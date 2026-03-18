import { useState, useEffect, useRef, Fragment } from "react";
import { toast } from "sonner";
import { Upload, Save, Search, AlertCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
	/** When true, suppresses the back-header and renders content only */
	embedded?: boolean;
}

const emptyRow = (): CORow =>
	Object.fromEntries(CO_KEYS.map((k) => [k, ""])) as CORow;

export function MarksEntryByCO({
	test,
	course,
	onBack,
	embedded = false,
}: MarksEntryByCOProps) {
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
	const [searchTerm, setSearchTerm] = useState("");
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

	// Filtering + Pagination
	const filteredEnrollments = enrollments.filter(
		(e) =>
			e.student_rollno.toLowerCase().includes(searchTerm.toLowerCase()) ||
			e.student_name.toLowerCase().includes(searchTerm.toLowerCase()),
	);
	const totalPages = Math.ceil(filteredEnrollments.length / ITEMS_PER_PAGE);
	const paginated = filteredEnrollments.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	const CO_COLORS: Record<string, string> = {
		CO1: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
		CO2: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
		CO3: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
		CO4: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
		CO5: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
		CO6: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
	};

	const renderTableHeader = () => (
		<TableHeader className="bg-gray-50 dark:bg-muted sticky top-0 z-30 [&_tr]:border-0 shadow-sm">
			<TableRow className="hover:bg-transparent border-b border-border">
				<TableHead
					scope="col"
					className="sticky left-0 z-40 bg-gray-50 dark:bg-muted px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-[120px] min-w-[120px] shadow-[1px_0_0_0_hsl(var(--border))]"
				>
					Roll No
				</TableHead>
				<TableHead
					scope="col"
					className="sticky left-[120px] z-40 bg-gray-50 dark:bg-muted px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-[200px] min-w-[200px] shadow-[1px_0_0_0_hsl(var(--border))]"
				>
					Student Name
				</TableHead>
				{CO_KEYS.map((co) => (
					<TableHead
						key={co}
						scope="col"
						className="px-4 py-3 text-center border-r border-border min-w-[100px] align-middle"
					>
						<div className="flex flex-col items-center gap-0.5">
							<Badge
								className={cn(
									"text-[10px] font-bold h-auto py-0 px-1.5 rounded border-transparent text-xs",
									CO_COLORS[co],
								)}
							>
								{co}
							</Badge>
							{coMaxMarks[co] > 0 && (
								<span className="text-[10px] text-muted-foreground">
									({coMaxMarks[co]})
								</span>
							)}
						</div>
					</TableHead>
				))}
				<TableHead
					scope="col"
					className="px-4 py-3 text-center bg-blue-50/50 dark:bg-blue-950/40 min-w-20 align-middle backdrop-blur-sm"
				>
					<div className="flex flex-col items-center gap-0.5">
						<span className="text-xs font-bold text-blue-600 dark:text-blue-400">
							Total
						</span>
						{Object.values(coMaxMarks).some((v) => v > 0) && (
							<span className="text-[10px] text-muted-foreground">
								(
								{Object.values(coMaxMarks).reduce(
									(s, v) => s + v,
									0,
								)}
								)
							</span>
						)}
					</div>
				</TableHead>
			</TableRow>
		</TableHeader>
	);

	const renderTableBody = (rows: typeof paginated) => (
		<TableBody className="bg-background [&_tr:last-child]:border-0">
			{rows.map((enrollment) => {
				const rollno = enrollment.student_rollno;
				const isDirty = dirtyRows.has(rollno);
				const row = marks[rollno] ?? emptyRow();
				const hasInvalid = CO_KEYS.some((co) =>
					invalidCells.has(`${rollno}:${co}`),
				);
				const total = CO_KEYS.reduce(
					(sum, co) => sum + (parseFloat(row[co]) || 0),
					0,
				);
				const stickyBg = hasInvalid
					? "bg-red-50 group-hover:bg-red-100 dark:bg-red-950 dark:group-hover:bg-red-900"
					: isDirty
						? "bg-amber-50 group-hover:bg-amber-100 dark:bg-amber-950 dark:group-hover:bg-amber-900"
						: "bg-background group-hover:bg-muted/50";
				return (
					<TableRow
						key={rollno}
						className={cn(
							"transition-colors group border-b border-border",
							hasInvalid
								? "bg-red-50/30 hover:bg-red-50/50 dark:bg-red-900/10 dark:hover:bg-red-900/20"
								: isDirty
									? "bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-900/10 dark:hover:bg-amber-900/20"
									: "hover:bg-muted/50",
						)}
					>
						<TableCell
							className={cn(
								"sticky left-0 z-20 px-6 py-3 whitespace-nowrap font-medium text-foreground border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]",
								stickyBg,
							)}
						>
							<Badge variant="outline" className="font-mono">
								{rollno}
							</Badge>
						</TableCell>
						<TableCell
							className={cn(
								"sticky left-[120px] z-20 px-6 py-3 whitespace-nowrap text-muted-foreground border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]",
								stickyBg,
							)}
						>
							{enrollment.student_name}
						</TableCell>
						{CO_KEYS.map((co) => {
							const cellKey = `${rollno}:${co}`;
							const invalid = invalidCells.has(cellKey);
							return (
								<TableCell
									key={co}
									className="px-4 py-3 text-center border-r border-border"
								>
									<Input
										type="number"
										step="0.5"
										min="0"
										max={
											coMaxMarks[co] > 0
												? coMaxMarks[co]
												: undefined
										}
										value={row[co]}
										onChange={(e) =>
											handleMarkChange(
												rollno,
												co,
												e.target.value,
											)
										}
										onFocus={(e) => e.target.select()}
										placeholder="-"
										className={cn(
											"w-20 h-8 p-1.5 text-center text-sm bg-background",
											invalid &&
												"border-destructive border-2 text-destructive focus-visible:ring-destructive/30",
										)}
									/>
								</TableCell>
							);
						})}
						<TableCell className="px-4 py-3 text-center font-bold bg-blue-50/20 dark:bg-blue-900/10">
							<span
								className={
									hasInvalid
										? "text-destructive"
										: "text-foreground"
								}
							>
								{total % 1 === 0
									? total.toFixed(0)
									: total.toFixed(2)}
							</span>
						</TableCell>
					</TableRow>
				);
			})}
		</TableBody>
	);

	const renderPagination = () =>
		totalPages > 1 ? (
			<Pagination className="w-auto">
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							onClick={() =>
								setCurrentPage((p) => Math.max(1, p - 1))
							}
							className={
								currentPage === 1
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
						/>
					</PaginationItem>
					{Array.from({ length: totalPages }, (_, i) => i + 1)
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
											onClick={() => setCurrentPage(page)}
											isActive={currentPage === page}
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
		) : null;

	return (
		<div className="space-y-2 w-full min-w-0">
			{!embedded && (
				<MarksEntryHeader
					title="CO-wise Marks Entry"
					course={course}
					onBack={onBack}
				/>
			)}

			{embedded ? (
				// ── Flat embedded layout matching FacultyMarks by-question style ──
				<div className="flex flex-col h-full">
					{/* Sub-toolbar */}
					<div className="shrink-0 border-b bg-background px-6 py-3 flex items-center justify-end gap-2 border-border">
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
							<Input
								placeholder="Search Student…"
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-9 h-8 text-sm w-56 bg-background"
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

					{/* Banners */}
					{invalidCells.size > 0 && (
						<div className="shrink-0 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border-b border-destructive/20 px-6 py-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span className="font-medium">
								{invalidCells.size} invalid mark(s)
							</span>
							<span className="text-xs text-destructive/80">
								— values exceed CO max marks
							</span>
						</div>
					)}
					{dirtyRows.size > 0 && (
						<div className="shrink-0 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span className="font-medium">
								{dirtyRows.size} student(s) modified
							</span>
							<span className="text-xs text-amber-600/80 dark:text-amber-400/80">
								— unsaved changes highlighted
							</span>
						</div>
					)}

					{/* Table scroll area */}
					<div className="flex-1 overflow-auto bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full">
						{loading ? (
							<div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground">
								Loading students…
							</div>
						) : enrollments.length === 0 ? (
							<div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground">
								No students enrolled in this course
							</div>
						) : (
							<table className="min-w-full border-collapse">
								{renderTableHeader()}
								{renderTableBody(paginated)}
							</table>
						)}
					</div>

					{/* Footer */}
					{!loading && filteredEnrollments.length > 0 && (
						<div className="shrink-0 bg-background border-t border-border px-6 py-3 flex items-center justify-between gap-4">
							<p className="text-sm text-muted-foreground whitespace-nowrap">
								Showing{" "}
								{filteredEnrollments.length === 0
									? 0
									: (currentPage - 1) * ITEMS_PER_PAGE +
										1}{" "}
								to{" "}
								{Math.min(
									currentPage * ITEMS_PER_PAGE,
									filteredEnrollments.length,
								)}{" "}
								of {filteredEnrollments.length} entries
							</p>
							{renderPagination()}
						</div>
					)}
				</div>
			) : (
				// ── Standalone card layout (non-embedded) ──────────────────────
				<TestInfoCard
					test={test}
					onSave={handleSubmit}
					isSaving={submitting}
					isDisabled={enrollments.length === 0}
					searchTerm={searchTerm}
					onSearch={(v) => {
						setSearchTerm(v);
						setCurrentPage(1);
					}}
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
							Loading students...
						</div>
					) : enrollments.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
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
										(Values must be ≥ 0 and within the CO
										max marks)
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
										{renderTableHeader()}
										{renderTableBody(paginated)}
									</table>
								</div>
							</div>

							{totalPages > 1 && (
								<div className="flex justify-center">
									{renderPagination()}
								</div>
							)}
						</div>
					)}
				</TestInfoCard>
			)}
		</div>
	);
}
