import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserPlus, BookOpen } from "lucide-react";
import type { Programme } from "@/services/api";
import { ConfirmDeleteDialog } from "../../features/shared";
import { sortableHeader } from "../../features/shared/tableUtils";

interface ProgrammeColumnProps {
	onEdit?: (programme: Programme) => void;
	onDelete?: (programme: Programme) => void;
	onEnroll?: (programme: Programme) => void;
	onManageCourses?: (programme: Programme) => void;
}

export function getProgrammeColumns({
	onEdit,
	onDelete,
	onEnroll,
	onManageCourses,
}: ProgrammeColumnProps): ColumnDef<Programme>[] {
	return [
		{
			accessorKey: "programme_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
				>
					{row.getValue("programme_code")}
				</Badge>
			),
		},
		{
			accessorKey: "programme_name",
			header: sortableHeader("Name", "text-left"),
			cell: ({ row }) => (
				<div className="font-medium text-left">
					{row.getValue("programme_name")}
				</div>
			),
		},
		{
			accessorKey: "degree_level",
			header: "Level",
			cell: ({ row }) => (
				<Badge variant="outline">
					{row.getValue("degree_level")}
				</Badge>
			),
		},
		{
			accessorKey: "duration_years",
			header: "Duration",
			cell: ({ row }) => (
				<span className="text-sm">
					{row.getValue("duration_years")} Years
				</span>
			),
		},
		{
			accessorKey: "department_name",
			header: "Department",
			cell: ({ row }) => (
				<div className="text-sm">
					{row.getValue("department_name") || row.original.department_code || "—"}
				</div>
			),
		},
		{
			id: "counts",
			header: () => <div className="text-center">Statistics</div>,
			cell: ({ row }) => {
				const prog = row.original;
				return (
					<div className="flex flex-wrap gap-1.5 justify-center max-w-[150px] mx-auto">
						{typeof prog.student_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								🎓 {prog.student_count}
							</Badge>
						)}
						{typeof prog.course_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								📚 {prog.course_count}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-center">Actions</div>,
			cell: ({ row }) => {
				const prog = row.original;
				return (
					<div className="flex justify-center gap-2">
						{onManageCourses && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onManageCourses(prog)}
								className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
								title="Manage Courses"
							>
								<BookOpen className="w-4 h-4" />
							</Button>
						)}
						{onEnroll && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onEnroll(prog)}
								className="text-green-600 hover:text-green-700 hover:bg-green-50"
								title="Bulk Enroll Students"
							>
								<UserPlus className="w-4 h-4" />
							</Button>
						)}
						{onEdit && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onEdit(prog)}
								className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
							>
								<Pencil className="w-4 h-4" />
							</Button>
						)}
						{onDelete && (
							<ConfirmDeleteDialog
								title={<>Are you absolutely sure?</>}
								description={
									<>
										This will permanently delete the{" "}
										<strong>{prog.programme_name}</strong>{" "}
										programme. This action cannot be undone.
									</>
								}
								onConfirm={() => onDelete(prog)}
								trigger={
									<Button
										variant="ghost"
										size="icon"
										className="text-red-600 hover:text-red-700 hover:bg-red-50"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								}
							/>
						)}
					</div>
				);
			},
		},
	];
}
