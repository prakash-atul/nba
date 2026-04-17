import { ConcludeCourseDialog } from "./ConcludeCourseDialog";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp } from "lucide-react";
import type { Course } from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { facultyApi } from "@/services/api/faculty";
import { toast } from "sonner";
import { OfferingTestAverages } from "./OfferingTestAverages";
import { getFacultyOverviewColumns } from "./FacultyOverview.columns";

interface FacultyOverviewProps {
	courses: Course[];
	isLoading: boolean;
	onRefresh?: () => void;
}

export function FacultyOverview({
	courses,
	isLoading,
	onRefresh,
}: FacultyOverviewProps) {
	const [concludeData, setConcludeData] = useState<{
		isOpen: boolean;
		course: Course | null;
		isConcluding: boolean;
		canConclude: boolean;
		incompleteTests: string[];
	}>({
		isOpen: false,
		course: null,
		isConcluding: false,
		canConclude: true,
		incompleteTests: [],
	});

	const handleConcludeCourse = async () => {
		if (!concludeData.course || !concludeData.canConclude) return;
		const offeringId =
			concludeData.course.offering_id || concludeData.course.course_id;

		setConcludeData((prev) => ({ ...prev, isConcluding: true }));

		try {
			await facultyApi.concludeCourse(offeringId);
			toast.success("Course session concluded successfully", {
				description: "Rollbacks are not possible. Session deactivated.",
			});
			setConcludeData({
				isOpen: false,
				course: null,
				isConcluding: false,
				canConclude: true,
				incompleteTests: [],
			});
			if (onRefresh) onRefresh();
		} catch (error) {
			console.error("Failed to conclude course", error);
			toast.error("Failed to conclude course", {
				description:
					"You might not be authorized or the server encountered an error.",
			});
			setConcludeData((prev) => ({ ...prev, isConcluding: false }));
		}
	};

	const openConcludeDialog = async (course: Course) => {
		const offeringId = course.offering_id || course.course_id;
		try {
			const status =
				await facultyApi.checkCourseCompletionStatus(offeringId);
			setConcludeData({
				isOpen: true,
				course,
				isConcluding: false,
				canConclude: status.can_conclude,
				incompleteTests: status.incomplete_tests,
			});
		} catch (error) {
			console.error("Failed to check course status", error);
			toast.error("Failed to check course status");
		}
	};

	const columns = useMemo(
		() => getFacultyOverviewColumns(openConcludeDialog),
		[openConcludeDialog],
	);

	const activeCourses = useMemo(
		() => courses.filter((c) => c.is_active !== 0),
		[courses],
	);
	const pastCourses = useMemo(
		() => courses.filter((c) => c.is_active === 0),
		[courses],
	);

	const renderSubRow = (row: any) => {
		const offeringId = row.original.offering_id;
		if (!offeringId) return null;
		return <OfferingTestAverages offeringId={offeringId} />;
	};

	return (
		<div className="space-y-6">
			{/* Course List */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="w-5 h-5" />
						My Courses
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="active" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="active">
								Active Courses ({activeCourses.length})
							</TabsTrigger>
							<TabsTrigger value="past">
								Course History ({pastCourses.length})
							</TabsTrigger>
						</TabsList>
						<TabsContent value="active">
							<DataTable
								columns={columns}
								data={activeCourses}
								refreshing={isLoading}
								renderSubRow={renderSubRow}
							/>
						</TabsContent>
						<TabsContent value="past">
							<DataTable
								columns={columns}
								data={pastCourses}
								refreshing={isLoading}
								renderSubRow={renderSubRow}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Performance Insights */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5" />
						Performance Insights
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
							<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
								Total Courses
							</p>
							<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
								{courses.length}
							</p>
						</div>
						<div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
							<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
								Active Semester
							</p>
							<p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
								{courses[0]?.semester ?? "N/A"}
							</p>
						</div>
						<div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
							<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
								Total Credits
							</p>
							<p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
								{courses.reduce((sum, c) => sum + c.credit, 0)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<ConcludeCourseDialog
				open={concludeData.isOpen}
				onOpenChange={(open: boolean) =>
					!concludeData.isConcluding &&
					setConcludeData((prev) => ({ ...prev, isOpen: open }))
				}
				canConclude={concludeData.canConclude}
				isConcluding={concludeData.isConcluding}
				course={concludeData.course}
				incompleteTests={concludeData.incompleteTests}
				onConclude={handleConcludeCourse}
			/>
		</div>
	);
}
