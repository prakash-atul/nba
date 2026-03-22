import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
	ArrowUpDown,
	Plus,
	Pencil,
	Trash2,
	Users,
	Eye,
	EyeOff,
	Phone,
} from "lucide-react";
import { toast } from "sonner";
import type {
	DepartmentFaculty,
	HODCreateUserRequest,
	HODUpdateUserRequest,
} from "@/services/api";
import { hodApi } from "@/services/api/hod";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { DataTable } from "@/features/shared/DataTable";
import { UserPhonesRow } from "@/features/users";
import type { ColumnDef } from "@tanstack/react-table";

export function FacultyManagement() {
	const {
		data: faculty,
		loading: isLoading,
		refresh: onRefresh,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		filters,
		setFilter,
	} = usePaginatedData<DepartmentFaculty, { role: string | undefined }>({
		fetchFn: (params) => hodApi.getDepartmentFaculty(params),
		limit: 20,
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
		phones: [""],
	});
	const [editFormData, setEditFormData] = useState<HODUpdateUserRequest>({
		username: "",
		email: "",
		password: "",
		role: "faculty" as "faculty" | "staff",
		designation: "",
		phones: [""],
	});

	const resetForm = () => {
		setFormData({
			employee_id: 0,
			username: "",
			email: "",
			password: "",
			role: "faculty",
			designation: "",
			phones: [""],
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

		const invalidPhones = formData.phones?.filter(
			(p) => p !== "" && !/^\d{10}$/.test(p),
		);
		if (invalidPhones && invalidPhones.length > 0) {
			toast.error("All phone numbers must be exactly 10 digits");
			return;
		}

		setIsSubmitting(true);
		try {
			await hodApi.createUser(formData);
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

		const invalidEditPhones = editFormData.phones?.filter(
			(p) => p !== "" && !/^\d{10}$/.test(p),
		);
		if (invalidEditPhones && invalidEditPhones.length > 0) {
			toast.error("All phone numbers must be exactly 10 digits");
			return;
		}

		setIsSubmitting(true);
		try {
			const updateData: HODUpdateUserRequest = {
				username: editFormData.username,
				email: editFormData.email,
				role: editFormData.role,
				designation: editFormData.designation || null,
				phones: editFormData.phones?.filter(Boolean) || undefined,
			};

			if (editFormData.password) {
				updateData.password = editFormData.password;
			}

			await hodApi.updateUser(selectedUser.employee_id, updateData);
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
			await hodApi.deleteUser(employeeId);
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
			designation: user.designation ?? "",
			phones: user.phones?.length ? user.phones : [""],
		});
		setIsEditDialogOpen(true);
	};

	const getRoleBadge = (member: DepartmentFaculty) => {
		const isHOD = member.role === "hod";

		if (isHOD) {
			return (
				<Badge
					variant="secondary"
					className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
				>
					HOD
				</Badge>
			);
		}

		switch (member.role) {
			case "admin":
				return (
					<Badge
						variant="secondary"
						className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800"
					>
						Admin
					</Badge>
				);
			case "faculty":
				return (
					<Badge
						variant="secondary"
						className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
					>
						Faculty
					</Badge>
				);
			case "staff":
				return (
					<Badge
						variant="secondary"
						className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800"
					>
						Staff
					</Badge>
				);
			default:
				return (
					<Badge
						variant="secondary"
						className="bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 border-gray-200 dark:border-gray-800"
					>
						{member.role}
					</Badge>
				);
		}
	};

	const columns: ColumnDef<DepartmentFaculty>[] = [
		{
			accessorKey: "employee_id",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Emp. ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono">
					{row.getValue("employee_id")}
				</Badge>
			),
		},
		{
			accessorKey: "username",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="mr-auto"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium flex">
					{row.getValue("username")}
				</div>
			),
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="mr-auto"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Email
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<Badge variant="outline" className="flex">
					{row.getValue("email")}
				</Badge>
			),
		},
		{
			accessorKey: "designation",
			header: "Designation",
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{(row.getValue("designation") as string) || "—"}
				</div>
			),
		},
		{
			id: "phone_action",
			header: "Phones",
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => row.toggleExpanded()}
					className="h-8 gap-2"
				>
					<Phone className="h-4 w-4" />
					{row.getIsExpanded() ? "Hide" : "Show"}
				</Button>
			),
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => getRoleBadge(row.original),
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => {
				const member = row.original;
				const isHOD = member.role === "hod";
				return (
					<div className="flex items-center justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
							onClick={() => openEditDialog(member)}
						>
							<Pencil className="w-4 h-4" />
						</Button>
						{!isHOD && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Delete Member?
										</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete "
											{member.username}"? This action
											cannot be undone.
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
						)}
					</div>
				);
			},
		},
	];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
						<Users className="w-5 h-5 text-white" />
					</div>
					<div>
						<CardTitle>Department Members</CardTitle>
						<p className="text-sm text-muted-foreground">
							Manage faculty and staff in your department
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
						<Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
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
													parseInt(e.target.value) ||
													0,
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
								<Label htmlFor="username">Full Name *</Label>
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
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="designation">
										Designation
									</Label>
									<Input
										id="designation"
										placeholder="e.g., Professor"
										value={formData.designation ?? ""}
										onChange={(e) =>
											setFormData({
												...formData,
												designation: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Phone Numbers</Label>
									{(formData.phones?.length
										? formData.phones
										: [""]
									).map((phone, idx) => (
										<div
											key={idx}
											className="flex items-center gap-2"
										>
											<Input
												type="tel"
												maxLength={10}
												pattern="\d{10}"
												placeholder="e.g., 9876543210"
												value={phone}
												onChange={(e) => {
													const val =
														e.target.value.replace(
															/\D/g,
															"",
														);
													const newPhones = [
														...(formData.phones ||
															[]),
													];
													newPhones[idx] = val;
													setFormData({
														...formData,
														phones: newPhones,
													});
												}}
											/>
											{(formData.phones?.length
												? formData.phones.length
												: 1) > 1 && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="text-red-500 hover:text-red-700 hover:bg-red-50"
													onClick={() => {
														const newPhones = (
															formData.phones ||
															[]
														).filter(
															(_, i) => i !== idx,
														);
														if (
															newPhones.length ===
															0
														)
															newPhones.push("");
														setFormData({
															...formData,
															phones: newPhones,
														});
													}}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
									))}
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="w-full mt-2"
										onClick={() => {
											setFormData({
												...formData,
												phones: [
													...(formData.phones || []),
													"",
												],
											});
										}}
									>
										<Plus className="w-4 h-4 mr-2" />
										Add Phone Number
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password *</Label>
								<div className="relative">
									<Input
										id="password"
										type={
											showPassword ? "text" : "password"
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
				<DataTable
					columns={columns}
					data={faculty}
					refreshing={isLoading}
					serverPagination={{
						pagination,
						onNext: goNext,
						onPrev: goPrev,
						canPrev,
						pageIndex,
						search,
						onSearch: setSearch,
					}}
					renderSubRow={(row) => (
						<UserPhonesRow
							employeeId={(row.original as any).employee_id}
						/>
					)}
				>
					{() => (
						<Select
							value={filters.role || "all"}
							onValueChange={(v) =>
								setFilter("role", v === "all" ? undefined : v)
							}
						>
							<SelectTrigger className="w-[130px]">
								<SelectValue placeholder="All Roles" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Roles</SelectItem>
								<SelectItem value="faculty">Faculty</SelectItem>
								<SelectItem value="staff">Staff</SelectItem>
							</SelectContent>
						</Select>
					)}
				</DataTable>
			</CardContent>

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
								value={editFormData.username ?? ""}
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
								value={editFormData.email ?? ""}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										email: e.target.value,
									})
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit_designation">
									Designation
								</Label>
								<Input
									id="edit_designation"
									placeholder="e.g., Professor"
									value={
										(editFormData.designation as string) ??
										""
									}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											designation: e.target.value || null,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Phone Numbers</Label>
								{(editFormData.phones?.length
									? editFormData.phones
									: [""]
								).map((phone, idx) => (
									<div
										key={idx}
										className="flex items-center gap-2"
									>
										<Input
											type="tel"
											maxLength={10}
											pattern="\d{10}"
											placeholder="e.g., 9876543210"
											value={phone}
											onChange={(e) => {
												const val =
													e.target.value.replace(
														/\D/g,
														"",
													);
												const newPhones = [
													...(editFormData.phones ||
														[]),
												];
												newPhones[idx] = val;
												setEditFormData({
													...editFormData,
													phones: newPhones,
												});
											}}
										/>
										{(editFormData.phones?.length
											? editFormData.phones.length
											: 1) > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													const newPhones = (
														editFormData.phones ||
														[]
													).filter(
														(_, i) => i !== idx,
													);
													if (newPhones.length === 0)
														newPhones.push("");
													setEditFormData({
														...editFormData,
														phones: newPhones,
													});
												}}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full mt-2"
									onClick={() => {
										setEditFormData({
											...editFormData,
											phones: [
												...(editFormData.phones || []),
												"",
											],
										});
									}}
								>
									<Plus className="w-4 h-4 mr-2" />
									Add Phone Number
								</Button>
							</div>
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
									value={editFormData.password ?? ""}
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
		</Card>
	);
}
