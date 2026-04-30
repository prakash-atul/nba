import { useState, useEffect } from "react";
import { debugLogger } from "@/lib/debugLogger";
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
import { adminApi } from "@/services/api";
import { FormDialog } from "../shared/FormDialog";
import { PhoneListInput } from "../shared/PhoneListInput";

export interface UserFormDialogProps {
	mode: "create" | "edit";
	initialData?: User | DeanUser | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (data: any) => Promise<void>;
	departments: Department[];
	schools?: School[];
	isLoading?: boolean;
}

export function UserFormDialog({
	mode,
	initialData,
	open,
	onOpenChange,
	onSave,
	departments,
	schools = [],
	isLoading = false,
}: UserFormDialogProps) {
	const isEdit = mode === "edit";

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

	useEffect(() => {
		if (open) {
			if (isEdit && initialData) {
				const loadUserData = async () => {
					let phoneNumbers: string[] = [""];
					try {
						const remotePhones = await adminApi.getUserPhones(
							initialData.employee_id,
						);
						if (remotePhones && remotePhones.length > 0) {
							phoneNumbers = remotePhones;
						}
					} catch (e) {
						console.warn("Could not load user phones:", e);
					}

					setFormData({
						employee_id: initialData.employee_id.toString(),
						username: initialData.username || "",
						email: initialData.email || "",
						password: "",
						role: initialData.role || "staff",
						department_id:
							("department_id" in initialData &&
							initialData.department_id
								? initialData.department_id
								: undefined
							)?.toString() || "none",
						school_id:
							("school_id" in initialData &&
							(initialData as any).school_id
								? (initialData as any).school_id
								: undefined
							)?.toString() || "none",
						designation: initialData.designation || "",
						phones: phoneNumbers,
					});
					setErrors({});
				};
				loadUserData();
			} else {
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
			}
		}
	}, [open, isEdit, initialData]);

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!isEdit && !formData.employee_id)
			newErrors.employee_id = "Employee ID is required";
		if (!formData.username) newErrors.username = "Username is required";
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		if (!isEdit && !formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password && formData.password.length < 6) {
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
				"UserFormDialog",
				"Form validation failed",
				newErrors,
			);
		}

		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) return;

		const submitData: any = {
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
			phones: formData.phones.filter((p) => p.trim() !== ""),
		};

		if (formData.password) {
			submitData.password = formData.password;
		}

		if (isEdit) {
			await onSave(submitData);
		} else {
			submitData.employee_id = parseInt(formData.employee_id);
			await onSave(submitData);
		}
	};

	return (
		<FormDialog
			open={open}
			onOpenChange={onOpenChange}
			title={
				isEdit
					? `Edit User - ${initialData?.username}`
					: "Create New User"
			}
			description={
				isEdit
					? "Update the user's profile information. Leave password blank to keep the current one."
					: "Add a new user to the system."
			}
			onSave={handleSave}
			isLoading={isLoading}
			saveLabel={isEdit ? "Save Changes" : "Create User"}
		>
			<div className="space-y-4 py-2">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label
							htmlFor="employee_id"
							className="text-sm font-medium"
						>
							Employee ID {isEdit ? "" : "*"}
						</Label>
						{isEdit ? (
							<div className="px-3 py-2 rounded border border-input bg-muted text-sm">
								{initialData?.employee_id}
							</div>
						) : (
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
						)}
						{errors.employee_id && (
							<p className="text-xs text-red-500">
								{errors.employee_id}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="role" className="text-sm font-medium">
							Role *
						</Label>
						<Select
							value={formData.role}
							onValueChange={(value) =>
								setFormData({ ...formData, role: value })
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
								<SelectItem value="faculty">Faculty</SelectItem>
								<SelectItem value="staff">Staff</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label
							htmlFor="username"
							className="text-sm font-medium"
						>
							Name/Username *
						</Label>
						<Input
							id="username"
							value={formData.username}
							onChange={(e) =>
								setFormData({
									...formData,
									username: e.target.value,
								})
							}
							disabled={isLoading}
							className={errors.username ? "border-red-500" : ""}
						/>
						{errors.username && (
							<p className="text-xs text-red-500">
								{errors.username}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-sm font-medium">
							Email *
						</Label>
						<Input
							id="email"
							type="email"
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

					<div className="space-y-1.5">
						<Label
							htmlFor="password"
							className="text-sm font-medium"
						>
							Password {isEdit ? "(Optional)" : "*"}
						</Label>
						<Input
							id="password"
							type="password"
							value={formData.password}
							onChange={(e) =>
								setFormData({
									...formData,
									password: e.target.value,
								})
							}
							disabled={isLoading}
							className={errors.password ? "border-red-500" : ""}
							placeholder={
								isEdit ? "Leave blank to keep current" : ""
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
							Department
						</Label>
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
								<SelectValue placeholder="Select Department" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								{departments.map((dept: any) => {
															const id = dept.department_id || dept.id;
															const label = dept.department_name || dept.name || dept.department_code || id;
															return (
																<SelectItem key={id} value={id ? id.toString() : 'none'}>{label}</SelectItem>
															);
													})}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label
							htmlFor="school_id"
							className="text-sm font-medium"
						>
							School (For Dean/Directors)
						</Label>
						<Select
							value={formData.school_id}
							onValueChange={(value) =>
								setFormData({ ...formData, school_id: value })
							}
							disabled={isLoading}
						>
							<SelectTrigger id="school_id">
								<SelectValue placeholder="Select School" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								{schools.map((school) => (
									<SelectItem
										key={school.school_id}
										value={school.school_id.toString()}
									>
										{school.school_name} (
										{school.school_code})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
							value={formData.designation}
							onChange={(e) =>
								setFormData({
									...formData,
									designation: e.target.value,
								})
							}
							disabled={isLoading}
							placeholder="e.g. Professor, Director"
						/>
					</div>
				</div>

				<div className="pt-2 mt-4">
					<Label className="text-sm font-medium mb-3 block">
						Phone Numbers
					</Label>
					<PhoneListInput
						phones={formData.phones}
						onChange={(phones) =>
							setFormData({ ...formData, phones })
						}
						disabled={isLoading}
						errors={errors}
					/>
				</div>
			</div>
		</FormDialog>
	);
}


