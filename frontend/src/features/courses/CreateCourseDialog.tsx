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
import { hodApi } from "@/services/api/hod";
import type { DepartmentFaculty, BaseCourse } from "@/services/api/types";

export interface CreateCourseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (data: any) => Promise<void>;
	isLoading?: boolean;
	initialData?: any;
	mode?: "base" | "offering";
}

export function CreateCourseDialog({
	open,
	onOpenChange,
	onSave,
	isLoading = false,
	initialData,
	mode = "offering",
}: CreateCourseDialogProps) {
	const defaultFormData = {
		course_code: "",
		course_name: "",
		credit: "3",
		course_type: "Theory",
		course_level: "Undergraduate",
		year: new Date().getFullYear().toString(),
		semester: "Autumn",
		faculty_id: "",
		co_threshold: "40",
		passing_threshold: "60",
	};

	const [formData, setFormData] = useState(defaultFormData);

	const [faculties, setFaculties] = useState<DepartmentFaculty[]>([]);
	const [isFetchingFaculties, setIsFetchingFaculties] = useState(false);
	const [baseCourses, setBaseCourses] = useState<BaseCourse[]>([]);
	const [isFetchingCourses, setIsFetchingCourses] = useState(false);
	const [selectedBaseCourseid, setSelectedBaseCourseid] = useState<
		number | null
	>(null);

	useEffect(() => {
		if (open) {
			if (initialData) {
				setFormData({ ...defaultFormData, ...initialData });
				if (initialData.base_course_id) {
					setSelectedBaseCourseid(initialData.base_course_id);
				}
			} else {
				setFormData(defaultFormData);
				setSelectedBaseCourseid(null);
			}

			const fetchData = async () => {
				setIsFetchingFaculties(true);
				setIsFetchingCourses(true);
				try {
					const [facultyResp, courseResp] = await Promise.all([
						hodApi.getDepartmentFaculty({ limit: 100 }),
						hodApi.getBaseCourses({ limit: 200 }),
					]);
					setFaculties(facultyResp.data);
					setBaseCourses(courseResp.data || []);
				} catch (error) {
					console.error("Failed to fetch data:", error);
				} finally {
					setIsFetchingFaculties(false);
					setIsFetchingCourses(false);
				}
			};
			fetchData();
			return () => {
				setSelectedBaseCourseid(null);
			};
		}
	}, [open]);

	const handleSave = async () => {
		if (
			!formData.course_code ||
			!formData.course_name ||
			(mode === "offering" && !formData.faculty_id)
		) {
			return;
		}

		await onSave({
			course_code: formData.course_code,
			name: formData.course_name,
			credit: parseInt(formData.credit),
			...(mode === "offering"
				? {
						course_type: formData.course_type,
						course_level: formData.course_level,
						year: parseInt(formData.year),
						semester: formData.semester,
						faculty_id: parseInt(formData.faculty_id),
						co_threshold: parseFloat(formData.co_threshold),
						passing_threshold: parseFloat(
							formData.passing_threshold,
						),
					}
				: {}),
		});

		setFormData(defaultFormData);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{initialData ? "Offer Course" : "Create New Course"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label>Select from Course Catalog</Label>
							{selectedBaseCourseid && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedBaseCourseid(null);
										setFormData((f) => ({
											...f,
											course_code: "",
											course_name: "",
											credit: "3",
										}));
									}}
									disabled={isLoading}
									className="text-xs"
								>
									Clear Selection
								</Button>
							)}
						</div>
						<Select
							value={
								selectedBaseCourseid
									? selectedBaseCourseid.toString()
									: undefined
							}
							onValueChange={(value) => {
								const selected = baseCourses.find(
									(c) => c.course_id === parseInt(value),
								);
								if (selected) {
									setSelectedBaseCourseid(selected.course_id);
									setFormData((f) => ({
										...f,
										course_code: selected.course_code,
										course_name: selected.course_name,
										credit: selected.credit.toString(),
									}));
								}
							}}
							disabled={isLoading || isFetchingCourses}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Browse available courses..." />
							</SelectTrigger>
							<SelectContent>
								{baseCourses.map((course) => (
									<SelectItem
										key={course.course_id}
										value={course.course_id.toString()}
									>
										{course.course_code} -{" "}
										{course.course_name} ({course.credit}{" "}
										cr.)
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-[10px] text-muted-foreground">
							Or enter course details manually below
						</p>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>Course Code *</Label>
							<Input
								value={formData.course_code}
								onChange={(e) =>
									setFormData((f) => ({
										...f,
										course_code: e.target.value,
									}))
								}
								disabled={
									isLoading || selectedBaseCourseid !== null
								}
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
								disabled={
									isLoading || selectedBaseCourseid !== null
								}
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
						<Label>Course Name *</Label>
						<Input
							value={formData.course_name}
							onChange={(e) =>
								setFormData((f) => ({
									...f,
									course_name: e.target.value,
								}))
							}
							disabled={
								isLoading || selectedBaseCourseid !== null
							}
							placeholder="e.g., Biochemistry"
						/>
					</div>
					{selectedBaseCourseid === null && (
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
					)}
					{mode === "offering" && (
						<>
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
										disabled={
											isLoading || isFetchingFaculties
										}
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
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<Label>CO Attainment Threshold (%)</Label>
									<Input
										type="number"
										value={formData.co_threshold}
										onChange={(e) =>
											setFormData((f) => ({
												...f,
												co_threshold: e.target.value,
											}))
										}
										disabled={isLoading}
										min="0"
										max="100"
									/>
									<p className="text-[10px] text-muted-foreground">
										Target percentage of students achieving
										target marks
									</p>
								</div>
								<div className="space-y-1.5">
									<Label>Passing Threshold (%)</Label>
									<Input
										type="number"
										value={formData.passing_threshold}
										onChange={(e) =>
											setFormData((f) => ({
												...f,
												passing_threshold:
													e.target.value,
											}))
										}
										disabled={isLoading}
										min="0"
										max="100"
									/>
									<p className="text-[10px] text-muted-foreground">
										Target marks percentage for a student to
										"pass" a CO
									</p>
								</div>
							</div>{" "}
						</>
					)}{" "}
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
						disabled={
							isLoading ||
							!formData.course_code ||
							!formData.course_name ||
							(mode === "offering" && !formData.faculty_id)
						}
					>
						{isLoading ? "Creating..." : "Create Course"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
