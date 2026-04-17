import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { CSVUploader } from "@/features/shared/CSVUploader";
import { AttainmentSettingsPanel } from "./AttainmentSettingsPanel";
import { AttainmentCriteriaCard } from "./AttainmentCriteriaCard";
import { PassingMarksCard } from "./PassingMarksCard";
import { StudentMarksTable } from "./StudentMarksTable";
import { COAttainmentTable } from "./COAttainmentTable";
import { COPOMatrixTable } from "./COPOMatrixTable";
import { POComputation3PointTable } from "./POComputation3PointTable";
import { POComputationPercentageTable } from "./POComputationPercentageTable";
import type { StudentMarks, AttainmentThreshold, AttainmentData, COPOMatrixState } from "./types";

export interface MatrixViewProps {
    courseCode: string;
    courseName: string;
    facultyName: string;
    departmentName: string;
    year: number;
    semester: string;
    readOnly?: boolean;
    saving: boolean;
    showSettings: boolean;
    setShowSettings: (val: boolean) => void;
    coThreshold: number;
    setCoThreshold: (val: number) => void;
    passingThreshold: number;
    setPassingThreshold: (val: number) => void;
    attainmentThresholds: AttainmentThreshold[];
    addThreshold: () => void;
    updateThreshold: (id: number, value: number) => void;
    removeThreshold: (id: number) => void;
    saveSettings: () => void;
    attainmentCriteria: any;
    getLevelColorFn: (level: number) => string;
    studentsData: StudentMarks[];
    maxMarks: any;
    loading: boolean;
    getPercentageColorFn: (percentage: number) => string;
    coMaxMarks: Record<string, number>;
    attainmentData: AttainmentData | null;
    getLevel: (percentage: number) => number;
    copoMatrix: COPOMatrixState;
    updateCOPOMapping: (co: string, po: string, val: number) => void;
    calculatePOAttainment: (po: string) => any;
    poComputations: any;
    handleCSVDataParsed: (data: any[]) => void;
    saveMatrix: () => void;
    handleExportAttainment: () => void;
}

export function MatrixView({
    courseCode,
    courseName,
    facultyName,
    departmentName,
    year,
    semester,
    readOnly,
    saving,
    showSettings,
    setShowSettings,
    coThreshold,
    setCoThreshold,
    passingThreshold,
    setPassingThreshold,
    attainmentThresholds,
    addThreshold,
    updateThreshold,
    removeThreshold,
    saveSettings,
    attainmentCriteria,
    getLevelColorFn,
    studentsData,
    maxMarks,
    loading,
    getPercentageColorFn,
    coMaxMarks,
    attainmentData,
    getLevel,
    copoMatrix,
    updateCOPOMapping,
    calculatePOAttainment,
    poComputations,
    handleCSVDataParsed,
    saveMatrix,
    handleExportAttainment
}: MatrixViewProps) {
return (
		<div className="space-y-6 pb-8">
			{/* Header Section */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
						CO-PO Mapping
					</h2>
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
						Course: {courseCode} - {courseName}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{!readOnly && (
						<>
							<CSVUploader
								onDataParsed={handleCSVDataParsed}
								accept=".csv"
								buttonText="Import Matrix"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={saveMatrix}
								disabled={saving}
								className="gap-2"
							>
								<Save className="h-4 w-4" />
								{saving ? "Saving..." : "Save Matrix"}
							</Button>
							<Button
								onClick={() => setShowSettings(!showSettings)}
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
							>
								<Settings className="h-4 w-4" />
								Attainment Settings
							</Button>
						</>
					)}
					<Button
						onClick={handleExportAttainment}
						variant="ghost"
						size="sm"
						className="flex items-center gap-2"
					>
						Export Attainment Excel
					</Button>
				</div>
			</div>

			{/* Settings Panel */}
			<AttainmentSettingsPanel
				showSettings={showSettings}
				coThreshold={coThreshold}
				setCoThreshold={setCoThreshold}
				passingThreshold={passingThreshold}
				setPassingThreshold={setPassingThreshold}
				attainmentThresholds={attainmentThresholds}
				addThreshold={addThreshold}
				updateThreshold={updateThreshold}
				removeThreshold={removeThreshold}
				saveSettings={saveSettings}
			/>

			{/* Attainment Criteria Card */}
			<AttainmentCriteriaCard
				attainmentCriteria={attainmentCriteria}
				getLevelColor={getLevelColorFn}
			/>

			{/* Passing Marks Card */}
			<PassingMarksCard
				coThreshold={coThreshold}
				passingThreshold={passingThreshold}
			/>

			{/* Student Marks Table */}
			<StudentMarksTable
				studentsData={studentsData}
				maxMarks={maxMarks}
				facultyName={facultyName}
				departmentName={departmentName}
				courseName={courseName}
				courseCode={courseCode}
				year={year}
				semester={semester}
				loading={loading}
				getPercentageColor={getPercentageColorFn}
				coMaxMarks={coMaxMarks}
			/>

			{/* CO Attainment Tables */}
			{attainmentData && (
				<COAttainmentTable
					attainmentData={attainmentData}
					getAttainmentLevel={getLevel}
					getPercentageColor={getPercentageColorFn}
					coThreshold={coThreshold}
					coMaxMarks={coMaxMarks}
				/>
			)}

			{/* CO-PO-PSO Matrix Table */}
			<COPOMatrixTable
				copoMatrix={copoMatrix}
				readOnly={readOnly}
				courseInfo={{
					university_name: "TEZPUR UNIVERSITY",
					faculty_name: facultyName,
					branch: departmentName,
					programme_name: "B. Tech",
					year: year.toString(),
					semester: semester,
					course_name: courseName,
					course_code: courseCode,
					session: `${new Date().getFullYear()}-${(
						new Date().getFullYear() + 1
					)
						.toString()
						.slice(-2)}`,
				}}
				updateCOPOMapping={updateCOPOMapping}
				calculatePOAttainment={calculatePOAttainment}
				getPercentageColor={getPercentageColorFn}
				attainmentData={attainmentData}
				getAttainmentLevel={getLevel}
				getLevelColor={getLevelColorFn}
				attainmentThresholds={attainmentThresholds}
				coMaxMarks={coMaxMarks}
			/>

			{/* Detailed PO Computation Tables */}
			{poComputations && (
				<>
					<POComputation3PointTable
						data={poComputations.data3Point}
					/>
					<POComputationPercentageTable
						data={poComputations.dataPercentage}
					/>
				</>
			)}
		</div>
	);
}

