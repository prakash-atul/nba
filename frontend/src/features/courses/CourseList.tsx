import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type {
	AdminCourse,
	PaginationParams,
	PaginatedResponse,
} from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";
import type { Row } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, X, Search } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { EditCourseDialog } from "./EditCourseDialog";
import { CreateCourseDialog } from "./CreateCourseDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";
import { createCourseColumns, type CourseListColumnConfig } from "./utils";

export interface CourseListProps {
	// Data source
	fetchFn?: (
		params: PaginationParams,
	) => Promise<PaginatedResponse<AdminCourse>>;
	clientData?: AdminCourse[];

	// Permissions & capabilities
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
		canCreate?: boolean;
		canViewDepartment?: boolean;
		allowDepartmentFilter?: boolean;
		canViewCOPO?: boolean;
	};

	// UI customization
	title?: string;
	hideHeader?: boolean;
	showFaculty?: boolean;
	showDepartment?: boolean;
	showYear?: boolean;
	showSemester?: boolean;
	showCredits?: boolean;
	showType?: boolean;
	showLevel?: boolean;
	showStatus?: boolean;
	showEnrollment?: boolean;
	showTests?: boolean;
	showAverageScore?: boolean;

	// Expandable rows
	expandable?: boolean;
	renderSubRow?: (row: Row<AdminCourse>) => React.ReactNode;

	// Pagination
	paginationMode?: "server" | "client";
	pageSize?: number;

	// Filters
	availableFilters?: ("department" | "year" | "semester" | "status")[];

	// Events
	onCourseUpdate?: (courseId: number, data: any) => Promise<void>;
	onCourseDelete?: (courseId: number) => Promise<void>;
	onCourseCreate?: (data: any) => Promise<void>;
	onRefresh?: () => void;
	onViewCOPO?: (course: AdminCourse) => void;

	department_id?: number | null;
}

