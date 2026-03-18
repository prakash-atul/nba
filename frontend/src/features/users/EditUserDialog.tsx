import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { User, DeanUser, Department, School } from "@/services/api";

export interface EditUserDialogProps {
	open: boolean;
	user: (User | DeanUser) | null;
	onOpenChange: (open: boolean) => void;
	onSave: (employeeId: number, data: any) => Promise<void>;
	departments: Department[];
	schools?: School[];
	isLoading?: boolean;
}

export function EditUserDialog({
	open,
	user,
	onOpenChange,
	onSave,
	departments,
	schools = [],
	isLoading = false,
}: EditUserDialogProps) {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		role: "staff",
		department_id: "",
		school_id: "",
		designation: "",
		phone: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (user && open) {
			setFormData({
				username: user?.username || "",
				email: user?.email || "",
				password: "",
				role: user?.role || "staff",
				department_id:
					(user && "department_id" in user
						? user.department_id
						: undefined
					)?.toString() || "none",
				school_id:
					(user &&
					"school_id" in user &&
					(user as unknown as any).school_id
						? (user as unknown as any).school_id
						: undefined
					)?.toString() || "none",
				designation: user?.designation || "",
				phone: user?.phone || "",
			});
			setErrors({});
		}
	}, [user, open]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.username) newErrors.username = "Username is required";
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}
		if (formData.password && formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
			newErrors.phone = "Phone number must be exactly 10 digits";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm() || !user) return;

		const updateData: any = {
			username: formData.username,
			email: formData.email,
			role: formData.role,
			department_id:
				formData.department_id && formData.department_id !== "none"
					? parseInt(formData.department_id)
					: null,
			school_id:
				formData.school_id && formData.school_id !== "none"
					? parseInt(formData.school_id)
					: null,
			designation: formData.designation || null,
			phone: formData.phone || null,
		};

		if (formData.password) {
			updateData.password = formData.password;
		}

		await onSave(user.employee_id, updateData);

		setFormData({
			username: "",
			email: "",
			password: "",
			role: "staff",
			department_id: "",
			school_id: "",
			designation: "",
			phone: "",
		});
		setErrors({});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit User - {user?.username}</DialogTitle>
					<DialogDescription>
						Update the user's profile information. Leave password
						blank to keep the current one.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-sm font-medium text-muted-foreground">
								Employee ID
							</Label>
							<div className="px-3 py-2 rounded border border-input bg-muted text-sm">
								{user?.employee_id}
							</div>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="role"
								className="text-sm font-medium"
							>
								Role *
							</Label>
							<Select
								value={formData.role}
								onValueChange={(value) =>
									setFormData({
										...formData,
										role: value,
									})
								}
								disabled={isLoading}
							>
								<SelectTrigger id="role">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="dean">Dean</SelectItem>
									<SelectItem value="hod">HOD</SelectItem>
									<SelectItem value="faculty">
										Faculty
									</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="username"
								className="text-sm font-medium"
							>
								Username *
							</Label>
							<Input
								id="username"
								placeholder="john_doe"
								value={formData.username}
								onChange={(e) =>
									setFormData({
										...formData,
										username: e.target.value,
									})
								}
								disabled={isLoading}
								className={
									errors.username ? "border-red-500" : ""
								}
							/>
							{errors.username && (
								<p className="text-xs text-red-500">
									{errors.username}
								</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="email"
								className="text-sm font-medium"
							>
								Email *
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="john@example.com"
								value={formData.email}
								onChange={(e) =>
									setFormData({
										...formData,
										email: e.target.value,
									})
								}
								disabled={isLoading}
								className={errors.email ? "border-red-500" : ""}
							/>
							{errors.email && (
								<p className="text-xs text-red-500">
									{errors.email}
								</p>
							)}
						</div>

						<div className="space-y-1.5 col-span-2">
							<Label
								htmlFor="password"
								className="text-sm font-medium"
							>
								Password (leave blank to keep current)
							</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••"
								value={formData.password}
								onChange={(e) =>
									setFormData({
										...formData,
										password: e.target.value,
									})
								}
								disabled={isLoading}
								className={
									errors.password ? "border-red-500" : ""
								}
							/>
							{errors.password && (
								<p className="text-xs text-red-500">
									{errors.password}
								</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="department_id"
								className="text-sm font-medium"
							>
								{formData.role === "dean"
									? "School"
									: "Department"}
							</Label>
							{formData.role === "dean" ? (
								<Select
									value={formData.school_id}
									onValueChange={(value) =>
										setFormData({
											...formData,
											school_id: value,
										})
									}
									disabled={isLoading}
								>
									<SelectTrigger id="school_id">
										<SelectValue placeholder="Select school" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											None
										</SelectItem>
										{schools.map((school) => (
											<SelectItem
												key={school.school_id}
												value={school.school_id.toString()}
											>
												{school.school_code}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<Select
									value={formData.department_id}
									onValueChange={(value) =>
										setFormData({
											...formData,
											department_id: value,
										})
									}
									disabled={isLoading}
								>
									<SelectTrigger id="department_id">
										<SelectValue placeholder="Select department" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">
											None
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
							)}
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="designation"
								className="text-sm font-medium"
							>
								Designation
							</Label>
							<Input
								id="designation"
								placeholder="e.g., Senior Lecturer"
								value={formData.designation}
								onChange={(e) =>
									setFormData({
										...formData,
										designation: e.target.value,
									})
								}
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="phone"
								className="text-sm font-medium"
							>
								Phone
							</Label>
							<Input
								id="phone"
								placeholder="1234567890"
								value={formData.phone}
								onChange={(e) =>
									setFormData({
										...formData,
										phone: e.target.value
											.replace(/\D/g, "")
											.slice(0, 10),
									})
								}
								disabled={isLoading}
								className={errors.phone ? "border-red-500" : ""}
							/>
							{errors.phone && (
								<p className="text-xs text-red-500">
									{errors.phone}
								</p>
							)}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
