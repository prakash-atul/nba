import { useState, useRef, useMemo, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/features/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Upload,
	Download,
	UserPlus,
	FileText,
	X,
	CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { StaffCourse } from "@/services/api";

export interface StudentEntry {
	rollno: string;
	name: string;
}

interface StaffStudentUploadProps {
	course: StaffCourse;
	onStudentsChange: (students: StudentEntry[]) => void;
}

export function StaffStudentUpload({
	course,
	onStudentsChange,
}: StaffStudentUploadProps) {
	const [file, setFile] = useState<File | null>(null);
	const [students, setStudentsState] = useState<StudentEntry[]>([]);
	const [manualRollno, setManualRollno] = useState("");
	const [manualName, setManualName] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Reset when course changes
	useEffect(() => {
		setFile(null);
		setStudentsState([]);
		setManualRollno("");
		setManualName("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [course]);

	const setStudentsWrapper = (
		newStudents:
			| StudentEntry[]
			| ((prev: StudentEntry[]) => StudentEntry[]),
	) => {
		setStudentsState((prev) => {
			const next =
				typeof newStudents === "function"
					? newStudents(prev)
					: newStudents;
			onStudentsChange(next);
			return next;
		});
	};

	// Make sure we expose clearUpload capability if parent needs it, but parent only re-mounts or we handle success there
	// Actually wait, how does parent clear on success? It changes students to [], but here we have local state.
	// Parent should just reset students. We can use a key or reset on success via refs, but easiest is changing a key on the component

	const studentColumns = useMemo<ColumnDef<StudentEntry>[]>(
		() => [
			{
				accessorKey: "rollno",
				header: "Roll No",
				cell: ({ row }) => (
					<span className="font-mono">{row.original.rollno}</span>
				),
			},
			{
				accessorKey: "name",
				header: "Name",
			},
			{
				id: "remove",
				header: "Remove",
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
						onClick={() =>
							handleRemoveFromList(row.original.rollno)
						}
					>
						<X className="w-4 h-4" />
					</Button>
				),
			},
		],
		[],
	);

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
					setStudentsWrapper(parsedStudents);
					toast.success(
						`Parsed ${parsedStudents.length} students from CSV`,
					);
				}
			} catch (error) {
				console.error("CSV parsing error:", error);
				toast.error("Failed to parse CSV file");
			}
		};

		reader.onerror = () => {
			toast.error("Failed to read file");
		};

		reader.readAsText(file);
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
		setStudentsWrapper([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleAddManualStudent = () => {
		if (!manualRollno.trim()) {
			toast.error("Please enter a roll number");
			return;
		}
		if (!manualName.trim()) {
			toast.error("Please enter student name");
			return;
		}

		if (students.some((s) => s.rollno === manualRollno.trim())) {
			toast.error("This roll number is already in the list");
			return;
		}

		setStudentsWrapper((prev) => [
			...prev,
			{ rollno: manualRollno.trim(), name: manualName.trim() },
		]);
		setManualRollno("");
		setManualName("");
		toast.success("Student added to enrollment list");
	};

	const handleRemoveFromList = (rollno: string) => {
		setStudentsWrapper((prev) => prev.filter((s) => s.rollno !== rollno));
	};

	return (
		<div className="space-y-4 w-full">
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
									First row should be headers: rollno,name
								</li>
								<li>
									Each subsequent row should contain:
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
								{file ? file.name : "Click to upload CSV file"}
							</span>
							<span className="text-xs text-gray-500 mt-1">
								or drag and drop
							</span>
						</label>
					</div>
				</TabsContent>

				{/* Manual Entry Tab */}
				<TabsContent value="manual" className="space-y-4">
					<div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
						<h4 className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
							<UserPlus className="w-4 h-4" />
							Manual Student Entry
						</h4>
						<p className="text-sm text-green-700 dark:text-green-300 mt-1">
							Add students one by one to the enrollment list
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
						<div className="space-y-2">
							<Label htmlFor="rollno">Roll Number</Label>
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
											.getElementById("studentName")
											?.focus();
									}
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="studentName">Student Name</Label>
							<Input
								id="studentName"
								placeholder="e.g., John Doe"
								value={manualName}
								onChange={(e) => setManualName(e.target.value)}
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

			{students.length > 0 && (
				<div className="space-y-4 mt-6 pt-6 border-t">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="w-5 h-5 text-green-500" />
							<span className="font-medium">
								{students.length} students ready to enroll
							</span>
						</div>
						<Button variant="ghost" size="sm" onClick={clearUpload}>
							Clear All
						</Button>
					</div>

					<div className="max-h-64 overflow-y-auto rounded-md border">
						<DataTable columns={studentColumns} data={students} />
					</div>
				</div>
			)}
		</div>
	);
}
