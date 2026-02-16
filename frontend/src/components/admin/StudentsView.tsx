import { DataTable } from "@/components/shared/DataTable";
import { DataTableFacetedFilter } from "@/components/shared/DataTableFacetedFilter";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Student } from "@/services/api";

interface StudentsViewProps {
	students: Student[];
	refreshing: boolean;
}

export function StudentsView({ students, refreshing }: StudentsViewProps) {
	const columns: ColumnDef<Student>[] = [
		{
			accessorKey: "roll_no",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					Roll No
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("roll_no")}</div>
			),
		},
		{
			accessorKey: "student_name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "department_code",
			header: "Department",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
			cell: ({ row }) => {
				const student = row.original;
				return (
					<Badge>
						{student.department_code || student.department_id}
					</Badge>
				);
			},
		},
	];

	const departmentOptions = Array.from(
		new Set(
			students
				.map((s) => s.department_code)
				.filter((n): n is string => !!n),
		),
	)
		.sort()
		.map((name) => ({ label: name, value: name }));

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold">Students</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All registered students
				</p>
			</div>

			<DataTable
				columns={columns}
				data={students}
				searchKey="student_name"
				searchPlaceholder="Filter by name..."
				refreshing={refreshing}
			>
				{(table) => (
					<>
						<DataTableFacetedFilter
							column={table.getColumn("department_code")}
							title="Department"
							options={departmentOptions}
						/>
					</>
				)}
			</DataTable>
		</div>
	);
}
