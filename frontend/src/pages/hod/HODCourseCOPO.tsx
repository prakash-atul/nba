import { useLocation, useParams, Link } from "react-router-dom";
import { debugLogger } from "@/lib/debugLogger";
import { ArrowLeft } from "lucide-react";
import { COPOMapping } from "@/features/copo/COPOMapping";

export function HODCourseCOPO() {
	const { id } = useParams<{ id: string }>();
	const location = useLocation();

	// HOD COPO is offering-scoped
	const offeringId = Number(id);
	const courseData =
		location.state?.courseData ||
		location.state?.item ||
		location.state?.offering;

	debugLogger.debug("HODCourseCOPO", "Rendering COPO Mapping", {
		offeringId,
		hasState: !!location.state,
		courseData,
	});

	if (!offeringId) {
		debugLogger.warn("HODCourseCOPO", "Invalid offering ID provided in URL");
		return <div className="p-8">Invalid offering ID</div>;
	}

	return (
		<div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
			{/* Header */}
			<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10 flex gap-4 items-center">
				<Link
					to="/hod/courses"
					className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
				>
					<ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
				</Link>
				<div>
					<h1 className="text-xl font-bold text-gray-900 dark:text-white">
						Course CO-PO Mapping
					</h1>
					{courseData && (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{courseData.course_code || courseData.courseCode} -{" "}
							{courseData.course_name || courseData.courseName}
						</p>
					)}
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 p-6 z-0">
				<div className="max-w-7xl mx-auto">
					<COPOMapping
						courseId={offeringId}
						courseCode={
							courseData?.course_code ||
							courseData?.courseCode ||
							"Unknown Code"
						}
						courseName={
							courseData?.course_name ||
							courseData?.courseName ||
							"Unknown Course Name"
						}
						facultyName={
							courseData?.faculty_name ||
							courseData?.facultyName ||
							courseData?.faculty?.name ||
							"Unknown Faculty"
						}
						departmentName={
							courseData?.department_name ||
							courseData?.departmentName ||
							"Unknown Department"
						}
						semester={courseData?.semester || "Unknown Semester"}
						year={courseData?.year || new Date().getFullYear()}
						readOnly={true}
					/>
				</div>
			</div>
		</div>
	);
}
