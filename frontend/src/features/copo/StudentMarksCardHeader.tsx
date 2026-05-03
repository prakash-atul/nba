import { CardHeader, CardTitle } from "@/components/ui/card";

interface StudentMarksCardHeaderProps {
	facultyName: string;
	departmentName: string;
	courseName: string;
	courseCode: string;
	programme?: string;
	year?: string | number;
	semester?: string | number;
	session?: string;
}

export function StudentMarksCardHeader({
	facultyName,
	departmentName,
	courseName,
	courseCode,
	programme,
	year,
	semester,
	session,
}: StudentMarksCardHeaderProps) {
	const getAcademicYear = (yr: string | number | undefined) => String(yr || "");
	const getSemesterDisplay = (sem: string | number | undefined) => String(sem || "");
	const getCurrentSession = () => session || String(year || "");

	return (
		<CardHeader className="bg-orange-100 dark:bg-orange-950 border-b-4 border-orange-500">
			<div className="space-y-2">
				<CardTitle className="text-xl text-center text-gray-900 dark:text-white font-bold">
					TEZPUR UNIVERSITY
				</CardTitle>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div className="flex gap-2">
						<span className="font-semibold">Faculty Name:</span>
						<span>{facultyName}</span>
					</div>
					<div className="flex gap-2">
						<span className="font-semibold">BRANCH:</span>
						<span>{departmentName}</span>
					</div>
					<div className="flex gap-2">
						<span className="font-semibold">Programme:</span>
						<span>{programme || "B. Tech"}</span>
					</div>
					<div className="flex gap-2">
						<span className="font-semibold">YEAR:</span>
						<span>{getAcademicYear(year)}</span>
						<span className="font-semibold ml-4">SEM:</span>
						<span>{getSemesterDisplay(semester)}</span>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div className="flex gap-2">
						<span className="font-semibold">Course:</span>
						<span>{courseName}</span>
					</div>
					<div className="flex gap-2">
						<span className="font-semibold">Course Code:</span>
						<span>{courseCode}</span>
						<span className="font-semibold ml-4">SESSION:</span>
						<span>{getCurrentSession()}</span>
					</div>
				</div>
			</div>
		</CardHeader>
	);
}
