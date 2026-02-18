import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	Upload,
	Download,
	Users,
	Trash2,
	CheckCircle2,
	AlertTriangle,
	FileText,
	UserPlus,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { staffApi } from "@/services/api";
import type { StaffCourse, Enrollment } from "@/services/api";
import { usePaginatedData } from "@/lib/usePaginatedData";

interface StudentEntry {
	rollno: string;
	name: string;
}

export function StaffEnrollmentView() {
	const {
		data: courses,
		refresh: refreshCourses,
		loading: isLoading,
	} = usePaginatedData<StaffCourse>({
		fetchFn: staffApi.getDepartmentCourses,
		limit: 100,
	});
	const [selectedCourse, setSelectedCourse] = useState<StaffCourse | null>(
		null,
	);
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [loadingEnrollments, setLoadingEnrollments] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [students, setStudents] = useState<StudentEntry[]>([]);
	const [, setUploading] = useState(false);
	const [enrolling, setEnrolling] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Manual enrollment state
	const [manualRollno, setManualRollno] = useState("");
	const [manualName, setManualName] = useState("");

	const handleCourseChange = async (courseId: string) => {
		const course = courses.find((c) => c.id.toString() === courseId);
		setSelectedCourse(course || null);
		setEnrollments([]);
		setFile(null);
		setStudents([]);

		if (course) {
			await loadEnrollments(course.id);
		}
	};

	const loadEnrollments = async (courseId: number) => {
		setLoadingEnrollments(true);
		try {
			const data = await staffApi.getCourseEnrollments(courseId);
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		if (!selectedFile.name.endsWith(".csv")) {
			toast.error("Please select a CSV file");
			return;
		}

		setFile(selectedFile);
		parseCSV(selectedFile);
	};

	const parseCSV = (file: File) => {
		setUploading(true);
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const lines = text.split("\n").filter((line) => line.trim());

				// Skip header row if it exists
				const startIndex = lines[0].toLowerCase().includes("rollno")
					? 1
					: 0;

				const parsedStudents: StudentEntry[] = [];

				for (let i = startIndex; i < lines.length; i++) {
					const line = lines[i].trim();
					if (!line) continue;

					// Split by comma and handle quoted values
					const parts = line
						.split(",")
						.map((part) => part.trim().replace(/^"|"$/g, ""));

					if (parts.length >= 2) {
						const rollno = parts[0];
						const name = parts[1];

						if (rollno && name) {
							parsedStudents.push({ rollno, name });
						}
					}
				}

				if (parsedStudents.length === 0) {
					toast.error("No valid student entries found in CSV");
				} else {
					setStudents(parsedStudents);
					toast.success(
						`Parsed ${parsedStudents.length} students from CSV`,
					);
				}
			} catch (error) {
				console.error("CSV parsing error:", error);
				toast.error("Failed to parse CSV file");
			} finally {
				setUploading(false);
			}
		};

		reader.onerror = () => {
			toast.error("Failed to read file");
			setUploading(false);
		};

		reader.readAsText(file);
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
				selectedCourse.id,
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
			setFile(null);
			setStudents([]);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			await loadEnrollments(selectedCourse.id);
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
			await staffApi.removeEnrollment(selectedCourse.id, rollno);
			toast.success("Student removed from course successfully");
			await loadEnrollments(selectedCourse.id);
			refreshCourses();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to remove student",
			);
		}
	};

	const downloadTemplate = () => {
		const csvContent =
			"rollno,name\nCS101,John Doe\nCS102,Jane Smith\nCS103,Bob Johnson";
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "student_enrollment_template.csv";
		link.click();
		URL.revokeObjectURL(url);
	};

	const clearUpload = () => {
		setFile(null);
		setStudents([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Manual enrollment handlers
	const handleAddManualStudent = () => {
		if (!manualRollno.trim()) {
			toast.error("Please enter a roll number");
			return;
		}
		if (!manualName.trim()) {
			toast.error("Please enter student name");
			return;
		}

		// Check for duplicate
		if (students.some((s) => s.rollno === manualRollno.trim())) {
			toast.error("This roll number is already in the list");
			return;
		}

		setStudents((prev) => [
			...prev,
			{ rollno: manualRollno.trim(), name: manualName.trim() },
		]);
		setManualRollno("");
		setManualName("");
		toast.success("Student added to enrollment list");
	};

	const handleRemoveFromList = (rollno: string) => {
		setStudents((prev) => prev.filter((s) => s.rollno !== rollno));
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
						value={selectedCourse?.id.toString() || ""}
						onValueChange={handleCourseChange}
					>
						<SelectTrigger className="w-full md:w-[400px]">
							<SelectValue placeholder="Select a course to manage enrollments" />
						</SelectTrigger>
						<SelectContent>
							{courses.map((course) => (
								<SelectItem
									key={course.id}
									value={course.id.toString()}
								>
									<span className="font-mono mr-2">
										{course.course_code}
									</span>
									- {course.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{selectedCourse && (
				<>
					{/* Enrollment Section with Tabs */}
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
							<Tabs defaultValue="csv" className="w-full">
								<TabsList className="grid w-full grid-cols-2 mb-4">
									<TabsTrigger
										value="csv"
										className="flex items-center gap-2"
									>
										<Upload className="w-4 h-4" />
										CSV Upload
									</TabsTrigger>
									<TabsTrigger
										value="manual"
										className="flex items-center gap-2"
									>
										<UserPlus className="w-4 h-4" />
										Manual Entry
									</TabsTrigger>
								</TabsList>

								{/* CSV Upload Tab */}
								<TabsContent value="csv" className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 flex-1">
											<h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
												<FileText className="w-4 h-4" />
												CSV Format Requirements
											</h4>
											<ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
												<li>
													First row should be headers:
													rollno,name
												</li>
												<li>
													Each subsequent row should
													contain:
													roll_number,student_name
												</li>
												<li>Example: CS101,John Doe</li>
											</ul>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={downloadTemplate}
											className="ml-4"
										>
											<Download className="w-4 h-4 mr-2" />
											Template
										</Button>
									</div>

									{/* File Upload */}
									<div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
										<input
											ref={fileInputRef}
											type="file"
											accept=".csv"
											onChange={handleFileChange}
											className="hidden"
											id="csv-upload"
										/>
										<label
											htmlFor="csv-upload"
											className="flex flex-col items-center cursor-pointer"
										>
											<Upload className="w-10 h-10 text-gray-400 mb-2" />
											<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
												{file
													? file.name
													: "Click to upload CSV file"}
											</span>
											<span className="text-xs text-gray-500 mt-1">
												or drag and drop
											</span>
										</label>
									</div>
								</TabsContent>

								{/* Manual Entry Tab */}
								<TabsContent
									value="manual"
									className="space-y-4"
								>
									<div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
										<h4 className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
											<UserPlus className="w-4 h-4" />
											Manual Student Entry
										</h4>
										<p className="text-sm text-green-700 dark:text-green-300 mt-1">
											Add students one by one to the
											enrollment list
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
										<div className="space-y-2">
											<Label htmlFor="rollno">
												Roll Number
											</Label>
											<Input
												id="rollno"
												placeholder="e.g., CS101"
												value={manualRollno}
												onChange={(e) =>
													setManualRollno(
														e.target.value,
													)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														document
															.getElementById(
																"studentName",
															)
															?.focus();
													}
												}}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="studentName">
												Student Name
											</Label>
											<Input
												id="studentName"
												placeholder="e.g., John Doe"
												value={manualName}
												onChange={(e) =>
													setManualName(
														e.target.value,
													)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddManualStudent();
													}
												}}
											/>
										</div>
										<Button
											onClick={handleAddManualStudent}
											className="h-10"
										>
											<UserPlus className="w-4 h-4 mr-2" />
											Add
										</Button>
									</div>
								</TabsContent>
							</Tabs>

							{/* Preview Table - Shows for both tabs */}
							{students.length > 0 && (
								<div className="space-y-4 mt-6 pt-6 border-t">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<CheckCircle2 className="w-5 h-5 text-green-500" />
											<span className="font-medium">
												{students.length} students ready
												to enroll
											</span>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={clearUpload}
										>
											Clear All
										</Button>
									</div>

									<div className="max-h-64 overflow-y-auto rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														Roll No
													</TableHead>
													<TableHead>Name</TableHead>
													<TableHead className="w-20">
														Remove
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{students.map(
													(student, index) => (
														<TableRow key={index}>
															<TableCell className="font-mono">
																{student.rollno}
															</TableCell>
															<TableCell>
																{student.name}
															</TableCell>
															<TableCell>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
																	onClick={() =>
																		handleRemoveFromList(
																			student.rollno,
																		)
																	}
																>
																	<X className="w-4 h-4" />
																</Button>
															</TableCell>
														</TableRow>
													),
												)}
											</TableBody>
										</Table>
									</div>

									<Button
										onClick={handleEnroll}
										disabled={enrolling}
										className="w-full"
									>
										{enrolling ? (
											<>
												<span className="animate-spin mr-2">
													⏳
												</span>
												Enrolling...
											</>
										) : (
											<>
												<Users className="w-4 h-4 mr-2" />
												Enroll {students.length}{" "}
												Students
											</>
										)}
									</Button>
								</div>
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
										{selectedCourse.name}
									</p>
								</div>
								<Badge variant="secondary">
									{enrollments.length} Student
									{enrollments.length !== 1 ? "s" : ""}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							{loadingEnrollments ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
								</div>
							) : enrollments.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-8 text-gray-500">
									<AlertTriangle className="w-10 h-10 mb-2" />
									<p>No students enrolled in this course</p>
									<p className="text-sm">
										Upload a CSV file above to enroll
										students
									</p>
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Roll No</TableHead>
												<TableHead>Name</TableHead>
												<TableHead>
													Enrolled At
												</TableHead>
												<TableHead className="w-[100px]">
													Actions
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{enrollments.map((enrollment) => (
												<TableRow
													key={
														enrollment.student_rollno
													}
												>
													<TableCell className="font-mono">
														<Badge variant="outline">
															{
																enrollment.student_rollno
															}
														</Badge>
													</TableCell>
													<TableCell>
														{
															enrollment.student_name
														}
													</TableCell>
													<TableCell className="text-sm text-gray-500">
														{new Date(
															enrollment.enrolled_at,
														).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<AlertDialog>
															<AlertDialogTrigger
																asChild
															>
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
																		Remove
																		Student
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you
																		sure you
																		want to
																		remove{" "}
																		<strong>
																			{
																				enrollment.student_name
																			}
																		</strong>{" "}
																		(
																		{
																			enrollment.student_rollno
																		}
																		) from
																		this
																		course?
																		This
																		action
																		cannot
																		be
																		undone.
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
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
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
