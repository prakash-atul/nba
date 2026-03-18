import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import { CourseList } from "@/features/courses";
import { staffApi } from "@/services/api/staff";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const currentYear = new Date().getFullYear();
const currentSemester = new Date().getMonth() < 6 ? "Spring" : "Autumn";

export function StaffCourses() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const [activeTab, setActiveTab] = useState<"current" | "all">("current");

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Course Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "current" | "all")}
					className="w-full"
				>
					<TabsList>
						<TabsTrigger value="current">
							Current Semester
						</TabsTrigger>
						<TabsTrigger value="all">All Offerings</TabsTrigger>
					</TabsList>

					<TabsContent value="current" className="space-y-4">
						<CourseList
							fetchFn={(params) =>
								staffApi.getDepartmentCourses({
									...params,
									year: currentYear,
									semester: currentSemester,
								})
							}
							title={`Current Courses - ${currentSemester} ${currentYear}`}
							permissions={{
								canViewDepartment: true,
							}}
							showYear={false}
							showSemester={false}
						/>
					</TabsContent>

					<TabsContent value="all" className="space-y-4">
						<CourseList
							fetchFn={(params) =>
								staffApi.getDepartmentCourses(params)
							}
							title="All Course Offerings"
							permissions={{
								canViewDepartment: true,
							}}
							availableFilters={["year", "semester"]}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
