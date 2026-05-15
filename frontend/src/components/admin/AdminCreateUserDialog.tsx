import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Trash2, EyeOff, Eye } from "lucide-react";
import { useState } from "react";
import type { CreateUserRequest, Department, School } from "@/services/api";

interface AdminCreateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	newUser: CreateUserRequest;
	setNewUser: (user: CreateUserRequest) => void;
	departments: Department[];
	schools: School[];
	onSubmit: () => void;
	isSubmitting: boolean;
}

export function AdminCreateUserDialog({
	open,
	onOpenChange,
	newUser,
	setNewUser,
	departments,
	schools,
	onSubmit,
	isSubmitting,
}: AdminCreateUserDialogProps) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add New User</DialogTitle>
					<DialogDescription>
						Create a new user account. Fill in all required fields.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="employee_id">Employee ID *</Label>
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
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="hod">
										HOD (Dedicated Account)
									</SelectItem>
									<SelectItem value="dean">
										Dean (Dedicated Account)
									</SelectItem>
									<SelectItem value="faculty">
										Faculty
									</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
								</SelectContent>
							</Select>
							{newUser.role === "hod" && (
								<p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
									Creates a permanent HOD login account (e.g.
									hod_cse@tezu.ac.in). Faculty serving as HOD
									are tracked separately via Dean's HOD
									Management.
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
								value={newUser.designation ?? ""}
								onChange={(e) =>
									setNewUser({
										...newUser,
										designation: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Phone Numbers</Label>
							<div className="flex flex-col gap-2">
								{(newUser.phones?.length
									? newUser.phones
									: [""]
								).map((phone, idx) => (
									<div
										key={idx}
										className="flex items-center gap-2"
									>
										<Input
											type="tel"
											maxLength={10}
											pattern="\\d{10}"
											placeholder="e.g., 9876543210"
											value={phone}
											onChange={(e) => {
												const val =
													e.target.value.replace(
														/\D/g,
														"",
													);
												const newPhones = [
													...(newUser.phones || []),
												];
												newPhones[idx] = val;
												setNewUser({
													...newUser,
													phones: newPhones,
												});
											}}
										/>
										{(newUser.phones?.length
											? newUser.phones.length
											: 1) > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													let newPhones = (
														newUser.phones || []
													).filter(
														(_, i) => i !== idx,
													);
													if (newPhones.length === 0)
														newPhones = [""];
													setNewUser({
														...newUser,
														phones: newPhones,
													});
												}}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								))}
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-full mt-2"
								onClick={() => {
									setNewUser({
										...newUser,
										phones: [...(newUser.phones || []), ""],
									});
								}}
							>
								<Plus className="w-4 h-4 mr-2" />
								Add Phone
							</Button>
						</div>
					</div>

					{["faculty", "staff", "hod"].includes(newUser.role) && (
						<div className="space-y-2">
							<Label htmlFor="department_id">Department *</Label>
							<Select
								value={
									newUser.department_id
										? String(newUser.department_id)
										: ""
								}
								onValueChange={(val) =>
									setNewUser({
										...newUser,
										department_id: val
											? parseInt(val)
											: null,
										school_id: null,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									{departments.map((dept) => (
										<SelectItem
											key={`dept-${dept.department_id}`}
											value={String(dept.department_id)}
										>
											{dept.department_name} (
											{dept.department_code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{newUser.role === "dean" && (
						<div className="space-y-2">
							<Label htmlFor="school_id">School *</Label>
							<Select
								value={
									newUser.school_id
										? String(newUser.school_id)
										: ""
								}
								onValueChange={(val) =>
									setNewUser({
										...newUser,
										school_id: val ? parseInt(val) : null,
										department_id: null,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select school" />
								</SelectTrigger>
								<SelectContent>
									{schools.map((school) => (
										<SelectItem
											key={`school-${school.school_id}`}
											value={String(school.school_id)}
										>
											{school.school_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="password">Password *</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Minimum 6 characters"
								value={newUser.password}
								onChange={(e) =>
									setNewUser({
										...newUser,
										password: e.target.value,
									})
								}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
								onClick={() => setShowPassword(!showPassword)}
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
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={onSubmit} disabled={isSubmitting}>
						{isSubmitting ? (
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
	);
}
