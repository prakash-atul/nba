import { DataTable } from "@/features/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminCourse, Department } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { formatOrdinal } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function CoursesView() {
	const {
		data: courses,
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
	} = usePaginatedData<AdminCourse>({
		fetchFn: (params) => adminApi.getAllCourses(params),
		limit: 20,
		defaultSort: "c.course_code",
	});

	const { data: departments } = usePaginatedData<Department>({
		fetchFn: (params) => adminApi.getAllDepartments(params),
		limit: 100,
		defaultSort: "d.department_code",
	});

	const columns: ColumnDef<AdminCourse>[] = [
		{
			accessorKey: "course_code",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Code
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono">
					{row.getValue("course_code")}
				</Badge>
			),
		},
		{
			accessorKey: "course_name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="mr-auto"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Course Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div
					className="font-medium max-w-[200px] truncate flex"
					title={row.getValue("course_name")}
				>
					{row.getValue("course_name")}
				</div>
			),
		},
		{
			accessorKey: "faculty_name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="mr-auto"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Faculty
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="text-muted-foreground flex">
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
						className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
					>
						{dept}
					</Badge>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "year",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Year
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="text-center">
					{(row.getValue("year") as number) ?? "—"}
				</div>
			),
		},
		{
			accessorKey: "semester",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Sem
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="flex justify-center">
					<Badge
						variant="secondary"
						className="text-center font-medium"
					>
						{formatOrdinal(row.getValue("semester"))}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "credit",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Credits
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="text-center">
					<Badge variant="outline">{row.getValue("credit")}</Badge>
				</div>
			),
		},
		{
			accessorKey: "course_type",
			header: "Type",
			cell: ({ row }) => {
				const val = row.getValue("course_type") as string;
				return val ? (
					<Badge variant="secondary">{val}</Badge>
				) : (
					<span className="text-muted-foreground">�</span>
				);
			},
		},
		{
			accessorKey: "course_level",
			header: "Level",
			cell: ({ row }) => (
				<span className="text-sm">
					{(row.getValue("course_level") as string) || "�"}
				</span>
			),
		},
		{
			accessorKey: "is_active",
			header: "Status",
			cell: ({ row }) => {
				const isActive =
					row.getValue("is_active") === 1 ||
					row.getValue("is_active") === true;
				return (
					<Badge
						variant="secondary"
						className={
							isActive
								? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
								: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800"
						}
					>
						{isActive ? "Active" : "Inactive"}
					</Badge>
				);
			},
		},
		{
			accessorKey: "enrollment_count",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Enrolled
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant="secondary"
						className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
					>
						{(row.getValue("enrollment_count") as number) ?? 0}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "test_count",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Tests
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant="secondary"
						className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
					>
						{(row.getValue("test_count") as number) ?? 0}
					</Badge>
				</div>
			),
		},
	];

	if (error) {
		return (
			<div className="text-red-500 p-4">
				Failed to load courses: {error}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold">Courses</h2>
					<p className="text-gray-500 dark:text-gray-400">
						All courses in the system
					</p>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={courses}
				searchPlaceholder="Search by course name or code..."
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
								(filters.course_type as string | undefined) ||
								"all"
							}
							onValueChange={(val) =>
								setFilter(
									"course_type",
									val === "all" ? undefined : val,
								)
							}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="All Types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="Theory">Theory</SelectItem>
								<SelectItem value="Lab">Lab</SelectItem>
								<SelectItem value="Project">Project</SelectItem>
								<SelectItem value="Seminar">Seminar</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={
								filters.is_active !== undefined
									? String(filters.is_active)
									: "all"
							}
							onValueChange={(val) =>
								setFilter(
									"is_active",
									val === "all" ? undefined : val,
								)
							}
						>
							<SelectTrigger className="w-[130px]">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="1">Active</SelectItem>
								<SelectItem value="0">Inactive</SelectItem>
							</SelectContent>
						</Select>

						{(filters.department_id ||
							filters.course_type ||
							filters.is_active !== undefined) && (
							<Button
								variant="ghost"
								onClick={() => {
									setFilter("department_id", undefined);
									setFilter("course_type", undefined);
									setFilter("is_active", undefined);
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
