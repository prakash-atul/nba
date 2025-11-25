import type ExcelJS from "exceljs";
import type { StudentMarksData } from "./types";

interface COStats {
	above70: number;
	abovePass: number;
}

interface AttainmentCalculation {
	totalStudents: number;
	absentees: number;
	presentStudents: number;
	coStats: {
		CO1: COStats;
		CO2: COStats;
		CO3: COStats;
		CO4: COStats;
		CO5: COStats;
		CO6: COStats;
	};
}

interface AttainmentThreshold {
	id: number;
	percentage: number;
}

/**
 * Calculate CO attainment statistics from student data
 */
function calculateCOAttainment(
	studentsData: StudentMarksData[],
	passingThreshold: number,
	coThreshold: number
): AttainmentCalculation {
	const totalStudents = studentsData.length;
	let absentees = 0;

	const coStats = {
		CO1: { above70: 0, abovePass: 0 },
		CO2: { above70: 0, abovePass: 0 },
		CO3: { above70: 0, abovePass: 0 },
		CO4: { above70: 0, abovePass: 0 },
		CO5: { above70: 0, abovePass: 0 },
		CO6: { above70: 0, abovePass: 0 },
	};

	studentsData.forEach((student) => {
		if (student.absentee === "AB" || student.absentee === "UR") {
			absentees++;
			return;
		}

		(["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const).forEach((co) => {
			const percentage = student.coTotals[co];
			if (percentage >= coThreshold) coStats[co].above70++;
			if (percentage >= passingThreshold) coStats[co].abovePass++;
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
	const sortedThresholds = [...thresholds].sort(
		(a, b) => b.percentage - a.percentage
	);

	for (let i = 0; i < sortedThresholds.length; i++) {
		if (percentage >= sortedThresholds[i].percentage) {
			return sortedThresholds.length - i;
		}
	}

	return 0;
}

/**
 * Get background color based on percentage
 */
function getPercentageColor(
	percentage: number,
	thresholds: AttainmentThreshold[]
): string {
	const level = getAttainmentLevel(percentage, thresholds);
	const maxLevel = thresholds.length;

	if (level === maxLevel) return "FFAAFFAA"; // Light green
	if (level === maxLevel - 1) return "FFFFFFAA"; // Light yellow
	if (level === maxLevel - 2) return "FFFFCCAA"; // Light orange
	return "FFFFAAAA"; // Light red
}

/**
 * Create CO Attainment in x.0 Point Scale table
 */
export function createCOAttainmentPointScaleTable(
	ws: ExcelJS.Worksheet,
	startRow: number,
	studentsData: StudentMarksData[],
	passingThreshold: number,
	coThreshold: number,
	attainmentThresholds: AttainmentThreshold[]
): number {
	const attainment = calculateCOAttainment(
		studentsData,
		passingThreshold,
		coThreshold
	);
	const coList = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];

	let currentRow = startRow;

	// Title row
	const titleCell = ws.getCell(currentRow, 1);
	titleCell.value = "CO ATTAINMENT in 3.0 POINT Scale";
	titleCell.font = { bold: true, size: 14 };
	titleCell.alignment = { horizontal: "center", vertical: "middle" };
	titleCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFC0CB" }, // Pink
	};
	ws.mergeCells(currentRow, 1, currentRow, 10);
	currentRow++;

	// Header row 1
	const header1Cell = ws.getCell(currentRow, 1);
	header1Cell.value = "ATTAINMENT TABLE";
	header1Cell.font = { bold: true };
	header1Cell.alignment = { horizontal: "center", vertical: "middle" };
	header1Cell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" }, // Yellow
	};
	header1Cell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);

	const header1Span = ws.getCell(currentRow, 5);
	header1Span.value = "CO1 to CO6";
	header1Span.font = { bold: true };
	header1Span.alignment = { horizontal: "center", vertical: "middle" };
	header1Span.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFADD8E6" }, // Light blue
	};
	header1Span.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 5, currentRow, 10);
	currentRow++;

	// Header row 2 - CO columns
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value = co;
		cell.font = { bold: true };
		cell.alignment = { horizontal: "center", vertical: "middle" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFD3D3D3" }, // Light gray
		};
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 1: ABSENTEE+NOT ATTEMPT
	const absenteeCell = ws.getCell(currentRow, 1);
	absenteeCell.value = "ABSENTEE+NOT ATTEMPT";
	absenteeCell.font = { bold: true };
	absenteeCell.alignment = { horizontal: "left", vertical: "middle" };
	absenteeCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((_, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value = attainment.absentees;
		cell.alignment = { horizontal: "center" };
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 2: PRESENT STUDENT OR ATTEMPT
	const presentCell = ws.getCell(currentRow, 1);
	presentCell.value = "PRESENT STUDENT OR ATTEMPT";
	presentCell.font = { bold: true };
	presentCell.alignment = { horizontal: "left", vertical: "middle" };
	presentCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((_, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value = attainment.presentStudents;
		cell.alignment = { horizontal: "center" };
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 3: NO. OF STUDENTS SECURE MARKS > THRESHOLD % FOR CO ATTAINMENT
	const thresholdCountCell = ws.getCell(currentRow, 1);
	thresholdCountCell.value =
		"NO. OF STUDENTS SECURE MARKS > THRESHOLD % FOR CO ATTAINMENT";
	thresholdCountCell.font = { bold: true };
	thresholdCountCell.alignment = { horizontal: "left", vertical: "middle" };
	thresholdCountCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value =
			attainment.coStats[co as keyof typeof attainment.coStats].above70;
		cell.alignment = { horizontal: "center" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF404040" }, // Dark gray
		};
		cell.font = { color: { argb: "FFFFFFFF" } }; // White text
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 4: PC. OF STUDENTS SECURE MARKS > THRESHOLD % FOR CO ATTAINMENT
	const thresholdPctCell = ws.getCell(currentRow, 1);
	thresholdPctCell.value =
		"PC. OF STUDENTS SECURE MARKS > THRESHOLD % FOR CO ATTAINMENT";
	thresholdPctCell.font = { bold: true };
	thresholdPctCell.alignment = { horizontal: "left", vertical: "middle" };
	thresholdPctCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		const percentage =
			attainment.presentStudents > 0
				? (attainment.coStats[co as keyof typeof attainment.coStats]
						.above70 /
						attainment.presentStudents) *
				  100
				: 0;
		cell.value = Number(percentage.toFixed(2));
		cell.alignment = { horizontal: "center" };
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 5: CO Attainment Level (Based on Criteria)
	const attainmentLevelCell = ws.getCell(currentRow, 1);
	attainmentLevelCell.value = "CO Attainment Level (Based on Criteria)";
	attainmentLevelCell.font = { bold: true };
	attainmentLevelCell.alignment = { horizontal: "left", vertical: "middle" };
	attainmentLevelCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		const percentage =
			attainment.presentStudents > 0
				? (attainment.coStats[co as keyof typeof attainment.coStats]
						.above70 /
						attainment.presentStudents) *
				  100
				: 0;
		const level = getAttainmentLevel(percentage, attainmentThresholds);
		cell.value = Number(level.toFixed(2));
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: {
				argb: getPercentageColor(percentage, attainmentThresholds),
			},
		};
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 6: Final attainment level CO (by Direct Assessment)
	const finalDirectCell = ws.getCell(currentRow, 1);
	finalDirectCell.value = "Final attainment level CO (by Direct Assessment):";
	finalDirectCell.font = { bold: true };
	finalDirectCell.alignment = { horizontal: "left", vertical: "middle" };
	finalDirectCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFA500" }, // Orange
	};
	finalDirectCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		const percentage =
			attainment.presentStudents > 0
				? (attainment.coStats[co as keyof typeof attainment.coStats]
						.above70 /
						attainment.presentStudents) *
				  100
				: 0;
		const level = getAttainmentLevel(percentage, attainmentThresholds);
		cell.value = level;
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: {
				argb: getPercentageColor(percentage, attainmentThresholds),
			},
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

/**
 * Create CO Attainment in Absolute Scale table
 */
export function createCOAttainmentAbsoluteScaleTable(
	ws: ExcelJS.Worksheet,
	startRow: number,
	studentsData: StudentMarksData[],
	passingThreshold: number,
	coThreshold: number,
	attainmentThresholds: AttainmentThreshold[]
): number {
	const attainment = calculateCOAttainment(
		studentsData,
		passingThreshold,
		coThreshold
	);
	const coList = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];

	let currentRow = startRow;

	// Title row
	const titleCell = ws.getCell(currentRow, 1);
	titleCell.value = "CO ATTAINMENT in ABSOLUTE Scale";
	titleCell.font = { bold: true, size: 14 };
	titleCell.alignment = { horizontal: "center", vertical: "middle" };
	titleCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFC0CB" }, // Pink
	};
	ws.mergeCells(currentRow, 1, currentRow, 10);
	currentRow++;

	// Header row 1
	const header1Cell = ws.getCell(currentRow, 1);
	header1Cell.value = "ATTAINMENT TABLE";
	header1Cell.font = { bold: true };
	header1Cell.alignment = { horizontal: "center", vertical: "middle" };
	header1Cell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" }, // Yellow
	};
	header1Cell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);

	const header1Span = ws.getCell(currentRow, 5);
	header1Span.value = "CO1 to CO6";
	header1Span.font = { bold: true };
	header1Span.alignment = { horizontal: "center", vertical: "middle" };
	header1Span.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFADD8E6" }, // Light blue
	};
	header1Span.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 5, currentRow, 10);
	currentRow++;

	// Header row 2 - CO columns
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value = co;
		cell.font = { bold: true };
		cell.alignment = { horizontal: "center", vertical: "middle" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFD3D3D3" }, // Light gray
		};
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 1: ABSENTEE+NOT ATTEMPT
	const absenteeCell = ws.getCell(currentRow, 1);
	absenteeCell.value = "ABSENTEE+NOT ATTEMPT";
	absenteeCell.font = { bold: true };
	absenteeCell.alignment = { horizontal: "left", vertical: "middle" };
	absenteeCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((_, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value = attainment.absentees;
		cell.alignment = { horizontal: "center" };
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 2: PRESENT STUDENT OR ATTEMPT
	const presentCell = ws.getCell(currentRow, 1);
	presentCell.value = "PRESENT STUDENT OR ATTEMPT";
	presentCell.font = { bold: true };
	presentCell.alignment = { horizontal: "left", vertical: "middle" };
	presentCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((_, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value = attainment.presentStudents;
		cell.alignment = { horizontal: "center" };
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 3: NO. OF STUDENTS SECURE MARKS > PASSING MARKS
	const passingCountCell = ws.getCell(currentRow, 1);
	passingCountCell.value = "NO. OF STUDENTS SECURE MARKS > PASSING MARKS";
	passingCountCell.font = { bold: true };
	passingCountCell.alignment = { horizontal: "left", vertical: "middle" };
	passingCountCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		cell.value =
			attainment.coStats[co as keyof typeof attainment.coStats].abovePass;
		cell.alignment = { horizontal: "center" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF505050" }, // Dark gray
		};
		cell.font = { color: { argb: "FFFFFFFF" } }; // White text
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 4: PC. OF STUDENTS SECURE MARKS > PASSING MARKS
	const passingPctCell = ws.getCell(currentRow, 1);
	passingPctCell.value = "PC. OF STUDENTS SECURE MARKS > PASSING MARKS";
	passingPctCell.font = { bold: true };
	passingPctCell.alignment = { horizontal: "left", vertical: "middle" };
	passingPctCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		const percentage =
			attainment.presentStudents > 0
				? (attainment.coStats[co as keyof typeof attainment.coStats]
						.abovePass /
						attainment.presentStudents) *
				  100
				: 0;
		cell.value = Number(percentage.toFixed(2));
		cell.alignment = { horizontal: "center" };
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 5: CO Attainment (AVERAGE OF PERCENTAGE ATTAINMENTS)
	const avgAttainmentCell = ws.getCell(currentRow, 1);
	avgAttainmentCell.value =
		"CO Attainment (AVERAGE OF PERCENTAGE ATTAINMENTS)";
	avgAttainmentCell.font = { bold: true };
	avgAttainmentCell.alignment = { horizontal: "left", vertical: "middle" };
	avgAttainmentCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		const percentage =
			attainment.presentStudents > 0
				? (attainment.coStats[co as keyof typeof attainment.coStats]
						.abovePass /
						attainment.presentStudents) *
				  100
				: 0;
		cell.value = Number(percentage.toFixed(2));
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: {
				argb: getPercentageColor(percentage, attainmentThresholds),
			},
		};
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 6: Final attainment level CO (IN ABSOLUTE SCALE)
	const finalAbsoluteCell = ws.getCell(currentRow, 1);
	finalAbsoluteCell.value = "Final attainment level CO (IN ABSOLUTE SCALE):";
	finalAbsoluteCell.font = { bold: true };
	finalAbsoluteCell.alignment = { horizontal: "left", vertical: "middle" };
	finalAbsoluteCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFA500" }, // Orange
	};
	finalAbsoluteCell.border = {
		top: { style: "thin" },
		left: { style: "thin" },
		bottom: { style: "thin" },
		right: { style: "thin" },
	};
	ws.mergeCells(currentRow, 1, currentRow, 4);
	coList.forEach((co, idx) => {
		const cell = ws.getCell(currentRow, idx + 5);
		const percentage =
			attainment.presentStudents > 0
				? (attainment.coStats[co as keyof typeof attainment.coStats]
						.abovePass /
						attainment.presentStudents) *
				  100
				: 0;
		cell.value = Number(percentage.toFixed(2));
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: {
				argb: getPercentageColor(percentage, attainmentThresholds),
			},
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
