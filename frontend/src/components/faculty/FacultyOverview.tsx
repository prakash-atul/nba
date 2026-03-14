import { useState } from "react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, ArrowUpDown, Archive } from "lucide-react";
import type { Course } from "@/services/api";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { facultyApi } from "@/services/api/faculty";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface FacultyOverviewProps {
	courses: Course[];
	isLoading: boolean;
	onRefresh?: () => void;
}

export function FacultyOverview({ courses, isLoading, onRefresh }: FacultyOverviewProps) {
	const [concludeData, setConcludeData] = useState<{ isOpen: boolean; course: Course | null; isConcluding: boolean }>({
		isOpen: false,
		course: null,
		isConcluding: false
	});

	const handleConcludeCourse = async () => {
		if (!concludeData.course) return;
		const offeringId = concludeData.course.offering_id || concludeData.course.course_id;

		setConcludeData((prev) => ({ ...prev, isConcluding: true }));
		
		try {
			await facultyApi.concludeCourse(offeringId);
			toast.success("Course session concluded successfully", {
				description: "Rollbacks are not possible. Raw marks purged and session deactivated.",
			});
			setConcludeData({ isOpen: false, course: null, isConcluding: false });
			if (onRefresh) onRefresh();
		} catch (error) {
			console.error("Failed to conclude course", error);
			toast.error("Failed to conclude course", {
				description: "You might not be authorized or the server encountered an error."
			});
			setConcludeData((prev) => ({ ...prev, isConcluding: false }));
		}
	};
	const columns = useMemo<ColumnDef<Course>[]>(
		() => [
			{
				accessorKey: "course_code",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Code
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<Badge variant="outline">{row.original.course_code}</Badge>
				),
			},
			{
				accessorKey: "course_name",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Course Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
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
				cell: ({ row }) => `Year ${row.original.year}`,
			},
			{
				accessorKey: "semester",
				header: "Semester",
				cell: ({ row }) => (
					<Badge variant="outline">{row.original.semester}</Badge>
				),
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => (
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setConcludeData({ isOpen: true, course: row.original, isConcluding: false })}
					>
						<Archive className="h-4 w-4 mr-2" />
						Conclude
					</Button>
				),
			}
		],
		[],
	);

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
					<DataTable
						columns={columns}
						data={courses}
						refreshing={isLoading}
					/>
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

			<AlertDialog open={concludeData.isOpen} onOpenChange={(open) => !concludeData.isConcluding && setConcludeData(prev => ({ ...prev, isOpen: open }))}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently conclude the session for <span className="font-bold">{concludeData.course?.course_name}</span>.
							<br />
							<br />
							All raw mark drafts will be securely purged to save space (since aggregated insights are safely submitted) and you will no longer have active faculty assignments to this specific offering. Enrolled students will also be marked as Completed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={concludeData.isConcluding}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConcludeCourse();
							}}
							disabled={concludeData.isConcluding}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{concludeData.isConcluding ? "Concluding Session..." : "Yes, Conclude Session"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
