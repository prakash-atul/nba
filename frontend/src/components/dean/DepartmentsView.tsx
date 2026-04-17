import { DataTable } from "@/features/shared/DataTable";
import { Building2, Users, BookOpen, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeanDepartment } from "@/services/api";
import { deanApi } from "@/services/api/dean";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { useMemo } from "react";
import { getDeanDepartmentColumns } from "./DepartmentsView.columns";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function DepartmentsView() {
	const {
		data: departments,
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
	} = usePaginatedData<DeanDepartment, { hod_status: string }>({
		fetchFn: (params) => deanApi.getAllDepartments(params),
		limit: 20,
		defaultSort: "d.department_code",
	});
	const columns = useMemo(() => getDeanDepartmentColumns(), []);

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
								<Building2 className="w-6 h-6 text-purple-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{pagination?.total ?? "—"}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Departments
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
								<Users className="w-6 h-6 text-blue-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.reduce(
										(sum, d) =>
											sum + (d.faculty_count ?? 0),
										0,
									)}
								</p>
								<p className="text-sm text-muted-foreground">
									Faculty (this page)
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
								<BookOpen className="w-6 h-6 text-emerald-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.reduce(
										(sum, d) => sum + (d.course_count ?? 0),
										0,
									)}
								</p>
								<p className="text-sm text-muted-foreground">
									Courses (this page)
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
								<GraduationCap className="w-6 h-6 text-orange-500" />
							</div>
							<div>
								<p className="text-2xl font-bold">
									{departments.reduce(
										(sum, d) =>
											sum + (d.student_count ?? 0),
										0,
									)}
								</p>
								<p className="text-sm text-muted-foreground">
									Students (this page)
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Departments Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="w-5 h-5" />
						All Departments
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={departments}
						searchPlaceholder="Filter departments..."
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
							value={filters.hod_status || "all"}
							onValueChange={(value) =>
								setFilter(
									"hod_status",
									value === "all" ? undefined : value,
								)
							}
						>
							<SelectTrigger className="h-9 w-[180px]">
								<SelectValue placeholder="HOD Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									All HOD Status
								</SelectItem>
								<SelectItem value="assigned">
									Assigned
								</SelectItem>
								<SelectItem value="unassigned">
									Unassigned
								</SelectItem>
							</SelectContent>
						</Select>
					</DataTable>
				</CardContent>
			</Card>
		</div>
	);
}
