// Shared types for CO-PO Mapping components

export interface StudentMarks {
	rollNo: string;
	name: string;
	absentee: string; // "AB" or "UR" or empty
	tests: { [testName: string]: { [co: string]: number } };
	total: number;
	coTotals: {
		CO1: number;
		CO2: number;
		CO3: number;
		CO4: number;
		CO5: number;
		CO6: number;
		ΣCO: number;
	};
}

export interface AttainmentThreshold {
	id: number;
	percentage: number;
}

export interface AttainmentCriteria {
	id: number;
	minPercentage: number;
	maxPercentage: number | null;
	level: number;
}

export interface AttainmentData {
	totalStudents: number;
	absentees: number;
	presentStudents: number;
	coStats: {
		CO1: {
			above70: number;
			above60: number;
			above50: number;
			abovePass: number;
			aboveCOThreshold: number;
		};
		CO2: {
			above70: number;
			above60: number;
			above50: number;
			abovePass: number;
			aboveCOThreshold: number;
		};
		CO3: {
			above70: number;
			above60: number;
			above50: number;
			abovePass: number;
			aboveCOThreshold: number;
		};
		CO4: {
			above70: number;
			above60: number;
			above50: number;
			abovePass: number;
			aboveCOThreshold: number;
		};
		CO5: {
			above70: number;
			above60: number;
			above50: number;
			abovePass: number;
			aboveCOThreshold: number;
		};
		CO6: {
			above70: number;
			above60: number;
			above50: number;
			abovePass: number;
			aboveCOThreshold: number;
		};
	};
}

export interface COPOMatrixState {
	[key: string]: { [key: string]: number };
}
