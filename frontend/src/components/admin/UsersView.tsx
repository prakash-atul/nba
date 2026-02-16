import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableFacetedFilter } from "@/components/shared/DataTableFacetedFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Plus,
	Trash2,
	AlertCircle,
	RefreshCw,
	ArrowUpDown,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type {
	User,
	Department,
	CreateUserRequest,
	AdminStats,
} from "@/services/api";

interface UsersViewProps {
	users: User[];
	departments: Department[];
	currentUser: User | null;
	refreshing: boolean;
	onDataRefresh: (stats: AdminStats, users: User[]) => void;
}

export function UsersView({
	users = [],
	departments = [],
	currentUser,
	refreshing,
	onDataRefresh,
}: UsersViewProps) {
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [newUser, setNewUser] = useState<CreateUserRequest>({
		employee_id: 0,
		username: "",
		email: "",
		password: "",
		role: "faculty",
		department_id: null,
		designation: "",
		phone: "",
	});

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "faculty":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "staff":
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
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
					className="p-0 hover:bg-transparent"
				>
					Employee ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("employee_id")}</div>
			),
		},
		{
			accessorKey: "username",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "email",
			header: "Email",
			cell: ({ row }) => (
				<div className="text-gray-500">{row.getValue("email")}</div>
			),
		},
		{
			accessorKey: "designation",
			header: "Designation",
			cell: ({ row }) => (
				<div className="text-gray-500 italic">
					{row.getValue("designation") || "-"}
				</div>
			),
		},
		{
			accessorKey: "phone",
			header: "Phone",
			cell: ({ row }) => (
				<div className="text-gray-500 font-mono">
					{row.getValue("phone") || "-"}
				</div>
			),
		},
		{
			accessorKey: "role",
			header: "Role",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
			cell: ({ row }) => {
				const user = row.original;
				return (
					<div className="flex gap-1 flex-wrap justify-center">
						<Badge className={getRoleBadgeColor(user.role)}>
							{user.role.toUpperCase()}
						</Badge>
						{user.is_dean && (
							<Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
								DEAN
							</Badge>
						)}
						{user.is_hod && (
							<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
								HOD
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "department_code",
			header: "Department",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
			cell: ({ row }) => row.getValue("department_code") || "-",
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
			// Refresh data
			const [statsData, usersData] = await Promise.all([
				apiService.getAdminStats(),
				apiService.getAllUsers(),
			]);
			onDataRefresh(statsData, usersData);
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
			// Refresh data
			const [statsData, usersData] = await Promise.all([
				apiService.getAdminStats(),
				apiService.getAllUsers(),
			]);
			onDataRefresh(statsData, usersData);
		} catch (error: any) {
			toast.error(error.message || "Failed to delete user");
		} finally {
			setSubmitting(false);
		}
	};

	const roleOptions = [
		{ label: "Admin", value: "admin" },
		{ label: "Faculty", value: "faculty" },
		{ label: "Staff", value: "staff" },
	];

	const departmentOptions =
		departments?.map((d) => ({
			label: d.department_code,
			value: d.department_code,
		})) || [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Users Management</h2>
					<p className="text-gray-500 dark:text-gray-400">
						Manage all system users
					</p>
				</div>
				<Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							Add User
						</Button>
					</DialogTrigger>
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
													parseInt(e.target.value) ||
													0,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="role">Role *</Label>
									<select
										id="role"
										className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
										value={newUser.role}
										onChange={(e) =>
											setNewUser({
												...newUser,
												role: e.target
													.value as CreateUserRequest["role"],
											})
										}
									>
										<option value="admin">Admin</option>
										<option value="faculty">Faculty</option>
										<option value="staff">Staff</option>
									</select>
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
									<Label htmlFor="designation">
										Designation
									</Label>
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
										placeholder="e.g., 9876543210"
										value={newUser.phone || ""}
										onChange={(e) =>
											setNewUser({
												...newUser,
												phone: e.target.value,
											})
										}
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
			</div>

			<DataTable
				columns={columns}
				data={users}
				searchKey="username"
				searchPlaceholder="Search by name..."
				refreshing={refreshing}
			>
				{(table) => (
					<>
						<DataTableFacetedFilter
							column={table.getColumn("role")}
							title="Role"
							options={roleOptions}
						/>
						<DataTableFacetedFilter
							column={table.getColumn("department_code")}
							title="Department"
							options={departmentOptions}
						/>
					</>
				)}
			</DataTable>

			{/* Delete User Dialog */}
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
