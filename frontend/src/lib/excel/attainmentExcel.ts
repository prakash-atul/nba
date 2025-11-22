import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { AttainmentExportOptions } from "./types";

import {
	createAttainmentCriteriaSection,
	createPassingMarksSection,
	createUniversitySection,
	createFacultyInfoSection,
} from "./headerSections";
import { createTableHeaders } from "./tableHeaders";
import { fillStudentData } from "./studentRows";

// Re-export types for backward compatibility
export type {
	AttainmentExportOptions,
	StudentMarksData,
	COMarks,
	AssessmentInfo,
} from "./types";

export async function exportAttainmentExcel(opts: AttainmentExportOptions) {
	const {
		attainmentThresholds,
		coThreshold,
		passingThreshold,
		courseCode,
		facultyName = "Dr S. S. Satapathy",
		branch = "Mechanical Engineering",
		programme = "B. Tech",
		year = "I",
		semester = "II",
		courseName = "Introductory Computing",
		session = "2021-22",
		studentsData = [],
		assessments = [],
	} = opts;

	const wb = new ExcelJS.Workbook();
	wb.creator = "NBA System";
	wb.created = new Date();

	const ws = wb.addWorksheet("Attainment");

	// Set column widths
	ws.getColumn(1).width = 14;
	ws.getColumn(2).width = 14;
	ws.getColumn(3).width = 12;
	ws.getColumn(4).width = 12;

	// Columns E onwards (5-28) = width 4.5
	for (let col = 5; col <= 28; col++) {
		ws.getColumn(col).width = 4.5;
	}

	// Columns AC onwards (29-100) = width 6
	for (let col = 29; col <= 100; col++) {
		ws.getColumn(col).width = 6;
	}

	// Create header sections
	const rowsNeeded = createAttainmentCriteriaSection(
		ws,
		attainmentThresholds
	);
	createPassingMarksSection(ws, passingThreshold, coThreshold);

	const universityRow = rowsNeeded + 1;
	createUniversitySection(ws, universityRow);

	const infoRow1 = universityRow + 1;
	const infoRow2 = universityRow + 2;
	createFacultyInfoSection(ws, infoRow1, infoRow2, {
		facultyName,
		branch,
		courseName,
		programme,
		year,
		semester,
		courseCode,
		session,
	});

	// Create student marks table
	const tableStartRow = infoRow2 + 1;
	const { assessmentColumns, totalStartCol, coStartCol, sigmaCoCol } =
		createTableHeaders(ws, tableStartRow, assessments);

	// Fill student data
	fillStudentData(
		ws,
		tableStartRow + 4, // Start after 4-row header
		studentsData,
		assessments,
		assessmentColumns,
		totalStartCol,
		coStartCol,
		sigmaCoCol
	);

	// Finalize and save
	const buffer = await wb.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const fileName = `${courseCode || "attainment"}_attainment.xlsx`;
	saveAs(blob, fileName);
}
