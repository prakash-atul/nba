import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Student } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";

export function StudentsView() {
	const { data: students, loading, error, pagination, goNext, goPrev, canPrev, pageIndex, search, setSearch } =
		usePaginatedData<Student>({
			fetchFn: (params) => adminApi.getAllStudents(params),
			limit: 20,
			defaultSort: "s.roll_no",
		});

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
			accessorKey: "email",
			header: "Email",
			cell: ({ row }) => (
				<div className="text-sm text-gray-500">
					{row.getValue("email") || "-"}
				</div>
			),
		},
		{
			accessorKey: "batch_year",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className="p-0 hover:bg-transparent"
				>
					Batch
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
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

	if (error) {
		return (
			<div className="text-red-500 p-4">Failed to load students: {error}</div>
		);
	}

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
				searchPlaceholder="Search by roll no, name or email..."
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
		</div>
	);
}
