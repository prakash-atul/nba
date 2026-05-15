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
	copoMatrix?: COPOMatrix;
}

export interface COPOMatrix {
	[co: string]: {
		[po: string]: number;
	};
}

export interface StudentMarksData {
	sNo: number;
	rollNo: string;
	name: string;
	programmeName?: string;
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

/**
 * Calculate total max marks per CO from all assessments
 */
export function calculateTotalCOMaxMarks(
	assessments: AssessmentInfo[]
): COMarks {
	return assessments.reduce(
		(totals, assessment) => ({
			CO1: totals.CO1 + (assessment.coMaxMarks?.CO1 || 0),
			CO2: totals.CO2 + (assessment.coMaxMarks?.CO2 || 0),
			CO3: totals.CO3 + (assessment.coMaxMarks?.CO3 || 0),
			CO4: totals.CO4 + (assessment.coMaxMarks?.CO4 || 0),
			CO5: totals.CO5 + (assessment.coMaxMarks?.CO5 || 0),
			CO6: totals.CO6 + (assessment.coMaxMarks?.CO6 || 0),
		}),
		{ CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 }
	);
}

/**
 * Check if a CO is assessed (has max marks > 0)
 */
export function isCOAssessed(co: string, coMaxMarks: COMarks): boolean {
	return (coMaxMarks[co as keyof COMarks] || 0) > 0;
}
