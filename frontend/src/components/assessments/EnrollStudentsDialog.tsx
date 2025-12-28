import { useState, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Upload, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { CSVFormatInfo } from "./CSVFormatInfo";
import { CSVFileUpload } from "./CSVFileUpload";
import { apiService } from "@/services/api";
import type { Course } from "@/services/api";

interface EnrollStudentsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	course: Course | null;
}

interface StudentEntry {
	rollno: string;
	name: string;
}

export function EnrollStudentsDialog({
	open,
	onOpenChange,
	course,
}: EnrollStudentsDialogProps) {
	// const [file, setFile] = useState<File | null>(null);
	const [students, setStudents] = useState<StudentEntry[]>([]);
	const [uploading, setUploading] = useState(false);
	const [enrolling, setEnrolling] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Manual enrollment state
	const [manualRollno, setManualRollno] = useState("");
	const [manualName, setManualName] = useState("");

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		if (!selectedFile.name.endsWith(".csv")) {
			toast.error("Please select a CSV file");
			return;
		}

		// setFile(selectedFile);
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
						`Parsed ${parsedStudents.length} students from CSV`
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
		if (!course) {
			toast.error("No course selected");
			return;
		}

		if (students.length === 0) {
			toast.error("No students to enroll");
			return;
		}

		setEnrolling(true);
		try {
			const data = await apiService.enrollStudents(course.id, students);

			if (data.failure_count > 0) {
				toast.warning(
					`Enrollment completed with ${data.failure_count} failures. ${data.success_count} students enrolled successfully.`
				);
				console.warn("Failed enrollments:", data.failed);
			} else {
				toast.success(
					`All ${data.success_count} students enrolled successfully!`
				);
			}

			// Reset and close
			// setFile(null);
			setStudents([]);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			onOpenChange(false);
		} catch (error) {
			console.error("Enrollment error:", error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Failed to enroll students");
			}
		} finally {
			setEnrolling(false);
		}
	};

	const handleClose = () => {
		// setFile(null);
		setStudents([]);
		setManualRollno("");
		setManualName("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		onOpenChange(false);
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

	const clearAllStudents = () => {
		// setFile(null);
		setStudents([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
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

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Enroll Students</DialogTitle>
					<DialogDescription>
						Upload a CSV file to enroll students in{" "}
						{course?.course_code || "the selected course"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
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
							<CSVFormatInfo
								onDownloadTemplate={downloadTemplate}
							/>
							<CSVFileUpload
								fileInputRef={fileInputRef}
								onFileChange={handleFileChange}
								uploading={uploading}
								enrolling={enrolling}
							/>
						</TabsContent>

						{/* Manual Entry Tab */}
						<TabsContent value="manual" className="space-y-4">
							<div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
								<h4 className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
									<UserPlus className="w-4 h-4" />
									Manual Student Entry
								</h4>
								<p className="text-sm text-green-700 dark:text-green-300 mt-1">
									Add students one by one to the enrollment
									list
								</p>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="rollno">
											Roll Number
										</Label>
										<Input
											id="rollno"
											placeholder="e.g., CS101"
											value={manualRollno}
											onChange={(e) =>
												setManualRollno(e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													document
														.getElementById(
															"studentName"
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
												setManualName(e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddManualStudent();
												}
											}}
										/>
									</div>
								</div>
								<Button
									onClick={handleAddManualStudent}
									className="w-full"
								>
									<UserPlus className="w-4 h-4 mr-2" />
									Add Student
								</Button>
							</div>
						</TabsContent>
					</Tabs>

					{/* Preview Table - Shows for both tabs */}
					{students.length > 0 && (
						<div className="space-y-4 pt-4 border-t">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
									<CheckCircle2 className="w-4 h-4" />
									<span>
										Ready to enroll {students.length}{" "}
										student
										{students.length > 1 ? "s" : ""}
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={clearAllStudents}
								>
									Clear All
								</Button>
							</div>

							<div className="max-h-48 overflow-y-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Roll No</TableHead>
											<TableHead>Name</TableHead>
											<TableHead className="w-16">
												Remove
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{students.map((student, index) => (
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
																student.rollno
															)
														}
													>
														<X className="w-4 h-4" />
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={enrolling}
					>
						Cancel
					</Button>
					<Button
						onClick={handleEnroll}
						disabled={
							students.length === 0 || uploading || enrolling
						}
					>
						{enrolling ? "Enrolling..." : "Enroll Students"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
