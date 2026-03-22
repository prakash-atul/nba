import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
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
		phones: student?.phones || [],
		batch_year: student?.batch_year,
		student_status: student?.student_status || "Active",
	}));

	const handleSave = async () => {
		if (student) {
			const cleanedPhones = (formData.phones || []).filter(
				(p) => typeof p === "string" && p.trim() !== "",
			);
			if (cleanedPhones.some((p) => p.replace(/\D/g, "").length !== 10)) {
				alert("Phone numbers must be exactly 10 digits");
				return;
			}
			await onSave(student.roll_no, {
				...formData,
				phones: cleanedPhones,
                                phone: cleanedPhones.length > 0 ? cleanedPhones[0] : null,
			});
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
							<Label>Phone Numbers</Label>
							<div className="space-y-2">
								{(formData.phones?.length
									? formData.phones
									: [""]
								).map((phone, idx, arr) => (
									<div
										key={idx}
										className="flex gap-2 items-center"
									>
										<Input
											type="tel"
											value={phone}
											onChange={(e) =>
												setFormData((f) => {
													const newPhones = [
														...(f.phones || []),
													];
													newPhones[idx] =
														e.target.value;
													return {
														...f,
														phones: newPhones,
													};
												})
											}
											disabled={isLoading}
										/>
										{arr.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
												onClick={() =>
													setFormData((f) => ({
														...f,
														phones: (
															f.phones || []
														).filter(
															(_, i) => i !== idx,
														),
													}))
												}
												disabled={isLoading}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										setFormData((f) => ({
											...f,
											phones: [...(f.phones || []), ""],
										}))
									}
									disabled={isLoading}
									className="text-xs h-8 mt-2"
								>
									<Plus className="mr-2 h-3.5 w-3.5" /> Add
									Phone Number
								</Button>
							</div>
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
