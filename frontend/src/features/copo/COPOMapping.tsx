import { MatrixView } from "./MatrixView";
import { getLevelColor, getPercentageColor } from "./utils";
import { useCOPOMappingData } from "./useCOPOMappingData";

interface COPOMappingProps {
	courseCode: string;
	courseName: string;
	courseId: number;
	facultyName: string;
	departmentName: string;
	programme: string;
	year: string | number;
	semester: string;
	readOnly?: boolean;
}

export function COPOMapping({
	courseCode,
	courseName,
	courseId,
	facultyName,
	departmentName,
	programme,
	year,
	semester,
	readOnly = false,
}: COPOMappingProps) {
	const {
		loading,
		studentsData,
		maxMarks,
		showSettings,
		setShowSettings,
		attainmentThresholds,
		coThreshold,
		setCoThreshold,
		passingThreshold,
		setPassingThreshold,
		copoMatrix,
		saving,
		saveMatrix,
		handleCSVDataParsed,
		addThreshold,
		updateThreshold,
		removeThreshold,
		saveSettings,
		updateCOPOMapping,
		getLevel,
		attainmentData,
		coMaxMarks,
		attainmentCriteria,
		handleExportAttainment,
		poComputations,
		calculatePOAttainment,
	} = useCOPOMappingData({
		courseId,
		courseCode,
		facultyName,
		departmentName,
		year: String(year),
		semester: String(semester),
		courseName,
	});

	const getLevelColorFn = (level: number) =>
		getLevelColor(level, attainmentThresholds.length);

	const getPercentageColorFn = (percentage: number) =>
		getPercentageColor(percentage, getLevel, attainmentThresholds.length);

	return (
		<MatrixView
			courseCode={courseCode}
			courseName={courseName}
			facultyName={facultyName}
			departmentName={departmentName}
			programme={programme}
			year={year}
			semester={semester}
			readOnly={readOnly}
			saving={saving}
			showSettings={showSettings}
			setShowSettings={setShowSettings}
			coThreshold={coThreshold}
			setCoThreshold={setCoThreshold}
			passingThreshold={passingThreshold}
			setPassingThreshold={setPassingThreshold}
			attainmentThresholds={attainmentThresholds}
			addThreshold={addThreshold}
			updateThreshold={updateThreshold}
			removeThreshold={removeThreshold}
			saveSettings={saveSettings}
			attainmentCriteria={attainmentCriteria}
			getLevelColorFn={getLevelColorFn}
			studentsData={studentsData}
			maxMarks={maxMarks}
			loading={loading}
			getPercentageColorFn={getPercentageColorFn}
			coMaxMarks={coMaxMarks}
			attainmentData={attainmentData}
			getLevel={getLevel}
			copoMatrix={copoMatrix}
			updateCOPOMapping={updateCOPOMapping}
			calculatePOAttainment={calculatePOAttainment}
			poComputations={poComputations}
			handleCSVDataParsed={handleCSVDataParsed}
			saveMatrix={saveMatrix}
			handleExportAttainment={handleExportAttainment}
		/>
	);
}
