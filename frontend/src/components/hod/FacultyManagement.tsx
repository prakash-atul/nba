import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type { DepartmentFaculty, HODCreateUserRequest } from "@/services/api";
import { hodApi } from "@/services/api/hod";
import { usePaginatedData } from "@/lib/usePaginatedData";

export function FacultyManagement() {
	const {
		data: faculty,
		loading: isLoading,
		refresh: onRefresh,
	} = usePaginatedData<DepartmentFaculty>({
		fetchFn: (params) => hodApi.getDepartmentFaculty(params),
		limit: 100,
		defaultSort: "u.username",
	});
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [selectedUser, setSelectedUser] = useState<DepartmentFaculty | null>(
		null,
	);
	const [formData, setFormData] = useState<HODCreateUserRequest>({
		employee_id: 0,
		username: "",
		email: "",
		password: "",
		role: "faculty",
		designation: "",
		phone: "",
	});
	const [editFormData, setEditFormData] = useState({
		username: "",
		email: "",
		password: "",
		role: "faculty" as "faculty" | "staff",
	});

	const resetForm = () => {
		setFormData({
			employee_id: 0,
			username: "",
			email: "",
			password: "",
			role: "faculty",
			designation: "",
			phone: "",
		});
		setShowPassword(false);
	};

	const handleCreateUser = async () => {
		if (
			!formData.employee_id ||
			!formData.username ||
			!formData.email ||
			!formData.password
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (formData.password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		setIsSubmitting(true);
		try {
			await apiService.createDepartmentUser(formData);
			toast.success(
				`${
					formData.role === "faculty" ? "Faculty" : "Staff"
				} member created successfully`,
			);
			setIsAddDialogOpen(false);
			resetForm();
			onRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create user",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditUser = async () => {
		if (!selectedUser) return;

		if (!editFormData.username || !editFormData.email) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (editFormData.password && editFormData.password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		setIsSubmitting(true);
		try {
			const updateData: {
				username?: string;
				email?: string;
				password?: string;
				role?: "faculty" | "staff";
			} = {
				username: editFormData.username,
				email: editFormData.email,
				role: editFormData.role,
			};

			if (editFormData.password) {
				updateData.password = editFormData.password;
			}

			await apiService.updateDepartmentUser(
				selectedUser.employee_id,
				updateData,
			);
			toast.success("User updated successfully");
			setIsEditDialogOpen(false);
			setSelectedUser(null);
			onRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update user",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteUser = async (
		employeeId: number,
		username: string,
		role: string,
	) => {
		try {
			await apiService.deleteDepartmentUser(employeeId);
			toast.success(
				`${
					role === "faculty" ? "Faculty" : "Staff"
				} member "${username}" deleted`,
			);
			onRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete user",
			);
		}
	};

	const openEditDialog = (user: DepartmentFaculty) => {
		setSelectedUser(user);
		setEditFormData({
			username: user.username,
			email: user.email,
			password: "",
			role: user.role as "faculty" | "staff",
		});
		setIsEditDialogOpen(true);
	};

	const getRoleBadge = (member: DepartmentFaculty) => {
		if (member.is_hod) {
			return (
				<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
					HOD
				</Badge>
			);
		}

		switch (member.role) {
			case "admin":
				return <Badge variant="default">Admin</Badge>;
			case "faculty":
				return (
					<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
						Faculty
					</Badge>
				);
			case "staff":
				return (
					<Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
						Staff
					</Badge>
				);
			default:
				return <Badge variant="outline">{member.role}</Badge>;
		}
	};

	// Separate faculty list into HOD/faculty and staff
	const facultyList = faculty.filter((f) => f.role === "faculty" || f.is_hod);
	const staffList = faculty.filter((f) => f.role === "staff");

	return (
		<div className="space-y-6">
			{/* Faculty & HOD Section */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
							<Users className="w-5 h-5 text-white" />
						</div>
						<div>
							<CardTitle>Faculty Members</CardTitle>
							<p className="text-sm text-muted-foreground">
								Manage faculty in your department
							</p>
						</div>
					</div>
					<Dialog
						open={isAddDialogOpen}
						onOpenChange={(open) => {
							setIsAddDialogOpen(open);
							if (!open) resetForm();
						}}
					>
						<DialogTrigger asChild>
							<Button
								className="gap-2 bg-emerald-600 hover:bg-emerald-700"
								onClick={() =>
									setFormData((prev) => ({
										...prev,
										role: "faculty",
									}))
								}
							>
								<Plus className="w-4 h-4" />
								Add Member
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[500px]">
							<DialogHeader>
								<DialogTitle>Add New Member</DialogTitle>
								<DialogDescription>
									Add a new faculty or staff member to your
									department
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="employee_id">
											Employee ID *
										</Label>
										<Input
											id="employee_id"
											type="number"
											placeholder="e.g., 3016"
											value={formData.employee_id || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													employee_id:
														parseInt(
															e.target.value,
														) || 0,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="role">Role *</Label>
										<Select
											value={formData.role}
											onValueChange={(
												value: "faculty" | "staff",
											) =>
												setFormData({
													...formData,
													role: value,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="faculty">
													Faculty
												</SelectItem>
												<SelectItem value="staff">
													Staff
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="username">
										Full Name *
									</Label>
									<Input
										id="username"
										placeholder="e.g., Dr. John Doe"
										value={formData.username}
										onChange={(e) =>
											setFormData({
												...formData,
												username: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										placeholder="e.g., john@tezu.ernet.in"
										value={formData.email}
										onChange={(e) =>
											setFormData({
												...formData,
												email: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Password *</Label>
									<div className="relative">
										<Input
											id="password"
											type={
												showPassword
													? "text"
													: "password"
											}
											placeholder="Minimum 6 characters"
											value={formData.password}
											onChange={(e) =>
												setFormData({
													...formData,
													password: e.target.value,
												})
											}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
											onClick={() =>
												setShowPassword(!showPassword)
											}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4 text-muted-foreground" />
											) : (
												<Eye className="h-4 w-4 text-muted-foreground" />
											)}
										</Button>
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsAddDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={handleCreateUser}
									disabled={isSubmitting}
									className="bg-emerald-600 hover:bg-emerald-700"
								>
									{isSubmitting ? "Creating..." : "Create"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
						</div>
					) : facultyList.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No faculty members found
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Employee ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead className="text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{facultyList.map((member) => (
									<TableRow key={member.employee_id}>
										<TableCell className="font-medium">
											{member.employee_id}
										</TableCell>
										<TableCell>{member.username}</TableCell>
										<TableCell>{member.email}</TableCell>
										<TableCell>
											{getRoleBadge(member)}
										</TableCell>
										<TableCell className="text-right">
											{!member.is_hod && (
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															openEditDialog(
																member,
															)
														}
													>
														<Pencil className="w-4 h-4" />
													</Button>
													<AlertDialog>
														<AlertDialogTrigger
															asChild
														>
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive hover:text-destructive"
															>
																<Trash2 className="w-4 h-4" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete
																	Faculty
																	Member?
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Are you sure
																	you want to
																	delete "
																	{
																		member.username
																	}
																	"? This
																	action
																	cannot be
																	undone.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>
																	Cancel
																</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteUser(
																			member.employee_id,
																			member.username,
																			member.role,
																		)
																	}
																	className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																>
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Staff Section */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-linear-to-br from-gray-500 to-slate-600 flex items-center justify-center">
							<Users className="w-5 h-5 text-white" />
						</div>
						<div>
							<CardTitle>Staff Members</CardTitle>
							<p className="text-sm text-muted-foreground">
								Department staff
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
						</div>
					) : staffList.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No staff members in this department
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Employee ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead className="text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{staffList.map((member) => (
									<TableRow key={member.employee_id}>
										<TableCell className="font-medium">
											{member.employee_id}
										</TableCell>
										<TableCell>{member.username}</TableCell>
										<TableCell>{member.email}</TableCell>
										<TableCell>
											{getRoleBadge(member)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														openEditDialog(member)
													}
												>
													<Pencil className="w-4 h-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="text-destructive hover:text-destructive"
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Delete Staff
																Member?
															</AlertDialogTitle>
															<AlertDialogDescription>
																Are you sure you
																want to delete "
																{
																	member.username
																}
																"? This action
																cannot be
																undone.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																onClick={() =>
																	handleDeleteUser(
																		member.employee_id,
																		member.username,
																		member.role,
																	)
																}
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															>
																Delete
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Member</DialogTitle>
						<DialogDescription>
							Update member information
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit_role">Role</Label>
							<Select
								value={editFormData.role}
								onValueChange={(value: "faculty" | "staff") =>
									setEditFormData({
										...editFormData,
										role: value,
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="faculty">
										Faculty
									</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_username">Full Name *</Label>
							<Input
								id="edit_username"
								value={editFormData.username}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										username: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_email">Email *</Label>
							<Input
								id="edit_email"
								type="email"
								value={editFormData.email}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										email: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_password">
								New Password (leave empty to keep current)
							</Label>
							<div className="relative">
								<Input
									id="edit_password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter new password"
									value={editFormData.password}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											password: e.target.value,
										})
									}
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
									onClick={() =>
										setShowPassword(!showPassword)
									}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-muted-foreground" />
									) : (
										<Eye className="h-4 w-4 text-muted-foreground" />
									)}
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEditUser}
							disabled={isSubmitting}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
