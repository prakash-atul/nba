import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { formatOrdinal } from "@/lib/utils";
import { sortableHeader } from "@/features/shared/tableUtils";
import { ConfirmDeleteDialog } from "@/features/shared";
import type { StaffCourse } from "@/services/api";

interface CourseColumnsProps {
	onEdit: (course: StaffCourse) => void;
	onDelete: (courseId: number, courseName: string) => void | Promise<void>;
}

export const getCourseColumns = ({
	onEdit,
	onDelete,
}: CourseColumnsProps): ColumnDef<StaffCourse>[] => [
	{
		accessorKey: "course_code",
		header: sortableHeader("Code"),
		cell: ({ row }) => (
			<Badge variant="outline" className="font-mono">
				{row.original.course_code}
			</Badge>
		),
	},
	{
		accessorKey: "course_name",
		header: sortableHeader("Course Name", "text-left"),
		cell: ({ row }) => (
			<div
				className="font-medium text-left max-w-[220px] truncate"
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
			<Badge variant="outline">{row.original.credit}</Badge>
		),
	},
	{
		accessorKey: "faculty_name",
		header: sortableHeader("Faculty", "text-left"),
		cell: ({ row }) => (
			<div className="text-muted-foreground text-left max-w-[160px] truncate">
				{row.original.faculty_name || "—"}
			</div>
		),
	},
	{
		accessorKey: "year",
		header: "Year",
		cell: ({ row }) => row.original.year ?? "—",
	},
	{
		accessorKey: "semester",
		header: "Semester",
		cell: ({ row }) => (
			<Badge variant="secondary" className="font-medium">
				{formatOrdinal(row.original.semester)}
			</Badge>
		),
	},
	{
		accessorKey: "enrollment_count",
		header: "Enrolled",
		cell: ({ row }) => (
			<Badge
				variant="secondary"
				className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
			>
				{row.original.enrollment_count ?? 0}
			</Badge>
		),
	},
	{
		id: "actions",
		header: () => <div className="text-right">Actions</div>,
		cell: ({ row }) => {
			const course = row.original;
			return (
				<div className="flex items-center justify-end gap-2">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
						onClick={() => onEdit(course)}
					>
						<Pencil className="w-4 h-4" />
					</Button>
					<ConfirmDeleteDialog
						title={<>Delete Course</>}
						description={
							<>
								Are you sure you want to delete "
								{course.course_name}"? This will also delete all
								associated tests, marks, and enrollments. This
								action cannot be undone.
							</>
						}
						onConfirm={() =>
							onDelete(course.course_id, course.course_name)
						}
						trigger={
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						}
					/>
				</div>
			);
		},
	},
];
