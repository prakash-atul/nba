import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/features/shared/DataTable";
import { Building2, UserPlus, UserMinus, History } from "lucide-react";
import { toast } from "sonner";
import { deanApi, type DeanDepartment } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateAppointmentOrder } from "@/utils/appointmentUtils";
import { getStatusColumns, getHistoryColumns } from "./HODManagement.columns";

interface HODManagementProps {
	departments: DeanDepartment[];
	isLoading: boolean;
	onSuccess?: () => void;
}

export function HODManagement({
	departments,
	isLoading,
	onSuccess,
}: HODManagementProps) {
	const queryClient = useQueryClient();

	const [selectedDepartment, setSelectedDepartment] =
		useState<DeanDepartment | null>(null);
	const [appointDialogOpen, setAppointDialogOpen] = useState(false);
	const [selectedFaculty, setSelectedFaculty] = useState<string>("");
	const [appointmentOrder, setAppointmentOrder] = useState("");

	// Auto-generate appointment order when dialog opens and department is selected
	useEffect(() => {
		if (appointDialogOpen && selectedDepartment) {
			setAppointmentOrder(
				generateAppointmentOrder(
					"HOD",
					selectedDepartment.department_id,
				),
			);
		}
	}, [appointDialogOpen, selectedDepartment]);

	// Fetch faculty members for a department
	const { data: facultyMembers = [], isLoading: loadingFaculty } = useQuery({
		queryKey: ["departmentFaculty", selectedDepartment?.department_id],
		queryFn: () =>
			selectedDepartment
				? deanApi.getDepartmentFaculty(selectedDepartment.department_id)
				: Promise.resolve([]),
		enabled: appointDialogOpen && !!selectedDepartment,
	});

	// Fetch HOD assignment history
	const {
		data: hodHistory = [],
		isLoading: loadingHistory,
		refetch: refetchHistory,
	} = useQuery({
		queryKey: ["hodHistory"],
		queryFn: () => deanApi.getHODHistory(),
	});

	// Appoint HOD mutation
	const appointMutation = useMutation({
		mutationFn: ({
			departmentId,
			data,
		}: {
			departmentId: number;
			data: any;
		}) => deanApi.appointHOD(departmentId, data),
		onError: (error: any) => {
			toast.error(error?.message || "Failed to appoint HOD");
		},
	});

	// Demote HOD mutation
	const demoteMutation = useMutation({
		mutationFn: (employeeId: number) => deanApi.demoteHOD(employeeId),
		onError: (error: any) => {
			toast.error(error?.message || "Failed to demote HOD");
		},
	});

	const resetForm = () => {
		setSelectedFaculty("");
		setAppointmentOrder("");
	};

	const handleAppointClick = (department: DeanDepartment) => {
		setSelectedDepartment(department);
		setAppointDialogOpen(true);
	};

	const handleDemoteClick = (department: DeanDepartment) => {
		setSelectedDepartment(department);
		// Open appoint dialog for replacement
		setAppointDialogOpen(true);
	};

	const handleAppointSubmit = async () => {
		if (!selectedDepartment) return;

		const isReplacing = !!selectedDepartment.hod_employee_id;

		try {
			// If replacing, demote current HOD first
			if (isReplacing) {
				if (!selectedDepartment.hod_employee_id) {
					console.error("Missing HOD ID", selectedDepartment);
					toast.error(
						"Cannot replace: HOD employee ID is missing from department data",
					);
					return;
				}
				toast.info("Ending current HOD assignment...");
				await demoteMutation.mutateAsync(
					selectedDepartment.hod_employee_id,
				);
				toast.success("Previous serving HOD record ended");
			}

			if (!selectedFaculty || !appointmentOrder.trim()) {
				toast.error(
					"Please select a faculty member and enter appointment order",
				);
				return;
			}
			await appointMutation.mutateAsync({
				departmentId: selectedDepartment.department_id,
				data: {
					employee_id: parseInt(selectedFaculty),
					appointment_order: appointmentOrder,
				},
			});

			// Both steps succeeded — show toast, refresh, close dialog
			toast.success(
				isReplacing
					? "Serving HOD replaced successfully"
					: "Serving HOD recorded successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["deanDepartments"] });
			queryClient.invalidateQueries({ queryKey: ["deanUsers"] });
			queryClient.invalidateQueries({ queryKey: ["hodHistory"] });
			if (onSuccess) onSuccess();
			setAppointDialogOpen(false);
			resetForm();
		} catch (error: any) {
			console.error("HOD operation failed:", error);
			// onError handlers in mutations already show individual toasts
		}
	};

	const statusColumns = useMemo(
		() =>
			getStatusColumns({
				onAppointClick: handleAppointClick,
				onDemoteClick: handleDemoteClick,
			}),
		[],
	);

	const historyColumns = useMemo(() => getHistoryColumns(), []);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	const departmentsWithoutHOD = departments.filter((d) => !d.hod_name);
	const departmentsWithHOD = departments.filter((d) => d.hod_name);

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
								<Building2 className="w-6 h-6 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.length}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Departments
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
								<UserPlus className="w-6 h-6 text-green-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departmentsWithHOD.length}
								</p>
								<p className="text-sm text-muted-foreground">
									Departments with HOD
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
								<UserMinus className="w-6 h-6 text-orange-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departmentsWithoutHOD.length}
								</p>
								<p className="text-sm text-muted-foreground">
									Departments without HOD
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs: HOD Status + Assignment History */}
			<Tabs defaultValue="status">
				<TabsList>
					<TabsTrigger value="status">
						<Building2 className="w-4 h-4 mr-2" />
						HOD Status
					</TabsTrigger>
					<TabsTrigger
						value="history"
						onClick={() => refetchHistory()}
					>
						<History className="w-4 h-4 mr-2" />
						Assignment History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="status">
					<Card>
						<CardHeader>
							<CardTitle>Department HOD Status</CardTitle>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={statusColumns}
								data={departments}
								refreshing={isLoading}
								searchPlaceholder="Search departments..."
								searchKey="department_name"
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history">
					<Card>
						<CardHeader>
							<CardTitle>HOD Assignment History</CardTitle>
						</CardHeader>
						<CardContent>
							{loadingHistory ? (
								<div className="flex items-center justify-center h-32">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
								</div>
							) : (
								<DataTable
									columns={historyColumns}
									data={hodHistory}
									refreshing={loadingHistory}
									searchPlaceholder="Search by name or department..."
									searchKey="username"
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Appoint HOD Dialog */}
			<Dialog
				open={appointDialogOpen}
				onOpenChange={setAppointDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{selectedDepartment?.hod_name
								? "Assign New HOD"
								: "Record Serving HOD"}
						</DialogTitle>
						<DialogDescription>
							{selectedDepartment?.hod_name
								? `Assign new HOD (${selectedDepartment.hod_name}) for ${selectedDepartment.department_name}`
								: `Record the serving Head of Department for ${selectedDepartment?.department_name}`}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="appointment-order">
								Appointment Order No.
							</Label>
							<Input
								id="appointment-order"
								value={appointmentOrder}
								onChange={(e) =>
									setAppointmentOrder(e.target.value)
								}
								placeholder="e.g. ORD/HOD/2026/01"
							/>
						</div>

						<div className="space-y-2">
							<Label>Select Faculty / Staff Member</Label>
							{loadingFaculty ? (
								<div className="text-sm text-muted-foreground">
									Loading...
								</div>
							) : facultyMembers.length === 0 ? (
								<div className="text-sm text-muted-foreground">
									No faculty members available in this
									department
								</div>
							) : (
								<Select
									value={selectedFaculty}
									onValueChange={(value) =>
										setSelectedFaculty(value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Choose a faculty member" />
									</SelectTrigger>
									<SelectContent>
										{facultyMembers.map(
											(faculty: {
												employee_id: number;
												username: string;
												email: string;
											}) => (
												<SelectItem
													key={faculty.employee_id}
													value={faculty.employee_id.toString()}
												>
													{faculty.username} (
													{faculty.email})
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							)}
						</div>

						<div className="rounded-md bg-muted/50 border p-3 text-sm text-muted-foreground">
							This is a record-only assignment. The selected
							member will be recorded as the serving HOD. Their
							login role will NOT change — the HOD interface is
							always accessed via the dedicated HOD account
							(e.g.&nbsp;hod_cse@tezu.ac.in).
						</div>

						<div className="flex gap-2 pt-4">
							<Button
								variant="outline"
								onClick={() => {
									setAppointDialogOpen(false);
									resetForm();
								}}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onClick={handleAppointSubmit}
								disabled={
									appointMutation.isPending ||
									demoteMutation.isPending
								}
								className="flex-1"
							>
								{appointMutation.isPending ||
								demoteMutation.isPending
									? "Processing..."
									: selectedDepartment?.hod_name
										? "Assign New HOD"
										: "Record Serving HOD"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
