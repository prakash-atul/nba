import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type {
	DepartmentCourse,
	DepartmentFaculty,
	CreateCourseRequest,
	UpdateCourseRequest,
} from "@/services/api";
import { hodApi } from "@/services/api/hod";
import { usePaginatedData } from "@/lib/usePaginatedData";

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

export function CoursesManagement() {
	const {
		data: courses,
		loading: isLoading,
		refresh: onRefresh,
	} = usePaginatedData<DepartmentCourse>({
		fetchFn: (params) => hodApi.getDepartmentCourses(params),
		limit: 50,
		defaultSort: "c.course_code",
	});

	const { data: faculty } = usePaginatedData<DepartmentFaculty>({
		fetchFn: (params) => hodApi.getDepartmentFaculty(params),
		limit: 100,
		defaultSort: "u.username",
	});
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedCourse, setSelectedCourse] =
		useState<DepartmentCourse | null>(null);
	const [formData, setFormData] = useState<CreateCourseRequest>({
		course_code: "",
		name: "",
		credit: 3,
		faculty_id: 0,
		year: currentYear,
		semester: 1,
	});
	const [editFormData, setEditFormData] = useState<UpdateCourseRequest>({
		course_code: "",
		name: "",
		credit: 3,
		faculty_id: 0,
		year: currentYear,
		semester: 1,
	});

	const resetForm = () => {
		setFormData({
			course_code: "",
			name: "",
			credit: 3,
			faculty_id: 0,
			year: currentYear,
			semester: 1,
		});
	};

	const handleCreateCourse = async () => {
		if (!formData.course_code || !formData.name || !formData.faculty_id) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await apiService.createCourse(formData);
			toast.success("Course created successfully");
			setIsAddDialogOpen(false);
			resetForm();
			onRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create course",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteCourse = async (courseId: number, courseName: string) => {
		try {
			await apiService.deleteCourse(courseId);
			toast.success(`Course "${courseName}" deleted successfully`);
			onRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete course",
			);
		}
	};

	const openEditDialog = (course: DepartmentCourse) => {
		setSelectedCourse(course);
		setEditFormData({
			course_code: course.course_code,
			name: course.name,
			credit: course.credit,
			faculty_id: course.faculty_id,
			year: course.year,
			semester: course.semester,
		});
		setIsEditDialogOpen(true);
	};

	const handleUpdateCourse = async () => {
		if (!selectedCourse) return;

		if (
			!editFormData.course_code ||
			!editFormData.name ||
			!editFormData.faculty_id
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await apiService.updateCourse(selectedCourse.id, editFormData);
			toast.success("Course updated successfully");
			setIsEditDialogOpen(false);
			setSelectedCourse(null);
			onRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update course",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
						<BookOpen className="w-5 h-5 text-white" />
					</div>
					<div>
						<CardTitle>Department Courses</CardTitle>
						<p className="text-sm text-muted-foreground">
							Manage courses for your department
						</p>
					</div>
				</div>
				<Dialog
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
				>
					<DialogTrigger asChild>
						<Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
							<Plus className="w-4 h-4" />
							Add Course
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Add New Course</DialogTitle>
							<DialogDescription>
								Create a new course for your department
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="course_code">
										Course Code *
									</Label>
									<Input
										id="course_code"
										placeholder="e.g., CS301"
										value={formData.course_code}
										onChange={(e) =>
											setFormData({
												...formData,
												course_code: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="credit">Credits *</Label>
									<Select
										value={String(formData.credit)}
										onValueChange={(value) =>
											setFormData({
												...formData,
												credit: parseInt(value),
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[1, 2, 3, 4, 5, 6].map((c) => (
												<SelectItem
													key={c}
													value={String(c)}
												>
													{c}{" "}
													{c === 1
														? "Credit"
														: "Credits"}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="name">Course Name *</Label>
								<Input
									id="name"
									placeholder="e.g., Database Management Systems"
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="faculty">
									Assign Faculty *
								</Label>
								<Select
									value={
										formData.faculty_id
											? String(formData.faculty_id)
											: ""
									}
									onValueChange={(value) =>
										setFormData({
											...formData,
											faculty_id: parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select faculty member" />
									</SelectTrigger>
									<SelectContent>
										{faculty
											.filter(
												(f) =>
													f.role === "faculty" ||
													f.role === "hod",
											)
											.map((f) => (
												<SelectItem
													key={f.employee_id}
													value={String(
														f.employee_id,
													)}
												>
													{f.username}{" "}
													{f.role === "hod"
														? "(HOD)"
														: ""}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="year">Year *</Label>
									<Select
										value={String(formData.year)}
										onValueChange={(value) =>
											setFormData({
												...formData,
												year: parseInt(value),
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{years.map((y) => (
												<SelectItem
													key={y}
													value={String(y)}
												>
													{y}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="semester">Semester *</Label>
									<Select
										value={String(formData.semester)}
										onValueChange={(value) =>
											setFormData({
												...formData,
												semester: parseInt(value),
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{semesters.map((s) => (
												<SelectItem
													key={s}
													value={String(s)}
												>
													Semester {s}
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
								onClick={() => {
									setIsAddDialogOpen(false);
									resetForm();
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateCourse}
								disabled={isSubmitting}
								className="bg-emerald-600 hover:bg-emerald-700"
							>
								{isSubmitting ? "Creating..." : "Create Course"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
					</div>
				) : courses.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
						<p>No courses found in your department</p>
						<p className="text-sm">
							Click "Add Course" to create one
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead className="text-center">
									Credits
								</TableHead>
								<TableHead>Faculty</TableHead>
								<TableHead className="text-center">
									Year
								</TableHead>
								<TableHead className="text-center">
									Sem
								</TableHead>
								<TableHead className="text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{courses.map((course) => (
								<TableRow key={course.id}>
									<TableCell className="font-medium">
										{course.course_code}
									</TableCell>
									<TableCell>{course.name}</TableCell>
									<TableCell className="text-center">
										{course.credit}
									</TableCell>
									<TableCell>{course.faculty_name}</TableCell>
									<TableCell className="text-center">
										{course.year}
									</TableCell>
									<TableCell className="text-center">
										{course.semester}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
												onClick={() =>
													openEditDialog(course)
												}
											>
												<Pencil className="w-4 h-4" />
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Delete Course
														</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you
															want to delete "
															{course.name}"? This
															will also delete all
															associated tests,
															marks, and
															enrollments. This
															action cannot be
															undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Cancel
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																handleDeleteCourse(
																	course.id,
																	course.name,
																)
															}
															className="bg-red-600 hover:bg-red-700"
														>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>

			{/* Edit Course Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Course</DialogTitle>
						<DialogDescription>
							Update course information
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit_course_code">
									Course Code *
								</Label>
								<Input
									id="edit_course_code"
									placeholder="e.g., CS301"
									value={editFormData.course_code || ""}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											course_code: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit_credit">Credits *</Label>
								<Select
									value={String(editFormData.credit)}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											credit: parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5, 6].map((c) => (
											<SelectItem
												key={c}
												value={String(c)}
											>
												{c}{" "}
												{c === 1 ? "Credit" : "Credits"}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_name">Course Name *</Label>
							<Input
								id="edit_name"
								placeholder="e.g., Database Management Systems"
								value={editFormData.name || ""}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										name: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_faculty">
								Assign Faculty *
							</Label>
							<Select
								value={
									editFormData.faculty_id
										? String(editFormData.faculty_id)
										: ""
								}
								onValueChange={(value) =>
									setEditFormData({
										...editFormData,
										faculty_id: parseInt(value),
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select faculty member" />
								</SelectTrigger>
								<SelectContent>
									{faculty
										.filter(
											(f) =>
												f.role === "faculty" ||
												f.role === "hod",
										)
										.map((f) => (
											<SelectItem
												key={f.employee_id}
												value={String(f.employee_id)}
											>
												{f.username}{" "}
												{f.role === "hod"
													? "(HOD)"
													: ""}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit_year">Year *</Label>
								<Select
									value={String(editFormData.year)}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											year: parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{years.map((y) => (
											<SelectItem
												key={y}
												value={String(y)}
											>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit_semester">
									Semester *
								</Label>
								<Select
									value={String(editFormData.semester)}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											semester: parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{semesters.map((s) => (
											<SelectItem
												key={s}
												value={String(s)}
											>
												Semester {s}
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
							onClick={() => {
								setIsEditDialogOpen(false);
								setSelectedCourse(null);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateCourse}
							disabled={isSubmitting}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
