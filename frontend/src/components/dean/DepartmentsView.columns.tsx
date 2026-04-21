import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { DeanDepartment } from "@/services/api";
import { sortableHeader } from "../../features/shared/tableUtils";

export function getDeanDepartmentColumns(): ColumnDef<DeanDepartment>[] {
	return [
		{
			accessorKey: "department_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge variant="outline">
					{row.getValue("department_code")}
				</Badge>
			),
		},
		{
			accessorKey: "department_name",
			header: sortableHeader("Department Name", "text-left"),
			cell: ({ row }) => (
				<div className="font-medium text-left">
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
					<span className="text-left">{hodName}</span>
				) : (
					<span className="text-muted-foreground italic text-left">
						Not assigned
					</span>
				);
			},
		},
		{
			accessorKey: "faculty_count",
			header: sortableHeader("Faculty"),
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
			header: sortableHeader("Staff"),
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
			header: sortableHeader("Courses"),
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
			header: sortableHeader("Students"),
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
}
