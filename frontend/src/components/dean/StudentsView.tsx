import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeanStudent } from "@/services/api";
import { deanApi } from "@/services/api/dean";
import { usePaginatedData } from "@/lib/usePaginatedData";

export function StudentsView() {
	const {
		data: students,
		loading,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
	} = usePaginatedData<DeanStudent>({
		fetchFn: (params) => deanApi.getAllStudents(params),
		limit: 20,
		defaultSort: "s.roll_no",
	});

	const columns: ColumnDef<DeanStudent>[] = [
		{
			accessorKey: "roll_no",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Roll No
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono">
					{row.getValue("roll_no")}
				</Badge>
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
				>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">
					{row.getValue("student_name")}
				</div>
			),
		},
		{
			accessorKey: "department_code",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Department
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
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
		},
		{
			accessorKey: "batch_year",
			header: "Batch",
			cell: ({ row }) => row.getValue("batch_year") || "-",
		},
		{
			accessorKey: "student_status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("student_status") as string;
				return (
					<Badge
						variant={status === "Active" ? "default" : "secondary"}
					>
						{status}
					</Badge>
				);
			},
		},
	];

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
					searchPlaceholder="Search students..."
					refreshing={loading}
					serverPagination={{
						pagination,
						onNext: goNext,
						onPrev: goPrev,
						canPrev,
						pageIndex,
						search,
						onSearch: setSearch,
					}}
				/>
			</CardContent>
		</Card>
	);
}
