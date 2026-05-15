import { ConfirmDeleteDialog } from "../../features/shared";
import {
	DepartmentMemberDialog,
	type DepartmentMemberFormData,
} from "./DepartmentMemberDialog";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { debugLogger } from "@/lib/debugLogger";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, Phone } from "lucide-react";
import { toast } from "sonner";
import type { DepartmentFaculty, HODUpdateUserRequest } from "@/services/api";
import { hodApi } from "@/services/api/hod";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { UserList, getBaseUserColumns } from "@/features/shared";
import { UserPhonesRow } from "@/features/users";
import type { ColumnDef } from "@tanstack/react-table";

export function FacultyManagement() {
	useEffect(() => {
		debugLogger.info("FacultyManagement", "Mounted");
	}, []);

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

	useEffect(() => {
		if (faculty && faculty.length > 0) {
			debugLogger.info("FacultyManagement", "Data loaded", {
				count: faculty.length,
				first: faculty[0],
			});
		}
	}, [faculty]);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedUser, setSelectedUser] = useState<DepartmentFaculty | null>(
		null,
	);
	const [formData, setFormData] = useState<DepartmentMemberFormData>({
		employee_id: 0,
		username: "",
		email: "",
		password: "",
		role: "faculty",
		designation: "",
		phones: [""],
	});
	const [editFormData, setEditFormData] = useState<DepartmentMemberFormData>({
		employee_id: 0,
		username: " ",
		email: " ",
		password: " ",
		role: "faculty",
		designation: " ",
		phones: [" "],
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
	};

	const handleCreateUser = async () => {
		debugLogger.info("FacultyManagement", "handleCreateUser starting", {
			formData,
		});
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
			await hodApi.createUser({
				...formData,
				password: formData.password || "password",
				designation: formData.designation || null,
				phones: formData.phones?.filter(Boolean) || undefined,
			});
			toast.success(
				`${
					formData.role === "faculty" ? "Faculty" : "Staff"
				} member created successfully`,
			);
			setIsAddDialogOpen(false);
			resetForm();
			onRefresh();
		} catch (error) {
			debugLogger.error(
				"FacultyManagement",
				"handleCreateUser failed",
				error,
			);
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
		debugLogger.info("FacultyManagement", "handleEditUser starting", {
			selectedUser,
			editFormData,
		});
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
			debugLogger.error(
				"FacultyManagement",
				"handleEditUser failed",
				error,
			);
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
		debugLogger.info("FacultyManagement", "handleDeleteUser starting", {
			employeeId,
			username,
			role,
		});
		try {
			await hodApi.deleteUser(employeeId);
			toast.success(
				`${
					role === "faculty" ? "Faculty" : "Staff"
				} member "${username}" deleted`,
			);
			onRefresh();
		} catch (error) {
			debugLogger.error(
				"FacultyManagement",
				"handleDeleteUser failed",
				error,
			);
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
			employee_id: user.employee_id,
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
		...getBaseUserColumns<DepartmentFaculty>(),
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
							<ConfirmDeleteDialog
								trigger={
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								}
								title="Delete Member?"
								description={
									<>
										Are you sure you want to delete{" "}
										{member.username}? This action cannot be
										undone.
									</>
								}
								onConfirm={() =>
									handleDeleteUser(
										member.employee_id,
										member.username,
										member.role,
									)
								}
							/>
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
				<Button
					className="gap-2 bg-emerald-600 hover:bg-emerald-700"
					onClick={() => {
						setIsAddDialogOpen(true);
						resetForm();
					}}
				>
					<Plus className="w-4 h-4" />
					Add Member
				</Button>
				<DepartmentMemberDialog
					mode="add"
					open={isAddDialogOpen}
					onOpenChange={(open) => {
						setIsAddDialogOpen(open);
						if (!open) resetForm();
					}}
					formData={formData}
					setFormData={setFormData}
					onSubmit={handleCreateUser}
					isSubmitting={isSubmitting}
					onCancel={() => setIsAddDialogOpen(false)}
				/>
			</CardHeader>
			<CardContent>
				<UserList
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
					renderSubRow={(row: any) => (
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
				</UserList>
			</CardContent>

			{/* Edit Dialog */}
			<DepartmentMemberDialog
				mode="edit"
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				formData={editFormData}
				setFormData={setEditFormData}
				onSubmit={handleEditUser}
				isSubmitting={isSubmitting}
				onCancel={() => {
					setIsEditDialogOpen(false);
					setSelectedUser(null);
				}}
			/>
		</Card>
	);
}
