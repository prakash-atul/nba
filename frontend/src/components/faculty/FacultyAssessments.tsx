import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Plus,
	Users,
	ClipboardList,
	TrendingUp,
	GraduationCap,
} from "lucide-react";
import { CreateAssessmentForm } from "@/features/assessments/CreateAssessmentForm";
import { TestsList } from "@/features/assessments/TestsList";
import { EnrollStudentsDialog } from "@/features/assessments/EnrollStudentsDialog";
import { apiService } from "@/services/api";
import type { Course, Test, CourseStats } from "@/services/api";

interface FacultyAssessmentsProps {
	selectedCourse: Course | null;
}

export function FacultyAssessments({
	selectedCourse,
}: FacultyAssessmentsProps) {
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEnrollDialog, setShowEnrollDialog] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [testsCount, setTestsCount] = useState(0);
	const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);

	useEffect(() => {
		console.log(
			"[FacultyAssessments] selectedCourse changed:",
			selectedCourse?.offering_id ?? null,
		);
		if (!selectedCourse?.offering_id) {
			console.log(
				"[FacultyAssessments] No course selected — clearing stats",
			);
			setCourseStats(null);
			return;
		}
		let cancelled = false;
		setStatsLoading(true);
		console.log(
			"[FacultyAssessments] Fetching stats for offering_id:",
			selectedCourse.offering_id,
		);
		apiService
			.getFacultyCourseStats(selectedCourse.offering_id)
			.then((data) => {
				console.log("[FacultyAssessments] Stats fetched:", data);
				if (!cancelled) setCourseStats(data);
			})
			.catch((err) => {
				console.error("[FacultyAssessments] Stats fetch failed:", err);
				if (!cancelled) setCourseStats(null);
			})
			.finally(() => {
				if (!cancelled) setStatsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [selectedCourse?.offering_id]);

	// Re-fetch stats when assessments list changes (create/delete)
	useEffect(() => {
		if (!selectedCourse?.offering_id || refreshTrigger === 0) return;
		console.log(
			"[FacultyAssessments] Refreshing stats after assessment change, trigger:",
			refreshTrigger,
		);
		apiService
			.getFacultyCourseStats(selectedCourse.offering_id)
			.then((data) => {
				console.log("[FacultyAssessments] Stats refreshed:", data);
				setCourseStats(data);
			})
			.catch((err) =>
				console.error(
					"[FacultyAssessments] Stats refresh failed:",
					err,
				),
			);
	}, [refreshTrigger, selectedCourse?.offering_id]);

	const handleAssessmentCreated = () => {
		console.log(
			"[FacultyAssessments] Assessment created — triggering refresh",
		);
		setShowCreateForm(false);
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleGoToMarks = (_test: Test) => {
		// Navigate to marks entry — parent handles this via nav
	};

	return (
		<div className="h-full flex flex-col">
			{/* ── Page header + toolbar ─────────────────────────────────── */}
			{!showCreateForm && (
				<div className="px-6 pt-5 pb-4 border-b bg-background shrink-0 space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<h3 className="text-base font-semibold">
								Assessments
							</h3>
							{selectedCourse ? (
								<p className="text-sm text-muted-foreground mt-0.5">
									{selectedCourse.course_code} —{" "}
									{selectedCourse.course_name} &bull;{" "}
									{selectedCourse.semester} Semester{" "}
									{selectedCourse.year}
								</p>
							) : (
								<p className="text-sm text-muted-foreground mt-0.5">
									Select a course to manage its assessments
								</p>
							)}
						</div>
						<div className="flex gap-2 shrink-0">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowEnrollDialog(true)}
								disabled={!selectedCourse}
							>
								<Users className="w-4 h-4 mr-2" />
								Enroll Students
							</Button>
							<Button
								size="sm"
								onClick={() => setShowCreateForm(true)}
								disabled={!selectedCourse}
							>
								<Plus className="w-4 h-4 mr-2" />
								Create Assessment
							</Button>
						</div>
					</div>

					{/* Stat cards */}
					{selectedCourse && (
						<div className="grid grid-cols-3 gap-3">
							{/* Total Assessments */}
							<div className="rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 p-3 flex items-center gap-3">
								<div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
									<ClipboardList className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="min-w-0">
									<p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium truncate">
										Total Assessments
									</p>
									{statsLoading ? (
										<Skeleton className="h-5 w-8 mt-0.5" />
									) : (
										<p className="text-lg font-bold text-blue-700 dark:text-blue-300 leading-tight">
											{courseStats?.totalAssessments ??
												testsCount}
										</p>
									)}
								</div>
							</div>
							{/* Avg. Performance */}
							<div className="rounded-xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 p-3 flex items-center gap-3">
								<div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
									<TrendingUp className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<div className="min-w-0">
									<p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium truncate">
										Avg. Performance
									</p>
									{statsLoading ? (
										<Skeleton className="h-5 w-12 mt-0.5" />
									) : courseStats?.avgPerformance != null ? (
										<p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
											{courseStats.avgPerformance}%
										</p>
									) : (
										<div>
											<p className="text-sm font-bold text-emerald-700/60 dark:text-emerald-300/60 leading-tight">
												No marks yet
											</p>
											{courseStats &&
												courseStats.marksCount === 0 &&
												courseStats.totalAssessments >
													0 && (
													<p className="text-[10px] text-emerald-600/50 dark:text-emerald-400/50 leading-tight mt-0.5">
														Enter marks to track
													</p>
												)}
										</div>
									)}
								</div>
							</div>
							{/* Active Students */}
							<div className="rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 p-3 flex items-center gap-3">
								<div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
									<GraduationCap className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
								</div>
								<div className="min-w-0">
									<p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium truncate">
										Active Students
									</p>
									{statsLoading ? (
										<Skeleton className="h-5 w-8 mt-0.5" />
									) : (
										<p className="text-lg font-bold text-amber-700 dark:text-amber-300 leading-tight">
											{courseStats?.activeStudents ?? "—"}
										</p>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── Main content ─────────────────────────────────────────── */}
			<div className="flex-1 overflow-hidden">
				{showCreateForm ? (
					<CreateAssessmentForm
						selectedCourse={selectedCourse}
						onSuccess={handleAssessmentCreated}
						onCancel={() => setShowCreateForm(false)}
						contextStats={
							courseStats
								? {
										assessments:
											courseStats.totalAssessments,
										students: courseStats.activeStudents,
									}
								: null
						}
					/>
				) : (
					<ScrollArea className="h-full">
						<div className="p-6">
							<TestsList
								course={selectedCourse}
								refreshTrigger={refreshTrigger}
								onGoToMarks={handleGoToMarks}
								onCountChange={setTestsCount}
							/>
						</div>
					</ScrollArea>
				)}
			</div>

			{/* ── Enroll Students Dialog ────────────────────────────────── */}
			<EnrollStudentsDialog
				open={showEnrollDialog}
				onOpenChange={setShowEnrollDialog}
				course={selectedCourse}
			/>
		</div>
	);
}
