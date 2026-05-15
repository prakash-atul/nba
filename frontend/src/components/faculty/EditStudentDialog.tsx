import { useState, useEffect } from "react";
import { toast } from "sonner";
import { facultyApi } from "@/services/api/faculty";
import type { EnrolledStudent, UpdateStudentRequest } from "@/services/api";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
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
import { Trash2, Plus } from "lucide-react";
import { STATUS_OPTIONS } from "./FacultyStudents.columns";

interface EditStudentDialogProps {
	student: EnrolledStudent | null;
	onClose: () => void;
	onSuccess: (updatedStudent: Partial<EnrolledStudent>) => void;
}

export function EditStudentDialog({
	student,
	onClose,
	onSuccess,
}: EditStudentDialogProps) {
	const [editForm, setEditForm] = useState<UpdateStudentRequest>({});
	const [editSaving, setEditSaving] = useState(false);

	useEffect(() => {
		if (student) {
			setEditForm({
				student_name: student.student_name,
				email: student.email ?? "",
				phones: student.phones?.length ? student.phones : [],
				student_status: student.student_status,
				batch_year: student.batch_year,
			});
		} else {
			setEditForm({});
		}
	}, [student]);

	const handleEditSave = async () => {
		if (!student) return;

		const validPhones = (editForm.phones || []).filter(
			(p) => p.trim() !== "",
		);
		if (
			validPhones.length > 0 &&
			validPhones.some((p) => !/^\d{10}$/.test(p))
		) {
			toast.error("Phone number must be exactly 10 digits");
			return;
		}

		setEditSaving(true);
		try {
			const dataToSave = {
				...editForm,
				phones: validPhones,
				phone: validPhones.length > 0 ? validPhones[0] : null,
			};
			await facultyApi.updateStudent(student.roll_no, dataToSave);
			toast.success("Student updated successfully");
			onSuccess({
				roll_no: student.roll_no,
				student_name: editForm.student_name ?? student.student_name,
				email:
					(editForm.email as string | null | undefined) ??
					student.email,
				phones: dataToSave.phones.length
					? dataToSave.phones
					: student.phones || [],
				student_status:
					editForm.student_status ?? student.student_status,
				batch_year: editForm.batch_year ?? student.batch_year,
			});
			onClose();
		} catch {
			toast.error("Failed to update student");
		} finally {
			setEditSaving(false);
		}
	};

	return (
		<Dialog
			open={!!student}
			onOpenChange={(open: boolean) => !open && onClose()}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Student — {student?.roll_no}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label>Full Name</Label>
						<Input
							value={editForm.student_name ?? ""}
							onChange={(e) =>
								setEditForm((f) => ({
									...f,
									student_name: e.target.value,
								}))
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Email</Label>
							<Input
								type="email"
								value={editForm.email ?? ""}
								onChange={(e) =>
									setEditForm((f) => ({
										...f,
										email: e.target.value || null,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Phone Numbers</Label>
							{(editForm.phones?.length
								? editForm.phones
								: [""]
							).map((phone, index, arr) => (
								<div key={index} className="flex gap-2 mb-2">
									<Input
										type="tel"
										maxLength={10}
										pattern="\d{10}"
										value={phone}
										placeholder="10-digit phone number"
										onChange={(e) => {
											const val = e.target.value.replace(
												/\D/g,
												"",
											);
											const newPhones = [...arr];
											newPhones[index] = val;
											setEditForm((f) => ({
												...f,
												phones: newPhones,
											}));
										}}
									/>
									{arr.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="shrink-0 text-destructive hover:bg-destructive/10"
											onClick={() => {
												const newPhones = arr.filter(
													(_, i) => i !== index,
												);
												setEditForm((f) => ({
													...f,
													phones: newPhones,
												}));
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-1 flex items-center gap-1 w-full border-dashed"
								onClick={() => {
									setEditForm((f) => ({
										...f,
										phones: [...(f.phones || []), ""],
									}));
								}}
							>
								<Plus className="h-4 w-4" />
								Add Phone Number
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Batch Year</Label>
							<Input
								type="number"
								value={editForm.batch_year ?? ""}
								onChange={(e) =>
									setEditForm((f) => ({
										...f,
										batch_year: e.target.value
											? Number(e.target.value)
											: undefined,
									}))
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Status</Label>
							<Select
								value={editForm.student_status ?? "Active"}
								onValueChange={(v) =>
									setEditForm((f) => ({
										...f,
										student_status: v,
									}))
								}
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
						onClick={onClose}
						disabled={editSaving}
					>
						Cancel
					</Button>
					<Button onClick={handleEditSave} disabled={editSaving}>
						{editSaving ? "Saving…" : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
