import { DataTable } from "@/components/shared/DataTable";
import { DataTableFacetedFilter } from "@/components/shared/DataTableFacetedFilter";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminTest } from "@/services/api";

interface TestsViewProps {
	tests: AdminTest[];
	refreshing: boolean;
}

export function TestsView({ tests, refreshing }: TestsViewProps) {
	const columns: ColumnDef<AdminTest>[] = [
		{
			accessorKey: "test_id",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<span className="font-medium">{row.getValue("test_id")}</span>
			),
		},
		{
			accessorKey: "test_name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					Test Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "course_code",
			header: "Course",
			cell: ({ row }) => (
				<div>
					<span className="font-medium">
						{row.getValue("course_code")}
					</span>
					<span className="block text-xs text-gray-500">
						{row.original.course_name}
					</span>
				</div>
			),
		},
		{
			accessorKey: "full_marks",
			header: "Full Marks",
		},
		{
			accessorKey: "pass_marks",
			header: "Pass Marks",
		},
		{
			accessorKey: "year",
			header: "Year",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id)?.toString());
			},
		},
		{
			accessorKey: "semester",
			header: "Semester",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id)?.toString());
			},
			cell: ({ row }) => (
				<Badge variant="secondary">
					Sem {row.getValue("semester")}
				</Badge>
			),
		},
	];

	const yearOptions = Array.from(new Set(tests.map((t) => t.year)))
		.sort()
		.map((year) => ({ label: year.toString(), value: year.toString() }));

	const semesterOptions = Array.from(new Set(tests.map((t) => t.semester)))
		.sort((a, b) => a - b)
		.map((sem) => ({ label: `Sem ${sem}`, value: sem.toString() }));

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold">Tests / Assessments</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All tests and assessments in the system
				</p>
			</div>

			<DataTable
				columns={columns}
				data={tests}
				searchKey="test_name"
				searchPlaceholder="Search by test name..."
				refreshing={refreshing}
			>
				{(table) => (
					<>
						<DataTableFacetedFilter
							column={table.getColumn("year")}
							title="Year"
							options={yearOptions}
						/>
						<DataTableFacetedFilter
							column={table.getColumn("semester")}
							title="Semester"
							options={semesterOptions}
						/>
					</>
				)}
			</DataTable>
		</div>
	);
}
