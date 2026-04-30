import type ExcelJS from "exceljs";
import type { StudentMarksData, COMarks } from "./types";

interface AttainmentThreshold {
	id: number;
	percentage: number;
}

interface COPOMatrix {
	[co: string]: {
		[po: string]: number;
	};
}

interface AttainmentCalculation {
	totalStudents: number;
	absentees: number;
	presentStudents: number;
	coStats: {
		CO1: { abovePass: number };
		CO2: { abovePass: number };
		CO3: { abovePass: number };
		CO4: { abovePass: number };
		CO5: { abovePass: number };
		CO6: { abovePass: number };
	};
}

/**
 * Check if a CO is assessed (has total max marks > 0)
 */
function isCOAssessed(co: string, coMaxMarks?: COMarks): boolean {
	if (!coMaxMarks) return true; // Default to assessed if no data provided
	return (coMaxMarks[co as keyof COMarks] || 0) > 0;
}

/**
 * Calculate CO attainment statistics from student data
 */
function calculateCOAttainment(
	studentsData: StudentMarksData[],
	coThreshold: number
): AttainmentCalculation {
	const totalStudents = studentsData.length;
	let absentees = 0;

	const coStats = {
		CO1: { abovePass: 0 },
		CO2: { abovePass: 0 },
		CO3: { abovePass: 0 },
		CO4: { abovePass: 0 },
		CO5: { abovePass: 0 },
		CO6: { abovePass: 0 },
	};

	studentsData.forEach((student) => {
		if (student.absentee === "AB" || student.absentee === "UR") {
			absentees++;
			return;
		}

		(["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const).forEach((co) => {
			const percentage = student.coTotals[co];
			if (percentage >= coThreshold) coStats[co].abovePass++;
		});
	});

	const presentStudents = totalStudents - absentees;
	return { totalStudents, absentees, presentStudents, coStats };
}

/**
 * Get attainment level based on percentage and thresholds
 */
function getAttainmentLevel(
	percentage: number,
	thresholds: AttainmentThreshold[]
): number {
	const sorted = [...thresholds].sort(
		(a, b) => b.percentage - a.percentage
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
}

/**
 * Calculate PO/PSO attainment
 */
function calculatePOAttainment(
	po: string,
	copoMatrix: COPOMatrix,
	attainmentData: AttainmentCalculation,
	attainmentThresholds: AttainmentThreshold[],
	coMaxMarks?: COMarks
): number {
	const cos = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
	const attainmentPointsScale = attainmentThresholds.length;
	let sum = 0;
	let mappedCount = 0;

	cos.forEach((co) => {
		// Skip unassessed COs
		if (!isCOAssessed(co, coMaxMarks)) return;

		const percentage =
			attainmentData.presentStudents > 0
				? (attainmentData.coStats[
						co as keyof typeof attainmentData.coStats
				  ].abovePass /
						attainmentData.presentStudents) *
				  100
				: 0;

		const coLevel = getAttainmentLevel(percentage, attainmentThresholds);
		const poMapping = copoMatrix[co]?.[po] || 0;

		if (poMapping > 0) {
			sum += (coLevel * poMapping) / attainmentPointsScale;
			mappedCount++;
		}
	});

	return mappedCount > 0 ? sum / mappedCount : 0;
}

/**
 * Create CO-PO Mapping (3 Point Scale) table
 */
export function createCOPOMappingTable(
	ws: ExcelJS.Worksheet,
	startRow: number,
	studentsData: StudentMarksData[],
	coThreshold: number,
	attainmentThresholds: AttainmentThreshold[],
	copoMatrix: COPOMatrix,
	coMaxMarks?: COMarks
): number {
	const attainment = calculateCOAttainment(studentsData, coThreshold);
	const coList = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
	const poList = [
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

	let currentRow = startRow;

	// Title row
	const titleCell = ws.getCell(currentRow, 1);
	titleCell.value = `COMPUTATION BY MAPPED CO-PO (${attainmentThresholds.length} POINT SCALE)`;
	titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
	titleCell.alignment = { horizontal: "center", vertical: "middle" };
	titleCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF6B8E23" }, // Olive green
	};
	ws.mergeCells(currentRow, 1, currentRow, 16); // Span across all columns
	currentRow++;

	// Header row - PO/PSO columns
	const headerStartCol = 2; // Column B
	poList.forEach((po, idx) => {
		const cell = ws.getCell(currentRow, headerStartCol + idx);
		cell.value = po;
		cell.font = { bold: true };
		cell.alignment = { horizontal: "center", vertical: "middle" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFFFFFFF" }, // White
		};
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// CO rows
	coList.forEach((co) => {
		const assessed = isCOAssessed(co, coMaxMarks);

		// CO label in column A
		const coCell = ws.getCell(currentRow, 1);
		coCell.value = co;
		coCell.font = { bold: true };
		coCell.alignment = { horizontal: "center", vertical: "middle" };
		coCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: assessed ? "FFFFC000" : "FFD3D3D3" }, // Orange or gray for unassessed
		};
		coCell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};

		// Calculate CO attainment level (only if assessed)
		let coLevel = 0;
		if (assessed) {
			const percentage =
				attainment.presentStudents > 0
					? (attainment.coStats[co as keyof typeof attainment.coStats]
							.abovePass /
							attainment.presentStudents) *
					  100
					: 0;
			coLevel = getAttainmentLevel(percentage, attainmentThresholds);
		}

		// PO/PSO mapping values
		poList.forEach((po, idx) => {
			const cell = ws.getCell(currentRow, headerStartCol + idx);
			const mappingValue = copoMatrix[co]?.[po] || 0;
			const attainmentPointsScale = attainmentThresholds.length;

			if (!assessed) {
				// Show NA for unassessed COs
				cell.value = "NA";
				cell.font = { color: { argb: "FF808080" } };
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FFD3D3D3" }, // Light gray
				};
			} else {
				// Calculate the mapped value: (CO Level × Mapping) / Point Scale
				const computedValue =
					mappingValue > 0
						? (coLevel * mappingValue) / attainmentPointsScale
						: 0;

				cell.value =
					computedValue > 0 ? Number(computedValue.toFixed(2)) : "";

				// Apply conditional formatting - only show values if mapping exists
				if (mappingValue === 0) {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FFD3D3D3" }, // Light gray for empty cells
					};
				}
			}

			cell.alignment = { horizontal: "center", vertical: "middle" };
			cell.border = {
				top: { style: "thin" },
				left: { style: "thin" },
				bottom: { style: "thin" },
				right: { style: "thin" },
			};
		});

		currentRow++;
	});

	// AVG row
	const avgCell = ws.getCell(currentRow, 1);
	avgCell.value = "AVG";
	avgCell.font = { bold: true };
	avgCell.alignment = { horizontal: "center", vertical: "middle" };
	avgCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFC000" }, // Orange
	};
	avgCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};

	// Calculate average for each PO/PSO
	poList.forEach((po, idx) => {
		const cell = ws.getCell(currentRow, headerStartCol + idx);
		const poAttainment = calculatePOAttainment(
			po,
			copoMatrix,
			attainment,
			attainmentThresholds,
			coMaxMarks
		);

		cell.value = poAttainment > 0 ? Number(poAttainment.toFixed(2)) : "";
		cell.alignment = { horizontal: "center", vertical: "middle" };
		cell.font = { bold: true };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFFFC000" }, // Orange
		};
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	return currentRow; // Return next available row
}
