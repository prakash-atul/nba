import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DeanStudent } from "@/services/api";

interface StudentsViewProps {
	students: DeanStudent[];
	isLoading: boolean;
}

export function StudentsView({ students, isLoading }: StudentsViewProps) {
	// Get unique departments for filter
	const departments = Array.from(
		new Set(students.map((s) => s.department_code).filter(Boolean)),
	) as string[];

	const columns: ColumnDef<DeanStudent>[] = [
		{
			accessorKey: "roll_no",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Roll No
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono">
					{row.getValue("roll_no")}
				</Badge>
			),
		},
		{
			accessorKey: "student_name",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="font-medium">
					{row.getValue("student_name")}
				</div>
			),
		},
		{
			accessorKey: "department_code",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Department
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="flex items-center">
					<Badge
						variant="secondary"
						className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
					>
						{row.getValue("department_code")}
					</Badge>
					<span className="ml-2 text-sm text-muted-foreground">
						{row.original.department_name}
					</span>
				</div>
			),
			filterFn: (row, id, value) => {
				return value === "all" ? true : row.getValue(id) === value;
			},
		},
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<GraduationCap className="w-5 h-5" />
					All Students
				</CardTitle>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={students}
					searchKey="student_name"
					searchPlaceholder="Search students..."
				>
					{(table) => (
						<div className="flex gap-2">
							<Select
								value={
									(table
										.getColumn("department_code")
										?.getFilterValue() as string) ?? "all"
								}
								onValueChange={(value) =>
									table
										.getColumn("department_code")
										?.setFilterValue(
											value === "all" ? "" : value,
										)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Department" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Departments
									</SelectItem>
									{departments.map((dept) => (
										<SelectItem key={dept} value={dept}>
											{dept}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</DataTable>
			</CardContent>
		</Card>
	);
}
