import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Department, Student } from "@/services/api";
import { adminApi } from "@/services/api/admin";
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
			<div className="text-red-500 p-4">
				Failed to load students: {error}
			</div>
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
							placeholder="Batch Year"
							value={batchInput}
							onChange={(e) => setBatchInput(e.target.value)}
							className="h-8 w-[120px]"
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
							<SelectTrigger className="w-[130px]">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">
									Inactive
								</SelectItem>
								<SelectItem value="graduated">
									Graduated
								</SelectItem>
								<SelectItem value="dropped">Dropped</SelectItem>
							</SelectContent>
						</Select>

						{(filters.department_id ||
							filters.batch_year ||
							filters.student_status) && (
							<Button
								variant="ghost"
								onClick={() => {
									setBatchInput("");
									setFilter("department_id", undefined);
									setFilter("batch_year", undefined);
									setFilter("student_status", undefined);
								}}
								className="h-9 px-2 lg:px-3"
							>
								Reset
								<ArrowUpDown className="ml-2 h-4 w-4" />
							</Button>
						)}
					</>
				)}
			</DataTable>
		</div>
	);
}
