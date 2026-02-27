export { FacultyStatsCards } from "./FacultyStatsCards";
export { FacultyQuickAccess } from "./FacultyQuickAccess";
export { FacultyOverview } from "./FacultyOverview";
export { FacultyAssessments } from "./FacultyAssessments";
export { FacultyMarks } from "./FacultyMarks";
export { FacultyCOPO } from "./FacultyCOPO";
export { FacultyStudents } from "./FacultyStudents";

export type FacultyPage =
	| "dashboard"
	| "assessments"
	| "marks"
	| "copo"
	| "students";
