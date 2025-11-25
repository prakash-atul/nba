import ExcelJS from "exceljs";

export function createAttainmentCriteriaSection(
	ws: ExcelJS.Worksheet,
	attainmentThresholds: { id: number; percentage: number }[]
) {
	const sorted = [...attainmentThresholds].sort(
		(a, b) => b.percentage - a.percentage
	);
	const rowsNeeded = Math.max(sorted.length, 3);

	// Merged label for ATTAINMENT CRITERIA
	ws.mergeCells(1, 1, rowsNeeded, 2);
	const leftCell = ws.getCell(1, 1);
	leftCell.value = "ATTAINMENT\nCRITERIA";
	leftCell.alignment = {
		vertical: "middle",
		horizontal: "center",
		wrapText: true,
	};
	leftCell.font = { bold: true, size: 12 };
	leftCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFCCEEFF" },
	};
	leftCell.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Fill thresholds and level numbers
	for (let i = 0; i < rowsNeeded; i++) {
		const rowIndex = i + 1;
		const thr = sorted[i];
		const valueCell = ws.getCell(rowIndex, 3);
		const levelCell = ws.getCell(rowIndex, 4);

		if (thr) {
			valueCell.value = thr.percentage;
			valueCell.alignment = { horizontal: "center", vertical: "middle" };
			valueCell.font = { bold: true };
			valueCell.border = {
				top: { style: "thin" },
				right: { style: "thin" },
				bottom: { style: "thin" },
				left: { style: "thin" },
			};

			const level = sorted.length - i;
			levelCell.value = level > 0 ? `${level}` : "0";
			levelCell.alignment = { horizontal: "center", vertical: "middle" };
			levelCell.font = { bold: true };
			levelCell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFE68A00" },
			};
			levelCell.border = {
				top: { style: "thin" },
				right: { style: "thin" },
				bottom: { style: "thin" },
				left: { style: "thin" },
			};
		} else {
			valueCell.value = "";
			levelCell.value = "";
		}
	}

	return rowsNeeded;
}

export function createPassingMarksSection(
	ws: ExcelJS.Worksheet,
	passingThreshold: number,
	coThreshold: number
) {
	// Passing Marks label and value
	ws.mergeCells(1, 7, 1, 13);
	const passHeader = ws.getCell(1, 7);
	passHeader.value = "PASSING MARKS (%)";
	passHeader.alignment = { horizontal: "center", vertical: "middle" };
	passHeader.font = { bold: true };
	passHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFEEEEEE" },
	};
	passHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	const passValue = ws.getCell(1, 14);
	passValue.value = passingThreshold;
	passValue.alignment = { horizontal: "center", vertical: "middle" };
	passValue.font = { bold: true };
	passValue.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFDDEEFF" },
	};
	passValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// CO Threshold label and value
	ws.mergeCells(2, 7, 2, 13);
	const thrHeader = ws.getCell(2, 7);
	thrHeader.value = "Threshold % for CO attainment";
	thrHeader.alignment = { horizontal: "center", vertical: "middle" };
	thrHeader.font = { bold: true };
	thrHeader.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFEEEEEE" },
	};
	thrHeader.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	const thrValue = ws.getCell(2, 14);
	thrValue.value = coThreshold;
	thrValue.alignment = { horizontal: "center", vertical: "middle" };
	thrValue.font = { bold: true };
	thrValue.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFF2CC" },
	};
	thrValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Note label
	ws.mergeCells(3, 7, 3, 31);
	const noteCell = ws.getCell(3, 7);
	noteCell.value =
		'Please fill "AB" for Absent and "UR" for Unregistered candidate(s)';
	noteCell.alignment = { horizontal: "center", vertical: "middle" };
	noteCell.font = { italic: true, size: 10 };
	noteCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFC6E0B4" },
	};
	noteCell.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};
}

export function createUniversitySection(
	ws: ExcelJS.Worksheet,
	universityRow: number
) {
	ws.mergeCells(universityRow, 1, universityRow, 31);
	const universityCell = ws.getCell(universityRow, 1);
	universityCell.value = "TEZPUR UNIVERSITY";
	universityCell.alignment = { horizontal: "center", vertical: "middle" };
	universityCell.font = { bold: true, size: 12 };
	universityCell.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFE4B57E" },
	};
	universityCell.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};
}

