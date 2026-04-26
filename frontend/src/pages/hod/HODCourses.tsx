import { useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout";
import {
	CourseList,
	BaseCourseList,
	CourseFormDialog,
} from "@/features/courses";
import { hodApi } from "@/services/api/hod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { debugLogger } from "@/lib/debugLogger";

const currentYear = new Date().getFullYear();
const currentSemester = new Date().getMonth() < 6 ? "Spring" : "Autumn";

export function HODCourses() {
	const navigate = useNavigate();
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const [activeTab, setActiveTab] = useState<"current" | "all" | "catalog">(
		"current",
	);

	const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
	const [initialOfferData, setInitialOfferData] = useState<any>(null);

	useState(() => {
		debugLogger.info("HODCourses", "Component mounted");
	});

	const handleOfferCourse = useCallback((course: any) => {
		setInitialOfferData({
			base_course_id: course.course_id,
			course_code: course.course_code,
			course_name: course.course_name,
			credit: course.credit?.toString() || "3",
			year: currentYear.toString(),
			semester: currentSemester,
		});
		setIsOfferDialogOpen(true);
	}, []);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Courses Management"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
			/>
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<Tabs
					value={activeTab}
					onValueChange={(v) =>
						setActiveTab(v as "current" | "all" | "catalog")
					}
					className="w-full"
				>
					<TabsList className="mb-4">
						<TabsTrigger value="current">
							Current Semester
						</TabsTrigger>
						<TabsTrigger value="all">All Offerings</TabsTrigger>
						<TabsTrigger value="catalog">
							Course Catalog
						</TabsTrigger>
					</TabsList>

					<TabsContent value="current" className="space-y-4">
						<CourseList
							fetchFn={(params) =>
								hodApi.getDepartmentCourses({
									...params,
									year: currentYear,
									semester: currentSemester,
								})
							}
							title={`Courses - ${currentSemester} ${currentYear}`}
							permissions={{
								canEdit: true,
								canDelete: true,
								canCreate: true,
							}}
							onCourseCreate={async (data) => {
								await hodApi.createCourse(data);
							}}
							onCourseUpdate={async (courseId, data) => {
								await hodApi.updateCourse(courseId, data);
							}}
							onCourseDelete={async (courseId) => {
								await hodApi.deleteCourse(courseId);
							}}
							onViewCOPO={(course) =>
								navigate(
									`/hod/courses/${course.offering_id || course.course_id}/copo`,
									{
										state: { courseData: course },
									},
								)
							}
							showYear={true}
							showSemester={true}
						/>
					</TabsContent>

					<TabsContent value="all" className="space-y-4">
						<CourseList
							fetchFn={(params) =>
								hodApi.getDepartmentCourses(params)
							}
							title="All Course Offerings"
							permissions={{
								canEdit: false,
								canDelete: false,
								canCreate: false,
							}}
							onCourseCreate={async (data) => {
								await hodApi.createCourse(data);
							}}
							onCourseUpdate={async (courseId, data) => {
								await hodApi.updateCourse(courseId, data);
							}}
							onCourseDelete={async (courseId) => {
								await hodApi.deleteCourse(courseId);
							}}
							onViewCOPO={(course) =>
								navigate(
									`/hod/courses/${course.offering_id || course.course_id}/copo`,
									{
										state: { courseData: course },
									},
								)
							}
							availableFilters={["year", "semester", "status"]}
							showYear={true}
							showSemester={true}
						/>
					</TabsContent>

					<TabsContent value="catalog" className="space-y-4">
						<BaseCourseList
							fetchFn={(params) => hodApi.getBaseCourses(params)}
							title="Course Catalog"
							permissions={{
								canEdit: true,
								canDelete: true,
								canCreate: true,
								canOffer: true,
							}}
							onCourseCreate={async (data) => {
								await hodApi.createBaseCourse(data);
							}}
							onCourseUpdate={async (courseId, data) => {
								await hodApi.updateBaseCourse(courseId, data);
							}}
							onCourseDelete={async (courseId) => {
								await hodApi.deleteBaseCourse(courseId);
							}}
							onOfferCourse={handleOfferCourse}
						/>
					</TabsContent>
				</Tabs>
			</div>

			<CourseFormDialog
				mode="create"
				courseType="offering"
				open={isOfferDialogOpen}
				onOpenChange={setIsOfferDialogOpen}
				initialData={initialOfferData}
				onSave={async (data) => {
					try {
						await hodApi.createCourse(data);
						toast.success("Course offered successfully");
						setIsOfferDialogOpen(false);
					} catch (error) {
						console.error("Failed to offer course:", error);
						toast.error("Failed to offer course");
					}
				}}
			/>
		</div>
	);
}
