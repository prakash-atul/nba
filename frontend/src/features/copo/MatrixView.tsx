import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useState } from "react";
import { CSVUploader } from "@/features/shared/CSVUploader";
import { AttainmentSettingsPanel } from "./AttainmentSettingsPanel";
import { AttainmentCriteriaCard } from "./AttainmentCriteriaCard";
import { PassingMarksCard } from "./PassingMarksCard";
import { StudentMarksTable } from "./StudentMarksTable";
import { COAttainmentTable } from "./COAttainmentTable";
import { COPOMatrixTable } from "./COPOMatrixTable";
import { PODirectAttainmentTable } from "./PODirectAttainmentTable";
import { POComputation3PointTable } from "./POComputation3PointTable";
import { POComputationPercentageTable } from "./POComputationPercentageTable";
import type {
	StudentMarks,
	AttainmentThreshold,
	AttainmentData,
	COPOMatrixState,
} from "./types";

export interface MatrixViewProps {
	courseCode: string;
	courseName: string;
	facultyName: string;
	departmentName: string;
	programme: string;
	year: string | number;
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
	handleExportAttainment: (headerOverrides?: {
		programme?: string;
		year?: string;
		semester?: string;
		session?: string;
	}) => void;
}

export function MatrixView({
	courseCode,
	courseName,
	facultyName,
	departmentName,
	programme,
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
	handleExportAttainment,
}: MatrixViewProps) {
	const [editableProgramme, setEditableProgramme] = useState(programme);
	const [editableYear, setEditableYear] = useState(String(year));
	const [editableSemester, setEditableSemester] = useState(semester);
	const [editableSession, setEditableSession] = useState(String(year)); // default session = year

	const handleProgrammeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableProgramme(e.target.value);
	};

	const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableYear(e.target.value);
	};

	const handleSemesterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableSemester(e.target.value);
	};

	const handleSessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableSession(e.target.value);
	};

	return (
		<div className="space-y-6 pb-8">
			{/* Header Section with Card */}
			<Card className="border-0 shadow-none bg-transparent">
				<CardHeader className="px-0">
					<div className="flex justify-between items-start w-full">
						<div>
							<CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
								CO-PO Mapping
							</CardTitle>
							<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
								Course: {courseCode} - {courseName}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{!readOnly && (
								<Button
									onClick={() =>
										setShowSettings(!showSettings)
									}
									variant="outline"
									size="sm"
									className="flex items-center gap-2"
								>
									<Settings className="h-4 w-4" />
									Attainment Settings
								</Button>
							)}
							<Button
								onClick={() =>
									handleExportAttainment({
										programme: editableProgramme,
										year: editableYear,
										semester: editableSemester,
										session: editableSession,
									})
								}
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
							>
								Export Attainment Excel
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			<Card className="w-full border-0 shadow-none bg-transparent">
				<CardContent className="w-full px-0 pt-4">
					<div className="flex flex-wrap justify-evenly items-center gap-4">
						<div className="flex items-center gap-2">
							<Label
								htmlFor="programme"
								className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
							>
								Programme:
							</Label>
							<Input
								id="programme"
								type="text"
								value={editableProgramme}
								onChange={handleProgrammeChange}
								className=" text-xs border-b border-gray-300 dark:border-gray-600 bg-transparent px-2 py-0.5 focus:outline-none focus:border-blue-500"
								placeholder="Programme"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label
								htmlFor="year"
								className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
							>
								Year:
							</Label>
							<Input
								id="year"
								type="text"
								value={editableYear}
								onChange={handleYearChange}
								className=" text-xs border-b border-gray-300 dark:border-gray-600 bg-transparent px-2 py-0.5 focus:outline-none focus:border-blue-500"
								placeholder="Year"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label
								htmlFor="semester"
								className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
							>
								SEM:
							</Label>
							<Input
								id="semester"
								type="text"
								value={editableSemester}
								onChange={handleSemesterChange}
								className=" text-xs border-b border-gray-300 dark:border-gray-600 bg-transparent px-2 py-0.5 focus:outline-none focus:border-blue-500"
								placeholder="SEM"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label
								htmlFor="session"
								className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
							>
								Session:
							</Label>
							<Input
								id="session"
								type="text"
								value={editableSession}
								onChange={handleSessionChange}
								className=" text-xs border-b border-gray-300 dark:border-gray-600 bg-transparent px-2 py-0.5 focus:outline-none focus:border-blue-500"
								placeholder="Session"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

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
			year={editableYear}
			semester={editableSemester}
			programme={editableProgramme}
			session={editableSession}
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

			{/* Action Buttons: Import & Save */}
			{!readOnly && (
				<div className="flex items-center gap-2 justify-end mt-4">
					<CSVUploader
						onDataParsed={handleCSVDataParsed}
						accept=".csv"
						buttonText="Import Matrix"
					/>
					<Button
						onClick={saveMatrix}
						disabled={saving}
						variant="default"
						size="sm"
						className="gap-2"
					>
						Save Matrix
					</Button>
				</div>
			)}

			{/* CO-PO-PSO Matrix Table */}
			<COPOMatrixTable
				copoMatrix={copoMatrix}
				readOnly={readOnly}
				courseInfo={{
					university_name: "TEZPUR UNIVERSITY",
					faculty_name: facultyName,
					branch: departmentName,
					programme_name: editableProgramme,
					year: editableYear,
					semester: editableSemester,
					course_name: courseName,
					course_code: courseCode,
					session: editableSession,
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

			{/* PO Direct Attainment Table (Sum of Mappings) */}
			<PODirectAttainmentTable
				copoMatrix={copoMatrix}
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
