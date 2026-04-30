import { useState, useEffect, useMemo } from "react";
import { useCSVParser } from "@/lib/useCSVParser";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type {
	Course,
	Test,
	Enrollment,
	QuestionResponse,
} from "@/services/api";

export const CO_KEYS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;
export type COKey = (typeof CO_KEYS)[number];
export type CORow = Record<COKey, string>;

export const emptyRow = (): CORow =>
	Object.fromEntries(CO_KEYS.map((k) => [k, ""])) as CORow;

export const ITEMS_PER_PAGE = 10;

export function useMarksEntryByCO(test: Test, course: Course | null) {
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [marks, setMarks] = useState<Record<string, CORow>>({});
	const [originalMarks, setOriginalMarks] = useState<Record<string, CORow>>(
		{},
	);
	const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
	const [coMaxMarks, setCoMaxMarks] = useState<Record<COKey, number>>(
		Object.fromEntries(CO_KEYS.map((k) => [k, 0])) as Record<COKey, number>,
	);

	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [validateMarks, setValidateMarks] = useState(true);

	const invalidCells = useMemo(() => {
		const next = new Set<string>();
		if (!validateMarks) return next;

		Object.entries(marks).forEach(([rollno, row]) => {
			CO_KEYS.forEach((co) => {
				const value = row[co];
				if (value.trim() === "") return;
				const num = parseFloat(value);
				if (
					isNaN(num) ||
					num < 0 ||
					(coMaxMarks[co] > 0 && num > coMaxMarks[co])
				) {
					next.add(`${rollno}:${co}`);
				}
			});
		});
		return next;
	}, [marks, validateMarks, coMaxMarks]);

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

			// Pre-fill with any existing marks
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
			setCurrentPage(1);
		} catch (error) {
			console.error("Failed to load data:", error);
			toast.error("Failed to load students");
		} finally {
			setLoading(false);
		}
	};

	const handleMarkChange = (rollno: string, co: COKey, value: string) => {
		setMarks((prev) => ({
			...prev,
			[rollno]: { ...prev[rollno], [co]: value },
		}));

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
					validate_marks: validateMarks,
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

	const csvParserArgs = useMemo(() => {
		return {
			onParseSuccess: ({ originalLines, dataStartCol }: any) => {
				setMarks((prevMarks) => {
					const newMarks = { ...prevMarks };
					const newDirty = new Set(dirtyRows);
					let updatedCount = 0;
					let csvInvalidCount = 0;

					originalLines.forEach((values: any) => {
						const rollno = values[0];
						if (newMarks[rollno] === undefined) return;

						const coValues = values.slice(dataStartCol);
						const updated = { ...newMarks[rollno] } as CORow;

						CO_KEYS.forEach((co, idx) => {
							const val = coValues[idx];
							if (val === undefined || val === "") return;
							const num = parseFloat(val);
							if (isNaN(num)) return;
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

					setDirtyRows(newDirty);

					if (updatedCount > 0) {
						const msg =
							"Imported marks for " +
							updatedCount +
							" student(s). Review and click Save.";
						if (csvInvalidCount > 0) {
							toast.warning(
								msg +
									" " +
									csvInvalidCount +
									" value(s) exceed max marks — highlighted in red.",
							);
						} else {
							toast.success(msg);
						}
					} else {
						toast.warning(
							"No matching enrolled students found in CSV.",
						);
					}

					return newMarks;
				});
			},
		};
	}, [coMaxMarks, dirtyRows]);

	const { fileInputRef, handleFileUpload } = useCSVParser(csvParserArgs);

	return {
		enrollments,
		marks,
		dirtyRows,
		coMaxMarks,
		loading,
		submitting,
		searchTerm,
		setSearchTerm,
		currentPage,
		setCurrentPage,
		validateMarks,
		setValidateMarks,
		invalidCells,
		handleMarkChange,
		handleSubmit,
		fileInputRef,
		handleFileUpload,
	};
}
