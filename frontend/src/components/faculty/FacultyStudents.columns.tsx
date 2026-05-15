import type { ColumnDef } from "@tanstack/react-table";
import type { EnrolledStudent } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import { sortableHeader } from "../../features/shared/tableUtils";
import { motion, AnimatePresence } from "framer-motion";

export const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];

export const statusVariant = (status: string) => {
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
};

export function getFacultyStudentsColumns(
	handleEditOpen: (s: EnrolledStudent) => void,
	setDeleteTarget: (s: EnrolledStudent | null) => void,
): ColumnDef<EnrolledStudent>[] {
	return [
		{
			accessorKey: "roll_no",
			header: sortableHeader("Roll No"),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono text-xs">
					{row.original.roll_no}
				</Badge>
			),
		},
		{
			accessorKey: "student_name",
			header: sortableHeader("Name", "text-left"),
			cell: ({ row }) => (
				<div className="font-medium text-left max-w-[180px] truncate">{row.original.student_name}</div>
			),
		},
		{
			accessorKey: "department_code",
			header: "Department",
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
				>
					{row.original.department_code ??
						row.original.department_name}
				</Badge>
			),
		},
		{
			accessorKey: "batch_year",
			header: sortableHeader("Batch"),
			cell: ({ row }) => row.original.batch_year ?? "—",
		},
		{
			accessorKey: "email",
			header: sortableHeader("Email", "text-left"),
			cell: ({ row }) => (
				<div className="text-sm text-muted-foreground text-left max-w-[200px] truncate">
					{row.original.email ?? "—"}
				</div>
			),
		},
		{
			accessorKey: "phones",
			header: "Phones",
			cell: ({ row }) => {
				const phones = row.original.phones?.length
					? row.original.phones
					: (row.original as any).phone
						? [(row.original as any).phone]
						: [];
				if (!phones || phones.length === 0) {
					return <div className="text-muted-foreground">—</div>;
				}
				return (
					<div className="flex flex-wrap gap-1">
						{phones.map((p, i) => (
							<Badge
								key={i}
								variant="outline"
								className="font-mono text-xs"
							>
								{p}
							</Badge>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: "student_status",
			header: "Status",
			cell: ({ row }) => (
				<Badge variant={statusVariant(row.original.student_status)}>
					{row.original.student_status}
				</Badge>
			),
		},
		{
			accessorKey: "enrolled_courses",
			header: "Enrolled In",
			cell: ({ row }) => {
				const courses = row.original.enrolled_courses
					? row.original.enrolled_courses.split(", ")
					: [];
				const isExpanded = row.getIsExpanded();
				const visibleCourses = isExpanded
					? courses
					: courses.slice(0, 2);
				const hasMore = courses.length > 2;

				return (
					<div className="flex items-start gap-2 py-1">
						<div className="flex flex-col items-start">
							<AnimatePresence initial={false}>
								{visibleCourses.length > 0 ? (
									visibleCourses.map((course, idx) => (
										<motion.div
											key={`${course}-${idx}`}
											initial={{
												opacity: 0,
												height: 0,
												overflow: "hidden",
											}}
											animate={{
												opacity: 1,
												height: "auto",
											}}
											exit={{ opacity: 0, height: 0 }}
											transition={{
												duration: 0.2,
												ease: "easeInOut",
											}}
										>
											<div className="pb-1">
												<Badge
													variant="outline"
													className="px-1.5 py-0 font-normal"
												>
													{course}
												</Badge>
											</div>
										</motion.div>
									))
								) : (
									<span className="text-xs text-muted-foreground pb-1">
										—
									</span>
								)}
							</AnimatePresence>
						</div>
						{hasMore && (
							<Button
								variant="ghost"
								size="sm"
								className="h-5 w-5 p-0 mt-0.5 group hover:bg-primary/5 hover:text-primary transition-colors shrink-0"
								onClick={row.getToggleExpandedHandler()}
								title={
									isExpanded
										? "Show less"
										: `Show ${courses.length - 2} more`
								}
							>
								<ChevronDown
									className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${
										isExpanded ? "rotate-180" : ""
									}`}
								/>
							</Button>
						)}
					</div>
				);
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => handleEditOpen(row.original)}
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
						onClick={() => setDeleteTarget(row.original)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];
}
