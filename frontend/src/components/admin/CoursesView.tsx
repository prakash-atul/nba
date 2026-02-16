import { DataTable } from "@/components/shared/DataTable";
import { DataTableFacetedFilter } from "@/components/shared/DataTableFacetedFilter";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminCourse } from "@/services/api";

interface CoursesViewProps {
	courses: AdminCourse[];
	refreshing: boolean;
}

export function CoursesView({ courses, refreshing }: CoursesViewProps) {
	const columns: ColumnDef<AdminCourse>[] = [
		{
			accessorKey: "course_code",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					Code
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("course_code")}</div>
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
					className="p-0 hover:bg-transparent"
				>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "credit",
			header: "Credits",
			cell: ({ row }) => (
				<Badge variant="outline">{row.getValue("credit")}</Badge>
			),
		},
		{
			accessorKey: "faculty_name",
			header: "Faculty",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "year",
			header: "Year",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id)?.toString());
			},
		},
		{
			accessorKey: "semester",
			header: "Semester",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id)?.toString());
			},
			cell: ({ row }) => (
				<Badge variant="secondary">
					Sem {row.getValue("semester")}
				</Badge>
			),
		},
	];

	const facultyOptions = Array.from(
		new Set(courses.map((c) => c.faculty_name)),
	)
		.filter(Boolean)
		.sort()
		.map((name) => ({ label: name, value: name }));

	const yearOptions = Array.from(new Set(courses.map((c) => c.year)))
		.sort()
		.map((year) => ({ label: year.toString(), value: year.toString() }));

	const semesterOptions = Array.from(new Set(courses.map((c) => c.semester)))
		.sort((a, b) => a - b)
		.map((sem) => ({ label: `Sem ${sem}`, value: sem.toString() }));

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold">Courses</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All courses in the system
				</p>
			</div>

			<DataTable
				columns={columns}
				data={courses}
				searchKey="course_name"
				searchPlaceholder="Filter by course name..."
				refreshing={refreshing}
			>
				{(table) => (
					<>
						<DataTableFacetedFilter
							column={table.getColumn("faculty_name")}
							title="Faculty"
							options={facultyOptions}
						/>
						<DataTableFacetedFilter
							column={table.getColumn("year")}
							title="Year"
							options={yearOptions}
						/>
						<DataTableFacetedFilter
							column={table.getColumn("semester")}
							title="Semester"
							options={semesterOptions}
						/>
					</>
				)}
			</DataTable>
		</div>
	);
}
