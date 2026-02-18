import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { ClipboardList } from "lucide-react";
import type { DeanTest } from "@/services/api";
import type { ColumnDef } from "@tanstack/react-table";
import { deanApi } from "@/services/api/dean";
import { usePaginatedData } from "@/lib/usePaginatedData";

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
	},
	{
		accessorKey: "full_marks",
		header: () => <div className="text-center">Full Marks</div>,
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
		header: () => <div className="text-center">Pass Marks</div>,
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

export function TestsView() {
	const {
		data: tests,
		loading,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
	} = usePaginatedData<DeanTest>({
		fetchFn: (params) => deanApi.getAllTests(params),
		limit: 20,
		defaultSort: "t.test_id",
	});

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
					searchPlaceholder="Search tests..."
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
