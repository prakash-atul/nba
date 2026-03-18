import { useState, useEffect } from "react";
import { DataTable } from "@/features/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Plus,
	Trash2,
	AlertCircle,
	RefreshCw,
	ArrowUpDown,
	X,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
		phone: "",
	});

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

	const columns: ColumnDef<User>[] = [
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
				<div className="flex">{row.getValue("username")}</div>
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
		},
		{
			accessorKey: "phone",
			header: "Phone",
			cell: ({ row }) => (
				<div className="text-muted-foreground font-mono flex">
					{row.getValue("phone") || "—"}
				</div>
			),
		},
		{
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
				const user = row.original;
				const isHOD = user.role === "hod";
				const isDean = Number(user.is_dean) === 1;

				return (
					<div className="flex gap-1">
						<Badge
							variant="secondary"
							className={getRoleBadgeColor(user.role)}
						>
							{user.role.toUpperCase()}
						</Badge>
						{isDean && (
							<Badge
								variant="secondary"
								className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
							>
								DEAN
							</Badge>
						)}
						{isHOD && (
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
		},
		{
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
		},
		{
			id: "actions",
			header: () => <div className="text-center">Actions</div>,
			cell: ({ row }) => {
				const user = row.original;
				if (user.employee_id === currentUser?.employee_id) return null;
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							size="icon"
							className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
							onClick={() => {
								setUserToDelete(user);
								setIsDeleteUserOpen(true);
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				);
			},
		},
	];

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
		if (newUser.phone && !/^\d{10}$/.test(String(newUser.phone))) {
			toast.error("Phone number must be exactly 10 digits");
			return;
		}

		setSubmitting(true);
		try {
			await apiService.createUser(newUser);
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
				phone: "",
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

			<DataTable
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
			</DataTable>

			<Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Add New User</DialogTitle>
						<DialogDescription>
							Create a new user account. Fill in all required
							fields.
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
									placeholder="e.g., 5001"
									value={newUser.employee_id || ""}
									onChange={(e) =>
										setNewUser({
											...newUser,
											employee_id:
												parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="role">Role *</Label>
								<Select
									value={newUser.role}
									onValueChange={(val) =>
										setNewUser({
											...newUser,
											role: val as CreateUserRequest["role"],
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select role" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="admin">
											Admin
										</SelectItem>
										<SelectItem value="hod">
											HOD (Dedicated Account)
										</SelectItem>
										<SelectItem value="dean">
											Dean (Dedicated Account)
										</SelectItem>
										<SelectItem value="faculty">
											Faculty
										</SelectItem>
										<SelectItem value="staff">
											Staff
										</SelectItem>
									</SelectContent>
								</Select>
								{newUser.role === "hod" && (
									<p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
										Creates a permanent HOD login account
										(e.g. hod_cse@tezu.ac.in). Faculty
										serving as HOD are tracked separately
										via Dean's HOD Management.
									</p>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">Full Name *</Label>
							<Input
								id="username"
								placeholder="e.g., Dr. John Doe"
								value={newUser.username}
								onChange={(e) =>
									setNewUser({
										...newUser,
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
								placeholder="e.g., john@tezu.edu"
								value={newUser.email}
								onChange={(e) =>
									setNewUser({
										...newUser,
										email: e.target.value,
									})
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="designation">Designation</Label>
								<Input
									id="designation"
									placeholder="e.g., Professor"
									value={newUser.designation || ""}
									onChange={(e) =>
										setNewUser({
											...newUser,
											designation: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									type="tel"
									maxLength={10}
									pattern="\d{10}"
									placeholder="e.g., 9876543210"
									value={newUser.phone || ""}
									onChange={(e) => {
										// Only allow digits constraint directly on input
										const val = e.target.value.replace(
											/\D/g,
											"",
										);
										setNewUser({
											...newUser,
											phone: val,
										});
									}}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password *</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter password"
								value={newUser.password}
								onChange={(e) =>
									setNewUser({
										...newUser,
										password: e.target.value,
									})
								}
							/>
						</div>

						{newUser.role === "dean" ? (
							<div className="space-y-2">
								<Label htmlFor="school">
									School (Required for Dean)
								</Label>
								<select
									id="school"
									className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
									value={newUser.school_id || ""}
									onChange={(e) =>
										setNewUser({
											...newUser,
											school_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
								>
									<option value="">Select a School</option>
									{schools.map((sch) => (
										<option
											key={sch.school_id}
											value={sch.school_id}
										>
											{sch.school_name}
										</option>
									))}
								</select>
							</div>
						) : (
							<div className="space-y-2">
								<Label htmlFor="department">Department</Label>
								<select
									id="department"
									className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
									value={newUser.department_id || ""}
									onChange={(e) =>
										setNewUser({
											...newUser,
											department_id: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
								>
									<option value="">No Department</option>
									{departments.map((dept) => (
										<option
											key={dept.department_id}
											value={dept.department_id}
										>
											{dept.department_name} (
											{dept.department_code})
										</option>
									))}
								</select>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAddUserOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateUser}
							disabled={submitting}
						>
							{submitting ? (
								<>
									<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create User"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<AlertCircle className="h-5 w-5" />
							Delete User
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-semibold">
								{userToDelete?.username}
							</span>
							? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteUserOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteUser}
							disabled={submitting}
						>
							{submitting ? (
								<>
									<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
