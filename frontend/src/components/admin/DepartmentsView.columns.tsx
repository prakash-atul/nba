import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Pencil, Trash2, Info, Calendar } from "lucide-react";
import type { Department } from "@/services/api";
import { ConfirmDeleteDialog } from "../../features/shared";
import { sortableHeader } from "../../features/shared/tableUtils";

interface DepartmentColumnProps {
	onEdit: (department: Department) => void;
	onDelete: (department: Department) => void;
}

export function getDepartmentColumns({
	onEdit,
	onDelete,
}: DepartmentColumnProps): ColumnDef<Department>[] {
	return [
		{
			accessorKey: "department_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="font-mono bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
				>
					{row.getValue("department_code")}
				</Badge>
			),
		},
		{
			accessorKey: "department_name",
			header: sortableHeader("Name", "text-left"),
			cell: ({ row }) => (
				<div className="font-medium text-left">
					{row.getValue("department_name")}
				</div>
			),
		},
		{
			accessorKey: "school_name",
			header: "School",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
			cell: ({ row }) => {
				const schoolName = row.getValue("school_name") as string;
				const schoolCode = row.original.school_code;
				return schoolName ? (
					<div className="text-sm flex flex-col items-start">
						<div className="font-medium">{schoolName}</div>
						<div className="text-xs text-muted-foreground font-mono">
							({schoolCode})
						</div>
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "hod_name",
			header: "HOD",
			cell: ({ row }) => {
				const hodName = row.getValue("hod_name") as string | null;
				const hodId = row.original.hod_employee_id;
				return hodName ? (
					<div className="text-sm flex flex-col items-start">
						<Badge
							variant="secondary"
							className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
						>
							{hodName}
						</Badge>
						{hodId && (
							<div className="text-[10px] text-muted-foreground font-mono mt-1 ml-1">
								ID: {hodId}
							</div>
						)}
					</div>
				) : (
					<Badge
						variant="outline"
						className="text-muted-foreground border-dashed"
					>
						Not Assigned
					</Badge>
				);
			},
		},
		{
			id: "counts",
			header: () => <div className="text-center">Statistics</div>,
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<div className="flex flex-wrap gap-1.5 justify-center max-w-[150px] mx-auto">
						{typeof dept.faculty_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								👨‍🏫 {dept.faculty_count}
							</Badge>
						)}
						{typeof dept.student_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								🎓 {dept.student_count}
							</Badge>
						)}
						{typeof dept.course_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								📚 {dept.course_count}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "active_offerings_count",
			header: () => <div className="text-center">Offerings</div>,
			filterFn: (row, id, value) => {
				const count = row.getValue(id) as number;
				return value.includes(String(count));
			},
			cell: ({ row }) => {
				const count = row.getValue("active_offerings_count") as number;
				const latest = row.original.latest_offering;
				return (
					<div className="text-center flex flex-col items-center">
						<Badge
							variant="secondary"
							className="font-semibold px-2"
						>
							{count} Courses
						</Badge>
						{latest && (
							<div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
								Latest: {latest}
							</div>
						)}
					</div>
				);
			},
		},
		{
			id: "info",
			header: "Info",
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-gray-500 hover:text-gray-700"
							>
								<Info className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="space-y-4">
								<h4 className="font-medium leading-none">
									{dept.department_name}
								</h4>
								<div className="space-y-2">
									<p className="text-sm text-gray-500">
										{dept.description ||
											"No description available."}
									</p>
									<div className="flex items-center pt-2 border-t text-xs text-gray-400">
										<Calendar className="mr-2 h-3 w-3" />
										Created:{" "}
										{dept.created_at
											? new Date(
													dept.created_at,
												).toLocaleDateString()
											: "N/A"}
									</div>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-center">Actions</div>,
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<div className="flex justify-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onEdit(dept)}
							className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
						>
							<Pencil className="w-4 h-4" />
						</Button>
						<ConfirmDeleteDialog
							title={<>Are you absolutely sure?</>}
							description={
								<>
									This will permanently delete the{" "}
									<strong>{dept.department_name}</strong>{" "}
									department. This action cannot be undone.
								</>
							}
							onConfirm={() => onDelete(dept)}
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
					</div>
				);
			},
		},
	];
}
