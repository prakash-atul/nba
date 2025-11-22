export interface AttainmentExportOptions {
	attainmentThresholds: { id: number; percentage: number }[];
	coThreshold: number;
	passingThreshold: number;
	courseCode?: string;
	facultyName?: string;
	branch?: string;
	programme?: string;
	year?: string;
	semester?: string;
	courseName?: string;
	session?: string;
	studentsData?: StudentMarksData[];
	assessments?: AssessmentInfo[];
}

export interface StudentMarksData {
	sNo: number;
	rollNo: string;
	name: string;
	absentee?: string;
	assessmentMarks: { [assessmentName: string]: COMarks };
	coTotals: COMarks & { total: number };
}

export interface COMarks {
	CO1: number;
	CO2: number;
	CO3: number;
	CO4: number;
	CO5: number;
	CO6: number;
}

export interface AssessmentInfo {
	name: string;
	maxMarks: number;
	coMaxMarks: COMarks;
}

export interface AssessmentColumn {
	name: string;
	startCol: number;
	endCol: number;
}
