import { useState, useMemo, useEffect } from "react";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type {
	Student,
	PaginationParams,
	PaginatedResponse,
	UpdateStudentRequest,
} from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DeleteStudentDialog } from "./DeleteStudentDialog";
import { EditStudentDialog } from "./EditStudentDialog";
import { createStudentColumns, type StudentListColumnConfig } from "./utils";
import { toast } from "sonner";
import { coursesApi } from "@/services/api/courses";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];
const BATCH_OPTIONS = Array.from(
	{ length: 10 },
	(_, i) => new Date().getFullYear() - 4 + i,
);

export interface StudentListProps {
	// Data source
	fetchFn?: (params: PaginationParams) => Promise<PaginatedResponse<Student>>;
	clientData?: Student[];

	// Permissions
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
		canViewDepartment?: boolean;
		allowDepartmentFilter?: boolean;
	};

	// UI customization
	title?: string;
	hideHeader?: boolean;
	showEnrolledCourses?: boolean;
	showPhone?: boolean;

	// Pagination
	paginationMode?: "server" | "client";
	pageSize?: number;

	// Filters
	availableFilters?: ("department" | "batch" | "status" | "course")[];
	departments?: { id: number; name: string }[];
	courses?: {
		id: number | string;
		course_code: string;
		course_name: string;
	}[];

	// Events
	onStudentUpdate?: (
		rollNo: string,
		data: UpdateStudentRequest,
	) => Promise<void>;
	onStudentDelete?: (rollNo: string) => Promise<void>;
	onRefresh?: () => void;

	// Import any custom deps for dialog handlers
	department_id?: number | null;
}

