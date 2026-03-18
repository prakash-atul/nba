import { useState, useEffect, useRef, Fragment } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	Search,
	Upload,
	Save,
	BarChart2,
	CheckCircle,
	AlertCircle,
	FileText,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { BulkMarksTable } from "@/features/marks/BulkMarksTable";
import { MarksEntryByCO } from "@/features/marks/MarksEntryByCO";
import { ViewTestMarks } from "@/features/marks/ViewTestMarks";

type ViewMode = "by-question" | "by-co" | "bulk";

const ITEMS_PER_PAGE = 10;

interface FacultyMarksProps {
	selectedCourse: Course | null;
}

export function FacultyMarks({ selectedCourse }: FacultyMarksProps) {
	// ─── Tests (tabs) ───────────────────────────────────────────────
	const [tests, setTests] = useState<Test[]>([]);
	const [testsLoading, setTestsLoading] = useState(false);
	const [selectedTest, setSelectedTest] = useState<Test | null>(null);

	// ─── View mode ──────────────────────────────────────────────────
	const [viewMode, setViewMode] = useState<ViewMode>("by-question");

	// ─── Marks state (by-question) ──────────────────────────────────
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

	const fileInputRef = useRef<HTMLInputElement>(null);

	// ─── Effects ────────────────────────────────────────────────────
	useEffect(() => {
		if (selectedCourse) {
			loadTests();
		} else {
			setTests([]);
			setSelectedTest(null);
			setEnrollments([]);
			setQuestions([]);
			setMarks({});
		}
	}, [selectedCourse]);

	useEffect(() => {
		if (selectedTest && selectedCourse) {
			if (viewMode === "by-question") {
				loadEnrollmentsAndQuestions();
			}
		}
		setSearchTerm("");
		setCurrentPage(1);
	}, [selectedTest]);

	// Reload when switching back to by-question if marks not loaded yet
	useEffect(() => {
		if (
			viewMode === "by-question" &&
			selectedTest &&
			selectedCourse &&
			enrollments.length === 0 &&
			!marksLoading
		) {
			loadEnrollmentsAndQuestions();
		}
		setSearchTerm("");
		setCurrentPage(1);
	}, [viewMode]);

	// ─── Data loaders ───────────────────────────────────────────────
	const loadTests = async () => {
		if (!selectedCourse) return;
		setTestsLoading(true);
		try {
			const testsData = await apiService.getCourseTests(
				selectedCourse.offering_id ?? selectedCourse.course_id,
			);
			const list: Test[] = Array.isArray(testsData) ? testsData : [];
			setTests(list);
			if (list.length > 0) {
				setSelectedTest(list[0]);
			}
		} catch (err) {
			console.error("Failed to load tests:", err);
			setTests([]);
		} finally {
			setTestsLoading(false);
		}
	};

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

			// Seed empty marks for every student × question
			const initialMarks: Record<string, Record<string, string>> = {};
			enrolledList.forEach((e) => {
				initialMarks[e.student_rollno] = {};
				questionsList.forEach((q) => {
					initialMarks[e.student_rollno][q.question_identifier] = "";
				});
			});

			// Fetch all students' marks in parallel
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

	// ─── Tab selection ──────────────────────────────────────────────
	const handleTabSelect = (test: Test) => {
		if (test.id === selectedTest?.id) return;
		setSelectedTest(test);
		// Clear marks state for the incoming test
		setEnrollments([]);
		setQuestions([]);
		setMarks({});
		setOriginalMarks({});
		setDirtyRows(new Set());
	};

	// ─── Mark change ────────────────────────────────────────────────
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

	// ─── Save ────────────────────────────────────────────────────────
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

	// ─── CSV Import ──────────────────────────────────────────────────
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

	// ─── Computed view data ─────────────────────────────────────────
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

	// ─── Tab status helper ──────────────────────────────────────────
	const getTabStatus = (test: Test) => {
		if (test.id !== selectedTest?.id || viewMode !== "by-question") {
			return {
				dot: "bg-muted-foreground/30",
				subtitle: `Full: ${test.full_marks || "?"}`,
			};
		}
		if (enrollments.length === 0) {
			return {
				dot: "bg-muted-foreground/30",
				subtitle: `Full: ${test.full_marks || "?"}`,
			};
		}
		const pct = Math.round((enteredCount / enrollments.length) * 100);
		const dot =
			enteredCount === 0
				? "bg-muted-foreground/30"
				: enteredCount === enrollments.length
					? "bg-green-500"
					: "bg-yellow-500";
		const label =
			enteredCount === 0
				? "Pending"
				: enteredCount === enrollments.length
					? "Completed"
					: `${pct}% Entered`;
		return {
			dot,
			subtitle: `${label} • Full: ${test.full_marks || "?"}`,
		};
	};

	// ─── No course ───────────────────────────────────────────────────
	if (!selectedCourse) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-center">
				<FileText className="w-12 h-12 text-muted-foreground/20 mb-3" />
				<p className="text-muted-foreground">
					Select a course to enter marks
				</p>
			</div>
		);
	}

	// ─── Render ──────────────────────────────────────────────────────
	return (
		<div className="flex flex-col h-full overflow-hidden bg-background">
			{/* ── Assessment tab bar ─────────────────────────────── */}
			<div className="bg-background border-b shrink-0">
				<div className="flex items-center border-b border-border">
					<ScrollArea className="flex-1">
						<div className="flex items-center">
							{testsLoading ? (
								<div className="px-6 py-4 text-sm text-muted-foreground">
									Loading assessments…
								</div>
							) : tests.length === 0 ? (
								<div className="px-6 py-4 text-sm text-muted-foreground">
									No assessments – create one first
								</div>
							) : (
								tests.map((test) => {
									const { dot, subtitle } =
										getTabStatus(test);
									const isActive =
										selectedTest?.id === test.id;
									return (
										<button
											key={test.id}
											onClick={() =>
												handleTabSelect(test)
											}
											className={cn(
												"shrink-0 px-6 py-4 border-b-2 border-transparent hover:bg-muted transition-all cursor-pointer text-left",
												isActive &&
													"border-primary bg-primary/5",
											)}
										>
											<div className="flex items-center gap-2">
												<h4
													className={cn(
														"text-sm font-bold whitespace-nowrap",
														isActive
															? "text-primary"
															: "text-muted-foreground",
													)}
												>
													{test.name}
												</h4>
												<span
													className={cn(
														"h-2 w-2 rounded-full shrink-0",
														dot,
													)}
												/>
											</div>
											<p className="text-[10px] text-muted-foreground mt-0.5">
												{subtitle}
											</p>
										</button>
									);
								})
							)}
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>

				{/* ── Toolbar ────────────────────────────────────── */}
				{selectedTest && (
					<div className="px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
						<div className="flex items-center gap-3 flex-wrap">
							{/* Mode toggle */}
							<Tabs
								value={viewMode}
								onValueChange={(v) =>
									setViewMode(v as ViewMode)
								}
							>
								<TabsList className="h-auto p-1">
									<TabsTrigger
										value="by-question"
										className="text-xs px-4 py-1.5 font-semibold"
									>
										By Question
									</TabsTrigger>
									<TabsTrigger
										value="by-co"
										className="text-xs px-4 py-1.5 font-semibold"
									>
										By CO
									</TabsTrigger>
									<TabsTrigger
										value="bulk"
										className="text-xs px-4 py-1.5 font-semibold"
									>
										Bulk View
									</TabsTrigger>
								</TabsList>
							</Tabs>
							{/* Stats chip (by-question only) */}
							{viewMode === "by-question" &&
								enrollments.length > 0 && (
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
											{enteredCount}/{enrollments.length}{" "}
											Entered
										</Badge>
									</div>
								)}
						</div>

						{/* Right-side actions (by-question only) */}
						{viewMode === "by-question" && (
							<div className="flex items-center gap-2">
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
									onClick={() =>
										fileInputRef.current?.click()
									}
									className="gap-1.5 text-xs h-8"
								>
									<Upload className="w-3.5 h-3.5" />
									Import
								</Button>
								<Button
									size="sm"
									onClick={handleSubmit}
									disabled={
										submitting || dirtyRows.size === 0
									}
									className="gap-1.5 text-xs h-8"
								>
									<Save className="w-3.5 h-3.5" />
									{submitting ? "Saving…" : "Save"}
								</Button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* ── Content area ───────────────────────────────────── */}
			<div className="flex-1 overflow-hidden flex flex-col min-h-0">
				{!selectedTest ? (
					<div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
						<FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
						<p className="text-sm text-muted-foreground">
							Select an assessment tab above
						</p>
					</div>
				) : viewMode === "by-question" ? (
					<>
						{/* Dirty rows banner */}
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

						{/* Table scroll area */}
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
									No questions found — add questions to this
									assessment first
								</div>
							) : (
								<BulkMarksTable
									questions={questions}
									enrollments={currentEnrollments}
									marks={marks}
									dirtyRows={dirtyRows}
									onMarkChange={handleMarkChange}
								/>
							)}
						</div>

						{/* Footer with pagination */}
						{!marksLoading && filteredEnrollments.length > 0 && (
							<div className="shrink-0 bg-background border-t border-border px-6 py-3 flex items-center justify-between gap-4">
								<p className="text-sm text-muted-foreground whitespace-nowrap">
									Showing{" "}
									{filteredEnrollments.length === 0
										? 0
										: startIndex + 1}{" "}
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
														Math.abs(
															p - currentPage,
														) <= 1,
												)
												.map((page, index, array) => {
													const prevPage =
														array[index - 1];
													const showEllipsis =
														prevPage &&
														page - prevPage > 1;
													return (
														<Fragment
															key={`pg-${page}`}
														>
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
																		setCurrentPage(
																			page,
																		)
																	}
																	isActive={
																		currentPage ===
																		page
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
															Math.min(
																totalPages,
																p + 1,
															),
														)
													}
													className={
														currentPage ===
														totalPages
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
				) : viewMode === "by-co" ? (
					<div className="flex-1 overflow-auto">
						<MarksEntryByCO
							test={selectedTest}
							course={selectedCourse}
							onBack={() => setViewMode("by-question")}
							embedded
						/>
					</div>
				) : (
					<div className="flex-1 overflow-auto">
						<ViewTestMarks
							test={selectedTest}
							course={selectedCourse}
							onBack={() => setViewMode("by-question")}
							embedded
						/>
					</div>
				)}
			</div>
		</div>
	);
}
