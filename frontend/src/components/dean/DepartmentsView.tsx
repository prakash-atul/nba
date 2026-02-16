import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	Building2,
	Users,
	BookOpen,
	GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeanDepartment } from "@/services/api";

interface DepartmentsViewProps {
	departments: DeanDepartment[];
	isLoading: boolean;
}

export function DepartmentsView({
	departments,
	isLoading,
}: DepartmentsViewProps) {
	const columns: ColumnDef<DeanDepartment>[] = [
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
						Code
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<Badge variant="outline">
					{row.getValue("department_code")}
				</Badge>
			),
		},
		{
			accessorKey: "department_name",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Department Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="font-medium">
					{row.getValue("department_name")}
				</div>
			),
		},
		{
			accessorKey: "hod_name",
			header: "HOD",
			cell: ({ row }) => {
				const hodName = row.original.hod_name;
				return hodName ? (
					<span>{hodName}</span>
				) : (
					<span className="text-muted-foreground italic">
						Not assigned
					</span>
				);
			},
		},
		{
			accessorKey: "faculty_count",
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
							Faculty
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
						{row.getValue("faculty_count")}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "staff_count",
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
							Staff
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant="secondary"
						className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
					>
						{row.getValue("staff_count")}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "course_count",
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
							Courses
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
						{row.getValue("course_count")}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "student_count",
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
							Students
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant="secondary"
						className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
					>
						{row.getValue("student_count")}
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
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
								<Building2 className="w-6 h-6 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.length}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Departments
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
								<Users className="w-6 h-6 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.reduce(
										(sum, d) => sum + d.faculty_count,
										0,
									)}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Faculty
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
								<BookOpen className="w-6 h-6 text-emerald-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.reduce(
										(sum, d) => sum + d.course_count,
										0,
									)}
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
							<div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
								<GraduationCap className="w-6 h-6 text-orange-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.reduce(
										(sum, d) => sum + d.student_count,
										0,
									)}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Students
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Departments Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="w-5 h-5" />
						All Departments
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={departments}
						searchKey="department_name"
						searchPlaceholder="Filter departments..."
					/>
				</CardContent>
			</Card>
		</div>
	);
}
