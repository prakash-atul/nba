import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, BookOpen, ClipboardList, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DeanCourse } from "@/services/api";

interface CoursesViewProps {
	courses: DeanCourse[];
	isLoading: boolean;
}

export function CoursesView({ courses, isLoading }: CoursesViewProps) {
	// Get unique departments and years for filters
	const departments = Array.from(
		new Set(courses.map((c) => c.department_code).filter(Boolean)),
	) as string[];
	const years = Array.from(new Set(courses.map((c) => c.year))).sort(
		(a, b) => b - a,
	);

	const columns: ColumnDef<DeanCourse>[] = [
		{
			accessorKey: "course_code",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Code
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono">
					{row.getValue("course_code")}
				</Badge>
			),
		},
		{
			accessorKey: "course_name",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Course Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div
					className="font-medium max-w-[200px] truncate"
					title={row.getValue("course_name")}
				>
					{row.getValue("course_name")}
				</div>
			),
		},
		{
			accessorKey: "faculty_name",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Faculty
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{row.getValue("faculty_name") || "N/A"}
				</div>
			),
		},
		{
			accessorKey: "department_code",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Dept
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const dept = row.getValue("department_code") as string;
				return dept ? (
					<Badge
						variant="secondary"
						className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
					>
						{dept}
					</Badge>
				) : (
					"N/A"
				);
			},
			filterFn: (row, id, value) => {
				return value === "all" ? true : row.getValue(id) === value;
			},
		},
		{
			accessorKey: "year",
			header: ({ column }) => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
						>
							Year
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">{row.getValue("year")}</div>
			),
			filterFn: (row, id, value) => {
				return value === "all"
					? true
					: String(row.getValue(id)) === value;
			},
		},
		{
			accessorKey: "semester",
			header: ({ column }) => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
						>
							Sem
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">{row.getValue("semester")}</div>
			),
		},
		{
			accessorKey: "credit",
			header: ({ column }) => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
						>
							Credit
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">{row.getValue("credit")}</div>
			),
		},
		{
			accessorKey: "enrollment_count",
			header: ({ column }) => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
						>
							<Users className="w-4 h-4 mr-2" />
							Enrolled
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant="secondary"
						className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
					>
						{row.getValue("enrollment_count")}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "test_count",
			header: ({ column }) => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(
									column.getIsSorted() === "asc",
								)
							}
						>
							<ClipboardList className="w-4 h-4 mr-2" />
							Tests
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant="secondary"
						className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
					>
						{row.getValue("test_count")}
					</Badge>
				</div>
			),
		},
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BookOpen className="w-5 h-5" />
					All Courses
				</CardTitle>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={courses}
					searchKey="course_name"
					searchPlaceholder="Search courses..."
				>
					{(table) => (
						<div className="flex gap-2">
							<Select
								value={
									(table
										.getColumn("department_code")
										?.getFilterValue() as string) ?? "all"
								}
								onValueChange={(value) =>
									table
										.getColumn("department_code")
										?.setFilterValue(
											value === "all" ? "" : value,
										)
								}
							>
								<SelectTrigger className="w-[150px]">
									<SelectValue placeholder="Department" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Depts
									</SelectItem>
									{departments.map((dept) => (
										<SelectItem key={dept} value={dept}>
											{dept}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={
									(table
										.getColumn("year")
										?.getFilterValue() as string) ?? "all"
								}
								onValueChange={(value) =>
									table
										.getColumn("year")
										?.setFilterValue(
											value === "all" ? "" : value,
										)
								}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="Year" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Years
									</SelectItem>
									{years.map((year) => (
										<SelectItem
											key={year}
											value={year.toString()}
										>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</DataTable>
			</CardContent>
		</Card>
	);
}
