import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { apiService } from "@/services/api";
import type {
	Course,
	Test,
	QuestionResponse,
	Enrollment,
	BulkMarksEntry,
} from "@/services/api";
import { MarksEntryHeader } from "./MarksEntryHeader";
import { TestInfoCard } from "./TestInfoCard";
import { BulkMarksTable } from "./BulkMarksTable";
import { Button } from "@/components/ui/button";

interface MarksEntryByQuestionProps {
	test: Test;
	course: Course | null;
	onBack: () => void;
}

export function MarksEntryByQuestion({
	test,
	course,
	onBack,
}: MarksEntryByQuestionProps) {
	const [questions, setQuestions] = useState<QuestionResponse[]>([]);
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [marks, setMarks] = useState<Record<string, Record<string, string>>>(
		{},
	);
	const [originalMarks, setOriginalMarks] = useState<
		Record<string, Record<string, string>>
	>({});
	const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (test && course) {
			loadEnrollmentsAndQuestions();
		}
	}, [test, course]);

	const loadEnrollmentsAndQuestions = async () => {
		if (!course || !test) return;

		setLoading(true);
		try {
			const enrollmentData = await apiService.getCourseEnrollments(
				course.offering_id ?? course.course_id,
				test.id,
			);

			setEnrollments(enrollmentData.enrollments || []);
			setQuestions(enrollmentData.test_info?.questions || []);

			// Initialize marks structure
			const initialMarks: Record<string, Record<string, string>> = {};

			// Initialize all question slots for every enrolled student
			const enrollments = enrollmentData.enrollments || [];
			const questions = enrollmentData.test_info?.questions || [];

			enrollments.forEach((enrollment) => {
				initialMarks[enrollment.student_rollno] = {};
				questions.forEach((q) => {
					initialMarks[enrollment.student_rollno][
						q.question_identifier
					] = "";
				});
			});

			// Fetch all students' marks in parallel (fixes N+1 sequential loading)
			const marksResults = await Promise.all(
				enrollments.map(async (enrollment) => {
					try {
						return await apiService.getStudentMarks(
							test.id,
							enrollment.student_rollno,
						);
					} catch {
						return null; // student has no marks yet
					}
				}),
			);

			// Fill in existing marks from parallel results
			enrollments.forEach((enrollment, idx) => {
				const studentMarks = marksResults[idx];
				if (studentMarks?.raw_marks?.length) {
					studentMarks.raw_marks.forEach((rawMark) => {
						const questionIdentifier = rawMark.question_identifier;
						if (
							initialMarks[enrollment.student_rollno][
								questionIdentifier
							] !== undefined
						) {
							initialMarks[enrollment.student_rollno][
								questionIdentifier
							] = rawMark.marks.toString();
						}
					});
				}
			});

			setMarks(initialMarks);
			setOriginalMarks(JSON.parse(JSON.stringify(initialMarks))); // Deep copy
			setDirtyRows(new Set()); // Reset dirty rows on reload
		} catch (error) {
			console.error("Failed to load data:", error);
			toast.error("Failed to load students and questions");
		} finally {
			setLoading(false);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			processCSV(text);
		};
		reader.readAsText(file);

		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const processCSV = (text: string) => {
		const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
		if (lines.length < 2) {
			toast.error("CSV file is empty or missing header");
			return;
		}

		console.log("Processing CSV with " + lines.length + " lines");

		// Header analysis
		const headerLine = lines[0];
		const headers = headerLine
			.split(",")
			.map((h) => h.trim().toLowerCase());

		// Determine columns
		// Expected: Roll No, [Name?], Q1, Q2...
		// If 2nd column is 'name', skip it
		let marksStartIndex = 1;
		if (
			headers.length > 1 &&
			(headers[1].includes("name") || headers[1] === "student name")
		) {
			marksStartIndex = 2;
		} else {
			// Heuristic check on first data row
			const firstData = lines[1].split(",");
			if (firstData.length > 1 && isNaN(parseFloat(firstData[1]))) {
				// Likely a name
				marksStartIndex = 2;
			}
		}

		setMarks((prevMarks) => {
			const newMarks = { ...prevMarks };
			const newDirtyRows = new Set(dirtyRows);
			let updatedCount = 0;

			// Map visible questions to verify count
			const questionIds = questions.map((q) => q.question_identifier);

			lines.slice(1).forEach((line) => {
				const values = line.split(",").map((v) => v.trim());
				if (values.length < 2) return; // Skip invalid lines

				const rollNo = values[0]; // First col is Roll No

				// Ensure student exists in our list (enrolled)
				if (!enrollments.some((e) => e.student_rollno === rollNo)) {
					// Optionally warn or skip
					return;
				}

				// If student entry doesn't exist in state (shouldn't happen if enrolled), init it
				if (!newMarks[rollNo]) newMarks[rollNo] = {};

				const markValues = values.slice(marksStartIndex);

				markValues.forEach((val, index) => {
					if (index < questionIds.length) {
						const qId = questionIds[index];
						// Only update if value is provided and valid number
						if (val !== "" && !isNaN(parseFloat(val))) {
							newMarks[rollNo][qId] = val;
						}
					}
				});

				// Mark as dirty
				newDirtyRows.add(rollNo);
				updatedCount++;
			});

			setDirtyRows(newDirtyRows);

			if (updatedCount > 0) {
				toast.success(
					`Imported marks for ${updatedCount} students. Review and click Save.`,
				);
			} else {
				toast.warning("No matching students found in CSV.");
			}

			return newMarks;
		});
	};

	const handleMarkChange = (
		studentRollno: string,
		questionId: string,
		value: string,
	) => {
		setMarks((prev) => ({
			...prev,
			[studentRollno]: {
				...prev[studentRollno],
				[questionId]: value,
			},
		}));

		// Mark row as dirty if value differs from original
		setDirtyRows((prev) => {
			const newDirtyRows = new Set(prev);
			const originalValue =
				originalMarks[studentRollno]?.[questionId] || "";

			// Check if this student has any changes
			const hasChanges = value !== originalValue;

			if (hasChanges) {
				newDirtyRows.add(studentRollno);
			} else {
				// Check if all other questions for this student are unchanged
				const allQuestionsUnchanged = Object.keys(
					marks[studentRollno] || {},
				).every((qId) => {
					if (qId === questionId) return value === originalValue;
					return (
						(marks[studentRollno]?.[qId] || "") ===
						(originalMarks[studentRollno]?.[qId] || "")
					);
				});
				if (allQuestionsUnchanged) {
					newDirtyRows.delete(studentRollno);
				}
			}

			return newDirtyRows;
		});
	};

	const handleSubmit = async () => {
		if (!test) {
			toast.error("Test not found");
			return;
		}

		if (!test.id) {
			toast.error("Test ID is missing. Please select a valid test.");
			return;
		}

		if (dirtyRows.size === 0) {
			toast.error("No changes to save");
			return;
		}

		const bulkEntries: BulkMarksEntry[] = [];

		// Only process dirty (modified) rows
		for (const studentRollno of dirtyRows) {
			const studentMarks = marks[studentRollno];
			if (!studentMarks) continue;
			for (const [questionIdentifier, markValue] of Object.entries(
				studentMarks,
			)) {
				if (markValue.trim() !== "") {
					const mark = parseFloat(markValue);
					if (isNaN(mark) || mark < 0) {
						toast.error(
							`Invalid mark for ${studentRollno} - Question ${questionIdentifier}`,
						);
						return;
					}

					const match = questionIdentifier.match(/^(\d+)([a-h]?)$/);
					if (!match) {
						toast.error(
							`Invalid question identifier: ${questionIdentifier}`,
						);
						return;
					}

					const questionNumber = parseInt(match[1]);
					const subQuestion = match[2] || null;

					bulkEntries.push({
						student_rollno: studentRollno,
						question_number: questionNumber,
						sub_question: subQuestion,
						marks_obtained: mark,
					});
				}
			}
		}

		if (bulkEntries.length === 0) {
			toast.error("Please enter at least one mark");
			return;
		}

		setSubmitting(true);
		try {
			const result = await apiService.saveBulkMarks({
				test_id: test.id,
				marks_entries: bulkEntries,
			});

			if (result.data.failure_count > 0) {
				toast.warning(
					`Marks saved with ${result.data.failure_count} failures. ${result.data.success_count} successful.`,
				);
				console.error("Failed entries:", result.data.failed);
			} else {
				toast.success(
					`All marks saved successfully! (${result.data.success_count} entries)`,
				);
			}

			// Reload the data to show updated marks
			await loadEnrollmentsAndQuestions();
		} catch (error) {
			console.error("Failed to save marks:", error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Failed to save marks");
			}
		} finally {
			setSubmitting(false);
		}
	};

	const filteredEnrollments = enrollments.filter(
		(e) =>
			e.student_rollno.toLowerCase().includes(searchTerm.toLowerCase()) ||
			e.student_name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="space-y-2 w-full min-w-0">
			<MarksEntryHeader
				title="Bulk Marks Entry (By Question)"
				course={course}
				onBack={onBack}
			/>

			<TestInfoCard
				test={test}
				onSave={handleSubmit}
				isSaving={submitting}
				isDisabled={enrollments.length === 0}
				searchTerm={searchTerm}
				onSearch={setSearchTerm}
				searchPlaceholder="Search by roll no or name..."
				extraActions={
					<>
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept=".csv"
							onChange={handleFileUpload}
						/>
						<Button
							variant="outline"
							onClick={() => fileInputRef.current?.click()}
							className="gap-2"
						>
							<Upload className="w-4 h-4" />
							Import CSV
						</Button>
					</>
				}
			>
				{loading ? (
					<div className="text-center py-8 text-muted-foreground">
						Loading students and questions...
					</div>
				) : (
					<BulkMarksTable
						questions={questions}
						enrollments={filteredEnrollments}
						marks={marks}
						dirtyRows={dirtyRows}
						onMarkChange={handleMarkChange}
					/>
				)}
			</TestInfoCard>
		</div>
	);
}
