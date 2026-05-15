import type ExcelJS from "exceljs";
import type { StudentMarksData, COMarks } from "./types";

interface COStats {
	above70: number;
	abovePass: number;
	sumPercentage: number;
	averagePercentage: number;
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
	passingThreshold: number,
	coThreshold: number
): AttainmentCalculation {
	const totalStudents = studentsData.length;
	let absentees = 0;

	const coStats = {
		CO1: { above70: 0, abovePass: 0, sumPercentage: 0, averagePercentage: 0 },
		CO2: { above70: 0, abovePass: 0, sumPercentage: 0, averagePercentage: 0 },
		CO3: { above70: 0, abovePass: 0, sumPercentage: 0, averagePercentage: 0 },
		CO4: { above70: 0, abovePass: 0, sumPercentage: 0, averagePercentage: 0 },
		CO5: { above70: 0, abovePass: 0, sumPercentage: 0, averagePercentage: 0 },
		CO6: { above70: 0, abovePass: 0, sumPercentage: 0, averagePercentage: 0 },
	};

	studentsData.forEach((student) => {
		if (student.absentee === "AB" || student.absentee === "UR") {
			absentees++;
			return;
		}

		(["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const).forEach((co) => {
			const percentage = student.coTotals[co];
			const roundedPercentage = Math.round(percentage * 100) / 100;
			if (percentage >= coThreshold) coStats[co].above70++;
			if (percentage >= passingThreshold) coStats[co].abovePass++;
			coStats[co].sumPercentage += roundedPercentage;
		});
	});

	const presentStudents = totalStudents - absentees;
	
	// Calculate average percentage for each CO
	(["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const).forEach((co) => {
		if (presentStudents > 0) {
			coStats[co].averagePercentage = 
				Math.round((coStats[co].sumPercentage / presentStudents) * 100) / 100;
		}
	});
	
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
 * Get background color based on percentage
 */
function getPercentageColor(
	percentage: number,
	thresholds: AttainmentThreshold[]
): string {
	const level = getAttainmentLevel(percentage, thresholds);
	const maxLevel = thresholds.length;

	const flooredLevel = Math.floor(level);
	if (flooredLevel === maxLevel) return "FFAAFFAA"; // Light green
	if (flooredLevel === maxLevel - 1) return "FFFFFFAA"; // Light yellow
	if (flooredLevel === maxLevel - 2) return "FFFFCCAA"; // Light orange
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
	attainmentThresholds: AttainmentThreshold[],
	coMaxMarks?: COMarks
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
		const assessed = isCOAssessed(co, coMaxMarks);
		cell.value = assessed
			? attainment.coStats[co as keyof typeof attainment.coStats].above70
			: "NA";
		cell.alignment = { horizontal: "center" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: assessed ? "FF404040" : "FFD3D3D3" }, // Dark gray or light gray for NA
		};
		cell.font = { color: { argb: assessed ? "FFFFFFFF" : "FF808080" } }; // White or gray text
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
		const assessed = isCOAssessed(co, coMaxMarks);
		if (assessed) {
			const percentage =
				attainment.presentStudents > 0
					? (attainment.coStats[co as keyof typeof attainment.coStats]
							.above70 /
							attainment.presentStudents) *
					  100
					: 0;
			cell.value = Number(percentage.toFixed(2));
		} else {
			cell.value = "NA";
			cell.font = { color: { argb: "FF808080" } };
		}
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
		const assessed = isCOAssessed(co, coMaxMarks);
		if (assessed) {
			const percentage =
				attainment.presentStudents > 0
					? (attainment.coStats[co as keyof typeof attainment.coStats]
							.above70 /
							attainment.presentStudents) *
					  100
					: 0;
			const level = getAttainmentLevel(percentage, attainmentThresholds);
			cell.value = Number(level.toFixed(2));
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: {
					argb: getPercentageColor(percentage, attainmentThresholds),
				},
			};
		} else {
			cell.value = "NA";
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFD3D3D3" }, // Light gray for NA
			};
			cell.font = { bold: true, color: { argb: "FF808080" } };
		}
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
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
		const assessed = isCOAssessed(co, coMaxMarks);
		if (assessed) {
			const percentage =
				attainment.presentStudents > 0
					? (attainment.coStats[co as keyof typeof attainment.coStats]
							.above70 /
							attainment.presentStudents) *
					  100
					: 0;
			const level = getAttainmentLevel(percentage, attainmentThresholds);
			cell.value = level;
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: {
					argb: getPercentageColor(percentage, attainmentThresholds),
				},
			};
		} else {
			cell.value = "NA";
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFD3D3D3" }, // Light gray for NA
			};
			cell.font = { bold: true, color: { argb: "FF808080" } };
		}
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
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
	attainmentThresholds: AttainmentThreshold[],
	coMaxMarks?: COMarks
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
		const assessed = isCOAssessed(co, coMaxMarks);
		cell.value = assessed
			? attainment.coStats[co as keyof typeof attainment.coStats]
					.abovePass
			: "NA";
		cell.alignment = { horizontal: "center" };
		cell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: assessed ? "FF505050" : "FFD3D3D3" }, // Dark gray or light gray for NA
		};
		cell.font = { color: { argb: assessed ? "FFFFFFFF" : "FF808080" } }; // White or gray text
		cell.border = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
	});
	currentRow++;

	// Row 4: % of Students Above Passing Marks
	const passingPctCell = ws.getCell(currentRow, 1);
	passingPctCell.value = "% of Students Above Passing Marks";
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
		const assessed = isCOAssessed(co, coMaxMarks);
		if (assessed) {
			const percentage =
				attainment.presentStudents > 0
					? (attainment.coStats[co as keyof typeof attainment.coStats]
							.abovePass /
							attainment.presentStudents) *
					  100
					: 0;
			cell.value = Number(percentage.toFixed(2));
		} else {
			cell.value = "NA";
			cell.font = { color: { argb: "FF808080" } };
		}
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
		const assessed = isCOAssessed(co, coMaxMarks);
		if (assessed) {
			const percentage = attainment.coStats[co as keyof typeof attainment.coStats].averagePercentage || 0;
			cell.value = Number(percentage.toFixed(2));
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: {
					argb: getPercentageColor(percentage, attainmentThresholds),
				},
			};
		} else {
			cell.value = "NA";
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFD3D3D3" }, // Light gray for NA
			};
			cell.font = { bold: true, color: { argb: "FF808080" } };
		}
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
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
		const assessed = isCOAssessed(co, coMaxMarks);
		if (assessed) {
			const percentage = attainment.coStats[co as keyof typeof attainment.coStats].averagePercentage || 0;
			cell.value = Number(percentage.toFixed(2)) + "%";
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: {
					argb: getPercentageColor(percentage, attainmentThresholds),
				},
			};
		} else {
			cell.value = "NA";
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFD3D3D3" }, // Light gray for NA
			};
			cell.font = { bold: true, color: { argb: "FF808080" } };
		}
		cell.alignment = { horizontal: "center" };
		cell.font = { bold: true };
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
