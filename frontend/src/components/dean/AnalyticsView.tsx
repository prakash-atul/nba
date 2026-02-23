import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import {
	ArrowUpDown,
	BarChart3,
	Building2,
	BookOpen,
	ClipboardList,
	GraduationCap,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DepartmentAnalytics } from "@/services/api";
import type { ColumnDef } from "@tanstack/react-table";

interface AnalyticsViewProps {
	analytics: DepartmentAnalytics[];
	isLoading: boolean;
}

const columns: ColumnDef<DepartmentAnalytics>[] = [
	{
		accessorKey: "department_code",
		header: ({ column }) => (
			<Button
				variant="ghost"
				size="sm"
				className="-ml-3 h-8"
				onClick={() =>
					column.toggleSorting(column.getIsSorted() === "asc")
				}
			>
				Department
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="flex items-baseline gap-2">
				<Badge
					variant="secondary"
					className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
				>
					{row.original.department_code}
				</Badge>
				<p className="text-muted-foreground mt-1">
					{row.original.department_name}
				</p>
			</div>
		),
	},
	{
		accessorKey: "total_courses",
		header: ({ column }) => (
			<div className="text-center">
				<Button
					variant="ghost"
					size="sm"
					className="h-8"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Courses
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			</div>
		),
		cell: ({ row }) => (
			<div className="text-center">
				<Badge
					variant="secondary"
					className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
				>
					{row.getValue("total_courses")}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "total_tests",
		header: ({ column }) => (
			<div className="text-center">
				<Button
					variant="ghost"
					size="sm"
					className="h-8"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Tests
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			</div>
		),
		cell: ({ row }) => (
			<div className="text-center">
				<Badge
					variant="secondary"
					className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
				>
					{row.getValue("total_tests")}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "total_students",
		header: ({ column }) => (
			<div className="text-center">
				<Button
					variant="ghost"
					size="sm"
					className="h-8"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Students
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			</div>
		),
		cell: ({ row }) => (
			<div className="text-center">
				<Badge
					variant="secondary"
					className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
				>
					{row.getValue("total_students")}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "total_enrollments",
		header: ({ column }) => (
			<div className="text-center">
				<Button
					variant="ghost"
					size="sm"
					className="h-8"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Enrollments
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			</div>
		),
		cell: ({ row }) => (
			<div className="text-center">
				<Badge
					variant="secondary"
					className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
				>
					{row.getValue("total_enrollments")}
				</Badge>
			</div>
		),
	},
	{
		id: "avg_enrollment",
		accessorFn: (row) =>
			row.total_courses > 0
				? row.total_enrollments / row.total_courses
				: 0,
		header: ({ column }) => (
			<div className="text-center">
				<Button
					variant="ghost"
					size="sm"
					className="h-8"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Avg Enrollment/Course
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			</div>
		),
		cell: ({ row }) => {
			const courses = row.original.total_courses;
			const enrollments = row.original.total_enrollments;
			return (
				<div className="text-center font-medium">
					{courses > 0 ? (enrollments / courses).toFixed(1) : "0"}
				</div>
			);
		},
	},
];

export function AnalyticsView({ analytics, isLoading }: AnalyticsViewProps) {
	// Calculate totals
	const totals = analytics.reduce(
		(acc, dept) => ({
			courses: acc.courses + dept.total_courses,
			tests: acc.tests + dept.total_tests,
			students: acc.students + dept.total_students,
			enrollments: acc.enrollments + dept.total_enrollments,
		}),
		{ courses: 0, tests: 0, students: 0, enrollments: 0 },
	);

	// Sort by total courses (descending) - Initial sort for Datatable or keep as is?
	// The previous code sorted explicitly. `DataTable` handles local sorting if configured,
	// but providing pre-sorted data is fine too.
	const sortedAnalytics = [...analytics].sort(
		(a, b) => b.total_courses - a.total_courses,
	);

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
								<BookOpen className="w-6 h-6 text-emerald-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{totals.courses}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Courses
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
								<ClipboardList className="w-6 h-6 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{totals.tests}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Tests
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
								<GraduationCap className="w-6 h-6 text-orange-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{totals.students}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Students
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
								<Users className="w-6 h-6 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{totals.enrollments}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Enrollments
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Department Analytics Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="w-5 h-5" />
						Department-wise Analytics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={analytics}
						searchKey="department_code"
						searchPlaceholder="Search departments..."
						refreshing={isLoading}
					/>
				</CardContent>
			</Card>

			{/* Visual Analytics - Bar representation */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="w-5 h-5" />
						Courses Distribution by Department
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{sortedAnalytics.map((dept) => {
							const maxCourses = Math.max(
								...analytics.map((d) => d.total_courses),
								1,
							);
							const percentage =
								(dept.total_courses / maxCourses) * 100;

							return (
								<div
									key={dept.department_id}
									className="space-y-2"
								>
									<div className="flex justify-between text-sm">
										<span className="font-medium">
											{dept.department_code}
										</span>
										<span className="text-muted-foreground">
											{dept.total_courses} courses
										</span>
									</div>
									<div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
										<div
											className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
											style={{ width: `${percentage}%` }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
