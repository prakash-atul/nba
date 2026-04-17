import { ConcludeCourseDialog } from './ConcludeCourseDialog';
import { useState, useEffect, useCallback } from "react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	BookOpen,
	TrendingUp,
	Archive,
	ChevronRight,
	Loader2,
} from "lucide-react";
import type { Course } from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { facultyApi } from "@/services/api/faculty";
import type { TestAverage } from "@/services/api/types";
import { toast } from "sonner";
import { sortableHeader } from "../../features/shared/tableUtils";

// ── Test type colour map ─────────────────────────────────────────────────────
const TEST_TYPE_COLORS: Record<string, string> = {
	"Mid Sem":
		"bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
	"End Sem":
		"bg-rose-50   text-rose-700   dark:bg-rose-950   dark:text-rose-300   border-rose-200   dark:border-rose-800",
	Assignment:
		"bg-amber-50  text-amber-700  dark:bg-amber-950  dark:text-amber-300  border-amber-200  dark:border-amber-800",
	Quiz: "bg-sky-50    text-sky-700    dark:bg-sky-950    dark:text-sky-300    border-sky-200    dark:border-sky-800",
};

/** Expanded sub-row: lazy-loads per-test averages for a course offering */
function OfferingTestAverages({ offeringId }: { offeringId: number }) {
	const [averages, setAverages] = useState<TestAverage[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await facultyApi.getOfferingTestAverages(offeringId);
			setAverages(res);
		} catch {
			setError("Failed to load averages");
		} finally {
			setLoading(false);
		}
	}, [offeringId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 px-6 py-3 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading test averages…
			</div>
		);
	}
	if (error) {
		return (
			<div className="px-6 py-3 text-sm text-destructive">{error}</div>
		);
	}
	if (!averages || averages.length === 0) {
		return (
			<div className="px-6 py-3 text-sm text-muted-foreground">
				No tests found for this offering.
			</div>
		);
	}

	return (
		<div className="px-6 py-3">
			<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				Per-Test Averages
			</p>
			<div className="flex flex-wrap gap-3">
				{averages.map((t) => {
					const colorCls =
						TEST_TYPE_COLORS[t.test_type] ??
						"bg-gray-50 text-gray-600 border-gray-200";
					const pct = t.avg_pct != null ? `${t.avg_pct}%` : "—";
					const marks =
						t.avg_marks != null
							? `${t.avg_marks} / ${t.full_marks}`
							: `— / ${t.full_marks}`;
					return (
						<div
							key={t.test_id}
							className="flex flex-col gap-1 rounded-lg border bg-white dark:bg-slate-900 p-3 min-w-[140px]"
						>
							<div className="flex items-center justify-between gap-2">
								<Badge
									variant="secondary"
									className={`text-[10px] ${colorCls}`}
								>
									{t.test_type}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{t.students_assessed} students
								</span>
							</div>
							<p
								className="text-sm font-medium truncate"
								title={t.test_name}
							>
								{t.test_name}
							</p>
							<div className="flex items-baseline gap-1">
								<span className="text-lg font-bold tabular-nums">
									{pct}
								</span>
								<span className="text-xs text-muted-foreground">
									({marks})
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

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

	const columns = useMemo<ColumnDef<Course>[]>(
		() => [
			// ── Expand toggle ──────────────────────────────────────────────────
			{
				id: "expand",
				header: () => null,
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-muted-foreground"
						onClick={() => row.toggleExpanded()}
						aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
					>
						<ChevronRight
							className={`h-4 w-4 transition-transform duration-150 ${
								row.getIsExpanded() ? "rotate-90" : ""
							}`}
						/>
					</Button>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "course_code",
				header: sortableHeader("Code"),
				cell: ({ row }) => (
					<Badge variant="outline">{row.original.course_code}</Badge>
				),
			},
			{
				accessorKey: "course_name",
				header: sortableHeader("Course Name"),
				cell: ({ row }) => (
					<div
						className="max-w-60 truncate"
						title={row.original.course_name}
					>
						{row.original.course_name}
					</div>
				),
			},
			{
				accessorKey: "credit",
				header: "Credits",
				cell: ({ row }) => (
					<Badge variant="secondary">{row.original.credit} Cr</Badge>
				),
			},
			{
				accessorKey: "year",
				header: "Year",
				cell: ({ row }) => row.original.year,
			},
			{
				accessorKey: "semester",
				header: "Semester",
				cell: ({ row }) => (
					<Badge variant="outline">{row.original.semester}</Badge>
				),
			},
			{
				accessorKey: "enrollment_count",
				header: sortableHeader("Enrolled"),
				cell: ({ row }) => (
					<div className="text-center">
						<Badge
							variant="secondary"
							className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
						>
							{(row.getValue("enrollment_count") as number) ?? 0}
						</Badge>
					</div>
				),
			},
			{
				accessorKey: "test_count",
				header: sortableHeader("Tests"),
				cell: ({ row }) => (
					<div className="text-center">
						<Badge
							variant="secondary"
							className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
						>
							{(row.getValue("test_count") as number) ?? 0}
						</Badge>
					</div>
				),
			},
			{
				accessorKey: "avg_score_pct",
				header: sortableHeader("Avg Score"),
				cell: ({ row }) => {
					const pct = row.original.avg_score_pct;
					if (pct == null) {
						return (
							<div className="text-center text-muted-foreground text-sm">
								—
							</div>
						);
					}
					const color =
						pct >= 75
							? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
							: pct >= 50
								? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
								: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
					return (
						<div className="text-center">
							<Badge variant="secondary" className={color}>
								{pct}%
							</Badge>
						</div>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) =>
					row.original.is_active === 0 ? (
						<Badge
							variant="outline"
							className="text-muted-foreground bg-muted"
						>
							Concluded
						</Badge>
					) : (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => openConcludeDialog(row.original)}
						>
							<Archive className="h-4 w-4 mr-2" />
							Conclude
						</Button>
					),
			},
		],
		[],
	);

	const activeCourses = useMemo(
		() => courses.filter((c) => c.is_active !== 0),
		[courses],
	);
	const pastCourses = useMemo(
		() => courses.filter((c) => c.is_active === 0),
		[courses],
	);

	const renderSubRow = (row: Row<Course>) => {
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
