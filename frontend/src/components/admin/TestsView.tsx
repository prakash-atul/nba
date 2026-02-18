import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminTest } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";

export function TestsView() {
	const {
		data: tests,
		loading,
		error,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
	} = usePaginatedData<AdminTest>({
		fetchFn: (params) => adminApi.getAllTests(params),
		limit: 20,
		defaultSort: "t.test_id",
	});

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
		},
		{
			accessorKey: "semester",
			header: "Semester",
			cell: ({ row }) => (
				<Badge variant="secondary">
					Sem {row.getValue("semester")}
				</Badge>
			),
		},
	];

	if (error) {
		return (
			<div className="text-red-500 p-4">
				Failed to load tests: {error}
			</div>
		);
	}

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
				searchPlaceholder="Search by test name or course..."
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
