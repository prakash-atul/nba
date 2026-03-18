import { useState } from "react";
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
import type { Student, UpdateStudentRequest } from "@/services/api";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];

export interface EditStudentDialogProps {
	open: boolean;
	student: Student | null;
	onOpenChange: (open: boolean) => void;
	onSave: (rollNo: string, data: UpdateStudentRequest) => Promise<void>;
	isLoading?: boolean;
}

export function EditStudentDialog({
	open,
	student,
	onOpenChange,
	onSave,
	isLoading = false,
}: EditStudentDialogProps) {
	const [formData, setFormData] = useState<UpdateStudentRequest>(() => ({
		student_name: student?.student_name || "",
		email: student?.email || null,
		phone: student?.phone || null,
		batch_year: student?.batch_year,
		student_status: student?.student_status || "Active",
	}));

	const handleSave = async () => {
		if (student) {
			await onSave(student.roll_no, formData);
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Student — {student?.roll_no}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label>Full Name</Label>
						<Input
							value={formData.student_name ?? ""}
							onChange={(e) =>
								setFormData((f) => ({
									...f,
									student_name: e.target.value,
								}))
							}
							disabled={isLoading}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Email</Label>
							<Input
								type="email"
								value={formData.email ?? ""}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										email: e.target.value || null,
									}))
								}
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Phone</Label>
							<Input
								value={formData.phone ?? ""}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										phone: e.target.value || null,
									}))
								}
								disabled={isLoading}
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Batch Year</Label>
							<Input
								type="number"
								value={formData.batch_year ?? ""}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										batch_year: e.target.value
											? Number(e.target.value)
											: undefined,
									}))
								}
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select
								value={formData.student_status ?? "Active"}
								onValueChange={(v) =>
									setFormData((f) => ({
										...f,
										student_status: v,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{STATUS_OPTIONS.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
						{isLoading ? "Saving…" : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
