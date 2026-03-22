import { useState } from "react";
import { debugLogger } from "@/lib/debugLogger";
import {
	Dialog,
	DialogContent,
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
import type { Department, School } from "@/services/api";
import { Minus, Plus } from "lucide-react";

export interface CreateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (data: any) => Promise<void>;
	departments: Department[];
	schools?: School[];
	isLoading?: boolean;
}

export function CreateUserDialog({
	open,
	onOpenChange,
	onSave,
	departments,
	schools = [],
	isLoading = false,
}: CreateUserDialogProps) {
	const [formData, setFormData] = useState({
		employee_id: "",
		username: "",
		email: "",
		password: "",
		role: "staff",
		department_id: "",
		school_id: "",
		designation: "",
		phones: [""] as string[],
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.employee_id)
			newErrors.employee_id = "Employee ID is required";
		if (!formData.username) newErrors.username = "Username is required";
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}
		if (!formData.password) newErrors.password = "Password is required";
		if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		formData.phones.forEach((phone, idx) => {
			if (phone && !/^\d{10}$/.test(phone)) {
				newErrors[`phone_${idx}`] = "Number must be 10 digits";
			}
		});

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			debugLogger.warn(
				"CreateUserDialog",
				"Form validation failed",
				newErrors,
			);
		} else {
			debugLogger.debug("CreateUserDialog", "Form validation passed");
		}

		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) return;

		debugLogger.info("CreateUserDialog", "Submitting new user form", {
			employee_id: formData.employee_id,
			username: formData.username,
			email: formData.email,
			role: formData.role,
		});

		await onSave({
			employee_id: parseInt(formData.employee_id),
			username: formData.username,
			email: formData.email,
			password: formData.password,
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
			phones: formData.phones.filter((p) => p.trim() !== ""),
		});

		setFormData({
			employee_id: "",
			username: "",
			email: "",
			password: "",
			role: "staff",
			department_id: "",
			school_id: "",
			designation: "",
			phones: [""],
		});
		setErrors({});
		onOpenChange(false);
		debugLogger.info("CreateUserDialog", "Form reset and dialog closed");
	};

	const addPhoneField = () => {
		setFormData({ ...formData, phones: [...formData.phones, ""] });
	};

	const removePhoneField = (index: number) => {
		const newPhones = [...formData.phones];
		newPhones.splice(index, 1);
		if (newPhones.length === 0) newPhones.push("");
		setFormData({ ...formData, phones: newPhones });
	};

	const updatePhoneField = (index: number, value: string) => {
		const newPhones = [...formData.phones];
		newPhones[index] = value.replace(/\D/g, "").slice(0, 10);
		setFormData({ ...formData, phones: newPhones });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New User</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label
								htmlFor="employee_id"
								className="text-sm font-medium"
							>
								Employee ID *
							</Label>
							<Input
								id="employee_id"
								type="number"
								placeholder="12345"
								value={formData.employee_id}
								onChange={(e) =>
									setFormData({
										...formData,
										employee_id: e.target.value,
									})
								}
								disabled={isLoading}
								className={
									errors.employee_id ? "border-red-500" : ""
								}
							/>
							{errors.employee_id && (
								<p className="text-xs text-red-500">
									{errors.employee_id}
								</p>
							)}
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
								Password *
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

						<div className="space-y-1.5 col-span-2 border-t pt-4 mt-2">
							<div className="flex items-center justify-between mb-2">
								<Label className="text-sm font-semibold">
									Contact Numbers
								</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 text-xs gap-1"
									onClick={addPhoneField}
									disabled={isLoading}
								>
									<Plus className="h-3 w-3" />
									Add Number
								</Button>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{formData.phones.map((phone, idx) => (
									<div key={idx} className="space-y-1">
										<div className="flex gap-2">
											<div className="relative flex-1">
												<Input
													placeholder="10-digit number"
													value={phone}
													onChange={(e) =>
														updatePhoneField(
															idx,
															e.target.value,
														)
													}
													disabled={isLoading}
													className={
														errors[`phone_${idx}`]
															? "border-red-500 pr-8"
															: "pr-8"
													}
												/>
												<span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground font-mono">
													#{idx + 1}
												</span>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
												onClick={() =>
													removePhoneField(idx)
												}
												disabled={isLoading}
											>
												<Minus className="h-4 w-4" />
											</Button>
										</div>
										{errors[`phone_${idx}`] && (
											<p className="text-[10px] text-red-500 ml-1">
												{errors[`phone_${idx}`]}
											</p>
										)}
									</div>
								))}
							</div>
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
						{isLoading ? "Creating..." : "Create User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
