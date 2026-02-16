import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Plus,
	Trash2,
	RefreshCw,
	UserPlus,
	Pencil,
	School as SchoolIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type { School, User } from "@/services/api";
import { generateAppointmentOrder } from "@/utils/appointmentUtils";

interface SchoolsViewProps {
	schools: School[];
	users: User[];
	refreshing: boolean;
	onDataRefresh: () => void;
}

export function SchoolsView({
	schools = [],
	users = [],
	refreshing,
	onDataRefresh,
}: SchoolsViewProps) {
	const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
	const [isEditSchoolOpen, setIsEditSchoolOpen] = useState(false);
	const [isAppointDeanOpen, setIsAppointDeanOpen] = useState(false);
	const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Filter faculty for Dean appointment
	const facultyUsers = useMemo(
		() => users.filter((u) => u.role === "faculty"),
		[users],
	);

	// Create/Edit School Form
	const [schoolForm, setSchoolForm] = useState({
		school_code: "",
		school_name: "",
		description: "",
	});

	// Appoint Dean Form
	const [appointDeanForm, setAppointDeanForm] = useState({
		employee_id: "",
		appointment_order: "",
	});

	// Auto-generate appointment order when dialog opens and school is selected
	useEffect(() => {
		if (isAppointDeanOpen && selectedSchool) {
			setAppointDeanForm((prev) => ({
				...prev,
				appointment_order: generateAppointmentOrder(
					"DEAN",
					selectedSchool.school_id,
				),
			}));
		}
	}, [isAppointDeanOpen, selectedSchool]);

	const resetForm = () => {
		setSchoolForm({
			school_code: "",
			school_name: "",
			description: "",
		});
	};

	const handleCreateSchool = async () => {
		if (!schoolForm.school_name.trim() || !schoolForm.school_code.trim()) {
			toast.error("School name and code are required");
			return;
		}

		setSubmitting(true);
		try {
			await apiService.createSchool(schoolForm);
			toast.success("School created successfully");
			setIsCreateSchoolOpen(false);
			resetForm();
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to create school");
		} finally {
			setSubmitting(false);
		}
	};

	const openEditSchoolDialog = (school: School) => {
		setSelectedSchool(school);
		setSchoolForm({
			school_code: school.school_code,
			school_name: school.school_name,
			description: school.description || "",
		});
		setIsEditSchoolOpen(true);
	};

	const handleUpdateSchool = async () => {
		if (
			!selectedSchool ||
			!schoolForm.school_name.trim() ||
			!schoolForm.school_code.trim()
		) {
			toast.error("School name and code are required");
			return;
		}

		setSubmitting(true);
		try {
			await apiService.updateSchool(selectedSchool.school_id, schoolForm);
			toast.success("School updated successfully");
			setIsEditSchoolOpen(false);
			resetForm();
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to update school");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteSchool = async (school: School) => {
		if (
			!confirm(
				`Are you sure you want to delete ${school.school_name}? This action cannot be undone.`,
			)
		) {
			return;
		}

		try {
			await apiService.deleteSchool(school.school_id);
			toast.success("School deleted successfully");
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to delete school");
		}
	};

	const openAppointDeanDialog = (school: School) => {
		setSelectedSchool(school);
		setAppointDeanForm({ employee_id: "", appointment_order: "" });
		setIsAppointDeanOpen(true);
	};

	const handleAppointDean = async () => {
		if (
			!selectedSchool ||
			!appointDeanForm.employee_id ||
			!appointDeanForm.appointment_order
		) {
			toast.error("Please fill in all fields");
			return;
		}

		setSubmitting(true);
		try {
			await apiService.appointDean(selectedSchool.school_id, {
				employee_id: parseInt(appointDeanForm.employee_id),
				appointment_order: appointDeanForm.appointment_order,
			});
			toast.success("Dean appointed successfully");
			setIsAppointDeanOpen(false);
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to appoint Dean");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDemoteDean = async (user: User) => {
		if (
			!confirm(
				`Are you sure you want to demote Dean ${user.username}? They will revert to Faculty role.`,
			)
		) {
			return;
		}

		try {
			await apiService.demoteDean(user.employee_id);
			toast.success("Dean demoted successfully");
			onDataRefresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to demote Dean");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Schools Management</h2>
					<p className="text-gray-500 dark:text-gray-400">
						Manage schools and appoint Deans
					</p>
				</div>
				<Dialog
					open={isCreateSchoolOpen}
					onOpenChange={setIsCreateSchoolOpen}
				>
					<DialogTrigger asChild>
						<Button className="gap-2" onClick={resetForm}>
							<Plus className="h-4 w-4" />
							Add School
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New School</DialogTitle>
							<DialogDescription>
								Add a new school to the university.
							</DialogDescription>
						</DialogHeader>
						<div className="py-4 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="school-code">School Code</Label>
								<Input
									id="school-code"
									value={schoolForm.school_code}
									onChange={(e) =>
										setSchoolForm({
											...schoolForm,
											school_code: e.target.value,
										})
									}
									placeholder="e.g. SOE"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="school-name">School Name</Label>
								<Input
									id="school-name"
									value={schoolForm.school_name}
									onChange={(e) =>
										setSchoolForm({
											...schoolForm,
											school_name: e.target.value,
										})
									}
									placeholder="e.g. School of Engineering"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">
									Description (Optional)
								</Label>
								<Input
									id="description"
									value={schoolForm.description}
									onChange={(e) =>
										setSchoolForm({
											...schoolForm,
											description: e.target.value,
										})
									}
									placeholder="e.g. Engineering and Technology disciplines"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateSchoolOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateSchool}
								disabled={submitting}
							>
								{submitting ? "Creating..." : "Create School"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog
					open={isEditSchoolOpen}
					onOpenChange={setIsEditSchoolOpen}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit School</DialogTitle>
							<DialogDescription>
								Update school details.
							</DialogDescription>
						</DialogHeader>
						<div className="py-4 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="edit-school-code">
									School Code
								</Label>
								<Input
									id="edit-school-code"
									value={schoolForm.school_code}
									onChange={(e) =>
										setSchoolForm({
											...schoolForm,
											school_code: e.target.value,
										})
									}
									placeholder="e.g. SOE"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-school-name">
									School Name
								</Label>
								<Input
									id="edit-school-name"
									value={schoolForm.school_name}
									onChange={(e) =>
										setSchoolForm({
											...schoolForm,
											school_name: e.target.value,
										})
									}
									placeholder="e.g. School of Engineering"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-description">
									Description (Optional)
								</Label>
								<Input
									id="edit-description"
									value={schoolForm.description}
									onChange={(e) =>
										setSchoolForm({
											...schoolForm,
											description: e.target.value,
										})
									}
									placeholder="e.g. Engineering and Technology disciplines"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsEditSchoolOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleUpdateSchool}
								disabled={submitting}
							>
								{submitting ? "Updating..." : "Update School"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Appoint Dean Dialog */}
			<Dialog
				open={isAppointDeanOpen}
				onOpenChange={setIsAppointDeanOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Appoint Dean - {selectedSchool?.school_name}
						</DialogTitle>
						<DialogDescription>
							Select a faculty member to appoint as Dean.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 space-y-4">
						<div className="space-y-2">
							<Label>Faculty Member</Label>
							<Select
								value={appointDeanForm.employee_id}
								onValueChange={(val) =>
									setAppointDeanForm({
										...appointDeanForm,
										employee_id: val,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select faculty" />
								</SelectTrigger>
								<SelectContent>
									{facultyUsers
										.filter(
											(u) =>
												selectedSchool &&
												Number(u.school_id) ===
													selectedSchool.school_id,
										)
										.map((u) => (
											<SelectItem
												key={u.employee_id}
												value={u.employee_id.toString()}
											>
												{u.username} ({u.employee_id})
												{u.department_code
													? ` - ${u.department_code}`
													: ""}
											</SelectItem>
										))}
									{facultyUsers.filter(
										(u) =>
											selectedSchool &&
											Number(u.school_id) ===
												selectedSchool.school_id,
									).length === 0 && (
										<SelectItem value="none" disabled>
											No eligible faculty found in this
											school
										</SelectItem>
									)}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="order">Appointment Order No.</Label>
							<Input
								id="order"
								value={appointDeanForm.appointment_order}
								onChange={(e) =>
									setAppointDeanForm({
										...appointDeanForm,
										appointment_order: e.target.value,
									})
								}
								placeholder="e.g. ORD/DEAN/2026/01"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAppointDeanOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAppointDean}
							disabled={submitting}
						>
							{submitting ? "Appointing..." : "Appoint Dean"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{refreshing ? (
					<div className="col-span-full py-8 text-center text-gray-400">
						<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
						Loading schools...
					</div>
				) : schools.length === 0 ? (
					<div className="col-span-full py-12 text-center border rounded-lg bg-gray-50 dark:bg-gray-900/50">
						<SchoolIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
						<p className="text-gray-500">No schools found</p>
					</div>
				) : (
					schools.map((school) => (
						<Card
							key={school.school_id}
							className="overflow-hidden"
						>
							<CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
								<CardTitle className="text-lg flex items-start justify-between">
									<span>{school.school_name}</span>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												openEditSchoolDialog(school)
											}
										>
											<Pencil className="h-4 w-4 text-blue-500" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												handleDeleteSchool(school)
											}
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>
								</CardTitle>
								<div className="text-sm text-gray-500 flex justify-between">
									<span>Code: {school.school_code}</span>
								</div>
							</CardHeader>
							<CardContent className="pt-4 space-y-4">
								<div>
									<Label className="text-xs text-muted-foreground uppercase tracking-wider">
										Current Dean
									</Label>
									<div className="mt-1 flex items-center justify-between">
										{school.dean ? (
											<div className="flex items-center gap-2">
												<div>
													<p className="font-medium">
														{school.dean.username}
													</p>
													<p className="text-xs text-muted-foreground">
														{school.dean.email}
													</p>
												</div>
											</div>
										) : (
											<span className="text-sm text-yellow-600 dark:text-yellow-500 italic">
												Vacant
											</span>
										)}

										{school.dean ? (
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() =>
													handleDemoteDean(
														school.dean!,
													)
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										) : (
											<Button
												variant="outline"
												size="sm"
												className="h-8"
												onClick={() =>
													openAppointDeanDialog(
														school,
													)
												}
											>
												<UserPlus className="h-3.5 w-3.5 mr-1" />
												Appoint
											</Button>
										)}
									</div>
								</div>
								<div className="flex justify-between items-center text-sm pt-2 border-t">
									<span className="text-muted-foreground">
										Departments
									</span>
									<span className="font-medium bg-secondary px-2 py-0.5 rounded-full text-xs">
										{school.departments_count || 0}
									</span>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
