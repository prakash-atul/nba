import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { Settings, Upload, Save } from "lucide-react";
import { AttainmentSettingsPanel } from "./AttainmentSettingsPanel";
import { AttainmentCriteriaCard } from "./AttainmentCriteriaCard";
import { PassingMarksCard } from "./PassingMarksCard";
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
	getAttainmentLevel,
} from "./utils";

// Import the table components (to be created)
import { StudentMarksTable } from "./StudentMarksTable";
import { COAttainmentTable } from "./COAttainmentTable";
import { COPOMatrixTable } from "./COPOMatrixTable";

interface COPOMappingProps {
	courseCode: string;
	courseName: string;
	courseId: number;
	facultyName: string;
	departmentName: string;
	year: number;
	semester: number;
}

export function COPOMapping({
	courseCode,
	courseName,
	courseId,
	facultyName,
	departmentName,
	year,
	semester,
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load COPO data
	useEffect(() => {
		loadCOPOData();
		loadAttainmentConfig();
		loadMatrix();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [courseId]);

	const loadMatrix = async () => {
		try {
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
			console.error("Failed to load CO-PO matrix:", error);
		}
	};

	const loadAttainmentConfig = async () => {
		try {
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
					}))
				);
			}
		} catch (error) {
			console.error("Failed to load attainment configuration:", error);
			// Keep default values if loading fails
			toast.info("Using default attainment configuration");
		}
	};

	const loadCOPOData = async () => {
		try {
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
					.catch(() => ({ test, marksData: null }))
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
						test.id
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
						error
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
					(co) => coMaxTotals[co as keyof typeof coMaxTotals] > 0
				);
				const sumCO =
					nonZeroCOs.reduce(
						(sum, co) =>
							sum + student.coTotals[co as keyof typeof coTotals],
						0
					) / (nonZeroCOs.length || 1);

				student.coTotals.ΣCO = sumCO;
				student.total =
					totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
			});

			setMaxMarks(maxMarksMap);
			setStudentsData(Array.from(studentMap.values()));

			setLoading(false);
		} catch (error) {
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
			toast.error("CSV file contains no data rows");
			return;
		}

		// Parse header to find column indices
		const headers = lines[0].split(",").map((h) => h.trim().toUpperCase());
		const poMap: Record<string, number> = {};

		// Map headers to PO keys
		headers.forEach((header, index) => {
			if (header.startsWith("PO") || header.startsWith("PSO")) {
				poMap[header] = index;
			}
		});

		const newMatrix = JSON.parse(JSON.stringify(copoMatrix)); // Deep clone
		let updateCount = 0;

		lines.slice(1).forEach((line) => {
			const values = line.split(",").map((v) => v.trim());
			if (values.length === 0) return;

			// First column should be CO Name (CO1, CO2 etc)
			const coName = values[0].toUpperCase();
			if (newMatrix[coName]) {
				// Iterate through found PO columns
				Object.entries(poMap).forEach(([po, index]) => {
					if (index < values.length) {
						const val = parseInt(values[index]) || 0;
						if (val >= 0 && val <= 3) {
							// @ts-ignore
							if (newMatrix[coName][po] !== undefined) {
								// @ts-ignore
								newMatrix[coName][po] = val;
								updateCount++;
							}
						}
					}
				});
			}
		});

		if (updateCount > 0) {
			setCopoMatrix(newMatrix);
			toast.success(
				`Imported metadata successfully (${updateCount} values updated). Click Save to persist.`
			);
		} else {
			toast.warning("No valid data found in CSV matching CO/PO structure.");
		}
	};

	// Threshold management functions
	const addThreshold = () => {
		const newId = Math.max(...attainmentThresholds.map((t) => t.id), 0) + 1;
		const lowestPercentage = Math.min(
			...attainmentThresholds.map((t) => t.percentage)
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
				t.id === id ? { ...t, percentage: value } : t
			)
		);
	};

	const removeThreshold = (id: number) => {
		if (attainmentThresholds.length <= 1) {
			toast.error("At least one threshold is required");
			return;
		}
		setAttainmentThresholds(
			attainmentThresholds.filter((t) => t.id !== id)
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
					: "Failed to save settings"
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
				if (percentage >= 70)
					coStats[co as keyof typeof coStats].above70++;
				if (percentage >= 60)
					coStats[co as keyof typeof coStats].above60++;
				if (percentage >= 50)
					coStats[co as keyof typeof coStats].above50++;
				if (percentage >= passingThreshold)
					coStats[co as keyof typeof coStats].abovePass++;
				// Use configured CO threshold for 3-point scale attainment
				if (percentage >= coThreshold)
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
		{ CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 }
	);

	// Helper function wrappers
	// Calculate zero level threshold as lowest attainment threshold
	const zeroLevelThreshold = Math.min(
		...attainmentThresholds.map((t) => t.percentage)
	);

	const getLevel = (percentage: number) =>
		getAttainmentLevel(
			percentage,
			attainmentThresholds,
			zeroLevelThreshold
		);

	const getLevelColorFn = (level: number) =>
		getLevelColor(level, attainmentThresholds.length);

	const getPercentageColorFn = (percentage: number) =>
		getPercentageColor(percentage, getLevel, attainmentThresholds.length);

	const attainmentCriteria = getAttainmentCriteria(
		attainmentThresholds,
		zeroLevelThreshold
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
				})
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
				semester: semester.toString(),
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

	// Calculate PO/PSO attainment
	const calculatePOAttainment = (po: string): number => {
		if (!attainmentData) return 0;

		const cos = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
		const attainmentPointsScale = attainmentThresholds.length;
		let sum = 0;
		let mappedCount = 0;

		cos.forEach((co) => {
			const percentage =
				attainmentData.presentStudents > 0
					? (attainmentData.coStats[
							co as keyof typeof attainmentData.coStats
					  ].aboveCOThreshold /
							attainmentData.presentStudents) *
					  100
					: 0;

			const coLevel = getLevel(percentage);
			const poMapping = copoMatrix[co]?.[po] || 0;

			if (poMapping > 0) {
				sum += (coLevel * poMapping) / attainmentPointsScale;
				mappedCount++;
			}
		});

		return mappedCount > 0 ? sum / mappedCount : 0;
	};

	return (
		<div className="space-y-6 pb-8">
			{/* Header Section */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
						CO-PO Mapping
					</h2>
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
						Course: {courseCode} - {courseName}
					</p>
				</div>
				<div className="flex items-center gap-2">
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
						className="gap-2"
					>
						<Upload className="h-4 w-4" />
						Import Matrix
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={saveMatrix}
						disabled={saving}
						className="gap-2"
					>
						<Save className="h-4 w-4" />
						{saving ? "Saving..." : "Save Matrix"}
					</Button>
					<Button
						onClick={() => setShowSettings(!showSettings)}
						variant="outline"
						size="sm"
						className="flex items-center gap-2"
					>
						<Settings className="h-4 w-4" />
						Attainment Settings
					</Button>
					<Button
						onClick={handleExportAttainment}
						variant="ghost"
						size="sm"
						className="flex items-center gap-2"
					>
						Export Attainment Excel
					</Button>
				</div>
			</div>

			{/* Settings Panel */}
			<AttainmentSettingsPanel
				showSettings={showSettings}
				coThreshold={coThreshold}
				setCoThreshold={setCoThreshold}
				passingThreshold={passingThreshold}
				setPassingThreshold={setPassingThreshold}
				attainmentThresholds={attainmentThresholds}
				addThreshold={addThreshold}
				updateThreshold={updateThreshold}
				removeThreshold={removeThreshold}
				saveSettings={saveSettings}
			/>

			{/* Attainment Criteria Card */}
			<AttainmentCriteriaCard
				attainmentCriteria={attainmentCriteria}
				getLevelColor={getLevelColorFn}
			/>

			{/* Passing Marks Card */}
			<PassingMarksCard
				coThreshold={coThreshold}
				passingThreshold={passingThreshold}
			/>

			{/* Student Marks Table */}
			<StudentMarksTable
				studentsData={studentsData}
				maxMarks={maxMarks}
				facultyName={facultyName}
				departmentName={departmentName}
				courseName={courseName}
				courseCode={courseCode}
				year={year}
				semester={semester}
				loading={loading}
				getPercentageColor={getPercentageColorFn}
				coMaxMarks={coMaxMarks}
			/>

			{/* CO Attainment Tables */}
			{attainmentData && (
				<COAttainmentTable
					attainmentData={attainmentData}
					getAttainmentLevel={getLevel}
					getPercentageColor={getPercentageColorFn}
					coThreshold={coThreshold}
					coMaxMarks={coMaxMarks}
				/>
			)}

			{/* CO-PO-PSO Matrix Table */}
			<COPOMatrixTable
				copoMatrix={copoMatrix}
				courseInfo={{
					university_name: "TEZPUR UNIVERSITY",
					faculty_name: facultyName,
					branch: departmentName,
					programme_name: "B. Tech",
					year: year.toString(),
					semester: semester.toString(),
					course_name: courseName,
					course_code: courseCode,
					session: `${new Date().getFullYear()}-${(
						new Date().getFullYear() + 1
					)
						.toString()
						.slice(-2)}`,
				}}
				updateCOPOMapping={updateCOPOMapping}
				calculatePOAttainment={calculatePOAttainment}
				getPercentageColor={getPercentageColorFn}
				attainmentData={attainmentData}
				getAttainmentLevel={getLevel}
				getLevelColor={getLevelColorFn}
				attainmentThresholds={attainmentThresholds}
				coMaxMarks={coMaxMarks}
			/>
		</div>
	);
}
