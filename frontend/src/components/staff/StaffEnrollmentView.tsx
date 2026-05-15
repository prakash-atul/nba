import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";



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
import {
	BookOpen,
		Users,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { staffApi } from "@/services/api";
import type { StaffCourse, Enrollment } from "@/services/api";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { StaffStudentUpload } from "./StaffStudentUpload";

interface StudentEntry {
	rollno: string;
	name: string;
}

export function StaffEnrollmentView() {
	const currentYear = new Date().getFullYear();
	const currentSemester = new Date().getMonth() < 6 ? "Spring" : "Autumn";

	const {
		data: courses,
		refresh: refreshCourses,
		loading: isLoading,
	} = usePaginatedData<StaffCourse>({
		fetchFn: (params) =>
			staffApi.getDepartmentCourses({
				...params,
				year: currentYear.toString(),
				semester: currentSemester,
			}),
		limit: 100,
	});
	const [selectedCourse, setSelectedCourse] = useState<StaffCourse | null>(
		null,
	);
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [loadingEnrollments, setLoadingEnrollments] = useState(false);
	const [students, setStudents] = useState<StudentEntry[]>([]);
	const [enrolling, setEnrolling] = useState(false);

	const enrollmentColumns = useMemo<ColumnDef<Enrollment>[]>(
		() => [
			{
				accessorKey: "student_rollno",
				header: "Roll No",
				cell: ({ row }) => (
					<Badge variant="outline">
						{row.original.student_rollno}
					</Badge>
				),
			},
			{
				accessorKey: "student_name",
				header: "Name",
			},
			{
				accessorKey: "enrolled_at",
				header: "Enrolled At",
				cell: ({ row }) => (
					<span className="text-sm text-gray-500">
						{new Date(
							row.original.enrolled_at,
						).toLocaleDateString()}
					</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const enrollment = row.original;
					return (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Remove Student
									</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to remove{" "}
										<strong>
											{enrollment.student_name}
										</strong>{" "}
										({enrollment.student_rollno}) from this
										course? This action cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											handleRemoveEnrollment(
												enrollment.student_rollno,
											)
										}
										className="bg-red-500 hover:bg-red-600"
									>
										Remove
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					);
				},
			},
		],
		[selectedCourse],
	);



	const handleCourseChange = async (courseId: string) => {
		const course = courses.find((c) => c.course_id.toString() === courseId);
		setSelectedCourse(course || null);
		setEnrollments([]);
		setStudents([]);

		if (course) {
			await loadEnrollments(course.offering_id!);
		}
	};

	const loadEnrollments = async (offeringId: number) => {
		setLoadingEnrollments(true);
		try {
			const data = await staffApi.getCourseEnrollments(offeringId);
			setEnrollments(data.enrollments);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to load enrollments",
			);
		} finally {
			setLoadingEnrollments(false);
		}
	};

const handleEnroll = async () => {
		if (!selectedCourse) {
			toast.error("No course selected");
			return;
		}

		if (students.length === 0) {
			toast.error("No students to enroll");
			return;
		}

		setEnrolling(true);
		try {
			const result = await staffApi.bulkEnrollStudents(
				selectedCourse.offering_id!,
				students,
			);

			if (result.failure_count > 0) {
				toast.warning(
					`Enrollment completed with ${result.failure_count} failures. ${result.success_count} students enrolled successfully.`,
				);
			} else {
				toast.success(
					`All ${result.success_count} students enrolled successfully!`,
				);
			}

			// Reset and reload
			setStudents([]);
			await loadEnrollments(selectedCourse.offering_id!);
			refreshCourses();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to enroll students",
			);
		} finally {
			setEnrolling(false);
		}
	};

	const handleRemoveEnrollment = async (rollno: string) => {
		if (!selectedCourse) return;

		try {
			await staffApi.removeEnrollment(
				selectedCourse.offering_id!,
				rollno,
			);
			toast.success("Student removed from course successfully");
			await loadEnrollments(selectedCourse.offering_id!);
			refreshCourses();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to remove student",
			);
		}
	};

	
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Course Selection */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="w-5 h-5" />
						Select Course
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Select
						value={selectedCourse?.course_id.toString() || ""}
						onValueChange={handleCourseChange}
					>
						<SelectTrigger className="w-full md:w-[400px]">
							<SelectValue placeholder="Select a course to manage enrollments" />
						</SelectTrigger>
						<SelectContent>
							{courses.map((course) => (
								<SelectItem
									key={course.offering_id || course.course_id}
									value={course.course_id.toString()}
								>
									<span className="font-mono mr-2">
										{course.course_code}
									</span>
									- {course.course_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedCourse && (
				<>
					{/* Enrollment Section */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="w-5 h-5" />
								Add Students to Course
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Enroll students using CSV upload or manual entry
							</p>
						</CardHeader>
						<CardContent>
							<div className="mb-4">
								<StaffStudentUpload
									course={selectedCourse}
									onStudentsChange={setStudents}
								/>
							</div>
							{students.length > 0 && (
								<Button onClick={handleEnroll} disabled={enrolling} className="w-full mt-4">
									{enrolling ? (
										<>
											<span className="animate-spin mr-2">?</span>Enrolling...
										</>
									) : (
										<>
											<Users className="w-4 h-4 mr-2" />Enroll {students.length} Students
										</>
									)}
								</Button>
							)}
						</CardContent>
					</Card>

										{/* Current Enrollments */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<Users className="w-5 h-5" />
										Current Enrollments
									</CardTitle>
									<p className="text-sm text-muted-foreground mt-1">
										Students enrolled in{" "}
										{selectedCourse.course_code} -{" "}
										{selectedCourse.course_name}
									</p>
								</div>
								<Badge variant="secondary">
									{enrollments.length} Student
									{enrollments.length !== 1 ? "s" : ""}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={enrollmentColumns}
								data={enrollments}
								refreshing={loadingEnrollments}
							/>
						</CardContent>
					</Card>
				</>
			)}

			{!selectedCourse && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<BookOpen className="w-12 h-12 text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">
							Select a Course
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
							Choose a course from the dropdown above to manage
							student enrollments
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
