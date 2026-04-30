import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestList, getBaseTestColumns } from "@/features/shared";
import { ClipboardList, X } from "lucide-react";
import type { DeanTest, DeanDepartment } from "@/services/api";
import type { ColumnDef } from "@tanstack/react-table";
import { deanApi } from "@/services/api/dean";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatOrdinal } from "@/lib/utils";
import { sortableHeader } from "../../features/shared/tableUtils";

const columns: ColumnDef<DeanTest>[] = [
		...getBaseTestColumns<DeanTest>(),
		{
			accessorKey: "course_code",
			header: "Course",
			cell: ({ row }) => (
				<div className="flex gap-2 items-center">
					<Badge variant="outline" className="font-mono shrink-0">
						{row.getValue("course_code")}
					</Badge>
					<span
						className="text-xs text-muted-foreground max-w-32 truncate text-left"
						title={row.original.course_name}
					>
						{row.original.course_name}
					</span>
				</div>
			),
		},
		{
			accessorKey: "test_type",
			header: "Type",
		},
		{
			accessorKey: "faculty_name",
			header: sortableHeader("Faculty", "text-left"),
			cell: ({ row }) => (
				<div className="text-muted-foreground text-left max-w-[160px] truncate">
					{(row.getValue("faculty_name") as string) || "—"}
				</div>
			),
		},
	{
		accessorKey: "department_code",
		header: "Dept",
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
				<span className="text-muted-foreground">—</span>
			);
		},
	},
	{
		accessorKey: "test_type",
		header: "Type",
		cell: ({ row }) => {
			const val = row.getValue("test_type") as string;
			return val ? (
				<Badge variant="secondary">{val}</Badge>
			) : (
				<span className="text-muted-foreground">—</span>
			);
		},
	},
	{
		accessorKey: "semester",
		header: sortableHeader("Sem"),
		cell: ({ row }) => (
			<div className="text-center">
				<Badge variant="secondary" className="font-medium">
					{formatOrdinal(row.getValue("semester"))}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "full_marks",
		header: sortableHeader("Full Marks"),
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
		header: sortableHeader("Pass Marks"),
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
		filters,
		setFilter,
	} = usePaginatedData<
		DeanTest,
		{ department_id: string; test_type: string }
	>({
		fetchFn: (params) => deanApi.getAllTests(params),
		limit: 20,
		defaultSort: "t.test_id",
	});

	const { data: departments } = usePaginatedData<DeanDepartment>({
		fetchFn: (params) => deanApi.getAllDepartments(params),
		limit: 100,
		defaultSort: "d.department_code",
	});

	const hasFilters = !!filters.department_id || !!filters.test_type;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ClipboardList className="w-5 h-5" />
					All Assessments
				</CardTitle>
			</CardHeader>
			<CardContent>
				<TestList
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
				>
					{() => (
						<>
							<Select
								value={
									(filters.department_id as
										| string
										| undefined) || "all"
								}
								onValueChange={(val) =>
									setFilter(
										"department_id",
										val === "all" ? undefined : val,
									)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="All Departments" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Departments
									</SelectItem>
									{departments.map((dept) => (
										<SelectItem
											key={dept.department_id}
											value={String(dept.department_id)}
										>
											{dept.department_code}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={
									(filters.test_type as string | undefined) ||
									"all"
								}
								onValueChange={(val) =>
									setFilter(
										"test_type",
										val === "all" ? undefined : val,
									)
								}
							>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="All Types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Types
									</SelectItem>
									<SelectItem value="Mid Sem">
										Mid Sem
									</SelectItem>
									<SelectItem value="End Sem">
										End Sem
									</SelectItem>
									<SelectItem value="Quiz">Quiz</SelectItem>
									<SelectItem value="Assignment">
										Assignment
									</SelectItem>
									<SelectItem value="Lab">Lab</SelectItem>
								</SelectContent>
							</Select>

							{hasFilters && (
								<Button
									variant="ghost"
									onClick={() => {
										setFilter("department_id", undefined);
										setFilter("test_type", undefined);
									}}
									className="h-9 px-2 lg:px-3"
								>
									Reset
									<X className="ml-2 h-4 w-4" />
								</Button>
							)}
						</>
					)}
				</TestList>
			</CardContent>
		</Card>
	);
}
