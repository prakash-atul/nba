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
import {
	createCOAttainmentPointScaleTable,
	createCOAttainmentAbsoluteScaleTable,
} from "./coAttainmentTables";
import { createCOPOMappingTable } from "./copoMappingTable";

// Re-export types for backward compatibility
export type {
	AttainmentExportOptions,
	StudentMarksData,
	COMarks,
	AssessmentInfo,
	COPOMatrix,
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
		copoMatrix = {},
	} = opts;

	const wb = new ExcelJS.Workbook();
	wb.creator = "NBA System";
	wb.created = new Date();

	const ws = wb.addWorksheet("Attainment");

	// Set column widths
	ws.getColumn(1).width = 6;
	ws.getColumn(2).width = 10;
	ws.getColumn(3).width = 30;
	ws.getColumn(4).width = 20;

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

	// Add CO Attainment tables
	const studentDataEndRow = tableStartRow + 4 + studentsData.length;
	const attainmentTablesStartRow = studentDataEndRow + 3; // Leave 2 empty rows

	// Create CO Attainment in x.0 Point Scale table
	const pointScaleEndRow = createCOAttainmentPointScaleTable(
		ws,
		attainmentTablesStartRow,
		studentsData,
		passingThreshold,
		coThreshold,
		attainmentThresholds
	);

	// Create CO Attainment in Absolute Scale table
	createCOAttainmentAbsoluteScaleTable(
		ws,
		pointScaleEndRow + 2, // Leave 1 empty row between tables
		studentsData,
		passingThreshold,
		coThreshold,
		attainmentThresholds
	);

	// Create CO-PO Mapping table on a separate sheet (only if copoMatrix is provided)
	if (copoMatrix && Object.keys(copoMatrix).length > 0) {
		const copoWs = wb.addWorksheet("CO-PO Mapping");

		// Set column widths for CO-PO sheet
		copoWs.getColumn(1).width = 10; // CO labels
		for (let col = 2; col <= 16; col++) {
			copoWs.getColumn(col).width = 8; // PO/PSO columns
		}

		createCOPOMappingTable(
			copoWs,
			1, // Start from row 1 on the new sheet
			studentsData,
			coThreshold,
			attainmentThresholds,
			copoMatrix
		);
	}

	// Finalize and save
	const buffer = await wb.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const fileName = `${courseCode || "attainment"}_attainment.xlsx`;
	saveAs(blob, fileName);
}
