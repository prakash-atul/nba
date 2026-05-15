import { BaseAttainmentTable } from "./BaseAttainmentTable";
import type { AttainmentData } from "./types";

interface COAttainmentTableProps {
	attainmentData: AttainmentData;
	coThreshold: number;
	coMaxMarks?: Record<string, number>;
	getAttainmentLevel: (percentage: number) => number;
	getPercentageColor: (percentage: number) => string;
}

export function COAttainmentTable({
	attainmentData,
	coThreshold,
	coMaxMarks,
	getAttainmentLevel,
	getPercentageColor,
}: COAttainmentTableProps) {
	const coList = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];

	const isCOAssessed = (co: string): boolean => {
		if (!coMaxMarks) return true;
		return (coMaxMarks[co] || 0) > 0;
	};

	const getPercentage = (_co: string, field: 'aboveCOThreshold' | 'abovePass') => {
		if (attainmentData.presentStudents === 0) return 0;
		return (attainmentData.coStats[_co as keyof typeof attainmentData.coStats][field] / attainmentData.presentStudents) * 100;
	};
	
	const getAveragePercentage = (_co: string) => {
		if (attainmentData.presentStudents === 0) return 0;
		return attainmentData.coStats[_co as keyof typeof attainmentData.coStats].averagePercentage || 0;
	};

	return (
		<>
			<BaseAttainmentTable
				title="CO ATTAINMENT in 3.0 POINT Scale"
				coList={coList}
				isCOAssessed={isCOAssessed}
				attainmentData={attainmentData}
				rows={[
					{
						label: "ABSENTEE+NOT ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.absentees : "NA"
					},
					{
						label: "PRESENT STUDENT OR ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.presentStudents : "NA"
					},
					{
						label: `NO. OF STUDENTS SECURE MARKS > ${coThreshold}% (CO THRESHOLD)`,
						rowClass: "bg-gray-900 dark:bg-gray-950 text-white",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.coStats[_co as keyof typeof attainmentData.coStats].aboveCOThreshold : "NA"
					},
					{
						label: `PC. OF STUDENTS SECURE MARKS > ${coThreshold}% (CO THRESHOLD)`,
						getValue: (co, isAssessed) => isAssessed ? getPercentage(co, 'aboveCOThreshold').toFixed(2) : "NA",
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : ""
					},
					{
						label: "CO Attainment Level (Based on Criteria)",
						getValue: (co, isAssessed) => {
							if (!isAssessed) return "NA";
							const p = getPercentage(co, 'aboveCOThreshold');
							return getAttainmentLevel(p).toFixed(2);
						},
						cellClass: (co) => {
							if (!isCOAssessed(co)) return "text-gray-500 bg-gray-100 dark:bg-gray-800";
							return `font-bold ${getPercentageColor(getPercentage(co, 'aboveCOThreshold'))}`;
						}
					},
					{
						label: "Final attainment level CO (by Direct Assessment):",
						rowClass: "bg-orange-100 dark:bg-orange-950 font-bold",
						getValue: (co, isAssessed) => {
							if (!isAssessed) return "NA";
							const p = getPercentage(co, 'aboveCOThreshold');
							return getAttainmentLevel(p).toFixed(2);
						},
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : "font-bold text-lg"
					}
				]}
			/>

			<BaseAttainmentTable
				title="CO ATTAINMENT in ABSOLUTE Scale"
				coList={coList}
				isCOAssessed={isCOAssessed}
				attainmentData={attainmentData}
				rows={[
					{
						label: "ABSENTEE+NOT ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.absentees : "NA"
					},
					{
						label: "PRESENT STUDENT OR ATTEMPT",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.presentStudents : "NA"
					},
					{
						label: "NO. OF STUDENTS SECURE MARKS > PASSING MARKS",
						rowClass: "bg-gray-900 dark:bg-gray-950 text-white",
						getValue: (_co, isAssessed) => isAssessed ? attainmentData.coStats[_co as keyof typeof attainmentData.coStats].abovePass : "NA"
					},
					{
						label: "PC. OF STUDENTS SECURE MARKS > PASSING MARKS",
						getValue: (co, isAssessed) => isAssessed ? getPercentage(co, 'abovePass').toFixed(2) : "NA",
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : ""
					},
					{
						label: "CO Attainment (AVERAGE OF PERCENTAGE ATTAINMENTS)",
						getValue: (co, isAssessed) => isAssessed ? getAveragePercentage(co).toFixed(2) : "NA",
						cellClass: (co) => {
							if (!isCOAssessed(co)) return "text-gray-500 bg-gray-100 dark:bg-gray-800";
							return `font-bold ${getPercentageColor(getAveragePercentage(co))}`;
						}
					},
					{
						label: "Final attainment level CO (IN ABSOLUTE SCALE):",
						rowClass: "bg-orange-100 dark:bg-orange-950 font-bold",
						getValue: (co, isAssessed) => isAssessed ? getAveragePercentage(co).toFixed(2) + "%" : "NA",
						cellClass: (co) => !isCOAssessed(co) ? "text-gray-500" : "font-bold text-lg"
					}
				]}
			/>
		</>
	);
}