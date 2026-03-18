import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { GraduationCap, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { EditStudentDialog } from "./EditStudentDialog";
import { DeleteStudentDialog } from "./DeleteStudentDialog";
import { createStudentColumns, type StudentListColumnConfig } from "./utils";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];

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
	onStudentUpdate,
	onStudentDelete,
	onRefresh,
	department_id,
}: StudentListProps) {
	// Dialog state
	const [editTarget, setEditTarget] = useState<Student | null>(null);
	const [editSaving, setEditSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
	const [deleteSaving, setDeleteSaving] = useState(false);

	// Filter state
	const [batchInput, setBatchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [departmentFilter, setDepartmentFilter] = useState(
		department_id?.toString() || "all",
	);
	const [courseFilter, setCourseFilter] = useState("");

	// Data fetching
	const {
		data: serverStudents,
		loading: serverLoading,
		error,
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
		defaultSort: "-s.enrollment_date",
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
	const handleEditSave = async (
		rollNo: string,
		data: UpdateStudentRequest,
	) => {
		if (!onStudentUpdate) return;

		setEditSaving(true);
		try {
			await onStudentUpdate(rollNo, data);
			toast.success("Student updated successfully");
			setEditTarget(null);
			onRefresh?.();
		} catch (err) {
			toast.error("Failed to update student");
			console.error(err);
		} finally {
			setEditSaving(false);
		}
	};

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
			createStudentColumns(columnConfig, setEditTarget, (rollNo) => {
				const student = students.find((s) => s.roll_no === rollNo);
				if (student) setDeleteTarget(student);
			}),
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
									Total: {students.length} student
									{students.length !== 1 ? "s" : ""}
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

				<CardContent className="space-y-4">
					{/* Filters */}
					<div className="flex gap-4 flex-wrap items-end mt-2">
						<div className="flex-1 min-w-[200px]">
							<label className="text-sm font-medium">
								Search
							</label>
							<Input
								placeholder="Search by name or roll number..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								disabled={isLoading}
							/>
						</div>

						{availableFilters.includes("batch") && (
							<div className="flex-1 min-w-[150px]">
								<label className="text-sm font-medium">
									Batch
								</label>
								<Input
									placeholder="Filter by batch year..."
									value={batchInput}
									onChange={(e) =>
										setBatchInput(e.target.value)
									}
									disabled={isLoading}
									type="number"
								/>
							</div>
						)}

						{availableFilters.includes("status") && (
							<div className="flex-1 min-w-[150px]">
								<label className="text-sm font-medium">
									Status
								</label>
								<Select
									value={statusFilter}
									onValueChange={setStatusFilter}
									disabled={isLoading}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											All Statuses
										</SelectItem>
										{STATUS_OPTIONS.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{availableFilters.includes("department") &&
							permissions.allowDepartmentFilter && (
								<div className="flex-1 min-w-[150px]">
									<label className="text-sm font-medium">
										Department Filter
									</label>
									<Input
										placeholder="Dept ID..."
										value={departmentFilter}
										onChange={(e) =>
											setDepartmentFilter(e.target.value)
										}
										disabled={isLoading}
									/>
								</div>
							)}

						{availableFilters.includes("course") && (
							<div className="flex-1 min-w-[150px]">
								<label className="text-sm font-medium">
									Course Filter
								</label>
								<Input
									placeholder="Course Code..."
									value={courseFilter}
									onChange={(e) => {
										setCourseFilter(e.target.value);
										setFilter(
											"course_code",
											e.target.value || undefined,
										);
									}}
									disabled={isLoading}
								/>
							</div>
						)}

						{hasFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearch("");
									setBatchInput("");
									setStatusFilter("all");
									setDepartmentFilter("all");
									setCourseFilter("");
									setFilter("department_id", undefined);
									setFilter("batch_year", undefined);
									setFilter("student_status", undefined);
									setFilter("course_code", undefined);
								}}
								disabled={isLoading}
							>
								<X className="h-4 w-4 mr-1" />
								Clear
							</Button>
						)}
					</div>

					<DataTable
						columns={columns}
						data={students}
						refreshing={isLoading}
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
					/>
				</CardContent>
			</Card>

			{/* Dialogs */}
			<EditStudentDialog
				open={!!editTarget}
				student={editTarget}
				onOpenChange={(open) => !open && setEditTarget(null)}
				onSave={handleEditSave}
				isLoading={editSaving}
			/>

			<DeleteStudentDialog
				open={!!deleteTarget}
				studentName={deleteTarget?.student_name || null}
				rollNo={deleteTarget?.roll_no || null}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				onConfirm={handleDelete}
				isLoading={deleteSaving}
			/>
		</div>
	);
}
