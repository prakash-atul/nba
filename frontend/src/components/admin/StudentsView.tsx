import { DataTable } from "@/features/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Department, Student } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { useEffect, useState, useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];

export function StudentsView() {
	const {
		data: students,
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
	} = usePaginatedData<Student>({
		fetchFn: (params) => adminApi.getAllStudents(params),
		limit: 20,
		defaultSort: "-s.enrollment_date",
	});

	const [departments, setDepartments] = useState<Department[]>([]);
	const [batchInput, setBatchInput] = useState(
		(filters.batch_year as string | undefined) || "",
	);

	useEffect(() => {
		adminApi
			.getAllDepartments({ limit: 100 })
			.then((res) => {
				if (res.data) setDepartments(res.data);
			})
			.catch(console.error);
	}, []);

	// Debounce batch input
	useEffect(() => {
		const timer = setTimeout(() => {
			const normalizedInput = batchInput || undefined;
			if (normalizedInput !== filters.batch_year) {
				setFilter("batch_year", normalizedInput);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [batchInput, filters.batch_year, setFilter]);

	const statusVariant = (status: string) => {
		switch (status?.toLowerCase()) {
			case "active":
				return "default";
			case "graduated":
				return "secondary";
			case "inactive":
			case "dropped":
				return "destructive";
			default:
				return "outline";
		}
	};

	const columns = useMemo<ColumnDef<Student>[]>(
		() => [
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
					<Badge variant="outline" className="font-mono text-xs">
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
						className="p-0 hover:bg-transparent"
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
				accessorKey: "email",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
						className="p-0 hover:bg-transparent mr-auto"
					>
						Email
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className="flex text-muted-foreground"
					>
						{row.getValue("email")}
					</Badge>
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
				cell: ({ row }) => row.getValue("batch_year") ?? "—",
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
						<Badge variant={statusVariant(status)}>{status}</Badge>
					);
				},
			},
		],
		[],
	);

	if (error) {
		return (
			<div className="text-red-500 p-4">
				Failed to load students: {error}
			</div>
		);
	}

	const hasFilters =
		!!filters.department_id ||
		!!filters.batch_year ||
		!!filters.student_status;

	return (
		<div className="space-y-6">
			{/* Page header (HOD Style Icons/Spacing) */}
			<div className="flex items-center gap-4">
				<div className="p-3 rounded-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-emerald-500/20">
					<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div>
					<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
						Students
					</h2>
					<p className="text-sm text-muted-foreground">
						All registered students in the system
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GraduationCap className="w-5 h-5" />
						Student Roster
						{pagination && (
							<span className="ml-auto text-sm font-normal text-muted-foreground">
								{pagination.total} total
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
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
									<SelectTrigger className="h-9 w-[180px]">
										<SelectValue placeholder="All Departments" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											All Departments
										</SelectItem>
										{departments.map((dept: any) => (
											<SelectItem
												key={dept.department_id}
												value={String(
													dept.department_id,
												)}
											>
												{dept.department_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Input
									placeholder="Batch Year"
									value={batchInput}
									onChange={(e) =>
										setBatchInput(e.target.value)
									}
									className="h-9 w-[120px]"
								/>

								<Select
									value={
										(filters.student_status as
											| string
											| undefined) || "all"
									}
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
										<SelectItem value="all">
											All Status
										</SelectItem>
										{STATUS_OPTIONS.map((status) => (
											<SelectItem
												key={status}
												value={status.toLowerCase()}
											>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{hasFilters && (
									<Button
										variant="ghost"
										onClick={() => {
											setBatchInput("");
											setFilter(
												"department_id",
												undefined,
											);
											setFilter("batch_year", undefined);
											setFilter(
												"student_status",
												undefined,
											);
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
				</CardContent>
			</Card>
		</div>
	);
}
