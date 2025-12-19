import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, RefreshCw, AlertCircle } from "lucide-react";
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
	users,
	departments,
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
	});

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "dean":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "hod":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "faculty":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "staff":
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

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
										<option value="dean">Dean</option>
										<option value="hod">HOD</option>
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

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Employee ID</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Department</TableHead>
								<TableHead className="text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{refreshing ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8"
									>
										<RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
									</TableCell>
								</TableRow>
							) : users.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8 text-gray-500"
									>
										No users found
									</TableCell>
								</TableRow>
							) : (
								users.map((user) => (
									<TableRow key={user.employee_id}>
										<TableCell className="font-medium">
											{user.employee_id}
										</TableCell>
										<TableCell>{user.username}</TableCell>
										<TableCell className="text-gray-500">
											{user.email}
										</TableCell>
										<TableCell>
											<Badge
												className={getRoleBadgeColor(
													user.role
												)}
											>
												{user.role.toUpperCase()}
											</Badge>
										</TableCell>
										<TableCell>
											{user.department_code || (
												<span className="text-gray-400">
													-
												</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											{user.employee_id !==
												currentUser?.employee_id && (
												<Button
													variant="ghost"
													size="icon"
													className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
													onClick={() => {
														setUserToDelete(user);
														setIsDeleteUserOpen(
															true
														);
													}}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

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
