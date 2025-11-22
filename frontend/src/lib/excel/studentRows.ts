import ExcelJS from "exceljs";
import type {
	StudentMarksData,
	AssessmentInfo,
	AssessmentColumn,
	COMarks,
} from "./types";

export function fillStudentData(
	ws: ExcelJS.Worksheet,
	startRow: number,
	studentsData: StudentMarksData[],
	assessments: AssessmentInfo[],
	assessmentColumns: AssessmentColumn[],
	totalStartCol: number,
	coStartCol: number,
	sigmaCoCol: number
) {
	// Determine which COs have questions
	const coHasQuestions = [false, false, false, false, false, false];
	for (let i = 0; i < 6; i++) {
		const coKey = `CO${i + 1}` as keyof COMarks;
		coHasQuestions[i] = assessments.some(
			(assessment) => assessment.coMaxMarks[coKey] > 0
		);
	}
	const activeCOCount = coHasQuestions.filter((hasQ) => hasQ).length;

	let currentRow = startRow;

	studentsData.forEach((student) => {
		// S.No.
		ws.getCell(currentRow, 1).value = student.sNo;
		ws.getCell(currentRow, 1).alignment = {
			horizontal: "center",
			vertical: "middle",
		};
		ws.getCell(currentRow, 1).border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		// Roll No
		ws.getCell(currentRow, 2).value = student.rollNo;
		ws.getCell(currentRow, 2).alignment = {
			horizontal: "center",
			vertical: "middle",
		};
		ws.getCell(currentRow, 2).border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		// Name
		ws.getCell(currentRow, 3).value = student.name.toUpperCase();
		ws.getCell(currentRow, 3).alignment = {
			horizontal: "left",
			vertical: "middle",
		};
		ws.getCell(currentRow, 3).border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		// Absentee
		ws.getCell(currentRow, 4).value = student.absentee || "";
		ws.getCell(currentRow, 4).alignment = {
			horizontal: "center",
			vertical: "middle",
		};
		ws.getCell(currentRow, 4).border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		// Assessment marks
		assessmentColumns.forEach(({ name, startCol }, idx) => {
			const assessment = assessments[idx];
			const marks = student.assessmentMarks[name] || {
				CO1: 0,
				CO2: 0,
				CO3: 0,
				CO4: 0,
				CO5: 0,
				CO6: 0,
			};
			for (let i = 0; i < 6; i++) {
				const coKey = `CO${i + 1}` as keyof COMarks;
				const markValue = marks[coKey] || 0;
				const cell = ws.getCell(currentRow, startCol + i);
				cell.value = assessment.coMaxMarks[coKey] > 0 ? markValue : "";
				cell.alignment = { horizontal: "center", vertical: "middle" };
				cell.border = {
					top: { style: "thin" },
					right: { style: "thin" },
					bottom: { style: "thin" },
					left: { style: "thin" },
				};
			}
		});

		// Grand total
		const grandTotal = student.coTotals.total;
		const grandTotalCell = ws.getCell(currentRow, totalStartCol);
		grandTotalCell.value = grandTotal.toFixed(2);
		grandTotalCell.alignment = { horizontal: "center", vertical: "middle" };
		grandTotalCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFFFFF00" },
		};
		grandTotalCell.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		// CO percentages
		let coPercentagesSum = 0;
		for (let i = 0; i < 6; i++) {
			const coKey = `CO${i + 1}` as keyof COMarks;
			const percentage = student.coTotals[coKey];
			if (coHasQuestions[i]) {
				coPercentagesSum += percentage;
			}
			const cell = ws.getCell(currentRow, coStartCol + i);
			cell.value = coHasQuestions[i] ? percentage.toFixed(2) : "";
			cell.alignment = { horizontal: "center", vertical: "middle" };

			if (coHasQuestions[i]) {
				if (percentage >= 70) {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FF90EE90" },
					};
				} else if (percentage >= 60) {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FFFFFF00" },
					};
				} else if (percentage >= 50) {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FFFFA500" },
					};
				} else {
					cell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FFFF6B6B" },
					};
				}
			}

			cell.border = {
				top: { style: "thin" },
				right: { style: "thin" },
				bottom: { style: "thin" },
				left: { style: "thin" },
			};
		}

		// ΣCO average percentage
		const sigmaCoAverage =
			activeCOCount > 0 ? coPercentagesSum / activeCOCount : 0;
		const sigmaCoCell = ws.getCell(currentRow, sigmaCoCol);
		sigmaCoCell.value = sigmaCoAverage.toFixed(2);
		sigmaCoCell.alignment = { horizontal: "center", vertical: "middle" };
		sigmaCoCell.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		currentRow++;
	});
}
