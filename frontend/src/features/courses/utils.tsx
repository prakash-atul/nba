import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { AdminCourse } from "@/services/api";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

/**
 * Get the variant styling for an active/inactive badge
 */
export function getStatusVariant(status: number | undefined): BadgeVariant {
	return status === 1 ? "default" : "destructive";
}

/**
 * Convert semester number to Spring/Autumn string
 */
export function getSemesterName(num: number | string | undefined): string {
	if (!num) return "�";
	if (typeof num === "string" && isNaN(Number(num))) {
		return num.charAt(0).toUpperCase() + num.slice(1).toLowerCase();
	}
	const n = Number(num);
	if (isNaN(n)) return "�";
	return n % 2 === 0 ? "Spring (Sem " + n + ")" : "Autumn (Sem " + n + ")";
}

/**
 * Convert semester number to ordinal (1 -> "1st", 2 -> "2nd", etc)
 */
export function toOrdinal(num: number | string | undefined): string {
	if (!num) return "—";
	const n = Number(num);
	if (isNaN(n)) return "—";
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export interface CourseListColumnConfig {
	showDepartment?: boolean;
	showFaculty?: boolean;
	showYear?: boolean;
	showSemester?: boolean;
	showCredits?: boolean;
	showType?: boolean;
	showLevel?: boolean;
	showStatus?: boolean;
	showEnrollment?: boolean;
	showTests?: boolean;
	showAverageScore?: boolean;
	canEdit?: boolean;
	canDelete?: boolean;
	expandable?: boolean;
}

/**
 * Generate columns for course list based on configuration
 */
export function createCourseColumns(
	config: CourseListColumnConfig,
	onEdit?: (course: AdminCourse) => void,
	onDelete?: (courseId: number | undefined) => void,
): ColumnDef<AdminCourse>[] {
	const columns: ColumnDef<AdminCourse>[] = [];

	// Add expandable column if configured
	if (config.expandable) {
		columns.push({
			id: "expand",
			header: () => null,
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-muted-foreground"
					onClick={() => row.toggleExpanded()}
					aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
				>
					<ArrowUpDown
						className={`h-4 w-4 transition-transform duration-150 ${
							row.getIsExpanded() ? "rotate-90" : ""
						}`}
					/>
				</Button>
			),
			enableSorting: false,
			enableHiding: false,
		});
	}

	columns.push(
		{
			accessorKey: "course_code",
			header: createSortableHeader("Code"),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono text-xs">
					{row.getValue("course_code")}
				</Badge>
			),
		},
		{
			accessorKey: "course_name",
			header: createSortableHeader("Course Name"),
			cell: ({ row }) => (
				<div className="font-medium max-w-[200px] truncate">
					{row.getValue("course_name")}
				</div>
			),
		},
	);

	if (config.showFaculty) {
		columns.push({
			accessorKey: "faculty_name",
			header: "Faculty",
			cell: ({ row }) => (
				<span className="text-muted-foreground text-sm">
					{(row.getValue("faculty_name") as string) ?? "—"}
				</span>
			),
		});
	}

	if (config.showDepartment) {
		columns.push({
			accessorKey: "department_code",
			header: "Department",
			cell: ({ row }) => (
				<Badge variant="outline">
					{(row.getValue("department_code") as string) ?? "—"}
				</Badge>
			),
		});
	}

	if (config.showYear) {
		columns.push({
			accessorKey: "year",
			header: "Year",
			cell: ({ row }) => (
				<div className="text-center">
					{(row.getValue("year") as number) ?? "—"}
				</div>
			),
		});
	}

	if (config.showSemester) {
		columns.push({
			accessorKey: "semester",
			header: "Semester",
			cell: ({ row }) => (
				<Badge variant="secondary" className="text-xs">
					{getSemesterName(
						(row.getValue("semester") as number | string) ?? "—",
					)}
				</Badge>
			),
		});
	}

	if (config.showCredits) {
		columns.push({
			accessorKey: "credit",
			header: "Credits",
			cell: ({ row }) => (
				<div className="text-center">
					<Badge variant="outline">
						{(row.getValue("credit") as number) ?? "—"}
					</Badge>
				</div>
			),
		});
	}

	if (config.showType) {
		columns.push({
			accessorKey: "course_type",
			header: "Type",
			cell: ({ row }) => (
				<Badge variant="secondary" className="text-xs">
					{(row.getValue("course_type") as string) ?? "—"}
				</Badge>
			),
		});
	}

	if (config.showLevel) {
		columns.push({
			accessorKey: "course_level",
			header: "Level",
			cell: ({ row }) => (
				<span className="text-sm">
					{(row.getValue("course_level") as string) ?? "—"}
				</span>
			),
		});
	}

	if (config.showStatus) {
		columns.push({
			accessorKey: "is_active",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("is_active") as number | undefined;
				return (
					<Badge variant={getStatusVariant(status)}>
						{status === 1 ? "Active" : "Inactive"}
					</Badge>
				);
			},
		});
	}

	if (config.showEnrollment) {
		columns.push({
			accessorKey: "enrollment_count",
			header: "Enrolled",
			cell: ({ row }) => (
				<div className="text-center">
					<Badge variant="outline">
						{(row.getValue("enrollment_count") as number) ?? 0}
					</Badge>
				</div>
			),
		});
	}

	if (config.showTests) {
		columns.push({
			accessorKey: "test_count",
			header: "Tests",
			cell: ({ row }) => (
				<div className="text-center">
					<Badge variant="outline">
						{(row.getValue("test_count") as number) ?? 0}
					</Badge>
				</div>
			),
		});
	}

	if (config.showAverageScore) {
		columns.push({
			accessorKey: "avg_score_pct",
			header: "Avg Score",
			cell: ({ row }) => {
				const avg = row.getValue("avg_score_pct");
				const numAvg =
					typeof avg === "string"
						? parseFloat(avg)
						: (avg as number | null);
				return (
					<div className="text-center">
						{numAvg !== null &&
						numAvg !== undefined &&
						!isNaN(numAvg)
							? `${numAvg.toFixed(1)}%`
							: "—"}
					</div>
				);
			},
		});
	}

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
					{config.canDelete && onDelete && (<Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(row.original.course_id)}><Trash2 className="h-4 w-4" /></Button>)}
				</div>
			),
		});
	}

	return columns;
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

