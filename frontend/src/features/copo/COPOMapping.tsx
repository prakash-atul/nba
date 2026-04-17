import { MatrixView } from "./MatrixView";
import { useCallback, useState, useEffect, useMemo } from "react";
import { debugLogger } from "@/lib/debugLogger";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { exportAttainmentExcel } from "@/lib/excel/attainmentExcel";
import type {
	StudentMarks,
	AttainmentThreshold,
	AttainmentData,
	COPOMatrixState,
} from "./types";
import {
	getLevelColor,
	getPercentageColor,
	getAttainmentCriteria,
} from "./utils";

// Import the table components (to be created)

interface COPOMappingProps {
	courseCode: string;
	courseName: string;
	courseId: number;
	facultyName: string;
	departmentName: string;
	year: number;
	semester: string;
	readOnly?: boolean;
}

export function COPOMapping({
	courseCode,
	courseName,
	courseId,
	facultyName,
	departmentName,
	year,
	semester,
	readOnly = false,
}: COPOMappingProps) {
	const [loading, setLoading] = useState(true);
	const [studentsData, setStudentsData] = useState<StudentMarks[]>([]);
	const [maxMarks, setMaxMarks] = useState<{
		[testName: string]: {
			total: number;
			CO1: number;
			CO2: number;
			CO3: number;
			CO4: number;
			CO5: number;
			CO6: number;
		};
	}>({});

	// Attainment settings state
	const [showSettings, setShowSettings] = useState(false);
	const [attainmentThresholds, setAttainmentThresholds] = useState<
		AttainmentThreshold[]
	>([
		{ id: 1, percentage: 70 },
		{ id: 2, percentage: 60 },
		{ id: 3, percentage: 50 },
	]);
	const [coThreshold, setCoThreshold] = useState(40);
	const [passingThreshold, setPassingThreshold] = useState(60);

	// CO-PO-PSO Mapping Matrix State
	const [copoMatrix, setCopoMatrix] = useState<COPOMatrixState>({
		CO1: {
			PO1: 0,
			PO2: 0,
			PO3: 0,
			PO4: 0,
			PO5: 0,
			PO6: 0,
			PO7: 0,
			PO8: 0,
			PO9: 0,
			PO10: 0,
			PO11: 0,
			PO12: 0,
			PSO1: 0,
			PSO2: 0,
			PSO3: 0,
		},
		CO2: {
			PO1: 0,
			PO2: 0,
			PO3: 0,
			PO4: 0,
			PO5: 0,
			PO6: 0,
			PO7: 0,
			PO8: 0,
			PO9: 0,
			PO10: 0,
			PO11: 0,
			PO12: 0,
			PSO1: 0,
			PSO2: 0,
			PSO3: 0,
		},
		CO3: {
			PO1: 0,
			PO2: 0,
			PO3: 0,
			PO4: 0,
			PO5: 0,
			PO6: 0,
			PO7: 0,
			PO8: 0,
			PO9: 0,
			PO10: 0,
			PO11: 0,
			PO12: 0,
			PSO1: 0,
			PSO2: 0,
			PSO3: 0,
		},
		CO4: {
			PO1: 0,
			PO2: 0,
			PO3: 0,
			PO4: 0,
			PO5: 0,
			PO6: 0,
			PO7: 0,
			PO8: 0,
			PO9: 0,
			PO10: 0,
			PO11: 0,
			PO12: 0,
			PSO1: 0,
			PSO2: 0,
			PSO3: 0,
		},
		CO5: {
			PO1: 0,
			PO2: 0,
			PO3: 0,
			PO4: 0,
			PO5: 0,
			PO6: 0,
			PO7: 0,
			PO8: 0,
			PO9: 0,
			PO10: 0,
			PO11: 0,
			PO12: 0,
			PSO1: 0,
			PSO2: 0,
			PSO3: 0,
		},
		CO6: {
			PO1: 0,
			PO2: 0,
			PO3: 0,
			PO4: 0,
			PO5: 0,
			PO6: 0,
			PO7: 0,
			PO8: 0,
			PO9: 0,
			PO10: 0,
			PO11: 0,
			PO12: 0,
			PSO1: 0,
			PSO2: 0,
			PSO3: 0,
		},
	});

	const [saving, setSaving] = useState(false);

	// Load COPO data
	useEffect(() => {
		loadCOPOData();
		loadAttainmentConfig();
		loadMatrix();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [courseId]);

	const loadMatrix = async () => {
		try {
			debugLogger.info("COPOMapping", "loadMatrix called");
			const mappings = await apiService.getCoPoMatrix(courseId);
			if (mappings && mappings.length > 0) {
				const newMatrix = JSON.parse(JSON.stringify(copoMatrix)); // Deep clone
				mappings.forEach((m) => {
					const co = m.co_name as keyof COPOMatrixState;
					const po = m.po_name;
					if (newMatrix[co]) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(newMatrix[co] as any)[po] = m.value;
					}
				});
				setCopoMatrix(newMatrix);
			}
		} catch (error) {
			debugLogger.error(
				"COPOMapping",
				"Failed to load CO-PO matrix",
				error,
			);
			console.error("Failed to load CO-PO matrix:", error);
		}
	};

	const loadAttainmentConfig = async () => {
		try {
			debugLogger.info("COPOMapping", "loadAttainmentConfig called");
			const config = await apiService.getAttainmentConfig(courseId);

			// Update thresholds
			setCoThreshold(config.co_threshold);
			setPassingThreshold(config.passing_threshold);

			// Update attainment thresholds if they exist
			if (
				config.attainment_thresholds &&
				config.attainment_thresholds.length > 0
			) {
				setAttainmentThresholds(
					config.attainment_thresholds.map((t) => ({
						id: t.id,
						percentage: t.percentage,
					})),
				);
			}
		} catch (error) {
			debugLogger.error(
				"COPOMapping",
				"Failed to load attainment configuration",
				error,
			);
			console.error("Failed to load attainment configuration:", error);
			// Keep default values if loading fails
			toast.info("Using default attainment configuration");
		}
	};

	const loadCOPOData = async () => {
		try {
			debugLogger.info("COPOMapping", "loadCOPOData called");
			setLoading(true);
			const testsData = await apiService.getCourseTests(courseId);

			if (testsData.length === 0) {
				setStudentsData([]);
				setLoading(false);
				return;
			}

			// Fetch marks for all tests
			const allMarksPromises = testsData.map((test) =>
				apiService
					.getTestMarks(test.id)
					.then((data) => ({ test, marksData: data }))
					.catch(() => ({ test, marksData: null })),
			);

			const allMarksResults = await Promise.all(allMarksPromises);

			// Process and structure the data
			const studentMap = new Map<string, StudentMarks>();
			const maxMarksMap: {
				[testName: string]: {
					total: number;
					CO1: number;
					CO2: number;
					CO3: number;
					CO4: number;
					CO5: number;
					CO6: number;
				};
			} = {};

			// Initialize max marks from tests
			testsData.forEach((test) => {
				maxMarksMap[test.name] = {
					total: test.full_marks,
					CO1: 0,
					CO2: 0,
					CO3: 0,
					CO4: 0,
					CO5: 0,
					CO6: 0,
				};
			});

			// Process marks data
			allMarksResults.forEach(({ test, marksData }) => {
				if (!marksData || !marksData.marks) return;

				marksData.marks.forEach((markRecord) => {
					const studentId = markRecord.student_id;
					const studentName = markRecord.student_name || studentId;

					if (!studentMap.has(studentId)) {
						studentMap.set(studentId, {
							rollNo: studentId,
							name: studentName,
							absentee: "",
							tests: {},
							total: 0,
							coTotals: {
								CO1: 0,
								CO2: 0,
								CO3: 0,
								CO4: 0,
								CO5: 0,
								CO6: 0,
								ΣCO: 0,
							},
						});
					}

					const student = studentMap.get(studentId)!;
					student.tests[test.name] = {
						CO1: Number(markRecord.CO1) || 0,
						CO2: Number(markRecord.CO2) || 0,
						CO3: Number(markRecord.CO3) || 0,
						CO4: Number(markRecord.CO4) || 0,
						CO5: Number(markRecord.CO5) || 0,
						CO6: Number(markRecord.CO6) || 0,
					};
				});
			});

			// Fetch questions for each test to calculate max marks per CO
			for (const test of testsData) {
				try {
					const assessmentData = await apiService.getAssessment(
						test.id,
					);
					const questions = assessmentData.questions;

					questions.forEach((q) => {
						const coKey =
							`CO${q.co}` as keyof (typeof maxMarksMap)[string];
						if (maxMarksMap[test.name][coKey] !== undefined) {
							maxMarksMap[test.name][coKey] += q.max_marks;
						}
					});
				} catch (error) {
					console.error(
						`Failed to load questions for test ${test.name}:`,
						error,
					);
				}
			}

			// Calculate totals and percentages for each student
			studentMap.forEach((student) => {
				let totalMarks = 0;
				const coTotals = {
					CO1: 0,
					CO2: 0,
					CO3: 0,
					CO4: 0,
					CO5: 0,
					CO6: 0,
				};
				const coMaxTotals = {
					CO1: 0,
					CO2: 0,
					CO3: 0,
					CO4: 0,
					CO5: 0,
					CO6: 0,
				};

				Object.keys(student.tests).forEach((testName) => {
					const testMarks = student.tests[testName];
					const testMaxMarks = maxMarksMap[testName];

					Object.keys(testMarks).forEach((co) => {
						const coKey = co as keyof typeof coTotals;
						const coMarks = testMarks[coKey];
						const coMax = testMaxMarks[coKey] || 0;

						coTotals[coKey] += coMarks;
						coMaxTotals[coKey] += coMax;
						totalMarks += coMarks;
					});
				});

				let totalMaxMarks = 0;
				Object.keys(coTotals).forEach((co) => {
					const coKey = co as keyof typeof coTotals;
					const coMax = coMaxTotals[coKey];
					totalMaxMarks += coMax;
					student.coTotals[coKey] =
						coMax > 0 ? (coTotals[coKey] / coMax) * 100 : 0;
				});

				const nonZeroCOs = Object.keys(coTotals).filter(
					(co) => coMaxTotals[co as keyof typeof coMaxTotals] > 0,
				);
				const sumCO =
					nonZeroCOs.reduce(
						(sum, co) =>
							sum + student.coTotals[co as keyof typeof coTotals],
						0,
					) / (nonZeroCOs.length || 1);

				student.coTotals.ΣCO = sumCO;
				student.total =
					totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
			});

			setMaxMarks(maxMarksMap);
			setStudentsData(Array.from(studentMap.values()));

			setLoading(false);
		} catch (error) {
			debugLogger.error(
				"COPOMapping",
				"Failed to load CO-PO data",
				error,
			);
			console.error("Failed to load CO-PO data:", error);
			toast.error("Failed to load CO-PO data");
			setLoading(false);
		}
	};

	const saveMatrix = async () => {
		setSaving(true);
		try {
			const mappings: Array<{
				co: string;
				po: string;
				value: number;
			}> = [];

			Object.entries(copoMatrix).forEach(([co, pos]) => {
				Object.entries(pos).forEach(([po, value]) => {
					if (value > 0) {
						mappings.push({ co, po, value });
					}
				});
			});

			await apiService.saveCoPoMatrix(courseId, mappings);
			toast.success("CO-PO Matrix saved successfully");
		} catch (error) {
			console.error("Failed to save matrix:", error);
			toast.error("Failed to save CO-PO Matrix");
		} finally {
			setSaving(false);
		}
	};

	const handleCSVDataParsed = (data: any[]) => {
		const newMatrix = JSON.parse(JSON.stringify(copoMatrix)); // Deep clone
		let updateCount = 0;

		data.forEach((row) => {
			let coName = "";
			for (const key in row) {
				const val = row[key]?.toString().trim().toUpperCase();
				if (val && /^CO[1-6]$/i.test(val)) {
					coName = val;
					break;
				}
			}

			if (!coName || !newMatrix[coName]) return;

			for (const key in row) {
				const upperKey = key.trim().toUpperCase();
				if (upperKey.startsWith("PO") || upperKey.startsWith("PSO")) {
					const val = parseInt(row[key]) || 0;
					if (val >= 0 && val <= 3) {
						if (newMatrix[coName][upperKey] !== undefined) {
							newMatrix[coName][upperKey] = val;
							updateCount++;
						}
					}
				}
			}
		});

		if (updateCount > 0) {
			setCopoMatrix(newMatrix);
			toast.success(
				`Imported metadata successfully (${updateCount} values updated). Click Save to persist.`,
			);
		} else {
			toast.warning(
				"No valid data found in CSV matching CO/PO structure.",
			);
		}
	};

	// Threshold management functions
	const addThreshold = () => {
		const newId = Math.max(...attainmentThresholds.map((t) => t.id), 0) + 1;
		const lowestPercentage = Math.min(
			...attainmentThresholds.map((t) => t.percentage),
		);
		const newPercentage = Math.max(lowestPercentage - 10, 0);
		setAttainmentThresholds([
			...attainmentThresholds,
			{ id: newId, percentage: newPercentage },
		]);
	};

	const updateThreshold = (id: number, value: number) => {
		setAttainmentThresholds(
			attainmentThresholds.map((t) =>
				t.id === id ? { ...t, percentage: value } : t,
			),
		);
	};

	const removeThreshold = (id: number) => {
		if (attainmentThresholds.length <= 1) {
			toast.error("At least one threshold is required");
			return;
		}
		setAttainmentThresholds(
			attainmentThresholds.filter((t) => t.id !== id),
		);
	};

	const saveSettings = async () => {
		const percentages = attainmentThresholds.map((t) => t.percentage);
		const hasDuplicates = new Set(percentages).size !== percentages.length;
		if (hasDuplicates) {
			toast.error("Threshold percentages must be unique");
			return;
		}
		const allValid = percentages.every((p) => p >= 0 && p <= 100);
		if (!allValid) {
			toast.error("All percentages must be between 0 and 100");
			return;
		}

		try {
			await apiService.saveAttainmentConfig({
				course_id: courseId,
				co_threshold: coThreshold,
				passing_threshold: passingThreshold,
				attainment_thresholds: attainmentThresholds.map((t) => ({
					id: t.id,
					percentage: t.percentage,
				})),
			});
			toast.success("Settings saved successfully");
			setShowSettings(false);
		} catch (error) {
			console.error("Failed to save settings:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save settings",
			);
		}
	};

	// Update CO-PO-PSO mapping value
	const updateCOPOMapping = (co: string, po: string, value: number) => {
		setCopoMatrix((prev) => ({
			...prev,
			[co]: {
				...prev[co],
				[po]: Math.max(0, Math.min(value, attainmentThresholds.length)),
			},
		}));
	};

	// Calculate attainment data
	const calculateCOAttainment = (): AttainmentData => {
		const totalStudents = studentsData.length;
		let absentees = 0;

		const coStats = {
			CO1: {
				above70: 0,
				above60: 0,
				above50: 0,
				abovePass: 0,
				aboveCOThreshold: 0,
			},
			CO2: {
				above70: 0,
				above60: 0,
				above50: 0,
				abovePass: 0,
				aboveCOThreshold: 0,
			},
			CO3: {
				above70: 0,
				above60: 0,
				above50: 0,
				abovePass: 0,
				aboveCOThreshold: 0,
			},
			CO4: {
				above70: 0,
				above60: 0,
				above50: 0,
				abovePass: 0,
				aboveCOThreshold: 0,
			},
			CO5: {
				above70: 0,
				above60: 0,
				above50: 0,
				abovePass: 0,
				aboveCOThreshold: 0,
			},
			CO6: {
				above70: 0,
				above60: 0,
				above50: 0,
				abovePass: 0,
				aboveCOThreshold: 0,
			},
		};

		studentsData.forEach((student) => {
			if (student.absentee === "AB" || student.absentee === "UR") {
				absentees++;
				return;
			}

			Object.keys(coStats).forEach((co) => {
				const percentage =
					student.coTotals[co as keyof typeof student.coTotals];
				// Using Math.round to match Excel's precision behavior for threshold comparison
				const roundedPercentage = Math.round(percentage * 100) / 100;

				if (roundedPercentage >= 70)
					coStats[co as keyof typeof coStats].above70++;
				if (roundedPercentage >= 60)
					coStats[co as keyof typeof coStats].above60++;
				if (roundedPercentage >= 50)
					coStats[co as keyof typeof coStats].above50++;
				if (roundedPercentage >= passingThreshold)
					coStats[co as keyof typeof coStats].abovePass++;
				// Use configured CO threshold for 3-point scale attainment
				if (roundedPercentage >= coThreshold)
					coStats[co as keyof typeof coStats].aboveCOThreshold++;
			});
		});

		const presentStudents = totalStudents - absentees;
		return { totalStudents, absentees, presentStudents, coStats };
	};

	const attainmentData =
		studentsData.length > 0 ? calculateCOAttainment() : null;

	// Calculate total max marks per CO across all tests (for NA detection)
	const coMaxMarks: Record<string, number> = Object.values(maxMarks).reduce(
		(totals, testMarks) => ({
			CO1: (totals.CO1 || 0) + (testMarks.CO1 || 0),
			CO2: (totals.CO2 || 0) + (testMarks.CO2 || 0),
			CO3: (totals.CO3 || 0) + (testMarks.CO3 || 0),
			CO4: (totals.CO4 || 0) + (testMarks.CO4 || 0),
			CO5: (totals.CO5 || 0) + (testMarks.CO5 || 0),
			CO6: (totals.CO6 || 0) + (testMarks.CO6 || 0),
		}),
		{ CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
	);

	// Helper function wrappers
	// Calculate zero level threshold as lowest attainment threshold
	const zeroLevelThreshold = Math.min(
		...attainmentThresholds.map((t) => t.percentage),
	);

	const getLevel = useCallback(
		(percentage: number) => {
			const sorted = [...attainmentThresholds].sort(
				(a, b) => b.percentage - a.percentage,
			);
			for (let i = 0; i < sorted.length; i++) {
				if (percentage >= sorted[i].percentage) {
					return sorted.length - i;
				}
			}
			return 0;
		},
		[attainmentThresholds],
	);

	const getLevelColorFn = (level: number) =>
		getLevelColor(level, attainmentThresholds.length);

	const getPercentageColorFn = (percentage: number) =>
		getPercentageColor(percentage, getLevel, attainmentThresholds.length);

	const attainmentCriteria = getAttainmentCriteria(
		attainmentThresholds,
		zeroLevelThreshold,
	);

	// Export handler for attainment Excel
	const handleExportAttainment = async () => {
		try {
			// Transform studentsData to match export format
			const exportStudentsData = studentsData.map((student, index) => {
				// Convert test marks to proper COMarks format
				const assessmentMarks: {
					[key: string]: {
						CO1: number;
						CO2: number;
						CO3: number;
						CO4: number;
						CO5: number;
						CO6: number;
					};
				} = {};
				Object.entries(student.tests).forEach(([testName, marks]) => {
					assessmentMarks[testName] = {
						CO1: marks.CO1 || 0,
						CO2: marks.CO2 || 0,
						CO3: marks.CO3 || 0,
						CO4: marks.CO4 || 0,
						CO5: marks.CO5 || 0,
						CO6: marks.CO6 || 0,
					};
				});

				return {
					sNo: index + 1,
					rollNo: student.rollNo,
					name: student.name,
					absentee: student.absentee,
					assessmentMarks,
					coTotals: {
						CO1: student.coTotals.CO1,
						CO2: student.coTotals.CO2,
						CO3: student.coTotals.CO3,
						CO4: student.coTotals.CO4,
						CO5: student.coTotals.CO5,
						CO6: student.coTotals.CO6,
						total: student.total,
					},
				};
			});

			// Transform maxMarks to assessment format
			const exportAssessments = Object.entries(maxMarks).map(
				([name, marks]) => ({
					name,
					maxMarks: marks.total,
					coMaxMarks: {
						CO1: marks.CO1,
						CO2: marks.CO2,
						CO3: marks.CO3,
						CO4: marks.CO4,
						CO5: marks.CO5,
						CO6: marks.CO6,
					},
				}),
			);

			await exportAttainmentExcel({
				attainmentThresholds,
				coThreshold,
				passingThreshold,
				courseCode,
				facultyName,
				branch: departmentName,
				programme: "B. Tech",
				year: year.toString(),
				semester: semester,
				courseName,
				session: `${new Date().getFullYear()}-${(
					new Date().getFullYear() + 1
				)
					.toString()
					.slice(-2)}`,
				studentsData: exportStudentsData,
				assessments: exportAssessments,
				copoMatrix: copoMatrix,
			});
			toast.success("Attainment Excel downloaded");
		} catch (error) {
			console.error("Export failed:", error);
			toast.error("Failed to export Excel");
		}
	};

	// Replace calculatePOAttainment function with a useMemo that computes all data at once
	const poComputations = useMemo(() => {
		if (!attainmentData) return null;
		debugLogger.debug("COPO", "Starting calculation for tables", {
			presentStudents: attainmentData.presentStudents,
			thresholds: attainmentThresholds,
		});

		const cos = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
		const pos = [
			"PO1",
			"PO2",
			"PO3",
			"PO4",
			"PO5",
			"PO6",
			"PO7",
			"PO8",
			"PO9",
			"PO10",
			"PO11",
			"PO12",
			"PSO1",
			"PSO2",
			"PSO3",
		];
		const attainmentPointsScale = attainmentThresholds.length;

		const data3Point = {
			rows: [] as { co: string; values: Record<string, number | null> }[],
			averages: {} as Record<string, number | null>,
			overall: 0,
		};

		const dataPercentage = {
			rows: [] as { co: string; values: Record<string, number | null> }[],
			sums: {} as Record<string, number>,
			weightSums: {} as Record<string, number>,
			averages: {} as Record<string, number | null>,
			overall: 0,
		};

		const coLevels: Record<string, number> = {};
		const coPercentages: Record<string, number> = {};

		cos.forEach((co) => {
			let thresholdPercentage = 0;
			if (attainmentData.presentStudents > 0) {
				thresholdPercentage =
					(attainmentData.coStats[
						co as keyof typeof attainmentData.coStats
					].aboveCOThreshold /
						attainmentData.presentStudents) *
					100;
			}
			thresholdPercentage = Math.round(thresholdPercentage * 100) / 100; // Match precise Excel display rounding for calculation

			// Calculate "Norm" (Class Average of Student CO Percentages) for the Percentage Scale
			let sumPercentage = 0;
			let present = 0;
			studentsData.forEach((s) => {
				if (s.absentee !== "AB" && s.absentee !== "UR") {
					sumPercentage +=
						(s.coTotals[co as keyof typeof s.coTotals] as number) ||
						0;
					present++;
				}
			});
			const classAveragePercentage =
				present > 0
					? Math.round((sumPercentage / present) * 100) / 100
					: 0;

			coPercentages[co] = classAveragePercentage;
			coLevels[co] = getLevel(thresholdPercentage);
		});

		const mappedPOCount3Point: Record<string, number> = {};
		const sumPO3Point: Record<string, number> = {};

		cos.forEach((co) => {
			const row3Point = {
				co,
				values: {} as Record<string, number | null>,
			};
			const rowPercentage = {
				co,
				values: {} as Record<string, number | null>,
			};

			const coLevel = coLevels[co];
			const coPercentage = coPercentages[co];

			pos.forEach((po) => {
				const poMapping =
					copoMatrix[co as keyof COPOMatrixState]?.[
						po as keyof typeof copoMatrix.CO1
					] || 0;
				if (poMapping > 0) {
					// 3 Point Scale
					const val3Point =
						(coLevel * poMapping) / attainmentPointsScale;
					row3Point.values[po] = val3Point;

					mappedPOCount3Point[po] =
						(mappedPOCount3Point[po] || 0) + 1;
					sumPO3Point[po] = (sumPO3Point[po] || 0) + val3Point;

					// Percentage Scale
					const valPercentage = coPercentage * poMapping;
					rowPercentage.values[po] = valPercentage;

					dataPercentage.sums[po] =
						(dataPercentage.sums[po] || 0) + valPercentage;
					dataPercentage.weightSums[po] =
						(dataPercentage.weightSums[po] || 0) + poMapping;
				} else {
					row3Point.values[po] = null;
					rowPercentage.values[po] = null;
				}
			});

			data3Point.rows.push(row3Point);
			dataPercentage.rows.push(rowPercentage);
		});

		let overall3PointSum = 0;
		let overall3PointCount = 0;
		let overallPercentageSum = 0;
		let overallPercentageCount = 0;

		pos.forEach((po) => {
			if (mappedPOCount3Point[po] > 0) {
				const avg = sumPO3Point[po] / mappedPOCount3Point[po];
				data3Point.averages[po] = avg;
				if (avg > 0) {
					// Discard 0 values in 3 point scale overalls like in Excel
					overall3PointSum += avg;
					overall3PointCount++;
				}
			} else {
				data3Point.averages[po] = null;
			}

			if (dataPercentage.weightSums[po] > 0) {
				const avg =
					dataPercentage.sums[po] / dataPercentage.weightSums[po];
				dataPercentage.averages[po] = avg;
				overallPercentageSum += avg;
				overallPercentageCount++;
			} else {
				dataPercentage.averages[po] = null;
			}
		});

		data3Point.overall =
			overall3PointCount > 0 ? overall3PointSum / overall3PointCount : 0;
		dataPercentage.overall =
			overallPercentageCount > 0
				? overallPercentageSum / overallPercentageCount
				: 0;

		debugLogger.info("COPO", "Calculations completed", {
			overall3Point: data3Point.overall,
			overallPercentage: dataPercentage.overall,
		});

		return {
			data3Point,
			dataPercentage,
		};
	}, [
		attainmentData,
		attainmentThresholds.length,
		copoMatrix,
		getLevel,
		studentsData,
	]);

	const calculatePOAttainment = (po: string): number => {
		if (!poComputations) return 0;
		return poComputations.data3Point.averages[po] || 0;
	};

	return (
		<MatrixView
			courseCode={courseCode}
			courseName={courseName}
			facultyName={facultyName}
			departmentName={departmentName}
			year={year}
			semester={semester}
			readOnly={readOnly}
			saving={saving}
			showSettings={showSettings}
			setShowSettings={setShowSettings}
			coThreshold={coThreshold}
			setCoThreshold={setCoThreshold}
			passingThreshold={passingThreshold}
			setPassingThreshold={setPassingThreshold}
			attainmentThresholds={attainmentThresholds}
			addThreshold={addThreshold}
			updateThreshold={updateThreshold}
			removeThreshold={removeThreshold}
			saveSettings={saveSettings}
			attainmentCriteria={attainmentCriteria}
			getLevelColorFn={getLevelColorFn}
			studentsData={studentsData}
			maxMarks={maxMarks}
			loading={loading}
			getPercentageColorFn={getPercentageColorFn}
			coMaxMarks={coMaxMarks}
			attainmentData={attainmentData}
			getLevel={getLevel}
			copoMatrix={copoMatrix}
			updateCOPOMapping={updateCOPOMapping}
			calculatePOAttainment={calculatePOAttainment}
			poComputations={poComputations}
			handleCSVDataParsed={handleCSVDataParsed}
			saveMatrix={saveMatrix}
			handleExportAttainment={handleExportAttainment}
		/>
	);
}