export function StudentList({
	fetchFn,
	clientData,
	permissions = {},
	title = "Students",
	hideHeader = false,
	showEnrolledCourses = false,
	showPhone = permissions.canEdit,
	paginationMode = fetchFn ? "server" : "client",
	pageSize = 20,
	availableFilters = ["batch", "status"],
	departments = [],
	courses: passedCourses,

	onStudentDelete,
	onStudentUpdate,
	onRefresh,
	department_id,
}: StudentListProps) {
	// Dialog state
	const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
	const [editTarget, setEditTarget] = useState<Student | null>(null);
	const [deleteSaving, setDeleteSaving] = useState(false);

	// Filter state
	const [batchInput, setBatchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [departmentFilter, setDepartmentFilter] = useState(
		department_id?.toString() || "all",
	);
	const [courseFilter, setCourseFilter] = useState("all");

	// Course list for select menu
	const [courses, setCourses] = useState<
		{ id: string | number; course_code: string; course_name: string }[]
	>([]);
	const [loadingCourses, setLoadingCourses] = useState(false);

	useEffect(() => {
		if (passedCourses) {
			setCourses(passedCourses);
			return;
		}
		if (availableFilters.includes("course")) {
			setLoadingCourses(true);
			coursesApi
				.getCourses()
				.then((data) =>
					setCourses(
						data.map((c) => ({
							id: c.course_id,
							course_code: c.course_code,
							course_name: c.course_name,
						})),
					),
				)
				.catch((err) =>
					console.error("Failed to load courses for filter", err),
				)
				.finally(() => setLoadingCourses(false));
		}
	}, [availableFilters, passedCourses]);

	// Data fetching
	const {
		data: serverStudents,
		loading: serverLoading,
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
		fetchFn:
			fetchFn ||
			(() =>
				Promise.resolve({
					data: [],
					pagination: {} as any,
					success: true,
					message: "",
				})),
		limit: pageSize,
		defaultSort: "-s.roll_no",
	});

	// Client-side filtering
	const filteredClientData = useMemo(() => {
		if (!clientData) return [];

		return clientData.filter((student) => {
			const matchesBatch =
				!batchInput || student.batch_year?.toString() === batchInput;
			const matchesStatus =
				statusFilter === "all" ||
				student.student_status === statusFilter;
			const matchesSearch =
				!search ||
				student.student_name
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				student.roll_no.toLowerCase().includes(search.toLowerCase());

			const matchesCourse =
				!courseFilter ||
				((student as any).enrolled_courses &&
					(student as any).enrolled_courses
						.toLowerCase()
						.includes(courseFilter.toLowerCase()));

			return (
				matchesBatch && matchesStatus && matchesSearch && matchesCourse
			);
		});
	}, [clientData, batchInput, statusFilter, search, courseFilter]);

	// Determine which data to display
	const students =
		paginationMode === "client" ? filteredClientData : serverStudents;
	const isLoading = paginationMode === "client" ? false : serverLoading;

	// Column configuration
	const columnConfig: StudentListColumnConfig = {
		showEmail: true,
		showPhone,
		showDepartment: permissions.canViewDepartment,
		showEnrolledCourses,
		canEdit: permissions.canEdit,
		canDelete: permissions.canDelete,
	};

	// Handle edit

	// Handle delete
	const handleDelete = async (rollNo: string) => {
		if (!onStudentDelete) return;

		setDeleteSaving(true);
		try {
			await onStudentDelete(rollNo);
			toast.success("Student deleted successfully");
			setDeleteTarget(null);
			onRefresh?.();
		} catch (err) {
			toast.error("Failed to delete student");
			console.error(err);
		} finally {
			setDeleteSaving(false);
		}
	};

	// Create columns
	const columns = useMemo(
		() =>
			createStudentColumns(
				columnConfig,
				(student) => {
					if (student) setEditTarget(student);
				},
				(rollNo) => {
					const student = students.find((s) => s.roll_no === rollNo);
					if (student) setDeleteTarget(student);
				},
			),
		[students, columnConfig],
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
		!!filters.student_status ||
		!!filters.course_code;

	return (
		<div className="space-y-4 w-full">
			<Card className="w-full">
				{!hideHeader && (
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
									<GraduationCap className="h-6 w-6" />
									{title}
								</CardTitle>
								<p className="text-muted-foreground mt-1">
									Total:{" "}
									{paginationMode === "server"
										? (pagination?.total ?? students.length)
										: students.length}{" "}
									student
									{(paginationMode === "server"
										? (pagination?.total ?? students.length)
										: students.length) !== 1
										? "s"
										: ""}
								</p>
							</div>
							{onRefresh && (
								<Button
									variant="outline"
									onClick={onRefresh}
									disabled={isLoading}
								>
									Refresh
								</Button>
							)}
						</div>
					</CardHeader>
				)}

				<CardContent className="p-4 pt-0 md:p-6 md:pt-0">
					<DataTable
						columns={columns}
						data={students || []}
						refreshing={isLoading}
						{...(paginationMode === "server" && {
							serverPagination: {
								pageIndex,
								search,
								onSearch: setSearch,
								onNext: goNext,
								onPrev: goPrev,
								canPrev: canPrev && pageIndex > 0,
								pagination: pagination,
							},
						})}
					>
						{availableFilters.includes("batch") && (
							<Select
								value={batchInput || "all"}
								onValueChange={(val) => {
									const actualVal = val === "all" ? "" : val;
									setBatchInput(actualVal);
									setFilter(
										"batch_year",
										actualVal || undefined,
									);
								}}
								disabled={isLoading}
							>
								<SelectTrigger className="h-9 w-[130px]">
									<SelectValue placeholder="Batch Year" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Batches
									</SelectItem>
									{BATCH_OPTIONS.map((y) => (
										<SelectItem
											key={y}
											value={y.toString()}
										>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{availableFilters.includes("status") && (
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
								disabled={isLoading}
							>
								<SelectTrigger className="h-9 w-[140px]">
									<SelectValue placeholder="All Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Status
									</SelectItem>
									{STATUS_OPTIONS.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{availableFilters.includes("department") &&
							permissions.allowDepartmentFilter && (
								<Select
									value={departmentFilter || "all"}
									onValueChange={(val) => {
										const actualVal =
											val === "all" ? "" : val;
										setDepartmentFilter(actualVal);
										setFilter(
											"department_id",
											actualVal || undefined,
										);
									}}
									disabled={isLoading}
								>
									<SelectTrigger className="h-9 w-[180px]">
										<SelectValue placeholder="Department" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											All Depts
										</SelectItem>
										{departments.map((d) => (
											<SelectItem
												key={d.id}
												value={d.id.toString()}
											>
												{d.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

						{availableFilters.includes("course") && (
							<Select
								value={courseFilter || "all"}
								onValueChange={(val) => {
									const actualVal = val === "all" ? "" : val;
									setCourseFilter(actualVal);
									setFilter(
										"course_code",
										actualVal || undefined,
									);
								}}
								disabled={isLoading || loadingCourses}
							>
								<SelectTrigger className="h-9 w-[180px]">
									<SelectValue placeholder="Course Code" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Courses
									</SelectItem>
									{Array.from(
										new Map(
											courses.map((c) => [c.id, c]),
										).values(),
									).map((c) => (
										<SelectItem
											key={c.id}
											value={c.course_code}
										>
											{c.course_code} - {c.course_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{hasFilters && (
							<Button
								variant="ghost"
								size="sm"
								className="h-9 px-2 shrink-0"
								onClick={() => {
									setSearch("");
									setBatchInput("");
									setStatusFilter("all");
									setDepartmentFilter("");
									setCourseFilter("");
									setFilter("department_id", undefined);
									setFilter("batch_year", undefined);
									setFilter("student_status", undefined);
									setFilter("course_code", undefined);
								}}
								disabled={isLoading}
							>
								Reset
								<X className="ml-2 h-4 w-4" />
							</Button>
						)}
					</DataTable>
				</CardContent>
			</Card>

			{/* Dialogs */}

			<DeleteStudentDialog
				open={!!deleteTarget}
				studentName={deleteTarget?.student_name || null}
				rollNo={deleteTarget?.roll_no || null}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				onConfirm={handleDelete}
				isLoading={deleteSaving}
			/>

			<EditStudentDialog
				open={!!editTarget}
				student={editTarget}
				onOpenChange={(open) => !open && setEditTarget(null)}
				onSave={async (data) => {
					if (!editTarget || !onStudentUpdate) return;
					await onStudentUpdate(editTarget.roll_no, data);
				}}
			/>
		</div>
	);
}