export function CourseList({
	fetchFn,
	clientData,
	permissions = {},
	title = "Courses",
	hideHeader = false,
	showFaculty = true,
	showDepartment = permissions.canViewDepartment,
	showYear = true,
	showSemester = true,
	showCredits = true,
	showType = false,
	showLevel = false,
	showStatus = false,
	showEnrollment = true,
	showTests = false,
	showAverageScore = false,
	expandable = false,
	renderSubRow,
	paginationMode = fetchFn ? "server" : "client",
	pageSize = 20,
	availableFilters = ["year", "semester"],
	onCourseUpdate,
	onCourseDelete,
	onCourseCreate,
	onRefresh,
	onViewCOPO,
	department_id,
}: CourseListProps) {
	// Dialog state
	const [editTarget, setEditTarget] = useState<AdminCourse | null>(null);
	const [editSaving, setEditSaving] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [createSaving, setCreateSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);
	const [deleteSaving, setDeleteSaving] = useState(false);

	// Filter state
	const [yearFilter, setYearFilter] = useState("");
	const [semesterFilter, setSemesterFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [departmentFilter, setDepartmentFilter] = useState(
		department_id?.toString() || "all",
	);

	// Data fetching
	const {
		data: serverCourses,
		loading: serverLoading,
		error,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		setFilter,
	} = usePaginatedData<AdminCourse>({
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
		defaultSort: "-course_code",
	});

	// Client-side filtering
	const filteredClientData = useMemo(() => {
		if (!clientData) return [];

		return clientData.filter((course) => {
			const matchesYear =
				!yearFilter || course.year?.toString() === yearFilter;
			const matchesSemester =
				semesterFilter === "all" ||
				(semesterFilter === "Autumn" &&
					(String(course.semester).toLowerCase() === "autumn" ||
						Number(course.semester) % 2 === 1)) ||
				(semesterFilter === "Spring" &&
					(String(course.semester).toLowerCase() === "spring" ||
						Number(course.semester) % 2 === 0));
			const matchesSearch =
				!search ||
				course.course_code
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				course.course_name.toLowerCase().includes(search.toLowerCase());
			return matchesYear && matchesSemester && matchesSearch;
		});
	}, [clientData, yearFilter, semesterFilter, search]);

	// Server-side filtering sync
	useEffect(() => {
		if (paginationMode === "server") {
			setFilter("year", yearFilter || undefined);
			setFilter(
				"semester",
				semesterFilter === "all" ? undefined : semesterFilter,
			);
			setFilter(
				"is_active",
				statusFilter === "all"
					? undefined
					: statusFilter === "1"
						? 1
						: 0,
			);
			setFilter(
				"department_id",
				departmentFilter === "all" ? undefined : departmentFilter,
			);
		}
	}, [
		yearFilter,
		semesterFilter,
		statusFilter,
		departmentFilter,
		paginationMode,
		setFilter,
	]);

	// Determine which data to display
	const courses =
		paginationMode === "client" ? filteredClientData : serverCourses;
	const isLoading = paginationMode === "client" ? false : serverLoading;

	// Column configuration
	const columnConfig: CourseListColumnConfig = {
		showFaculty,
		showDepartment,
		showYear,
		showSemester,
		showCredits,
		showType,
		showLevel,
		showStatus,
		showEnrollment,
		showTests,
		showAverageScore,
		canEdit: permissions.canEdit,
		canDelete: permissions.canDelete,
		canViewCOPO: permissions.canViewCOPO || !!onViewCOPO,
		expandable,
	};

	// Handle edit
	const handleEditSave = async (courseId: number | undefined, data: any) => {
		if (!onCourseUpdate || !courseId) return;

		setEditSaving(true);
		try {
			await onCourseUpdate(courseId, data);
			toast.success("Course updated successfully");
			setEditTarget(null);
			onRefresh?.();
		} catch (err) {
			toast.error("Failed to update course");
			console.error(err);
		} finally {
			setEditSaving(false);
		}
	};

	// Handle create
	const handleCreate = async (data: any) => {
		if (!onCourseCreate) return;

		setCreateSaving(true);
		try {
			await onCourseCreate(data);
			toast.success("Course created successfully");
			setCreateOpen(false);
			onRefresh?.();
		} catch (err) {
			toast.error("Failed to create course");
			console.error(err);
		} finally {
			setCreateSaving(false);
		}
	};

	// Handle delete
	const handleDelete = async (courseId: number | undefined) => {
		if (!onCourseDelete || !courseId) return;

		setDeleteSaving(true);
		try {
			await onCourseDelete(courseId);
			toast.success("Course deleted successfully");
			setDeleteTarget(null);
			onRefresh?.();
		} catch (err) {
			toast.error("Failed to delete course");
			console.error(err);
		} finally {
			setDeleteSaving(false);
		}
	};

	// Create columns
	const columns = useMemo(
		() =>
			createCourseColumns(
				columnConfig,
				setEditTarget,
				(courseId: number | undefined) => {
					const course = courses.find(
						(c) => c.course_id === courseId,
					);
					if (course) setDeleteTarget(course);
				},
				onViewCOPO,
			),
		[courses, columnConfig, onViewCOPO],
	);

	if (error) {
		return (
			<div className="text-red-500 p-4">
				Failed to load courses: {error}
			</div>
		);
	}

	const hasActiveFilters =
		!!yearFilter ||
		semesterFilter !== "all" ||
		statusFilter !== "all" ||
		departmentFilter !== (department_id?.toString() || "all") ||
		!!search;

	return (
		<div className="space-y-4 w-full">
			{!hideHeader && (
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							{title}
						</h2>
						<p className="text-muted-foreground">
							Total: {courses.length} course
							{courses.length !== 1 ? "s" : ""}
						</p>
					</div>
					<div className="flex gap-2">
						{permissions.canCreate && (
							<Button
								onClick={() => setCreateOpen(true)}
								disabled={isLoading}
								className="gap-2"
							>
								<Plus className="h-4 w-4" />
								New Course
							</Button>
						)}
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
				</div>
			)}

			<Card>
				<CardHeader className="py-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<BookOpen className="h-5 w-5" />
						Courses
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={courses}
						refreshing={isLoading}
						renderSubRow={renderSubRow}
						{...(paginationMode === "server" && {
							serverPagination: {
								pageIndex,
								search,
								onSearch: setSearch,
								onNext: goNext,
								onPrev: goPrev,
								canPrev: canPrev && pageIndex > 0,
								pagination: null,
							},
						})}
					>
						{/* Additional filters next to the Search box inside DataTable */}
						{paginationMode === "client" && (
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-8 h-9 w-[150px] lg:w-[250px]"
									disabled={isLoading}
								/>
							</div>
						)}

						{availableFilters.includes("year") && (
							<Input
								placeholder="Year"
								value={yearFilter}
								onChange={(e) => setYearFilter(e.target.value)}
								disabled={isLoading}
								type="number"
								className="h-9 w-[100px]"
							/>
						)}

						{availableFilters.includes("semester") && (
							<Select
								value={semesterFilter}
								onValueChange={setSemesterFilter}
								disabled={isLoading}
							>
								<SelectTrigger className="h-9 w-[130px]">
									<SelectValue placeholder="Semester" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Semesters
									</SelectItem>
									<SelectItem value="Spring">
										Spring
									</SelectItem>
									<SelectItem value="Autumn">
										Autumn
									</SelectItem>
								</SelectContent>
							</Select>
						)}

						{availableFilters.includes("department") &&
							permissions.allowDepartmentFilter && (
								<Input
									placeholder="Dept ID"
									value={departmentFilter}
									onChange={(e) =>
										setDepartmentFilter(e.target.value)
									}
									disabled={isLoading}
									className="h-9 w-[100px]"
								/>
							)}

						{availableFilters.includes("status") && (
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
								disabled={isLoading}
							>
								<SelectTrigger className="h-9 w-[130px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Statuses
									</SelectItem>
									<SelectItem value="1">Active</SelectItem>
									<SelectItem value="0">Inactive</SelectItem>
								</SelectContent>
							</Select>
						)}

						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearch("");
									setYearFilter("");
									setSemesterFilter("all");
									setStatusFilter("all");
									setDepartmentFilter(
										department_id?.toString() || "all",
									);
									setFilter("year", undefined);
									setFilter("semester", undefined);
									setFilter("department_id", undefined);
									setFilter("is_active", undefined);
								}}
								disabled={isLoading}
								className="h-9 px-2"
							>
								Clear
								<X className="ml-2 h-4 w-4" />
							</Button>
						)}
					</DataTable>
				</CardContent>
			</Card>

			{/* Dialogs */}
			<EditCourseDialog
				open={!!editTarget}
				course={editTarget}
				onOpenChange={(open) => !open && setEditTarget(null)}
				onSave={handleEditSave}
				isLoading={editSaving}
			/>
			<CreateCourseDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSave={handleCreate}
				isLoading={createSaving}
			/>
			<DeleteCourseDialog
				open={!!deleteTarget}
				course={deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				onConfirm={handleDelete}
				isLoading={deleteSaving}
			/>
		</div>
	);
}
