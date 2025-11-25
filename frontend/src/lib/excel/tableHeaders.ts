import ExcelJS from "exceljs";
import type { AssessmentInfo, AssessmentColumn, COMarks } from "./types";

export function createTableHeaders(
	ws: ExcelJS.Worksheet,
	tableStartRow: number,
	assessments: AssessmentInfo[]
): {
	assessmentColumns: AssessmentColumn[];
	totalStartCol: number;
	coStartCol: number;
	sigmaCoCol: number;
} {
	const headerRow1 = tableStartRow;

	// S.No column
	ws.mergeCells(headerRow1, 1, headerRow1 + 3, 1);
	const sNoHeader = ws.getCell(headerRow1, 1);
	sNoHeader.value = "S.No.";
	sNoHeader.alignment = {
		horizontal: "center",
		vertical: "middle",
		wrapText: true,
	};
	sNoHeader.font = { bold: true };
	sNoHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" },
	};
	sNoHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Roll No column
	ws.mergeCells(headerRow1, 2, headerRow1 + 3, 2);
	const rollNoHeader = ws.getCell(headerRow1, 2);
	rollNoHeader.value = "Roll No.";
	rollNoHeader.alignment = {
		horizontal: "center",
		vertical: "middle",
		wrapText: true,
	};
	rollNoHeader.font = { bold: true };
	rollNoHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" },
	};
	rollNoHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Name column
	ws.mergeCells(headerRow1, 3, headerRow1 + 2, 3);
	const nameHeader = ws.getCell(headerRow1, 3);
	nameHeader.value = "Name of Student";
	nameHeader.alignment = {
		horizontal: "center",
		vertical: "middle",
		wrapText: true,
	};
	nameHeader.font = { bold: true };
	nameHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Absentee column
	ws.mergeCells(headerRow1, 4, headerRow1 + 2, 4);
	const absenteeHeader = ws.getCell(headerRow1, 4);
	absenteeHeader.value = "ABSENTEE RECORD";
	absenteeHeader.alignment = {
		horizontal: "center",
		vertical: "middle",
		wrapText: true,
	};
	absenteeHeader.font = { bold: true };
	absenteeHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	let currentCol = 5;
	const assessmentColumns: AssessmentColumn[] = [];

	// Create assessment headers
	assessments.forEach((assessment) => {
		const assessmentStartCol = currentCol;
		const numCols = 6;
		const assessmentEndCol = currentCol + numCols - 1;

		ws.mergeCells(
			headerRow1,
			assessmentStartCol,
			headerRow1,
			assessmentEndCol
		);
		const assessmentCell = ws.getCell(headerRow1, assessmentStartCol);
		assessmentCell.value = assessment.name;
		assessmentCell.alignment = { horizontal: "center", vertical: "middle" };
		assessmentCell.font = { bold: true };
		assessmentCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFFFFF00" },
		};
		assessmentCell.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		assessmentColumns.push({
			name: assessment.name,
			startCol: assessmentStartCol,
			endCol: assessmentEndCol,
		});
		currentCol += numCols;
	});

	// TOTAL column
	const totalStartCol = currentCol;
	ws.mergeCells(headerRow1, totalStartCol, headerRow1 + 1, totalStartCol);
	const totalHeader = ws.getCell(headerRow1, totalStartCol);
	totalHeader.value = "TOTAL";
	totalHeader.alignment = { horizontal: "center", vertical: "middle" };
	totalHeader.font = { bold: true };
	totalHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF87CEEB" },
	};
	totalHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// CO columns
	const coStartCol = totalStartCol + 1;
	for (let i = 1; i <= 6; i++) {
		ws.mergeCells(
			headerRow1,
			coStartCol + i - 1,
			headerRow1 + 1,
			coStartCol + i - 1
		);
		const coHeader = ws.getCell(headerRow1, coStartCol + i - 1);
		coHeader.value = `CO${i}`;
		coHeader.alignment = { horizontal: "center", vertical: "middle" };
		coHeader.font = { bold: true };
		coHeader.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFFFFF00" },
		};
		coHeader.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};
	}

	// ΣCO column
	const sigmaCoCol = coStartCol + 6;
	ws.mergeCells(headerRow1, sigmaCoCol, headerRow1 + 1, sigmaCoCol);
	const sigmaCoHeader = ws.getCell(headerRow1, sigmaCoCol);
	sigmaCoHeader.value = "ΣCO";
	sigmaCoHeader.alignment = { horizontal: "center", vertical: "middle" };
	sigmaCoHeader.font = { bold: true };
	sigmaCoHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" },
	};
	sigmaCoHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Row 2: CO labels for each assessment
	const headerRow2 = tableStartRow + 1;
	assessmentColumns.forEach(({ startCol }) => {
		for (let i = 0; i < 6; i++) {
			const coCell = ws.getCell(headerRow2, startCol + i);
			coCell.value = `CO${i + 1}`;
			coCell.alignment = { horizontal: "center", vertical: "middle" };
			coCell.font = { bold: true };
			coCell.border = {
				top: { style: "thin" },
				right: { style: "thin" },
				bottom: { style: "thin" },
				left: { style: "thin" },
			};
		}
	});

	// Row 3: Maximum Marks and % labels
	const headerRow3 = tableStartRow + 2;

	const totalPercentLabel = ws.getCell(headerRow3, totalStartCol);
	totalPercentLabel.value = "%";
	totalPercentLabel.alignment = { horizontal: "center", vertical: "middle" };
	totalPercentLabel.font = { bold: true };
	totalPercentLabel.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF87CEEB" },
	};
	totalPercentLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	for (let i = 0; i < 6; i++) {
		const coPercentLabel = ws.getCell(headerRow3, coStartCol + i);
		coPercentLabel.value = "%";
		coPercentLabel.alignment = { horizontal: "center", vertical: "middle" };
		coPercentLabel.font = { bold: true };
		coPercentLabel.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};
	}

	const sigmaCoPercentLabel = ws.getCell(headerRow3, sigmaCoCol);
	sigmaCoPercentLabel.value = "%";
	sigmaCoPercentLabel.alignment = {
		horizontal: "center",
		vertical: "middle",
	};
	sigmaCoPercentLabel.font = { bold: true };
	sigmaCoPercentLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	assessmentColumns.forEach(({ startCol }, idx) => {
		const assessment = assessments[idx];
		ws.mergeCells(headerRow3, startCol, headerRow3, startCol + 4);
		const maxMarksCell = ws.getCell(headerRow3, startCol);
		maxMarksCell.value = "Maximum Marks";
		maxMarksCell.alignment = { horizontal: "center", vertical: "middle" };
		maxMarksCell.font = { bold: true };
		maxMarksCell.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};

		const maxMarksValueCell = ws.getCell(headerRow3, startCol + 5);
		maxMarksValueCell.value = assessment.maxMarks;
		maxMarksValueCell.alignment = {
			horizontal: "center",
			vertical: "middle",
		};
		maxMarksValueCell.font = { bold: true };
		maxMarksValueCell.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFFFFF00" },
		};
		maxMarksValueCell.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};
	});

	// Row 4: CO max marks
	const headerRow4 = tableStartRow + 3;

	const coWiseLabel = ws.getCell(headerRow4, 3);
	coWiseLabel.value = "CO WISE MAXIMUM MARKS";
	coWiseLabel.alignment = { horizontal: "center", vertical: "middle" };
	coWiseLabel.font = { bold: true };
	coWiseLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	const absenteeRow4 = ws.getCell(headerRow4, 4);
	absenteeRow4.value = '"AB" or 0';
	absenteeRow4.alignment = { horizontal: "center", vertical: "middle" };
	absenteeRow4.font = { bold: true };
	absenteeRow4.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	assessmentColumns.forEach(({ startCol }, idx) => {
		const assessment = assessments[idx];
		for (let i = 0; i < 6; i++) {
			const coKey = `CO${i + 1}` as keyof COMarks;
			const coCell = ws.getCell(headerRow4, startCol + i);
			const maxMarkValue = assessment.coMaxMarks[coKey];
			coCell.value = maxMarkValue > 0 ? maxMarkValue : "";
			coCell.alignment = { horizontal: "center", vertical: "middle" };
			coCell.font = { bold: true };
			coCell.border = {
				top: { style: "thin" },
				right: { style: "thin" },
				bottom: { style: "thin" },
				left: { style: "thin" },
			};
		}
	});

	const totalCOMaxMarks = assessments.reduce(
		(acc, a) => {
			acc.CO1 += a.coMaxMarks.CO1;
			acc.CO2 += a.coMaxMarks.CO2;
			acc.CO3 += a.coMaxMarks.CO3;
			acc.CO4 += a.coMaxMarks.CO4;
			acc.CO5 += a.coMaxMarks.CO5;
			acc.CO6 += a.coMaxMarks.CO6;
			return acc;
		},
		{ CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 }
	);
	const totalMaxSum = Object.values(totalCOMaxMarks).reduce(
		(sum, v) => sum + v,
		0
	);
	const totalMaxCell = ws.getCell(headerRow4, totalStartCol);
	totalMaxCell.value = totalMaxSum;
	totalMaxCell.alignment = { horizontal: "center", vertical: "middle" };
	totalMaxCell.font = { bold: true };
	totalMaxCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FF87CEEB" },
	};
	totalMaxCell.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	for (let i = 0; i < 6; i++) {
		const percentCell = ws.getCell(headerRow4, coStartCol + i);
		percentCell.value = 100;
		percentCell.alignment = { horizontal: "center", vertical: "middle" };
		percentCell.font = { bold: true };
		percentCell.border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};
	}

	const sigmaCoSumCell = ws.getCell(headerRow4, sigmaCoCol);
	sigmaCoSumCell.value = 100;
	sigmaCoSumCell.alignment = { horizontal: "center", vertical: "middle" };
	sigmaCoSumCell.font = { bold: true };
	sigmaCoSumCell.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	return { assessmentColumns, totalStartCol, coStartCol, sigmaCoCol };
}
