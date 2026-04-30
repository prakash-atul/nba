import type {
	StudentMarks,
	AttainmentData,
	COPOMatrixState,
	AttainmentThreshold,
} from "./types";

export const calculateCOAttainment = (
	studentsData: StudentMarks[],
	passingThreshold: number,
	coThreshold: number,
): AttainmentData => {
	const totalStudents = studentsData.length;
	let absentees = 0;

	const coStats = {
		CO1: {
			above70: 0,
			above60: 0,
			above50: 0,
			abovePass: 0,
			aboveCOThreshold: 0,
			sumPercentage: 0,
			averagePercentage: 0,
		},
		CO2: {
			above70: 0,
			above60: 0,
			above50: 0,
			abovePass: 0,
			aboveCOThreshold: 0,
			sumPercentage: 0,
			averagePercentage: 0,
		},
		CO3: {
			above70: 0,
			above60: 0,
			above50: 0,
			abovePass: 0,
			aboveCOThreshold: 0,
			sumPercentage: 0,
			averagePercentage: 0,
		},
		CO4: {
			above70: 0,
			above60: 0,
			above50: 0,
			abovePass: 0,
			aboveCOThreshold: 0,
			sumPercentage: 0,
			averagePercentage: 0,
		},
		CO5: {
			above70: 0,
			above60: 0,
			above50: 0,
			abovePass: 0,
			aboveCOThreshold: 0,
			sumPercentage: 0,
			averagePercentage: 0,
		},
		CO6: {
			above70: 0,
			above60: 0,
			above50: 0,
			abovePass: 0,
			aboveCOThreshold: 0,
			sumPercentage: 0,
			averagePercentage: 0,
		},
	};

	studentsData.forEach((student) => {
		if (student.absentee === "AB" || student.absentee === "UR") {
			absentees++;
			return;
		}

		Object.keys(coStats).forEach((co) => {
			const percentage =
				student.coTotals[co as keyof typeof student.coTotals];
			// Using Math.round to match Excel's precision behavior for threshold comparison
			const roundedPercentage = Math.round(percentage * 100) / 100;

			if (roundedPercentage >= 70)
				coStats[co as keyof typeof coStats].above70++;
			if (roundedPercentage >= 60)
				coStats[co as keyof typeof coStats].above60++;
			if (roundedPercentage >= 50)
				coStats[co as keyof typeof coStats].above50++;
			if (roundedPercentage >= passingThreshold)
				coStats[co as keyof typeof coStats].abovePass++;
			// Use configured CO threshold for 3-point scale attainment
			if (roundedPercentage >= coThreshold)
				coStats[co as keyof typeof coStats].aboveCOThreshold++;
			
			// Accumulate sum for average percentage calculation
			coStats[co as keyof typeof coStats].sumPercentage += roundedPercentage;
		});
	});

	const presentStudents = totalStudents - absentees;
	
	// Calculate average percentage for each CO
	Object.keys(coStats).forEach((co) => {
		if (presentStudents > 0) {
			coStats[co as keyof typeof coStats].averagePercentage = 
				Math.round((coStats[co as keyof typeof coStats].sumPercentage / presentStudents) * 100) / 100;
		}
	});
	
	return { totalStudents, absentees, presentStudents, coStats };
};

