import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { debugLogger } from "@/lib/debugLogger";
import type {
	StudentMarks,
	AttainmentThreshold,
	COPOMatrixState,
} from "./types";
import {
	calculateCOAttainment,
	calculateCOMaxMarks,
	calculatePOComputations,
} from "./computations";
import { getAttainmentCriteria } from "./utils";
import { exportAttainmentExcel } from "@/lib/excel/attainmentExcel";

export interface UseCOPOMappingDataProps {
	courseId: number;
	courseCode: string;
	facultyName: string;
	departmentName: string;
	year: string | number;
	semester: string | number;
	courseName: string;
}

export function useCOPOMappingData({
	courseId,
	courseCode,
	facultyName,
	departmentName,
	year,
	semester,
	courseName,
}: UseCOPOMappingDataProps) {
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

			setCoThreshold(config.co_threshold);
			setPassingThreshold(config.passing_threshold);

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

			const allMarksPromises = testsData.map((test) =>
				apiService
					.getTestMarks(test.id)
					.then((data) => ({ test, marksData: data }))
					.catch((error) => {
						console.error(`Failed to fetch marks for test ${test.id}:`, error);
						return { test, marksData: null };
					}),
			);

			const allMarksResults = await Promise.all(allMarksPromises);

			const studentMap = new Map<string, StudentMarks>();
			const maxMarksMap: typeof maxMarks = {};

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

			// Parallelize assessment loading
			const assessmentPromises = testsData.map((test) =>
				apiService
					.getAssessment(test.id)
					.then((assessmentData) => ({ test, questions: assessmentData.questions }))
					.catch((error) => {
						console.error(`Failed to load questions for test ${test.name}:`, error);
						return { test, questions: [] };
					}),
			);

			const assessmentResults = await Promise.all(assessmentPromises);

			assessmentResults.forEach(({ test, questions }) => {
				questions.forEach((q) => {
					const coKey =
						`CO${q.co}` as keyof (typeof maxMarksMap)[string];
					if (maxMarksMap[test.name][coKey] !== undefined) {
						maxMarksMap[test.name][coKey] += q.max_marks;
					}
				});
			});

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
			const mappings: Array<{ co: string; po: string; value: number }> =
				[];

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleCSVDataParsed = (data: any[]) => {
		const newMatrix = JSON.parse(JSON.stringify(copoMatrix));
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
				offering_id: courseId,
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

	const updateCOPOMapping = (co: string, po: string, value: number) => {
		setCopoMatrix((prev) => ({
			...prev,
			[co]: {
				...prev[co],
				[po]: Math.max(0, Math.min(value, attainmentThresholds.length)),
			},
		}));
	};

	const zeroLevelThreshold = Math.min(
		...attainmentThresholds.map((t) => t.percentage),
	);

	const getLevel = useCallback(
		(percentage: number) => {
			const sorted = [...attainmentThresholds].sort(
				(a, b) => b.percentage - a.percentage,
			);
			if (sorted.length === 0) return 0;
			if (percentage >= sorted[0].percentage) return sorted.length;

			for (let i = 1; i < sorted.length; i++) {
				if (percentage >= sorted[i].percentage) {
					const baseLevel = sorted.length - i;
					const basePct = sorted[i].percentage;
					const nextPct = sorted[i - 1].percentage;
					const diff = nextPct - basePct;
					if (diff === 0) return baseLevel;
					return baseLevel + (percentage - basePct) / diff;
				}
			}
			return 0;
		},
		[attainmentThresholds],
	);

	const attainmentData = useMemo(() => {
		return studentsData.length > 0
			? calculateCOAttainment(studentsData, passingThreshold, coThreshold)
			: null;
	}, [studentsData, passingThreshold, coThreshold]);

	const coMaxMarks = useMemo(() => {
		return calculateCOMaxMarks(maxMarks);
	}, [maxMarks]);

	const attainmentCriteria = useMemo(() => {
		return getAttainmentCriteria(attainmentThresholds, zeroLevelThreshold);
	}, [attainmentThresholds, zeroLevelThreshold]);

	const handleExportAttainment = async (headerOverrides?: {
		programme?: string;
		year?: string;
		semester?: string;
		session?: string;
	}) => {
		try {
			const exportStudentsData = studentsData.map((student, index) => {
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
				programme: headerOverrides?.programme || "B. Tech",
				year: headerOverrides?.year || String(year),
				semester: headerOverrides?.semester || String(semester),
				courseName,
				session: headerOverrides?.session || String(year),
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

	const poComputations = useMemo(() => {
		if (!attainmentData) return null;
		debugLogger.debug("COPO", "Starting calculation for tables", {
			presentStudents: attainmentData.presentStudents,
			thresholds: attainmentThresholds,
		});

		const result = calculatePOComputations(
			attainmentData,
			studentsData,
			attainmentThresholds,
			copoMatrix,
			getLevel,
		);

		debugLogger.info("COPO", "Calculations completed", {
			overall3Point: result.data3Point.overall,
			overallPercentage: result.dataPercentage.overall,
		});

		return result;
	}, [
		attainmentData,
		attainmentThresholds,
		copoMatrix,
		getLevel,
		studentsData,
	]);

	const calculatePOAttainment = useCallback(
		(po: string): number => {
			if (!poComputations) return 0;
			return poComputations.data3Point.averages[po] || 0;
		},
		[poComputations],
	);

	return {
		loading,
		studentsData,
		maxMarks,
		showSettings,
		setShowSettings,
		attainmentThresholds,
		coThreshold,
		setCoThreshold,
		passingThreshold,
		setPassingThreshold,
		copoMatrix,
		saving,
		saveMatrix,
		handleCSVDataParsed,
		addThreshold,
		updateThreshold,
		removeThreshold,
		saveSettings,
		updateCOPOMapping,
		getLevel,
		attainmentData,
		coMaxMarks,
		attainmentCriteria,
		handleExportAttainment,
		poComputations,
		calculatePOAttainment,
	};
}
