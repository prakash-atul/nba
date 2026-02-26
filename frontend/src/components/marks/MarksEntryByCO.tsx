import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { apiService } from "@/services/api";
import type {
	Course,
	Test,
	Enrollment,
	QuestionResponse,
} from "@/services/api";
import { MarksEntryHeader } from "./MarksEntryHeader";
import { TestInfoCard } from "./TestInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

const CO_KEYS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;
type COKey = (typeof CO_KEYS)[number];
type CORow = Record<COKey, string>;

interface MarksEntryByCOProps {
	test: Test;
	course: Course | null;
	onBack: () => void;
}

const emptyRow = (): CORow =>
	Object.fromEntries(CO_KEYS.map((k) => [k, ""])) as CORow;

export function MarksEntryByCO({ test, course, onBack }: MarksEntryByCOProps) {
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [marks, setMarks] = useState<Record<string, CORow>>({});
	const [originalMarks, setOriginalMarks] = useState<Record<string, CORow>>(
		{},
	);
	const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
	const [coMaxMarks, setCoMaxMarks] = useState<Record<COKey, number>>(
		Object.fromEntries(CO_KEYS.map((k) => [k, 0])) as Record<COKey, number>,
	);
	const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const ITEMS_PER_PAGE = 10;

	useEffect(() => {
		if (test && course) {
			loadData();
		}
	}, [test, course]);

	const loadData = async () => {
		if (!course || !test) return;
		setLoading(true);
		try {
			const enrollmentData = await apiService.getCourseEnrollments(
				course.offering_id ?? course.course_id,
			);
			const enrolled: Enrollment[] = enrollmentData.enrollments || [];
			setEnrollments(enrolled);

			// Load questions to compute per-CO max marks
			try {
				const assessment = await apiService.getAssessment(test.id);
				const questions: QuestionResponse[] =
					assessment.questions || [];
				const maxMarks = Object.fromEntries(
					CO_KEYS.map((k) => [k, 0]),
				) as Record<COKey, number>;
				questions
					.filter((q) => !q.is_optional)
					.forEach((q) => {
						const key = `CO${q.co}` as COKey;
						if (key in maxMarks) maxMarks[key] += q.max_marks;
					});
				setCoMaxMarks(maxMarks);
			} catch {
				// No questions — max marks unavailable
			}

			// Seed all rows with empty values
			const initial: Record<string, CORow> = {};
			for (const e of enrolled) {
				initial[e.student_rollno] = emptyRow();
			}

			// Pre-fill with any existing marks (one request for all students)
			try {
				const testMarks = await apiService.getTestMarks(test.id);
				if (testMarks.marks?.length) {
					testMarks.marks.forEach(
						(entry: Record<string, unknown>) => {
							const rollno = entry.student_id as string;
							if (initial[rollno] !== undefined) {
								CO_KEYS.forEach((co) => {
									const val = entry[co];
									initial[rollno][co] =
										val !== null &&
										val !== undefined &&
										Number(val) !== 0
											? val.toString()
											: "";
								});
							}
						},
					);
				}
			} catch {
				// No existing marks yet — fine
			}

			setMarks(initial);
			setOriginalMarks(JSON.parse(JSON.stringify(initial)));
			setDirtyRows(new Set());
			setInvalidCells(new Set());
			setCurrentPage(1);
		} catch (error) {
			console.error("Failed to load data:", error);
			toast.error("Failed to load students");
		} finally {
			setLoading(false);
		}
	};

	const isCellInvalid = (co: COKey, value: string): boolean => {
		if (value.trim() === "") return false;
		const num = parseFloat(value);
		if (isNaN(num)) return true;
		if (num < 0) return true;
		if (coMaxMarks[co] > 0 && num > coMaxMarks[co]) return true;
		return false;
	};

	const handleMarkChange = (rollno: string, co: COKey, value: string) => {
		setMarks((prev) => ({
			...prev,
			[rollno]: { ...prev[rollno], [co]: value },
		}));

		const cellKey = `${rollno}:${co}`;
		setInvalidCells((prev) => {
			const next = new Set(prev);
			if (isCellInvalid(co, value)) {
				next.add(cellKey);
			} else {
				next.delete(cellKey);
			}
			return next;
		});

		setDirtyRows((prev) => {
			const next = new Set(prev);
			const rowUnchanged = CO_KEYS.every((k) => {
				const cur = k === co ? value : (marks[rollno]?.[k] ?? "");
				return cur === (originalMarks[rollno]?.[k] ?? "");
			});
			if (rowUnchanged) {
				next.delete(rollno);
			} else {
				next.add(rollno);
			}
			return next;
		});
	};

	const handleSubmit = async () => {
		if (invalidCells.size > 0) {
			toast.error(
				`Fix ${invalidCells.size} invalid mark(s) before saving`,
			);
			return;
		}
		if (dirtyRows.size === 0) {
			toast.error("No changes to save");
			return;
		}

		setSubmitting(true);
		let successCount = 0;
		let failCount = 0;

		for (const rollno of dirtyRows) {
			const row = marks[rollno];
			if (!row) continue;
			try {
				await apiService.saveMarksByCO({
					test_id: test.id,
					student_id: rollno,
					CO1: row.CO1.trim() !== "" ? parseFloat(row.CO1) || 0 : 0,
					CO2: row.CO2.trim() !== "" ? parseFloat(row.CO2) || 0 : 0,
					CO3: row.CO3.trim() !== "" ? parseFloat(row.CO3) || 0 : 0,
					CO4: row.CO4.trim() !== "" ? parseFloat(row.CO4) || 0 : 0,
					CO5: row.CO5.trim() !== "" ? parseFloat(row.CO5) || 0 : 0,
					CO6: row.CO6.trim() !== "" ? parseFloat(row.CO6) || 0 : 0,
				});
				successCount++;
			} catch {
				failCount++;
			}
		}

		setSubmitting(false);

		if (failCount > 0) {
			toast.warning(
				`Saved ${successCount} student(s). ${failCount} failed.`,
			);
		} else {
			toast.success(
				`All ${successCount} student mark(s) saved successfully!`,
			);
		}

		await loadData();
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
		const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
		if (lines.length < 2) {
			toast.error("CSV file is empty or missing header");
			return;
		}

		const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
		let marksStartIndex = 1;
		if (headers.length > 1 && headers[1].includes("name")) {
			marksStartIndex = 2;
		} else if (lines.length > 1) {
			const firstData = lines[1].split(",");
			if (firstData.length > 1 && isNaN(parseFloat(firstData[1]))) {
				marksStartIndex = 2;
			}
		}

		setMarks((prevMarks) => {
			const newMarks = { ...prevMarks };
			const newDirty = new Set(dirtyRows);
			let updatedCount = 0;

			let csvInvalidCount = 0;
			lines.slice(1).forEach((line) => {
				const values = line.split(",").map((v) => v.trim());
				if (values.length < 2) return;

				const rollno = values[0];
				if (newMarks[rollno] === undefined) return; // not enrolled

				const coValues = values.slice(marksStartIndex);
				const updated: CORow = { ...newMarks[rollno] };

				CO_KEYS.forEach((co, idx) => {
					const val = coValues[idx];
					if (val === undefined || val === "") return;
					const num = parseFloat(val);
					if (isNaN(num)) return;
					// Clamp to valid range — warn but still import
					if (
						num < 0 ||
						(coMaxMarks[co] > 0 && num > coMaxMarks[co])
					) {
						csvInvalidCount++;
					}
					updated[co] = val;
				});

				newMarks[rollno] = updated;
				newDirty.add(rollno);
				updatedCount++;
			});

			// Recompute invalid cells from the updated marks
			const newInvalid = new Set<string>();
			Object.entries(newMarks).forEach(([rollno, row]) => {
				CO_KEYS.forEach((co) => {
					if (isCellInvalid(co, row[co]))
						newInvalid.add(`${rollno}:${co}`);
				});
			});
			setInvalidCells(newInvalid);

			setDirtyRows(newDirty);

			if (updatedCount > 0) {
				const msg = `Imported marks for ${updatedCount} student(s). Review and click Save.`;
				if (csvInvalidCount > 0) {
					toast.warning(
						`${msg} ${csvInvalidCount} value(s) exceed max marks — highlighted in red.`,
					);
				} else {
					toast.success(msg);
				}
			} else {
				toast.warning("No matching enrolled students found in CSV.");
			}

			return newMarks;
		});
	};

	// Pagination
	const totalPages = Math.ceil(enrollments.length / ITEMS_PER_PAGE);
	const paginated = enrollments.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	return (
		<div className="space-y-2 w-full min-w-0">
			<MarksEntryHeader
				title="CO-wise Marks Entry"
				course={course}
				onBack={onBack}
			/>

			<TestInfoCard
				test={test}
				onSave={handleSubmit}
				isSaving={submitting}
				isDisabled={enrollments.length === 0}
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
					<div className="text-center py-8 text-gray-500">
						Loading students...
					</div>
				) : enrollments.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						No students enrolled in this course
					</div>
				) : (
					<div className="px-6 py-0 space-y-4 grid grid-cols-1 w-full">
						{invalidCells.size > 0 && (
							<div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md px-4 py-2">
								<span className="font-medium">
									{invalidCells.size} invalid mark(s)
								</span>
								<span className="text-xs">
									(Values must be ≥ 0 and within the CO max
									marks)
								</span>
							</div>
						)}
						{dirtyRows.size > 0 && (
							<div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md px-4 py-2">
								<span className="font-medium">
									{dirtyRows.size} student(s) modified
								</span>
								<span className="text-xs">
									(Highlighted rows will be saved)
								</span>
							</div>
						)}

						<div className="relative border rounded-md w-full overflow-hidden">
							<div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full">
								<table className="w-full caption-bottom text-sm min-w-max">
									<TableHeader className="bg-background">
										<TableRow className="hover:bg-transparent">
											<TableHead className="text-left w-[120px] min-w-[120px] sticky left-0 top-0 bg-background z-50 border-r shadow-sm">
												Roll No
											</TableHead>
											<TableHead className="text-left w-[200px] min-w-[200px] sticky left-[120px] top-0 bg-background z-50 border-r shadow-sm">
												Name
											</TableHead>
											{CO_KEYS.map((co) => (
												<TableHead
													key={co}
													className="text-center min-w-[100px] sticky top-0 bg-background z-40 shadow-sm"
												>
													<div className="flex flex-col items-center gap-1 py-2">
														<span>{co}</span>
														{coMaxMarks[co] > 0 && (
															<Badge
																variant="secondary"
																className="text-xs"
															>
																{coMaxMarks[co]}
															</Badge>
														)}
													</div>
												</TableHead>
											))}
											<TableHead className="text-center min-w-[80px] sticky top-0 bg-background z-40 shadow-sm">
												Total
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginated.map((enrollment) => {
											const isDirty = dirtyRows.has(
												enrollment.student_rollno,
											);
											const row =
												marks[
													enrollment.student_rollno
												] ?? emptyRow();
											const total = CO_KEYS.reduce(
												(sum, co) =>
													sum +
													(parseFloat(row[co]) || 0),
												0,
											);
											return (
												<TableRow
													key={
														enrollment.student_rollno
													}
													className={
														isDirty
															? "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30"
															: "bg-background hover:bg-muted/50"
													}
												>
													<TableCell className="text-left font-medium sticky left-0 bg-inherit z-30 border-r">
														{
															enrollment.student_rollno
														}
													</TableCell>
													<TableCell className="text-left sticky left-[120px] bg-inherit z-30 border-r">
														{
															enrollment.student_name
														}
													</TableCell>
													{CO_KEYS.map((co) => (
														<TableCell
															key={co}
															className="text-center"
														>
															<Input
																type="number"
																step="0.5"
																min="0"
																max={
																	coMaxMarks[
																		co
																	] > 0
																		? coMaxMarks[
																				co
																			]
																		: undefined
																}
																value={row[co]}
																onChange={(e) =>
																	handleMarkChange(
																		enrollment.student_rollno,
																		co,
																		e.target
																			.value,
																	)
																}
																onFocus={(e) =>
																	e.target.select()
																}
																placeholder="0"
																className={`w-20 text-center${
																	invalidCells.has(
																		`${enrollment.student_rollno}:${co}`,
																	)
																		? " border-red-500 focus-visible:ring-red-500"
																		: ""
																}`}
															/>
														</TableCell>
													))}
													<TableCell className="text-center">
														<Badge variant="secondary">
															{total % 1 === 0
																? total
																: total.toFixed(
																		1,
																	)}
														</Badge>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</table>
							</div>
						</div>

						{totalPages > 1 && (
							<div className="flex justify-center">
								<Pagination>
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
											{ length: totalPages },
											(_, i) => i + 1,
										)
											.filter(
												(page) =>
													page === 1 ||
													page === totalPages ||
													Math.abs(
														page - currentPage,
													) <= 1,
											)
											.map((page, idx, arr) => {
												const showEllipsis =
													idx > 0 &&
													page - arr[idx - 1] > 1;
												return showEllipsis ? (
													<>
														<PaginationItem
															key={`e-${page}`}
														>
															<span className="px-4">
																...
															</span>
														</PaginationItem>
														<PaginationItem
															key={page}
														>
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
													</>
												) : (
													<PaginationItem key={page}>
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
													currentPage === totalPages
														? "pointer-events-none opacity-50"
														: "cursor-pointer"
												}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						)}
					</div>
				)}
			</TestInfoCard>
		</div>
	);
}