export const calculateCOMaxMarks = (maxMarks: {
	[testName: string]: {
		total: number;
		CO1: number;
		CO2: number;
		CO3: number;
		CO4: number;
		CO5: number;
		CO6: number;
	};
}): Record<string, number> => {
	return Object.values(maxMarks).reduce(
		(totals, testMarks) => ({
			CO1: (totals.CO1 || 0) + (testMarks.CO1 || 0),
			CO2: (totals.CO2 || 0) + (testMarks.CO2 || 0),
			CO3: (totals.CO3 || 0) + (testMarks.CO3 || 0),
			CO4: (totals.CO4 || 0) + (testMarks.CO4 || 0),
			CO5: (totals.CO5 || 0) + (testMarks.CO5 || 0),
			CO6: (totals.CO6 || 0) + (testMarks.CO6 || 0),
		}),
		{ CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
	);
};

export const calculatePOComputations = (
	attainmentData: AttainmentData,
	studentsData: StudentMarks[],
	attainmentThresholds: AttainmentThreshold[],
	copoMatrix: COPOMatrixState,
	getLevel: (percentage: number) => number,
) => {
	const cos = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
	const pos = [
		"PO1",
		"PO2",
		"PO3",
		"PO4",
		"PO5",
		"PO6",
		"PO7",
		"PO8",
		"PO9",
		"PO10",
		"PO11",
		"PO12",
		"PSO1",
		"PSO2",
		"PSO3",
	];
	const attainmentPointsScale = attainmentThresholds.length;

	const data3Point = {
		rows: [] as { co: string; values: Record<string, number | null> }[],
		averages: {} as Record<string, number | null>,
		overall: 0,
	};

	const dataPercentage = {
		rows: [] as { co: string; values: Record<string, number | null> }[],
		sums: {} as Record<string, number>,
		weightSums: {} as Record<string, number>,
		averages: {} as Record<string, number | null>,
		overall: 0,
	};

	const coLevels: Record<string, number> = {};
	const coPercentages: Record<string, number> = {};

	cos.forEach((co) => {
		let thresholdPercentage = 0;
		if (attainmentData.presentStudents > 0) {
			thresholdPercentage =
				(attainmentData.coStats[
					co as keyof typeof attainmentData.coStats
				].aboveCOThreshold /
					attainmentData.presentStudents) *
				100;
		}
		thresholdPercentage = Math.round(thresholdPercentage * 100) / 100; // Match precise Excel display rounding for calculation

		// Calculate "Norm" (Class Average of Student CO Percentages) for the Percentage Scale
		let sumPercentage = 0;
		let present = 0;
		studentsData.forEach((s) => {
			if (s.absentee !== "AB" && s.absentee !== "UR") {
				sumPercentage +=
					(s.coTotals[co as keyof typeof s.coTotals] as number) || 0;
				present++;
			}
		});
		const classAveragePercentage =
			present > 0 ? Math.round((sumPercentage / present) * 100) / 100 : 0;

		coPercentages[co] = classAveragePercentage;
		coLevels[co] = getLevel(thresholdPercentage);
	});

	const mappedPOCount3Point: Record<string, number> = {};
	const sumPO3Point: Record<string, number> = {};

	cos.forEach((co) => {
		const row3Point = { co, values: {} as Record<string, number | null> };
		const rowPercentage = {
			co,
			values: {} as Record<string, number | null>,
		};

		const coLevel = coLevels[co];
		const coPercentage = coPercentages[co];

		pos.forEach((po) => {
			const poMapping =
				copoMatrix[co as keyof COPOMatrixState]?.[
					po as keyof typeof copoMatrix.CO1
				] || 0;
			if (poMapping > 0) {
				// 3 Point Scale
				const val3Point = (coLevel * poMapping) / attainmentPointsScale;
				row3Point.values[po] = val3Point;

				mappedPOCount3Point[po] = (mappedPOCount3Point[po] || 0) + 1;
				sumPO3Point[po] = (sumPO3Point[po] || 0) + val3Point;

				// Percentage Scale
				const valPercentage = coPercentage * poMapping;
				rowPercentage.values[po] = valPercentage;

				dataPercentage.sums[po] =
					(dataPercentage.sums[po] || 0) + valPercentage;
				dataPercentage.weightSums[po] =
					(dataPercentage.weightSums[po] || 0) + poMapping;
			} else {
				row3Point.values[po] = null;
				rowPercentage.values[po] = null;
			}
		});

		data3Point.rows.push(row3Point);
		dataPercentage.rows.push(rowPercentage);
	});

	let overall3PointSum = 0;
	let overall3PointCount = 0;
	let overallPercentageSum = 0;
	let overallPercentageCount = 0;

	pos.forEach((po) => {
		if (mappedPOCount3Point[po] > 0) {
			const avg = sumPO3Point[po] / mappedPOCount3Point[po];
			data3Point.averages[po] = avg;
			if (avg > 0) {
				// Discard 0 values in 3 point scale overalls like in Excel
				overall3PointSum += avg;
				overall3PointCount++;
			}
		} else {
			data3Point.averages[po] = null;
		}

		if (dataPercentage.weightSums[po] > 0) {
			const avg = dataPercentage.sums[po] / dataPercentage.weightSums[po];
			dataPercentage.averages[po] = avg;
			overallPercentageSum += avg;
			overallPercentageCount++;
		} else {
			dataPercentage.averages[po] = null;
		}
	});

	data3Point.overall =
		overall3PointCount > 0 ? overall3PointSum / overall3PointCount : 0;
	dataPercentage.overall =
		overallPercentageCount > 0
			? overallPercentageSum / overallPercentageCount
			: 0;

	return { data3Point, dataPercentage };
};
