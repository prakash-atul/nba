import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminCourse } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";

export function CoursesView() {
	const { data: courses, loading, error, pagination, goNext, goPrev, canPrev, pageIndex, search, setSearch } =
		usePaginatedData<AdminCourse>({
			fetchFn: (params) => adminApi.getAllCourses(params),
			limit: 20,
			defaultSort: "c.course_code",
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
					className="p-0 hover:bg-transparent"
				>
					Code
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("course_code")}</div>
			),
		},
		{
			accessorKey: "course_name",
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
			accessorKey: "credit",
			header: "Credits",
			cell: ({ row }) => (
				<Badge variant="outline">{row.getValue("credit")}</Badge>
			),
		},
		{
			accessorKey: "department_name",
			header: "Department",
			cell: ({ row }) => {
				const name = row.getValue("department_name") as string;
				return name || "N/A";
			},
		},
		{
			accessorKey: "course_type",
			header: "Type",
			cell: ({ row }) => {
				const val = row.getValue("course_type") as string;
				return <Badge variant="secondary">{val}</Badge>;
			},
		},
		{
			accessorKey: "course_level",
			header: "Level",
		},
		{
			accessorKey: "is_active",
			header: "Status",
			cell: ({ row }) => {
				const isActive = row.getValue("is_active") === 1 || row.getValue("is_active") === true;
				return (
					<Badge variant={isActive ? "default" : "destructive"}>
						{isActive ? "Active" : "Inactive"}
					</Badge>
				);
			},
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
			<div>
				<h2 className="text-2xl font-bold">Courses</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All courses in the system
				</p>
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
			/>
		</div>
	);
}
