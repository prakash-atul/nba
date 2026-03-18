import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminTest, Department } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { formatOrdinal } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
		filters,
		setFilter,
	} = usePaginatedData<AdminTest>({
		fetchFn: (params) => adminApi.getAllTests(params),
		limit: 20,
		defaultSort: "t.test_id",
	});

	const [departments, setDepartments] = useState<Department[]>([]);
	const [testTypeInput, setTestTypeInput] = useState(
		(filters.test_type as string | undefined) || "",
	);

	useEffect(() => {
		adminApi
			.getAllDepartments({ limit: 100 })
			.then((res) => {
				if (res.data) setDepartments(res.data);
			})
			.catch(console.error);
	}, []);

	// Debounce test_type input
	useEffect(() => {
		const timer = setTimeout(() => {
			if (testTypeInput !== filters.test_type) {
				setFilter("test_type", testTypeInput || undefined);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [testTypeInput, filters.test_type, setFilter]);

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
					{formatOrdinal(row.getValue("semester"))} Semester
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
			>
				{() => (
					<>
						<Select
							value={
								(filters.department_id as string | undefined) ||
								"all"
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
								{departments.map((dept: any) => (
									<SelectItem
										key={dept.department_id}
										value={String(dept.department_id)}
									>
										{dept.department_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Input
							placeholder="Test Type"
							value={testTypeInput}
							onChange={(e) => setTestTypeInput(e.target.value)}
							className="h-8 w-[150px]"
						/>

						{(filters.department_id || filters.test_type) && (
							<Button
								variant="ghost"
								onClick={() => {
									setTestTypeInput("");
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
			</DataTable>
		</div>
	);
}
