import { useState } from "react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, UserPlus, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { deanApi, type DeanDepartment } from "@/services/api";

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
	const [appointMode, setAppointMode] = useState<"promote" | "create">(
		"promote",
	);
	const [selectedFaculty, setSelectedFaculty] = useState<string>("");
	const [appointmentOrder, setAppointmentOrder] = useState("");

	// Form state for creating new HOD
	const [newHODForm, setNewHODForm] = useState({
		employee_id: "",
		username: "",
		email: "",
		password: "",
	});

	// Fetch faculty members for a department
	const { data: facultyMembers = [], isLoading: loadingFaculty } = useQuery({
		queryKey: ["departmentFaculty", selectedDepartment?.department_id],
		queryFn: () =>
			selectedDepartment
				? deanApi.getDepartmentFaculty(selectedDepartment.department_id)
				: Promise.resolve([]),
		enabled:
			appointDialogOpen &&
			appointMode === "promote" &&
			!!selectedDepartment,
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
		setNewHODForm({
			employee_id: "",
			username: "",
			email: "",
			password: "",
		});
		setAppointMode("promote");
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

		const isReplacing = !!selectedDepartment.hod_name;

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
				toast.info("Demoting current HOD...");
				await demoteMutation.mutateAsync(
					selectedDepartment.hod_employee_id,
				);
				toast.success("Current HOD demoted successfully");
			}

			if (appointMode === "promote") {
				if (!selectedFaculty || !appointmentOrder.trim()) {
					toast.error("Please select a faculty member and enter appointment order");
					return;
				}
				await appointMutation.mutateAsync({
					departmentId: selectedDepartment.department_id,
					data: {
						employee_id: parseInt(selectedFaculty),
						appointment_order: appointmentOrder,
					},
				});
			} else {
				// Create new HOD
				if (
					!newHODForm.employee_id ||
					!newHODForm.username ||
					!newHODForm.email ||
					!newHODForm.password ||
					!appointmentOrder.trim()
				) {
					toast.error("Please fill all fields including appointment order");
					return;
				}
				await appointMutation.mutateAsync({
					departmentId: selectedDepartment.department_id,
					data: {
						employee_id: parseInt(newHODForm.employee_id),
						username: newHODForm.username,
						email: newHODForm.email,
						password: newHODForm.password,
						appointment_order: appointmentOrder,
					},
				});
			}

			// Both steps succeeded — show toast, refresh, close dialog
			toast.success(
				isReplacing
					? "HOD replaced successfully"
					: "HOD appointed successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["deanDepartments"] });
			queryClient.invalidateQueries({ queryKey: ["deanUsers"] });
			if (onSuccess) onSuccess();
			setAppointDialogOpen(false);
			resetForm();
		} catch (error: any) {
			console.error("HOD operation failed:", error);
			// onError handlers in mutations already show individual toasts
		}
	};

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

			{/* Departments Table */}
			<Card>
				<CardHeader>
					<CardTitle>Department HOD Status</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Department</TableHead>
								<TableHead>Code</TableHead>
								<TableHead>HOD</TableHead>
								<TableHead>Faculty Count</TableHead>
								<TableHead className="text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{departments.map((dept) => (
								<TableRow key={dept.department_id}>
									<TableCell className="font-medium">
										{dept.department_name}
									</TableCell>
									<TableCell>
										{dept.department_code}
									</TableCell>
									<TableCell>
										{dept.hod_name ? (
											<Badge variant="default">
												{dept.hod_name}
											</Badge>
										) : (
											<Badge variant="secondary">
												No HOD
											</Badge>
										)}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Users className="w-4 h-4 text-muted-foreground" />
											{dept.faculty_count}
										</div>
									</TableCell>
									<TableCell className="text-right">
										{dept.hod_name ? (
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													handleDemoteClick(dept)
												}
											>
												Replace HOD
											</Button>
										) : (
											<Button
												size="sm"
												onClick={() =>
													handleAppointClick(dept)
												}
											>
												<UserPlus className="w-4 h-4 mr-2" />
												Appoint HOD
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Appoint HOD Dialog */}
			<Dialog
				open={appointDialogOpen}
				onOpenChange={setAppointDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{selectedDepartment?.hod_name
								? "Replace HOD"
								: "Appoint HOD"}
						</DialogTitle>
						<DialogDescription>
							{selectedDepartment?.hod_name
								? `Replace current HOD (${selectedDepartment.hod_name}) for ${selectedDepartment.department_name}`
								: `Appoint a Head of Department for ${selectedDepartment?.department_name}`}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex gap-2">
							<Button
								variant={
									appointMode === "promote"
										? "default"
										: "outline"
								}
								onClick={() => setAppointMode("promote")}
								className="flex-1"
							>
								Promote Faculty
							</Button>
							<Button
								variant={
									appointMode === "create"
										? "default"
										: "outline"
								}
								onClick={() => setAppointMode("create")}
								className="flex-1"
							>
								Create New HOD
							</Button>
						</div>

						<div className="space-y-2">
							<Label htmlFor="appointment-order">Appointment Order No.</Label>
							<Input
								id="appointment-order"
								value={appointmentOrder}
								onChange={(e) => setAppointmentOrder(e.target.value)}
								placeholder="e.g. ORD/HOD/2026/01"
							/>
						</div>

						{appointMode === "promote" ? (
							<div className="space-y-2">
								<Label>Select Faculty Member</Label>
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
														key={
															faculty.employee_id
														}
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
						) : (
							<div className="space-y-3">
								<div className="space-y-2">
									<Label>Employee ID</Label>
									<Input
										type="number"
										value={newHODForm.employee_id}
										onChange={(e) =>
											setNewHODForm({
												...newHODForm,
												employee_id: e.target.value,
											})
										}
										placeholder="Enter employee ID"
									/>
								</div>
								<div className="space-y-2">
									<Label>Name</Label>
									<Input
										value={newHODForm.username}
										onChange={(e) =>
											setNewHODForm({
												...newHODForm,
												username: e.target.value,
											})
										}
										placeholder="Enter full name"
									/>
								</div>
								<div className="space-y-2">
									<Label>Email</Label>
									<Input
										type="email"
										value={newHODForm.email}
										onChange={(e) =>
											setNewHODForm({
												...newHODForm,
												email: e.target.value,
											})
										}
										placeholder="Enter email address"
									/>
								</div>
								<div className="space-y-2">
									<Label>Password</Label>
									<Input
										type="password"
										value={newHODForm.password}
										onChange={(e) =>
											setNewHODForm({
												...newHODForm,
												password: e.target.value,
											})
										}
										placeholder="Enter password"
									/>
								</div>
							</div>
						)}

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
										? "Replace HOD"
										: "Appoint HOD"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
