import { useState } from "react";
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
import type { Student, UpdateStudentRequest } from "@/services/api";
import { toast } from "sonner";

interface EditStudentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	student: Student | null;
	onSave: (data: UpdateStudentRequest) => Promise<void>;
}

export function EditStudentDialog({
	open,
	onOpenChange,
	student,
	onSave,
}: EditStudentDialogProps) {
	const [saving, setSaving] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [formData, setFormData] = useState({
		student_name: "",
		email: "",
		phone: "",
		student_status: "Active",
	});

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setFormData({
				student_name: "",
				email: "",
				phone: "",
				student_status: "Active",
			});
			setErrors({});
		}
		onOpenChange(isOpen);
	};

	// Initialize form when student changes
	if (student && open && formData.student_name !== student.student_name) {
		setFormData({
			student_name: student.student_name || "",
			email: student.email || "",
			phone: (student.phones && student.phones[0]) || "",
			student_status: student.student_status || "Active",
		});
	}

	const validatePhone = (phone: string): string => {
		if (!phone) return "";
		const digitsOnly = phone.replace(/\D/g, "");
		if (digitsOnly.length !== 10) {
			return "Phone must be exactly 10 digits";
		}
		return "";
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 10);
		setFormData({ ...formData, phone: value });
		setErrors({ ...errors, phone: validatePhone(value) });
	};

	const handleSave = async () => {
		if (!student) return;

		// Validate phone
		const phoneError = validatePhone(formData.phone);
		if (phoneError) {
			setErrors({ ...errors, phone: phoneError });
			toast.error(phoneError);
			return;
		}

		// Validate email if provided
		if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		setSaving(true);
		try {
			await onSave({
				student_name: formData.student_name,
				email: formData.email || null,
				phone: formData.phone || null,
				student_status: formData.student_status,
			});
			toast.success("Student updated successfully");
			handleOpenChange(false);
		} catch (error) {
			toast.error("Failed to update student");
			console.error(error);
		} finally {
			setSaving(false);
		}
	};

	if (!student) return null;

	const currentPhone = (student.phones && student.phones[0]) || "";
	const currentEmail = student.email || "";
	const currentName = student.student_name || "";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit Student</DialogTitle>
					<DialogDescription>
						Update student information for {student.roll_no}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="name" className="text-right">
							Name
						</Label>
						<Input
							id="name"
							value={formData.student_name}
							onChange={(e) =>
								setFormData({
									...formData,
									student_name: e.target.value,
								})
							}
							placeholder={currentName}
							className="col-span-3"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="email" className="text-right">
							Email
						</Label>
						<Input
							id="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							type="email"
							placeholder={currentEmail || "student@tezu.ac.in"}
							className="col-span-3"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="phone" className="text-right">
							Phone
						</Label>
						<div className="col-span-3">
							<Input
								id="phone"
								value={formData.phone}
								onChange={handlePhoneChange}
								type="tel"
								inputMode="numeric"
								placeholder={currentPhone || "10 digit mobile number"}
								maxLength={10}
								className={errors.phone ? "border-red-500" : ""}
							/>
							{errors.phone && (
								<p className="text-xs text-red-500 mt-1">
									{errors.phone}
								</p>
							)}
						</div>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="status" className="text-right">
							Status
						</Label>
						<Input
							id="status"
							value={formData.student_status}
							onChange={(e) =>
								setFormData({
									...formData,
									student_status: e.target.value,
								})
							}
							placeholder={student.student_status || "Active"}
							className="col-span-3"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}