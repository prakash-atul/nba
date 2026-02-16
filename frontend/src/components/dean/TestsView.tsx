import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableFacetedFilter } from "@/components/shared/DataTableFacetedFilter";
import { ClipboardList } from "lucide-react";
import type { DeanTest } from "@/services/api";
import type { ColumnDef } from "@tanstack/react-table";

interface TestsViewProps {
	tests: DeanTest[];
	isLoading: boolean;
}

const columns: ColumnDef<DeanTest>[] = [
	{
		accessorKey: "test_name",
		header: "Test Name",
		cell: ({ row }) => (
			<span className="font-medium">{row.getValue("test_name")}</span>
		),
	},
	{
		accessorKey: "course_code",
		header: "Course",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<Badge variant="outline" className="font-mono w-fit">
					{row.getValue("course_code")}
				</Badge>
				<span className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
					{row.original.course_name}
				</span>
			</div>
		),
	},
	{
		accessorKey: "faculty_name",
		header: "Faculty",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{row.getValue("faculty_name") || "N/A"}
			</span>
		),
	},
	{
		accessorKey: "department_code",
		header: "Department",
		cell: ({ row }) => {
			const dept = row.getValue("department_code") as string;
			return dept ? (
				<Badge
					variant="secondary"
					className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
				>
					{dept}
				</Badge>
			) : (
				"N/A"
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "full_marks",
		header: ({ column }) => <div className="text-center">Full Marks</div>,
		cell: ({ row }) => (
			<div className="text-center">
				<Badge
					variant="secondary"
					className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
				>
					{row.getValue("full_marks")}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "pass_marks",
		header: ({ column }) => <div className="text-center">Pass Marks</div>,
		cell: ({ row }) => (
			<div className="text-center">
				<Badge
					variant="secondary"
					className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
				>
					{row.getValue("pass_marks")}
				</Badge>
			</div>
		),
	},
];

export function TestsView({ tests, isLoading }: TestsViewProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	const uniqueDepartments = Array.from(
		new Set(tests.map((t) => t.department_code).filter(Boolean)),
	).map((dept) => ({
		label: dept as string,
		value: dept as string,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ClipboardList className="w-5 h-5" />
					All Assessments
				</CardTitle>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={tests}
					searchKey="test_name"
					searchPlaceholder="Search tests..."
				>
					{(table) =>
						uniqueDepartments.length > 0 && (
							<DataTableFacetedFilter
								column={table.getColumn("department_code")}
								title="Department"
								options={uniqueDepartments}
							/>
						)
					}
				</DataTable>
			</CardContent>
		</Card>
	);
}
