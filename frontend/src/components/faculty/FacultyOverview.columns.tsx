import type { ColumnDef } from "@tanstack/react-table";
import type { Course } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Archive } from "lucide-react";
import { sortableHeader } from "../../features/shared/tableUtils";

export function getFacultyOverviewColumns(
	openConcludeDialog: (course: Course) => void,
): ColumnDef<Course>[] {
	return [
		// ── Expand toggle ──────────────────────────────────────────────────
		{
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
					<ChevronRight
						className={`h-4 w-4 transition-transform duration-150 ${
							row.getIsExpanded() ? "rotate-90" : ""
						}`}
					/>
				</Button>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "course_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.course_code}</Badge>
			),
		},
		{
			accessorKey: "course_name",
			header: sortableHeader("Course Name", "text-left"),
			cell: ({ row }) => (
				<div
					className="max-w-60 truncate text-left font-medium"
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
				<Badge variant="secondary">{row.original.credit} Cr</Badge>
			),
		},
		{
			accessorKey: "year",
			header: sortableHeader("Year"),
			cell: ({ row }) => row.original.year,
		},
		{
			accessorKey: "semester",
			header: sortableHeader("Sem"),
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.semester}</Badge>
			),
		},
		{
			accessorKey: "enrollment_count",
			header: sortableHeader("Enrolled"),
			cell: ({ row }) => (
				<div className="flex gap-2">
					<Badge
						variant={
							row.original.enrollment_count === 0
								? "secondary"
								: "default"
						}
					>
						{row.original.enrollment_count} Students
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "test_count",
			header: sortableHeader("Tests"),
			cell: ({ row }) => (
				<div className="flex gap-2">
					<Badge
						variant={
							row.original.test_count === 0
								? "secondary"
								: "outline"
						}
					>
						{row.original.test_count} Tests
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "avg_score_pct",
			header: sortableHeader("Avg Score"),
			cell: ({ row }) => {
				const avg = row.original.avg_score_pct;
				if (avg == null)
					return <span className="text-muted-foreground">—</span>;
				let color = "bg-emerald-50 text-emerald-700";
				if (avg < 50) color = "bg-rose-50 text-rose-700";
				else if (avg < 70) color = "bg-amber-50 text-amber-700";

				return (
					<Badge variant="secondary" className={color}>
						{avg}%
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) =>
				row.original.is_active === 0 ? (
					<Badge
						variant="outline"
						className="text-muted-foreground bg-muted"
					>
						Concluded
					</Badge>
				) : (
					<Button
						variant="destructive"
						size="sm"
						onClick={() => openConcludeDialog(row.original)}
					>
						<Archive className="h-4 w-4 mr-2" />
						Conclude
					</Button>
				),
		},
	];
}
