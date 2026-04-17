import { ConfirmDeleteDialog } from "../../features/shared";
import { AdminCreateUserDialog } from "./AdminCreateUserDialog";
import { useState, useMemo, useEffect } from "react";
import { UserList } from "@/features/shared";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type {
	User,
	Department,
	CreateUserRequest,
	School,
} from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { getUsersViewColumns } from "./UsersView.columns";

export function UsersView({ currentUser }: { currentUser?: User | null }) {
	const {
		data: users,
		loading: refreshing,
		refresh,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		filters,
		setFilter,
	} = usePaginatedData<User>({
		fetchFn: (params) => adminApi.getAllUsers(params),
		limit: 20,
		defaultSort: "u.employee_id",
	});

	const { data: departments } = usePaginatedData<Department>({
		fetchFn: (params) => adminApi.getAllDepartments(params),
		limit: 100,
		defaultSort: "d.department_code",
	});

	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [schools, setSchools] = useState<School[]>([]);

	useEffect(() => {
		adminApi
			.getAllSchools()
			.then((data) => setSchools(data))
			.catch((err) => console.error("Failed to load schools", err));
	}, []);

	const [newUser, setNewUser] = useState<CreateUserRequest>({
		employee_id: 0,
		username: "",
		email: "",
		password: "",
		role: "faculty",
		department_id: null,
		school_id: null,
		phones: [""],
	});

	const columns = useMemo<ColumnDef<User>[]>(
		() =>
			getUsersViewColumns({
				onDelete: (user) => {
					setUserToDelete(user);
					setIsDeleteUserOpen(true);
				},
				currentUserId: currentUser?.employee_id,
			}),
		[currentUser],
	);

	const handleCreateUser = async () => {
		if (
			!newUser.employee_id ||
			!newUser.username ||
			!newUser.email ||
			!newUser.password
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Phone validation
		const validPhones = (newUser.phones || []).filter(
			(p) => p.trim() !== "",
		);
		for (const phone of validPhones) {
			if (!/^\d{10}$/.test(phone)) {
				toast.error("Phone number must be exactly 10 digits");
				return;
			}
		}

		setSubmitting(true);
		try {
			const payload = { ...newUser, phones: validPhones };
			await apiService.createUser(payload);
			toast.success("User created successfully");
			setIsAddUserOpen(false);
			setNewUser({
				employee_id: 0,
				username: "",
				email: "",
				password: "",
				role: "faculty",
				department_id: null,
				designation: "",
				phones: [""],
			});
			refresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to create user");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteUser = async () => {
		if (!userToDelete) return;

		setSubmitting(true);
		try {
			await apiService.deleteUser(userToDelete.employee_id);
			toast.success("User deleted successfully");
			setIsDeleteUserOpen(false);
			setUserToDelete(null);
			refresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to delete user");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold">Users Management</h2>
					<p className="text-gray-500 dark:text-gray-400">
						Manage all system users
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="gap-2"
						onClick={() => setIsAddUserOpen(true)}
					>
						<Plus className="h-4 w-4" />
						Add User
					</Button>
				</div>
			</div>

			<UserList
				columns={columns}
				data={users}
				searchPlaceholder="Search users..."
				refreshing={refreshing}
				serverPagination={{
					pagination,
					onNext: goNext,
					onPrev: goPrev,
					canPrev,
					pageIndex,
					search,
					onSearch: setSearch,
				}}
			>
				{() => (
					<>
						<Select
							value={
								(filters.department_id as string | undefined) ||
								"all"
							}
							onValueChange={(val) =>
								setFilter(
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
								{departments.map((dept) => (
									<SelectItem
										key={dept.department_id}
										value={dept.department_id.toString()}
									>
										{dept.department_code}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={
								(filters.role as string | undefined) || "all"
							}
							onValueChange={(val) =>
								setFilter(
									"role",
									val === "all" ? undefined : val,
								)
							}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="All Roles" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Roles</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
								<SelectItem value="faculty">Faculty</SelectItem>
								<SelectItem value="staff">Staff</SelectItem>
							</SelectContent>
						</Select>

						{(filters.department_id || filters.role) && (
							<Button
								variant="ghost"
								onClick={() => {
									setFilter("department_id", undefined);
									setFilter("role", undefined);
								}}
								className="h-9 px-2 lg:px-3"
							>
								Reset
								<X className="ml-2 h-4 w-4" />
							</Button>
						)}
					</>
				)}
			</UserList>

			<AdminCreateUserDialog
				open={isAddUserOpen}
				onOpenChange={setIsAddUserOpen}
				newUser={newUser}
				setNewUser={setNewUser}
				departments={departments}
				schools={schools}
				onSubmit={handleCreateUser}
				isSubmitting={submitting}
			/>

			<ConfirmDeleteDialog
				open={isDeleteUserOpen}
				onOpenChange={setIsDeleteUserOpen}
				title="Delete User"
				description={
					<>
						Are you sure you want to delete{" "}
						<span className="font-semibold">
							{userToDelete?.username}
						</span>
						? This action cannot be undone.
					</>
				}
				confirmText="Delete"
				isLoading={submitting}
				onConfirm={handleDeleteUser}
			/>
		</div>
	);
}