export function createFacultyInfoSection(
	ws: ExcelJS.Worksheet,
	infoRow1: number,
	infoRow2: number,
	options: {
		facultyName: string;
		branch: string;
		courseName: string;
		programme: string;
		year: string;
		semester: string;
		courseCode?: string;
		session: string;
	}
) {
	// Row 1: Faculty Name and Branch
	ws.mergeCells(infoRow1, 1, infoRow1, 2);
	const facultyLabel = ws.getCell(infoRow1, 1);
	facultyLabel.value = "Faculty Name:";
	facultyLabel.alignment = { horizontal: "center", vertical: "middle" };
	facultyLabel.font = { bold: true };
	facultyLabel.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" },
	};
	facultyLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow1, 3, infoRow1, 4);
	const facultyValue = ws.getCell(infoRow1, 3);
	facultyValue.value = options.facultyName;
	facultyValue.alignment = { horizontal: "center", vertical: "middle" };
	facultyValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow1, 5, infoRow1, 6);
	ws.getCell(infoRow1, 5).value = "BRANCH";
	ws.getCell(infoRow1, 5).alignment = {
		horizontal: "center",
		vertical: "middle",
	};
	ws.getCell(infoRow1, 5).font = { bold: true };
	ws.getCell(infoRow1, 5).border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow1, 7, infoRow1, 14);
	const branchValue = ws.getCell(infoRow1, 10);
	branchValue.value = options.branch;
	branchValue.alignment = { horizontal: "center", vertical: "middle" };
	branchValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow1, 15, infoRow1, 22);
	const courseLabel = ws.getCell(infoRow1, 15);
	courseLabel.value = "Course:";
	courseLabel.alignment = { horizontal: "center", vertical: "middle" };
	courseLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow1, 23, infoRow1, 31);
	const courseValue = ws.getCell(infoRow1, 23);
	courseValue.value = options.courseName;
	courseValue.alignment = { horizontal: "center", vertical: "middle" };
	courseValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	// Row 2: Programme, Year, Sem, Course Code, Session
	ws.mergeCells(infoRow2, 1, infoRow2, 2);
	const programmeLabel = ws.getCell(infoRow2, 1);
	programmeLabel.value = "Programme:";
	programmeLabel.alignment = { horizontal: "center", vertical: "middle" };
	programmeLabel.font = { bold: true };
	programmeLabel.fill = {
		type: "pattern",
		pattern: "solid",
		fgColor: { argb: "FFFFFF00" },
	};
	programmeLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow2, 3, infoRow2, 4);
	const programmeValue = ws.getCell(infoRow2, 3);
	programmeValue.value = options.programme;
	programmeValue.alignment = { horizontal: "center", vertical: "middle" };
	programmeValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow2, 5, infoRow2, 6);

	ws.getCell(infoRow2, 5).border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.getCell(infoRow2, 5).value = "YEAR";
	ws.getCell(infoRow2, 5).alignment = {
		horizontal: "center",
		vertical: "middle",
	};
	ws.getCell(infoRow2, 5).font = { bold: true };
	ws.getCell(infoRow2, 5).border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow2, 7, infoRow2, 8);

	ws.getCell(infoRow2, 7).value = options.year;
	ws.getCell(infoRow2, 7).alignment = {
		horizontal: "center",
		vertical: "middle",
	};
	ws.getCell(infoRow2, 7).border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.getCell(infoRow2, 9).value = "SEM";
	ws.getCell(infoRow2, 9).alignment = {
		horizontal: "center",
		vertical: "middle",
	};
	ws.getCell(infoRow2, 9).font = { bold: true };
	ws.getCell(infoRow2, 9).border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.getCell(infoRow2, 10).value = options.semester;
	ws.getCell(infoRow2, 10).alignment = {
		horizontal: "center",
		vertical: "middle",
	};
	ws.getCell(infoRow2, 10).border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	for (let col = 11; col <= 14; col++) {
		ws.getCell(infoRow2, col).border = {
			top: { style: "thin" },
			right: { style: "thin" },
			bottom: { style: "thin" },
			left: { style: "thin" },
		};
	}

	ws.mergeCells(infoRow2, 15, infoRow2, 22);
	const courseCodeLabel = ws.getCell(infoRow2, 15);
	courseCodeLabel.value = "Course Code:";
	courseCodeLabel.alignment = { horizontal: "center", vertical: "middle" };
	courseCodeLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow2, 23, infoRow2, 26);
	const courseCodeValue = ws.getCell(infoRow2, 23);
	courseCodeValue.value = options.courseCode;
	courseCodeValue.alignment = { horizontal: "center", vertical: "middle" };
	courseCodeValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow2, 27, infoRow2, 28);
	const sessionLabel = ws.getCell(infoRow2, 27);
	sessionLabel.value = "SESSION";
	sessionLabel.alignment = { horizontal: "center", vertical: "middle" };
	sessionLabel.font = { bold: true };
	sessionLabel.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};

	ws.mergeCells(infoRow2, 29, infoRow2, 31);
	const sessionValue = ws.getCell(infoRow2, 29);
	sessionValue.value = options.session;
	sessionValue.alignment = { horizontal: "center", vertical: "middle" };
	sessionValue.border = {
		top: { style: "thin" },
		right: { style: "thin" },
		bottom: { style: "thin" },
		left: { style: "thin" },
	};
}
