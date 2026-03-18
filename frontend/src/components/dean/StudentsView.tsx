import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, GraduationCap, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeanStudent, DeanDepartment } from "@/services/api";
import { deanApi } from "@/services/api/dean";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
		filters,
		setFilter,
	} = usePaginatedData<
		DeanStudent,
		{ department_id: string; batch_year: string; student_status: string }
	>({
		fetchFn: (params) => deanApi.getAllStudents(params),
		limit: 20,
		defaultSort: "s.roll_no",
	});

	const { data: departments } = usePaginatedData<DeanDepartment>({
		fetchFn: (params) => deanApi.getAllDepartments(params),
		limit: 100,
		defaultSort: "d.department_code",
	});

	const [batchInput, setBatchInput] = useState(
		(filters.batch_year as string | undefined) || "",
	);

	// Debounce batch year input
	useEffect(() => {
		const timer = setTimeout(() => {
			const normalizedInput = batchInput || undefined;
			if (normalizedInput !== filters.batch_year) {
				setFilter("batch_year", normalizedInput);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [batchInput, filters.batch_year, setFilter]);

	const hasFilters =
		!!filters.department_id ||
		!!filters.batch_year ||
		!!filters.student_status;

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
					className="mr-auto"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium flex">
					{row.getValue("student_name")}
				</div>
			),
		},
		{
			accessorKey: "department_code",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="mr-auto"
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
				>
					<Select
						value={filters.department_id || "all"}
						onValueChange={(val) =>
							setFilter(
								"department_id",
								val === "all" ? undefined : val,
							)
						}
					>
						<SelectTrigger className="h-9 w-[180px]">
							<SelectValue placeholder="All Departments" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Departments</SelectItem>
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

					<Input
						placeholder="Batch Year"
						value={batchInput}
						onChange={(e) => setBatchInput(e.target.value)}
						className="h-9 w-[110px]"
					/>

					<Select
						value={filters.student_status || "all"}
						onValueChange={(val) =>
							setFilter(
								"student_status",
								val === "all" ? undefined : val,
							)
						}
					>
						<SelectTrigger className="h-9 w-[130px]">
							<SelectValue placeholder="All Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="Active">Active</SelectItem>
							<SelectItem value="Inactive">Inactive</SelectItem>
							<SelectItem value="Graduated">Graduated</SelectItem>
							<SelectItem value="Dropped">Dropped</SelectItem>
						</SelectContent>
					</Select>

					{hasFilters && (
						<Button
							variant="ghost"
							className="h-9 px-2"
							onClick={() => {
								setBatchInput("");
								setFilter("department_id", undefined);
								setFilter("batch_year", undefined);
								setFilter("student_status", undefined);
							}}
						>
							Reset
							<X className="ml-2 h-4 w-4" />
						</Button>
					)}
				</DataTable>
			</CardContent>
		</Card>
	);
}
