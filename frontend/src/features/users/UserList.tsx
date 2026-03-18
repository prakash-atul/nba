import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { debugLogger } from "@/lib/debugLogger";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type {
	User,
	DeanUser,
	PaginationParams,
	PaginatedResponse,
	Department,
	School,
} from "@/services/api";
import { adminApi } from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, X, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

export interface UserListProps {
	// Data source
	fetchFn: (
		params: PaginationParams,
	) => Promise<PaginatedResponse<User | DeanUser>>;

	// Permissions & capabilities
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
		canCreate?: boolean;
		canViewDepartment?: boolean;
		allowDepartmentFilter?: boolean;
	};

	// UI customization
	title?: string;
	hideHeader?: boolean;
	showRole?: boolean;
	showDepartment?: boolean;
	showPhone?: boolean;
	showDesignation?: boolean;
	showEmail?: boolean;
	showDeanStatus?: boolean;

	// Pagination
	pageSize?: number;

	// Filters
	availableFilters?: ("role" | "department" | "status")[];
}

export function UserList({
	fetchFn,
	permissions = {},
	title = "Users",
	hideHeader = false,
	showRole = true,
	showDepartment,
	showPhone = true,
	showDesignation = true,
	showEmail = true,
	showDeanStatus = true,
	pageSize = 20,
	availableFilters = ["role"],
}: UserListProps) {
	// Set showDepartment default after permissions is available
	const effectiveShowDepartment =
		showDepartment ?? permissions.canViewDepartment ?? false;
	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<(User | DeanUser) | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [schools, setSchools] = useState<School[]>([]);

	const {
		data: users,
		loading,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		filters,
		setFilter,
		refresh,
	} = usePaginatedData<User | DeanUser>({
		fetchFn,
		limit: pageSize,
		defaultSort: "u.employee_id",
	});

	// Load departments on mount
	useEffect(() => {
		const loadDepartments = async () => {
			try {
				debugLogger.info(
					"UserList",
					"Loading departments and schools...",
				);
				const response = await adminApi.getAllDepartments();
				setDepartments(response.data || []);

				// Keep error wrapper in case school endpoint fails on non-admin
				try {
					const schoolRes = await adminApi.getAllSchools();
					setSchools((schoolRes as any).data || schoolRes || []);
				} catch (e) {
					console.warn("Could not load schools:", e);
				}

				debugLogger.info(
					"UserList",
					`Loaded ${(response.data || []).length} departments`,
				);
			} catch (error) {
				debugLogger.error(
					"UserList",
					"Failed to load departments",
					error,
				);
				console.error("Failed to load departments:", error);
			}
		};
		loadDepartments();
	}, []);

	const handleCreateUser = useCallback(
		async (data: any) => {
			try {
				setIsLoading(true);
				debugLogger.info("UserList", "Creating user", {
					employee_id: data.employee_id,
					username: data.username,
					role: data.role,
				});
				await adminApi.createUser(data);
				debugLogger.info(
					"UserList",
					`User ${data.username} created successfully`,
				);
				toast.success("User created successfully");
				setCreateDialogOpen(false);
				refresh();
			} catch (error: any) {
				const message =
					error?.response?.data?.message ||
					error?.message ||
					"Failed to create user";
				debugLogger.error("UserList", "Create user failed", {
					error: error?.message,
					data,
				});
				toast.error(message);
			} finally {
				setIsLoading(false);
			}
		},
		[refresh, setCreateDialogOpen],
	);

	const handleEditUser = useCallback(
		async (employeeId: number, data: any) => {
			try {
				setIsLoading(true);
				debugLogger.info("UserList", "Updating user", {
					employee_id: employeeId,
					changes: data,
				});
				await adminApi.updateUser(employeeId, data);
				debugLogger.info(
					"UserList",
					`User ${employeeId} updated successfully`,
				);
				toast.success("User updated successfully");
				setEditDialogOpen(false);
				refresh();
			} catch (error: any) {
				const message =
					error?.response?.data?.message ||
					error?.message ||
					"Failed to update user";
				debugLogger.error("UserList", "Update user failed", {
					employee_id: employeeId,
					error: error?.message,
				});
				toast.error(message);
			} finally {
				setIsLoading(false);
			}
		},
		[refresh, setEditDialogOpen],
	);

	const handleDeleteUser = useCallback(
		async (employeeId: number) => {
			try {
				setIsLoading(true);
				debugLogger.warn("UserList", "Deleting user", {
					employee_id: employeeId,
				});
				await adminApi.deleteUser(employeeId);
				debugLogger.warn(
					"UserList",
					`User ${employeeId} deleted successfully`,
				);
				toast.success("User deleted successfully");
				setDeleteDialogOpen(false);
				refresh();
			} catch (error: any) {
				const message =
					error?.response?.data?.message ||
					error?.message ||
					"Failed to delete user";
				debugLogger.error("UserList", "Delete user failed", {
					employee_id: employeeId,
					error: error?.message,
				});
				toast.error(message);
			} finally {
				setIsLoading(false);
			}
		},
		[refresh, setDeleteDialogOpen],
	);

	const getRoleBadgeColor = (role: string) => {
		switch (role.toLowerCase()) {
			case "admin":
				return "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
			case "dean":
				return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800";
			case "hod":
				return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
			case "faculty":
				return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800";
			case "staff":
				return "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800";
			default:
				return "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800";
		}
	};

	const columns: ColumnDef<User | DeanUser>[] = useMemo(() => {
		const cols: ColumnDef<User | DeanUser>[] = [
			{
				accessorKey: "employee_id",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Employee ID
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
		];

		if (showEmail) {
			cols.push({
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
			});
		}

		if (showDesignation) {
			cols.push({
				accessorKey: "designation",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="mr-auto"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Designation
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<Badge variant="secondary" className="flex italic">
						{row.getValue("designation") || "—"}
					</Badge>
				),
			});
		}

		if (showPhone) {
			cols.push({
				accessorKey: "phone",
				header: "Phone",
				cell: ({ row }) => (
					<div className="text-muted-foreground font-mono flex">
						{row.getValue("phone") || "—"}
					</div>
				),
			});
		}

		if (showRole) {
			cols.push({
				accessorKey: "role",
				header: ({ column }) => (
					<Button
						variant="ghost"
						className="mr-auto"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Role
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					const user = row.original as any;
					return (
						<div className="flex gap-1">
							<Badge
								variant="secondary"
								className={getRoleBadgeColor(user.role)}
							>
								{user.role.toUpperCase()}
							</Badge>
							{user.role !== "dean" &&
								showDeanStatus &&
								!!user.is_dean && (
									<Badge
										variant="secondary"
										className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
									>
										DEAN
									</Badge>
								)}
							{user.role !== "hod" &&
								showDeanStatus &&
								!!user.is_hod && (
									<Badge
										variant="secondary"
										className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
									>
										HOD
									</Badge>
								)}
						</div>
					);
				},
			});
		}

		if (effectiveShowDepartment) {
			cols.push({
				accessorKey: "department_code",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Department
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					const deptCode = row.getValue("department_code") as string;
					return deptCode ? (
						<Badge
							variant="secondary"
							className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
						>
							{deptCode}
						</Badge>
					) : (
						<span className="text-muted-foreground">—</span>
					);
				},
			});
		}

		// Add actions column if permissions allow
		if (permissions.canEdit || permissions.canDelete) {
			cols.push({
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const user = row.original as User | DeanUser;
					return (
						<div className="flex gap-2">
							{permissions.canEdit && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedUser(user);
										setEditDialogOpen(true);
									}}
									disabled={isLoading}
								>
									<Pencil className="h-4 w-4" />
								</Button>
							)}
							{permissions.canDelete && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedUser(user);
										setDeleteDialogOpen(true);
									}}
									disabled={isLoading}
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					);
				},
			});
		}

		return cols;
	}, [
		showRole,
		effectiveShowDepartment,
		showPhone,
		showDesignation,
		showEmail,
		showDeanStatus,
		permissions.canEdit,
		permissions.canDelete,
		isLoading,
		setSelectedUser,
		setEditDialogOpen,
		setDeleteDialogOpen,
	]);

	return (
		<Card>
			{!hideHeader && (
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								{title}
							</CardTitle>
						</div>
						{permissions.canCreate && (
							<Button
								size="sm"
								onClick={() => setCreateDialogOpen(true)}
								disabled={isLoading}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add User
							</Button>
						)}
					</div>
				</CardHeader>
			)}
			<CardContent className="space-y-4">
				{/* Search and filters */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<Input
						placeholder="Search by name, email, or ID..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="sm:max-w-xs"
					/>
					{availableFilters.includes("role") && (
						<Select
							value={filters.role || ""}
							onValueChange={(value) =>
								setFilter("role", value || undefined)
							}
						>
							<SelectTrigger className="sm:max-w-xs">
								<SelectValue placeholder="Filter by role" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="admin">Admin</SelectItem>
								<SelectItem value="dean">Dean</SelectItem>
								<SelectItem value="hod">HOD</SelectItem>
								<SelectItem value="faculty">Faculty</SelectItem>
								<SelectItem value="staff">Staff</SelectItem>
							</SelectContent>
						</Select>
					)}
					{(filters.role || search) && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSearch("");
								Object.keys(filters).forEach((key) =>
									setFilter(key, undefined),
								);
							}}
						>
							<X className="h-4 w-4 mr-2" />
							Clear
						</Button>
					)}
				</div>

				{/* Data table */}
				<DataTable
					columns={columns}
					data={users}
					refreshing={loading}
					{...(true && {
						serverPagination: {
							pageIndex,
							search,
							onSearch: setSearch,
							onNext: goNext,
							onPrev: goPrev,
							canPrev: canPrev && pageIndex > 0,
							pagination: null,
						},
					})}
				/>

				{/* Dialogs */}
				<CreateUserDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSave={handleCreateUser}
					departments={departments}
					schools={schools}
					isLoading={isLoading}
				/>
				<EditUserDialog
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					user={selectedUser}
					onSave={handleEditUser}
					departments={departments}
					schools={schools}
					isLoading={isLoading}
				/>
				<DeleteUserDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					user={selectedUser}
					onConfirm={handleDeleteUser}
					isLoading={isLoading}
				/>
			</CardContent>
		</Card>
	);
}
