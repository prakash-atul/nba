import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Plus, Pencil, Trash2, BookOpen, ArrowUpDown, X } from "lucide-react";
import { formatOrdinal } from "@/lib/utils";
import { toast } from "sonner";
import { staffApi, type StaffCourse } from "@/services/api";
import { usePaginatedData } from "@/lib/usePaginatedData";

interface Faculty {
	employee_id: string;
	username: string;
	email: string;
	role: string;
}

interface CourseFormData {
	course_code: string;
	name: string;
	credit: number;
	faculty_id: string;
	year: number;
	semester: string;
}

// Unused props removed

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];
const semesters = ["Spring", "Autumn"] as const;

export function CourseManagement() {
	const {
		data: courses,
		loading: isLoading,
		refresh: onRefresh,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		filters,
		setFilter,
	} = usePaginatedData<StaffCourse, { year?: number; semester?: string }>({
		fetchFn: (params) => staffApi.getDepartmentCourses(params),
		limit: 50,
		defaultSort: "c.course_code",
	});

	const { data: faculty, loading: isLoadingFaculty } =
		usePaginatedData<Faculty>({
			fetchFn: (params) => staffApi.getDepartmentFaculty(params),
			limit: 100,
			defaultSort: "u.username",
		});
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedCourse, setSelectedCourse] = useState<StaffCourse | null>(
		null,
	);
	const [formData, setFormData] = useState<CourseFormData>({
		course_code: "",
		name: "",
		credit: 3,
		faculty_id: "",
		year: currentYear,
		semester: "Spring",
	});
	const [editFormData, setEditFormData] = useState<CourseFormData>({
		course_code: "",
		name: "",
		credit: 3,
		faculty_id: "",
		year: currentYear,
		semester: "Spring",
	});

	const columns = useMemo<ColumnDef<StaffCourse>[]>(
		() => [
			{
				accessorKey: "course_code",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Code
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<Badge variant="outline" className="font-mono">
						{row.original.course_code}
					</Badge>
				),
			},
			{
				accessorKey: "course_name",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Course Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<div
						className="font-medium max-w-[200px] truncate"
						title={row.original.course_name}
					>
						{row.original.course_name}
					</div>
				),
			},
			{
				accessorKey: "credit",
				header: "Credits",
				cell: ({ row }) => (
					<Badge variant="outline">{row.original.credit}</Badge>
				),
			},
			{
				accessorKey: "faculty_name",
				header: "Faculty",
				cell: ({ row }) => (
					<div className="text-muted-foreground">
						{row.original.faculty_name || "\u2014"}
					</div>
				),
			},
			{
				accessorKey: "year",
				header: "Year",
				cell: ({ row }) => row.original.year ?? "\u2014",
			},
			{
				accessorKey: "semester",
				header: "Semester",
				cell: ({ row }) => (
					<Badge variant="secondary" className="font-medium">
						{formatOrdinal(row.original.semester)}
					</Badge>
				),
			},
			{
				accessorKey: "enrollment_count",
				header: "Enrolled",
				cell: ({ row }) => (
					<Badge
						variant="secondary"
						className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
					>
						{row.original.enrollment_count ?? 0}
					</Badge>
				),
			},
			{
				id: "actions",
				header: () => <div className="text-right">Actions</div>,
				cell: ({ row }) => {
					const course = row.original;
					return (
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
								onClick={() => openEditDialog(course)}
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
											Are you sure you want to delete "
											{course.course_name}"? This will
											also delete all associated tests,
											marks, and enrollments. This action
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() =>
												handleDeleteCourse(
													course.course_id,
													course.course_name,
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
					);
				},
			},
		],
		[],
	);

	const resetForm = () => {
		setFormData({
			course_code: "",
			name: "",
			credit: 3,
			faculty_id: "",
			year: currentYear,
			semester: "Spring",
		});
	};

	const handleCreateCourse = async () => {
		if (!formData.course_code || !formData.name || !formData.faculty_id) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await staffApi.createCourse({
				...formData,
				semester: formData.semester,
			});
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
			await staffApi.deleteCourse(courseId);
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

	const openEditDialog = (course: StaffCourse) => {
		setSelectedCourse(course);
		setEditFormData({
			course_code: course.course_code,
			name: course.course_name,
			credit: course.credit,
			faculty_id: course.faculty_id ? String(course.faculty_id) : "",
			year: course.year ?? currentYear,
			semester: course.semester ?? "Spring",
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
			await staffApi.updateCourse(selectedCourse.course_id, {
				...editFormData,
				semester: editFormData.semester,
			});
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
									value={formData.faculty_id}
									onValueChange={(value) =>
										setFormData({
											...formData,
											faculty_id: value,
										})
									}
									disabled={isLoadingFaculty}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												isLoadingFaculty
													? "Loading..."
													: "Select faculty member"
											}
										/>
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
													value={f.employee_id}
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
										value={formData.semester}
										onValueChange={(value) =>
											setFormData({
												...formData,
												semester: value,
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{semesters.map((s) => (
												<SelectItem key={s} value={s}>
													{s} Semester
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
				<DataTable
					columns={columns}
					data={courses}
					refreshing={isLoading}
					serverPagination={{
						pagination,
						onNext: goNext,
						onPrev: goPrev,
						canPrev,
						pageIndex,
						search,
						onSearch: setSearch,
					}}
				>
					{() => (
						<div className="flex items-center gap-2 flex-wrap">
							<Select
								value={
									filters.year !== undefined
										? String(filters.year)
										: ""
								}
								onValueChange={(v) =>
									setFilter("year", v ? Number(v) : undefined)
								}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="All Years" />
								</SelectTrigger>
								<SelectContent>
									{years.map((y) => (
										<SelectItem key={y} value={String(y)}>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{filters.year !== undefined && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => setFilter("year", undefined)}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
							<Select
								value={filters.semester ?? ""}
								onValueChange={(v) =>
									setFilter("semester", v || undefined)
								}
							>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="All Semesters" />
								</SelectTrigger>
								<SelectContent>
									{semesters.map((s) => (
										<SelectItem key={s} value={s}>
											{s} Semester
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{filters.semester !== undefined && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() =>
										setFilter("semester", undefined)
									}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
					)}
				</DataTable>
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
									value={editFormData.course_code}
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
								value={editFormData.name}
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
								value={editFormData.faculty_id}
								onValueChange={(value) =>
									setEditFormData({
										...editFormData,
										faculty_id: value,
									})
								}
								disabled={isLoadingFaculty}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											isLoadingFaculty
												? "Loading..."
												: "Select faculty member"
										}
									/>
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
												value={f.employee_id}
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
									value={editFormData.semester}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											semester: value,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{semesters.map((s) => (
											<SelectItem key={s} value={s}>
												{s} Semester
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
