import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { ArrowUpDown, Pencil, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
								variant="secondary"
								className="font-mono text-xs"
							>
								{p}
							</Badge>
						))}
					</div>
				);
			},
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
			header: "Enrolled In",
			cell: ({ row }) => {
				const enrolled = row.original.enrolled_courses;
				const courses = enrolled ? enrolled.split(", ") : [];
				const isExpanded = row.getIsExpanded();
				const visibleCourses = isExpanded
					? courses
					: courses.slice(0, 2);
				const hasMore = courses.length > 2;

				return (
					<div className="flex items-start justify-center gap-2 py-1">
						<div className="flex flex-col items-center justify-center">
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
				<div className="flex items-center gap-1">
					{config.canEdit && onEdit && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onEdit(row.original)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					)}
					{config.canDelete && onDelete && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
