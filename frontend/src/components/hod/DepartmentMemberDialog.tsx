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
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface DepartmentMemberFormData {
	employee_id: number;
	username: string;
	email: string;
	role: "faculty" | "staff";
	password?: string;
	designation?: string;
	phones: string[];
}

interface DepartmentMemberDialogProps {
	mode: "add" | "edit";
	open: boolean;
	onOpenChange: (open: boolean) => void;
	formData: DepartmentMemberFormData;
	setFormData: (data: DepartmentMemberFormData) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	onCancel: () => void;
}

export function DepartmentMemberDialog({
	mode,
	open,
	onOpenChange,
	formData,
	setFormData,
	onSubmit,
	isSubmitting,
	onCancel,
}: DepartmentMemberDialogProps) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "add" ? "Add New Member" : "Edit Member"}
					</DialogTitle>
					<DialogDescription>
						{mode === "add"
							? "Add a new faculty or staff member to your department"
							: "Update member information"}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${mode}_employee_id`}>
								Employee ID *
							</Label>
							<Input
								id={`${mode}_employee_id`}
								type="number"
								placeholder="e.g., 3016"
								value={formData.employee_id || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										employee_id:
											parseInt(e.target.value) || 0,
									})
								}
								disabled={mode === "edit"}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${mode}_role`}>Role *</Label>
							<Select
								value={formData.role}
								onValueChange={(value: "faculty" | "staff") =>
									setFormData({
										...formData,
										role: value,
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="faculty">
										Faculty
									</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${mode}_username`}>Full Name *</Label>
						<Input
							id={`${mode}_username`}
							placeholder="e.g., Dr. John Doe"
							value={formData.username}
							onChange={(e) =>
								setFormData({
									...formData,
									username: e.target.value,
								})
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${mode}_email`}>Email *</Label>
						<Input
							id={`${mode}_email`}
							type="email"
							placeholder="e.g., john@example.com"
							value={formData.email}
							onChange={(e) =>
								setFormData({
									...formData,
									email: e.target.value,
								})
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${mode}_designation`}>
								Designation
							</Label>
							<Input
								id={`${mode}_designation`}
								placeholder="e.g., Professor"
								value={formData.designation ?? ""}
								onChange={(e) =>
									setFormData({
										...formData,
										designation: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Phone Numbers</Label>
							<div className="flex flex-col gap-2">
								{(formData.phones?.length
									? formData.phones
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
													...(formData.phones || []),
												];
												newPhones[idx] = val;
												setFormData({
													...formData,
													phones: newPhones,
												});
											}}
										/>
										{(formData.phones?.length
											? formData.phones.length
											: 1) > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													let newPhones = (
														formData.phones || []
													).filter(
														(_, i) => i !== idx,
													);
													if (newPhones.length === 0)
														newPhones = [""];
													setFormData({
														...formData,
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
									setFormData({
										...formData,
										phones: [
											...(formData.phones || []),
											"",
										],
									});
								}}
							>
								<Plus className="w-4 h-4 mr-2" />
								Add Phone Number
							</Button>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${mode}_password`}>
							{mode === "add"
								? "Password *"
								: "Password (Optional)"}
						</Label>
						<div className="relative">
							<Input
								id={`${mode}_password`}
								type={showPassword ? "text" : "password"}
								placeholder={
									mode === "add"
										? "Minimum 6 characters"
										: "Leave blank to keep unchanged"
								}
								value={formData.password}
								onChange={(e) =>
									setFormData({
										...formData,
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
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						onClick={onSubmit}
						disabled={isSubmitting}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						{isSubmitting
							? mode === "add"
								? "Creating..."
								: "Saving..."
							: mode === "add"
								? "Create"
								: "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
