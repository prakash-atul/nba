import { useState, useEffect, useCallback } from "react";
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
import { Users, Plus, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UserFormDialog } from "./UserFormDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserPhonesRow } from "./UserPhonesRow";

/**
 * @file UserList.tsx
 */

import { useUserColumns } from "./userTableColumns";

export interface UserListProps {
	// Data source
	fetchFn: (
		params: PaginationParams,
	) => Promise<PaginatedResponse<User | DeanUser>>;
	fetchDepartmentsFn?: () => Promise<{ id: number; name: string }[]>;

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
	fetchDepartmentsFn,
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
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		filters,
		setFilter,
		refresh,
		sort,
		sortDir,
		setSort,
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
				const data = fetchDepartmentsFn
					? await fetchDepartmentsFn()
					: (await adminApi.getAllDepartments()).data || [];
				setDepartments(data as any);

				// Only attempt to load schools if we have create/edit permissions or are in Admin context
				if (
					!fetchDepartmentsFn ||
					permissions?.canCreate ||
					permissions?.canEdit
				) {
					try {
						const schoolRes = await adminApi.getAllSchools();
						setSchools((schoolRes as any).data || schoolRes || []);
					} catch (e) {
						console.warn("Could not load schools:", e);
					}
				}

				debugLogger.info(
					"UserList",
					`Loaded ${data.length} departments`,
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

	const columns = useUserColumns({
		showEmail,
		showDesignation,
		showPhone,
		showRole,
		showDeanStatus,
		effectiveShowDepartment,
		permissions,
		isLoading,
		setSelectedUser,
		setEditDialogOpen,
		setDeleteDialogOpen,
	});

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
				{/* Data table */}
				<DataTable
					columns={columns}
					data={users}
					refreshing={loading}
					renderSubRow={(row) => (
						<UserPhonesRow
							employeeId={(row.original as any).employee_id}
						/>
					)}
					{...(true && {
						serverPagination: {
							pageIndex,
							search,
							onSearch: setSearch,
							onNext: goNext,
							onPrev: goPrev,
							canPrev: canPrev && pageIndex > 0,
							pagination: pagination,
							filters,
							setFilter,
							sort,
							sortDir,
							setSort,
						},
					})}
				>
					{(_, currentFilters, currentSetFilter) => (
						<>
							{availableFilters.includes("role") && (
								<Select
									value={
										(currentFilters?.role as unknown as string) ||
										"all"
									}
									onValueChange={(val) =>
										currentSetFilter?.(
											"role",
											val === "all" ? undefined : val,
										)
									}
								>
									<SelectTrigger className="w-[140px]">
										<SelectValue placeholder="All Roles" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											All Roles
										</SelectItem>
										<SelectItem value="admin">
											Admin
										</SelectItem>
										<SelectItem value="dean">
											Dean
										</SelectItem>
										<SelectItem value="hod">HOD</SelectItem>
										<SelectItem value="faculty">
											Faculty
										</SelectItem>
										<SelectItem value="staff">
											Staff
										</SelectItem>
									</SelectContent>
								</Select>
							)}

							{effectiveShowDepartment &&
								availableFilters.includes("department") && (
									<Select
										value={
											(currentFilters?.department_id as unknown as string) ||
											"all"
										}
										onValueChange={(val) =>
											currentSetFilter?.(
												"department_id",
												val === "all" ? undefined : val,
											)
										}
									>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="All Departments" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All Departments
											</SelectItem>
											{departments.map((dept: any) => {
												const id =
													dept.department_id ||
													dept.id;
												const label =
													dept.department_code ||
													dept.name ||
													id;
												return (
													<SelectItem
														key={id}
														value={
															id
																? id.toString()
																: "empty"
														}
													>
														{label}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								)}

							{Object.keys(currentFilters || {}).some(
								(k) => currentFilters?.[k] !== undefined,
							) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										Object.keys(
											currentFilters || {},
										).forEach((key) =>
											currentSetFilter?.(
												key as keyof typeof currentFilters,
												undefined,
											),
										);
									}}
									className="h-9 px-2 lg:px-3 shrink-0"
								>
									<X className="h-4 w-4 mr-2" />
									Clear
								</Button>
							)}
						</>
					)}
				</DataTable>

				{/* Dialogs */}
				<UserFormDialog
					mode="create"
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSave={handleCreateUser}
					departments={departments}
					schools={schools}
					isLoading={isLoading}
				/>
				<UserFormDialog
					mode="edit"
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					initialData={selectedUser}
					onSave={(data) =>
						selectedUser
							? handleEditUser(selectedUser.employee_id, data)
							: Promise.resolve()
					}
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
