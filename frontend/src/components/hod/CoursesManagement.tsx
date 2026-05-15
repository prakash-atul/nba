import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseList } from "@/features/courses/CourseList";
import { hodApi } from "@/services/api/hod";
import { debugLogger } from "@/lib/debugLogger";
import { useEffect } from "react";

export function CoursesManagement() {
	useEffect(() => {
		debugLogger.info("CoursesManagement", "Mounted");
	}, []);

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth();
	const currentSemester = currentMonth >= 6 ? "Odd" : "Even";

	return (
		<Tabs defaultValue="current" className="space-y-4">
			<TabsList>
				<TabsTrigger value="current">Current Offerings</TabsTrigger>
				<TabsTrigger value="all">All Offerings</TabsTrigger>
				<TabsTrigger value="base">Base Courses</TabsTrigger>
			</TabsList>

			<TabsContent value="current">
				<CourseList
					title="Current Semester Offerings"
					mode="offering"
					fetchFn={(params) => hodApi.getDepartmentCourses(params)}
					initialFilters={{
						academic_year: currentYear.toString(),
						semester: currentSemester,
					}}
					permissions={{
						canEdit: true,
						canDelete: true,
						canViewDepartment: false,
					}}
				/>
			</TabsContent>

			<TabsContent value="all">
				<CourseList
					title="All Course Offerings"
					mode="offering"
					fetchFn={(params) => hodApi.getDepartmentCourses(params)}
					permissions={{
						canEdit: true,
						canDelete: true,
						canViewDepartment: false,
					}}
				/>
			</TabsContent>

			<TabsContent value="base">
				<CourseList
					title="Department Base Courses"
					mode="base"
					fetchFn={(params) => hodApi.getBaseCourses(params)}
					permissions={{
						canEdit: true,
						canDelete: true,
						canViewDepartment: false,
					}}
				/>
			</TabsContent>
		</Tabs>
	);
}
