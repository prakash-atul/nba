import { useState, useEffect } from "react";
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
import type { AdminCourse } from "@/services/api";
import { hodApi } from "@/services/api/hod";
import type { DepartmentFaculty } from "@/services/api/types";

export interface EditCourseDialogProps {
	open: boolean;
	course: AdminCourse | null;
	onOpenChange: (open: boolean) => void;
	onSave: (courseId: number | undefined, data: any) => Promise<void>;
	isLoading?: boolean;
}

export function EditCourseDialog({
	open,
	course,
	onOpenChange,
	onSave,
	isLoading = false,
}: EditCourseDialogProps) {
	const [formData, setFormData] = useState(() => ({
		course_code: course?.course_code || "",
		course_name: course?.course_name || "",
		credit: (course?.credit || 3).toString(),
		course_type: course?.course_type || "Theory",
		course_level: course?.course_level || "Undergraduate",
		year: (course?.year || new Date().getFullYear()).toString(),
		semester: course?.semester || "Autumn",
		faculty_id: (course?.faculty_id || "").toString(),
	}));

	const [faculties, setFaculties] = useState<DepartmentFaculty[]>([]);
	const [isFetchingFaculties, setIsFetchingFaculties] = useState(false);

	useEffect(() => {
		if (open) {
			const fetchFaculties = async () => {
				setIsFetchingFaculties(true);
				try {
					const response = await hodApi.getDepartmentFaculty({
						limit: 100,
					});
					setFaculties(response.data);
				} catch (error) {
					console.error("Failed to fetch faculties:", error);
				} finally {
					setIsFetchingFaculties(false);
				}
			};
			fetchFaculties();
		}
	}, [open]);

	useEffect(() => {
		if (course && open) {
			setFormData({
				course_code: course.course_code || "",
				course_name: course.course_name || "",
				credit: (course.credit || 3).toString(),
				course_type: course.course_type || "Theory",
				course_level: course.course_level || "Undergraduate",
				year: (course.year || new Date().getFullYear()).toString(),
				semester: course.semester || "Autumn",
				faculty_id: (course.faculty_id || "").toString(),
			});
		}
	}, [course, open]);

	const handleSave = async () => {
		if (course?.course_id && formData.faculty_id) {
			await onSave(course.course_id, {
				course_code: formData.course_code,
				name: formData.course_name,
				credit: parseInt(formData.credit),
				course_type: formData.course_type,
				course_level: formData.course_level,
				year: parseInt(formData.year),
				semester: formData.semester,
				faculty_id: parseInt(formData.faculty_id),
			});
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						Edit Course — {course?.course_code}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Course Code</Label>
							<Input
								value={formData.course_code}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										course_code: e.target.value,
									}))
								}
								disabled={isLoading}
								placeholder="e.g., BT101"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Credit</Label>
							<Select
								value={formData.credit}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										credit: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[1, 2, 3, 4, 5, 6].map((c) => (
										<SelectItem
											key={c}
											value={c.toString()}
										>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>Course Name</Label>
						<Input
							value={formData.course_name}
							onChange={(e) =>
								setFormData((f) => ({
									...f,
									course_name: e.target.value,
								}))
							}
							disabled={isLoading}
							placeholder="e.g., Biochemistry"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Course Type</Label>
							<Select
								value={formData.course_type}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										course_type: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"Theory",
										"Lab",
										"Project",
										"Seminar",
									].map((t) => (
										<SelectItem key={t} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Course Level</Label>
							<Select
								value={formData.course_level}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										course_level: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"Undergraduate",
										"Postgraduate",
										"UG & PG",
									].map((l) => (
										<SelectItem key={l} value={l}>
											{l}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-1.5">
							<Label>Year</Label>
							<Input
								type="number"
								value={formData.year}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										year: e.target.value,
									}))
								}
								disabled={isLoading}
								min="2020"
								max="2050"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Semester</Label>
							<Select
								value={formData.semester}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										semester: value,
									}))
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{["Autumn", "Spring"].map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label>Faculty *</Label>
							<Select
								value={formData.faculty_id}
								onValueChange={(value) =>
									setFormData((f) => ({
										...f,
										faculty_id: value,
									}))
								}
								disabled={isLoading || isFetchingFaculties}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Faculty" />
								</SelectTrigger>
								<SelectContent className="max-h-[200px]">
									{faculties.map((faculty) => (
										<SelectItem
											key={faculty.employee_id}
											value={faculty.employee_id.toString()}
										>
											{faculty.username} (
											{faculty.employee_id})
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
					<Button
						onClick={handleSave}
						disabled={isLoading || !formData.faculty_id}
					>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
