import { useState, useEffect, useRef, Fragment } from "react";
import { toast } from "sonner";
import {
	Search,
	Upload,
	Save,
	BarChart2,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import { apiService } from "@/services/api";
import type {
	Course,
	Test,
	QuestionResponse,
	Enrollment,
	BulkMarksEntry,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { BulkMarksTable } from "@/features/marks/BulkMarksTable";

const ITEMS_PER_PAGE = 10;

export interface FacultyMarksByQuestionProps {
	selectedCourse: Course;
	selectedTest: Test;
	headerContent?: React.ReactNode;
	onStatsUpdate?: (stats: {
		entered: number;
		total: number;
		average: string;
	}) => void;
}

export function FacultyMarksByQuestion({
	selectedCourse,
	selectedTest,
	headerContent,
	onStatsUpdate,
}: FacultyMarksByQuestionProps) {
	// ─── Marks state ──────────────────────────────────
	const [questions, setQuestions] = useState<QuestionResponse[]>([]);
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [marks, setMarks] = useState<Record<string, Record<string, string>>>(
		{},
	);
	const [originalMarks, setOriginalMarks] = useState<
		Record<string, Record<string, string>>
	>({});
	const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
	const [marksLoading, setMarksLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// ─── Search + pagination ────────────────────────────────────────
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [validateMarks, setValidateMarks] = useState(true);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (selectedTest && selectedCourse) {
			loadEnrollmentsAndQuestions();
		}
		setSearchTerm("");
		setCurrentPage(1);
	}, [selectedTest]);

	const loadEnrollmentsAndQuestions = async () => {
		if (!selectedCourse || !selectedTest) return;
		setMarksLoading(true);
		try {
			const enrollmentData = await apiService.getCourseEnrollments(
				selectedCourse.offering_id ?? selectedCourse.course_id,
				selectedTest.id,
			);
			const enrolledList: Enrollment[] = enrollmentData.enrollments || [];
			const questionsList: QuestionResponse[] =
				enrollmentData.test_info?.questions || [];

			setEnrollments(enrolledList);
			setQuestions(questionsList);

			const initialMarks: Record<string, Record<string, string>> = {};
			enrolledList.forEach((e) => {
				initialMarks[e.student_rollno] = {};
				questionsList.forEach((q) => {
					initialMarks[e.student_rollno][q.question_identifier] = "";
				});
			});

			const marksResults = await Promise.all(
				enrolledList.map(async (e) => {
					try {
						return await apiService.getStudentMarks(
							selectedTest.id,
							e.student_rollno,
						);
					} catch {
						return null;
					}
				}),
			);

			enrolledList.forEach((e, idx) => {
				const sm = marksResults[idx];
				if (sm?.raw_marks?.length) {
					sm.raw_marks.forEach(
						(rawMark: {
							question_identifier: string;
							marks: number;
						}) => {
							const qId = rawMark.question_identifier;
							if (
								initialMarks[e.student_rollno][qId] !==
								undefined
							) {
								initialMarks[e.student_rollno][qId] =
									rawMark.marks.toString();
							}
						},
					);
				}
			});

			setMarks(initialMarks);
			setOriginalMarks(JSON.parse(JSON.stringify(initialMarks)));
			setDirtyRows(new Set());
		} catch (err) {
			console.error("Failed to load data:", err);
			toast.error("Failed to load students and questions");
		} finally {
			setMarksLoading(false);
		}
	};

	const handleMarkChange = (
		studentRollno: string,
		questionId: string,
		value: string,
	) => {
		setMarks((prev) => ({
			...prev,
			[studentRollno]: { ...prev[studentRollno], [questionId]: value },
		}));
		setDirtyRows((prev) => {
			const next = new Set(prev);
			const originalValue =
				originalMarks[studentRollno]?.[questionId] || "";
			if (value !== originalValue) {
				next.add(studentRollno);
			} else {
				const allUnchanged = Object.keys(
					marks[studentRollno] || {},
				).every((qId) => {
					if (qId === questionId) return value === originalValue;
					return (
						(marks[studentRollno]?.[qId] || "") ===
						(originalMarks[studentRollno]?.[qId] || "")
					);
				});
				if (allUnchanged) next.delete(studentRollno);
			}
			return next;
		});
	};

	const handleSubmit = async () => {
		if (!selectedTest) {
			toast.error("No test selected");
			return;
		}
		if (dirtyRows.size === 0) {
			toast.error("No changes to save");
			return;
		}

		const bulkEntries: BulkMarksEntry[] = [];
		for (const rollno of dirtyRows) {
			const studentMarks = marks[rollno];
			if (!studentMarks) continue;
			for (const [questionIdentifier, markValue] of Object.entries(
				studentMarks,
			)) {
				if (markValue.trim() !== "") {
					const mark = parseFloat(markValue);
					if (isNaN(mark) || mark < 0) {
						toast.error(
							`Invalid mark for ${rollno} – Q${questionIdentifier}`,
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
					bulkEntries.push({
						student_rollno: rollno,
						question_number: parseInt(match[1]),
						sub_question: match[2] || null,
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
				test_id: selectedTest.id,
				marks_entries: bulkEntries,
				validate_marks: validateMarks,
			});
			if (result.data.failure_count > 0) {
				toast.warning(
					`Saved with ${result.data.failure_count} failure(s). ${result.data.success_count} successful.`,
				);
			} else {
				toast.success(
					`All marks saved! (${result.data.success_count} entries)`,
				);
			}
			await loadEnrollmentsAndQuestions();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save marks",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => processCSV(e.target?.result as string);
		reader.readAsText(file);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const processCSV = (text: string) => {
		const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
		if (lines.length < 2) {
			toast.error("CSV file is empty or missing header");
			return;
		}
		const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
		let marksStartIndex = 1;
		if (
			headers.length > 1 &&
			(headers[1].includes("name") || headers[1] === "student name")
		) {
			marksStartIndex = 2;
		} else {
			const firstData = lines[1].split(",");
			if (firstData.length > 1 && isNaN(parseFloat(firstData[1]))) {
				marksStartIndex = 2;
			}
		}

		setMarks((prevMarks) => {
			const newMarks = { ...prevMarks };
			const newDirtyRows = new Set(dirtyRows);
			let updatedCount = 0;
			const questionIds = questions.map((q) => q.question_identifier);

			lines.slice(1).forEach((line) => {
				const values = line.split(",").map((v) => v.trim());
				if (values.length < 2) return;
				const rollNo = values[0];
				if (!enrollments.some((e) => e.student_rollno === rollNo))
					return;
				if (!newMarks[rollNo]) newMarks[rollNo] = {};
				values.slice(marksStartIndex).forEach((val, index) => {
					if (
						index < questionIds.length &&
						val !== "" &&
						!isNaN(parseFloat(val))
					) {
						newMarks[rollNo][questionIds[index]] = val;
					}
				});
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

	const filteredEnrollments = enrollments.filter(
		(e) =>
			e.student_rollno.toLowerCase().includes(searchTerm.toLowerCase()) ||
			e.student_name.toLowerCase().includes(searchTerm.toLowerCase()),
	);
	const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const currentEnrollments = filteredEnrollments.slice(
		startIndex,
		startIndex + ITEMS_PER_PAGE,
	);

	const enteredCount = enrollments.filter((e) =>
		questions.some(
			(q) =>
				(marks[e.student_rollno]?.[q.question_identifier] || "") !== "",
		),
	).length;

	const rowTotal = (rollno: string) =>
		questions.reduce((sum, q) => {
			const v = parseFloat(marks[rollno]?.[q.question_identifier] || "");
			return isNaN(v) ? sum : sum + v;
		}, 0);

	const rowsWithAnyMark = enrollments.filter((e) =>
		questions.some(
			(q) =>
				(marks[e.student_rollno]?.[q.question_identifier] || "") !== "",
		),
	);
	const averageTotal =
		rowsWithAnyMark.length > 0
			? (
					rowsWithAnyMark.reduce(
						(sum, e) => sum + rowTotal(e.student_rollno),
						0,
					) / rowsWithAnyMark.length
				).toFixed(1)
			: "–";

	useEffect(() => {
		if (onStatsUpdate) {
			onStatsUpdate({
				entered: enteredCount,
				total: enrollments.length,
				average: averageTotal,
			});
		}
	}, [enteredCount, enrollments.length, averageTotal, onStatsUpdate]);

	return (
		<>
			{/* Toolbar */}
			<div className="px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-border shrink-0">
				<div className="flex items-center gap-3 flex-wrap">
					{headerContent}
					{enrollments.length > 0 && (
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="gap-1 font-normal text-xs py-1.5 px-3 rounded-lg"
							>
								<BarChart2 className="w-3.5 h-3.5 text-blue-500" />
								Avg: {averageTotal}
							</Badge>
							<Badge
								variant="outline"
								className="gap-1 font-normal text-xs py-1.5 px-3 rounded-lg"
							>
								<CheckCircle className="w-3.5 h-3.5 text-green-500" />
								{enteredCount}/{enrollments.length} Entered
							</Badge>
						</div>
					)}
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center space-x-2 mr-2">
						<Switch
							id="validate-marks-question"
							checked={validateMarks}
							onCheckedChange={setValidateMarks}
						/>
						<Label
							htmlFor="validate-marks-question"
							className="whitespace-nowrap flex text-sm items-center h-full"
						>
							Validate Marks
						</Label>
					</div>
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
						<Input
							placeholder="Search Student…"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="pl-9 h-8 text-sm w-56"
						/>
					</div>
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept=".csv"
						onChange={handleFileUpload}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5 text-xs h-8"
					>
						<Upload className="w-3.5 h-3.5" />
						Import
					</Button>
					<Button
						size="sm"
						onClick={handleSubmit}
						disabled={submitting || dirtyRows.size === 0}
						className="gap-1.5 text-xs h-8"
					>
						<Save className="w-3.5 h-3.5" />
						{submitting ? "Saving…" : "Save"}
					</Button>
				</div>
			</div>
			{/* Content Area */}
			{dirtyRows.size > 0 && (
				<div className="shrink-0 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 px-6 py-2">
					<AlertCircle className="w-4 h-4 shrink-0" />
					<span className="font-medium">
						{dirtyRows.size} student(s) modified
					</span>
					<span className="text-xs text-amber-600 dark:text-amber-500">
						— unsaved changes highlighted
					</span>
				</div>
			)}
			<div className="flex-1 overflow-auto bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full">
				{marksLoading ? (
					<div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground">
						Loading students and questions…
					</div>
				) : enrollments.length === 0 ? (
					<div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground">
						No students enrolled in this course
					</div>
				) : questions.length === 0 ? (
					<div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground">
						No questions found — add questions to this assessment
						first
					</div>
				) : (
					<BulkMarksTable
						questions={questions}
						enrollments={currentEnrollments}
						marks={marks}
						dirtyRows={dirtyRows}
						onMarkChange={handleMarkChange}
						validateMarks={validateMarks}
					/>
				)}
			</div>
			{!marksLoading && filteredEnrollments.length > 0 && (
				<div className="shrink-0 bg-background border-t border-border px-6 py-3 flex items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground whitespace-nowrap">
						Showing{" "}
						{filteredEnrollments.length === 0 ? 0 : startIndex + 1}{" "}
						to{" "}
						{Math.min(
							startIndex + ITEMS_PER_PAGE,
							filteredEnrollments.length,
						)}{" "}
						of {filteredEnrollments.length} entries
					</p>
					{totalPages > 1 && (
						<Pagination className="w-auto">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() =>
											setCurrentPage((p) =>
												Math.max(1, p - 1),
											)
										}
										className={
											currentPage === 1
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
								{Array.from(
									{
										length: totalPages,
									},
									(_, i) => i + 1,
								)
									.filter(
										(p) =>
											p === 1 ||
											p === totalPages ||
											Math.abs(p - currentPage) <= 1,
									)
									.map((page, index, array) => {
										const prevPage = array[index - 1];
										const showEllipsis =
											prevPage && page - prevPage > 1;
										return (
											<Fragment key={`pg-${page}`}>
												{showEllipsis && (
													<PaginationItem>
														<span className="px-2 text-muted-foreground text-sm">
															…
														</span>
													</PaginationItem>
												)}
												<PaginationItem>
													<PaginationLink
														onClick={() =>
															setCurrentPage(page)
														}
														isActive={
															currentPage === page
														}
														className="cursor-pointer"
													>
														{page}
													</PaginationLink>
												</PaginationItem>
											</Fragment>
										);
									})}
								<PaginationItem>
									<PaginationNext
										onClick={() =>
											setCurrentPage((p) =>
												Math.min(totalPages, p + 1),
											)
										}
										className={
											currentPage === totalPages
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					)}
				</div>
			)}
		</>
	);
}
