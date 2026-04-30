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
import { Checkbox } from "@/components/ui/checkbox";
import { hodApi } from "@/services/api/hod";
import type { DepartmentFaculty, BaseCourse } from "@/services/api/types";

export interface CourseFormDialogProps {
	mode: "create" | "edit";
	courseType: "base" | "offering";
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (data: any) => Promise<void>;
	isLoading?: boolean;
	initialData?: any;
}

export function CourseFormDialog({
	mode,
	courseType,
	open,
	onOpenChange,
	onSave,
	isLoading = false,
	initialData,
}: CourseFormDialogProps) {
	const defaultFormData = {
		course_code: "",
		course_name: "",
		credit: "3",
		course_type: "Theory",
		course_level: "Undergraduate",
		is_active: true, // Base specific
		year: new Date().getFullYear().toString(), // Offering specific
		semester: "Autumn", // Offering specific
		faculty_id: "", // Offering specific
		co_threshold: "40", // Offering specific
		passing_threshold: "60", // Offering specific
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
			if (initialData && mode === "edit") {
				setFormData({
					course_code: initialData.course_code || "",
					course_name:
						initialData.course_name || initialData.name || "",
					credit: (initialData.credit || 3).toString(),
					course_type: initialData.course_type || "Theory",
					course_level: initialData.course_level || "Undergraduate",
					is_active:
						initialData.is_active === undefined
							? true
							: initialData.is_active === 1,
					year: (
						initialData.year || new Date().getFullYear()
					).toString(),
					semester: initialData.semester || "Autumn",
					faculty_id: (initialData.faculty_id || "").toString(),
					co_threshold: (initialData.co_threshold || 40).toString(),
					passing_threshold: (
						initialData.passing_threshold || 60
					).toString(),
				});
				if (initialData.base_course_id) {
					setSelectedBaseCourseid(initialData.base_course_id);
				}
			} else if (
				initialData &&
				mode === "create" &&
				courseType === "offering"
			) {
				// prefill from base course when offering
				setFormData({
					...defaultFormData,
					course_code: initialData.course_code || "",
					course_name:
						initialData.course_name || initialData.name || "",
					credit: (initialData.credit || 3).toString(),
					course_type: initialData.course_type || "Theory",
					course_level: initialData.course_level || "Undergraduate",
				});
				if (initialData.course_id) {
					setSelectedBaseCourseid(initialData.course_id);
				}
			} else {
				setFormData(defaultFormData);
				setSelectedBaseCourseid(null);
			}

			const fetchData = async () => {
				if (courseType === "offering") {
					setIsFetchingFaculties(true);
					try {
						const facultyResp = await hodApi.getDepartmentFaculty({
							limit: 100,
						});
						setFaculties(facultyResp.data);
					} catch (error) {
						console.error("Failed to fetch faculties:", error);
					} finally {
						setIsFetchingFaculties(false);
					}

					if (mode === "create") {
						setIsFetchingCourses(true);
						try {
							const courseResp = await hodApi.getBaseCourses({
								limit: 200,
							});
							setBaseCourses(courseResp.data || []);
						} catch (error) {
							console.error(
								"Failed to fetch base courses:",
								error,
							);
						} finally {
							setIsFetchingCourses(false);
						}
					}
				}
			};
			fetchData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, initialData, mode, courseType]);

	const handleSave = async () => {
		if (!formData.course_code || !formData.course_name) return;
		if (courseType === "offering" && !formData.faculty_id) return;

		let savePayload: any = {
			course_code: formData.course_code,
			credit: parseInt(formData.credit),
		};

		if (courseType === "base") {
			savePayload.course_name = formData.course_name;
			savePayload.course_type = formData.course_type;
			savePayload.course_level = formData.course_level;
			savePayload.is_active = formData.is_active ? 1 : 0;
		} else {
			savePayload.name = formData.course_name;
			savePayload.course_type = formData.course_type;
			savePayload.course_level = formData.course_level;
			savePayload.year = parseInt(formData.year);
			savePayload.semester = formData.semester;
			savePayload.faculty_id = parseInt(formData.faculty_id);
			savePayload.co_threshold = parseFloat(formData.co_threshold);
			savePayload.passing_threshold = parseFloat(
				formData.passing_threshold,
			);
		}

		await onSave(savePayload);
		if (mode === "create") {
			setFormData(defaultFormData);
		}
	};

	const title =
		mode === "create"
			? courseType === "base"
				? "Add New Course Template"
				: "Offer Course"
			: courseType === "base"
				? `Edit Course Template — ${initialData?.course_code}`
				: `Edit Course — ${initialData?.course_code}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{mode === "create" && courseType === "offering" && (
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
										setSelectedBaseCourseid(
											selected.course_id,
										);
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
											{course.course_name} (
											{course.credit} cr.)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedBaseCourseid === null && (
								<p className="text-[10px] text-muted-foreground mt-1">
									Or enter course details manually below
								</p>
							)}
						</div>
					)}

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
									isLoading ||
									(mode === "create" &&
										courseType === "offering" &&
										selectedBaseCourseid !== null)
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
									isLoading ||
									(mode === "create" &&
										courseType === "offering" &&
										selectedBaseCourseid !== null)
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
								isLoading ||
								(mode === "create" &&
									courseType === "offering" &&
									selectedBaseCourseid !== null)
							}
							placeholder="e.g., Biochemistry"
						/>
					</div>

					{(mode === "edit" ||
						courseType === "base" ||
						(mode === "create" &&
							courseType === "offering" &&
							selectedBaseCourseid === null)) && (
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

					{courseType === "base" && (
						<div className="flex items-center space-x-2 pt-2">
							<Checkbox
								id="is_active"
								checked={formData.is_active}
								onCheckedChange={(checked: boolean) =>
									setFormData((f) => ({
										...f,
										is_active: checked,
									}))
								}
								disabled={isLoading}
							/>
							<Label htmlFor="is_active">
								Active (Template visible for new offerings)
							</Label>
						</div>
					)}

					{courseType === "offering" && (
						<>
							<div className="grid grid-cols-3 gap-4 border-t pt-4">
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
									/>
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
									/>
								</div>
							</div>
						</>
					)}
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
							(courseType === "offering" && !formData.faculty_id)
						}
					>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
