import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { Student } from "@/services/api";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

/**
 * Get the variant styling for a student status badge
 */
export function getStatusVariant(status: string): BadgeVariant {
	switch (status?.toLowerCase()) {
		case "active":
			return "default";
		case "graduated":
			return "secondary";
		case "inactive":
		case "dropped":
			return "destructive";
		default:
			return "outline";
	}
}

/**
 * Generate sortable column header with arrow icon
 */
export function createSortableHeader(label: string) {
	return ({ column }: any) => (
		<Button
			variant="ghost"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			className="p-0 hover:bg-transparent"
		>
			{label}
			<ArrowUpDown className="ml-2 h-4 w-4" />
		</Button>
	);
}

export interface StudentListColumnConfig {
	showEmail?: boolean;
	showPhone?: boolean;
	showDepartment?: boolean;
	showEnrolledCourses?: boolean;
	canEdit?: boolean;
	canDelete?: boolean;
}

/**
 * Generate columns for student list based on configuration
 */
export function createStudentColumns(
	config: StudentListColumnConfig,
	onEdit?: (student: Student) => void,
	onDelete?: (rollNo: string) => void,
): ColumnDef<Student>[] {
	const columns: ColumnDef<Student>[] = [
		{
			accessorKey: "roll_no",
			header: createSortableHeader("Roll No"),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono text-xs">
					{row.getValue("roll_no")}
				</Badge>
			),
		},
		{
			accessorKey: "student_name",
			header: createSortableHeader("Name"),
			cell: ({ row }) => (
				<div className="font-medium">
					{row.getValue("student_name")}
				</div>
			),
		},
	];

	if (config.showEmail) {
		columns.push({
			accessorKey: "email",
			header: createSortableHeader("Email"),
			cell: ({ row }) => (
				<Badge variant="outline" className="flex text-muted-foreground">
					{row.getValue("email") ?? "—"}
				</Badge>
			),
		});
	}

	if (config.showPhone) {
		columns.push({
			accessorKey: "phone",
			header: "Phone",
			cell: ({ row }) => (
				<div className="text-sm">{row.getValue("phone") ?? "—"}</div>
			),
		});
	}

	columns.push({
		accessorKey: "batch_year",
		header: createSortableHeader("Batch"),
		cell: ({ row }) => row.getValue("batch_year") ?? "—",
	});

	if (config.showDepartment) {
		columns.push({
			accessorKey: "department_code",
			header: "Department",
			cell: ({ row }) => {
				const student = row.original;
				return (
					<Badge variant="outline">
						{student.department_code || student.department_id}
					</Badge>
				);
			},
		});
	}

	if (config.showEnrolledCourses) {
		columns.push({
			accessorKey: "enrolled_courses",
			header: "Enrolled Courses",
			cell: ({ row }) => {
				const courses = row.getValue("enrolled_courses") as
					| { course_code: string }[]
					| undefined;
				return (
					<div className="flex gap-1 flex-wrap">
						{courses && courses.length > 0 ? (
							courses.slice(0, 2).map((c) => (
								<Badge
									key={c.course_code}
									variant="secondary"
									className="text-xs"
								>
									{c.course_code}
								</Badge>
							))
						) : (
							<span className="text-xs text-muted-foreground">
								None
							</span>
						)}
					</div>
				);
			},
		});
	}

	columns.push({
		accessorKey: "student_status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("student_status") as string;
			return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
		},
	});

	if (config.canEdit || config.canDelete) {
		columns.push({
			id: "actions",
			header: "Actions",
			cell: ({ row }) => (
				<div className="flex gap-2">
					{config.canEdit && onEdit && (
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => onEdit(row.original)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					)}
					{config.canDelete && onDelete && (
						<Button
							variant="destructive"
							size="icon"
							className="h-8 w-8"
							onClick={() => onDelete(row.original.roll_no)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			),
		});
	}

	return columns;
}
