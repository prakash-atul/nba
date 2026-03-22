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
import {
	adminApi,
	type User,
	type DeanUser,
	type Department,
	type School,
} from "@/services/api";
import { Minus, Plus } from "lucide-react";

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
		phones: [""] as string[],
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (user && open) {
			const loadUserData = async () => {
				let phoneNumbers: string[] = [""];
				try {
					const remotePhones = await adminApi.getUserPhones(
						user.employee_id,
					);
					if (remotePhones && remotePhones.length > 0) {
						phoneNumbers = remotePhones;
					}
				} catch (e) {
					console.warn("Could not load user phones:", e);
				}

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
					phones: phoneNumbers,
				});
				setErrors({});
			};
			loadUserData();
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

		formData.phones.forEach((phone, idx) => {
			if (phone && !/^\d{10}$/.test(phone)) {
				newErrors[`phone_${idx}`] = "Number must be 10 digits";
			}
		});

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
			phones: formData.phones.filter((p) => p.trim() !== ""),
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
			phones: [""],
		});
		setErrors({});
		onOpenChange(false);
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
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
