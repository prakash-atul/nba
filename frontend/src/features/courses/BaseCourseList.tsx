import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type {
	PaginationParams,
	PaginatedResponse,
	BaseCourse,
} from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { CourseFormDialog } from "./CourseFormDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";
import { sortableHeader } from "../shared/tableUtils";

export interface BaseCourseListProps {
	fetchFn?: (
		params: PaginationParams,
	) => Promise<PaginatedResponse<BaseCourse>>;

	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
		canCreate?: boolean;
		canOffer?: boolean;
	};

	title?: string;
	hideHeader?: boolean;
	pageSize?: number;

	onCourseUpdate?: (courseId: number, data: any) => Promise<void>;
	onCourseDelete?: (courseId: number) => Promise<void>;
	onCourseCreate?: (data: any) => Promise<void>;
	onOfferCourse?: (baseCourse: BaseCourse) => void;
	onRefresh?: () => void;
}

function createBaseCourseColumns(
	canEdit?: boolean,
	canDelete?: boolean,
	canOffer?: boolean,
	onEdit?: (course: BaseCourse) => void,
	onDelete?: (courseId: number) => void,
	onOffer?: (course: BaseCourse) => void,
): ColumnDef<BaseCourse>[] {
	const columns: ColumnDef<BaseCourse>[] = [
		{
			accessorKey: "course_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono text-xs">
					{row.getValue("course_code")}
				</Badge>
			),
		},
		{
			accessorKey: "course_name",
			header: sortableHeader("Course Name"),
			cell: ({ row }) => (
				<div className="font-medium max-w-[250px] truncate">
					{row.getValue("course_name")}
				</div>
			),
		},
		{
			accessorKey: "course_type",
			header: "Type",
			cell: ({ row }) => (
				<Badge variant="secondary" className="text-xs">
					{(row.getValue("course_type") as string) ?? "—"}
				</Badge>
			),
		},
		{
			accessorKey: "course_level",
			header: "Level",
			cell: ({ row }) => (
				<span className="text-sm">
					{(row.getValue("course_level") as string) ?? "—"}
				</span>
			),
		},
		{
			accessorKey: "credit",
			header: "Credits",
			cell: ({ row }) => (
				<div className="text-center">
					<Badge variant="outline">
						{(row.getValue("credit") as number) ?? "—"}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "is_active",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("is_active") as number | undefined;
				return (
					<Badge variant={status === 1 ? "default" : "destructive"}>
						{status === 1 ? "Active" : "Inactive"}
					</Badge>
				);
			},
		},
	];

	if (canEdit || canDelete || canOffer) {
		columns.push({
			id: "actions",
			header: "Actions",
			cell: ({ row }) => (
				<div className="flex gap-2">
					{canOffer && onOffer && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onOffer(row.original)}
							className="text-xs"
						>
							Offer
						</Button>
					)}
					{canEdit && onEdit && (
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={() => onEdit(row.original)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					)}
					{canDelete && onDelete && (
						<Button
							variant="destructive"
							size="icon"
							className="h-8 w-8"
							onClick={() => onDelete(row.original.course_id)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			),
		});
	}

	return columns;
}

export function BaseCourseList({
	fetchFn,
	permissions = {},
	title = "Course Catalog",
	hideHeader = false,
	pageSize = 20,
	onCourseUpdate,
	onCourseDelete,
	onCourseCreate,
	onOfferCourse,
	onRefresh,
}: BaseCourseListProps) {
	// Dialog state
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Dialog controls
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingCourse, setEditingCourse] = useState<BaseCourse | null>(null);
	const [deletingCourseId, setDeletingCourseId] = useState<number | null>(
		null,
	);
	const [saving, setSaving] = useState(false);

	// Data fetching
	const {
		data: courses,
		loading: isLoading,
		error,
		refresh,
	} = usePaginatedData<BaseCourse>({
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

	// Handlers
	const handleCreate = useCallback(
		async (data: any) => {
			if (!onCourseCreate) return;
			setSaving(true);
			try {
				await onCourseCreate(data);
				toast.success("Course template created successfully");
				setIsCreateDialogOpen(false);
				refresh();
			} catch (error: any) {
				toast.error(error.message || "Failed to create course");
			} finally {
				setSaving(false);
			}
		},
		[onCourseCreate, refresh],
	);

	const handleUpdate = useCallback(
		async (courseId: number | undefined, data: any) => {
			if (!onCourseUpdate || !courseId) return;
			setSaving(true);
			try {
				await onCourseUpdate(courseId, data);
				toast.success("Course template updated successfully");
				setEditingCourse(null);
				refresh();
			} catch (error: any) {
				toast.error(error.message || "Failed to update course");
			} finally {
				setSaving(false);
			}
		},
		[onCourseUpdate, refresh],
	);

	const handleDelete = useCallback(async () => {
		if (!onCourseDelete || !deletingCourseId) return;
		setSaving(true);
		try {
			await onCourseDelete(deletingCourseId);
			toast.success("Course template deleted successfully");
			setDeletingCourseId(null);
			refresh();
		} catch (error: any) {
			toast.error(error.message || "Failed to delete course");
		} finally {
			setSaving(false);
		}
	}, [onCourseDelete, deletingCourseId, refresh]);

	// Filter courses by status and search
	const filteredCourses = useMemo(() => {
		return courses.filter((c) => {
			const matchesStatus =
				statusFilter === "all" ||
				(c.is_active ?? 1) === (statusFilter === "1" ? 1 : 0);
			const matchesSearch =
				!search ||
				c.course_code.toLowerCase().includes(search.toLowerCase()) ||
				c.course_name.toLowerCase().includes(search.toLowerCase());
			return matchesStatus && matchesSearch;
		});
	}, [courses, statusFilter, search]);

	// Create columns
	const columns = useMemo(
		() =>
			createBaseCourseColumns(
				permissions.canEdit,
				permissions.canDelete,
				permissions.canOffer,
				(course) => setEditingCourse(course),
				(courseId) => setDeletingCourseId(courseId),
				onOfferCourse ? (course) => onOfferCourse(course) : undefined,
			),
		[permissions, onOfferCourse],
	);

	if (error) {
		return (
			<div className="text-red-500 p-4">
				Failed to load courses: {error}
			</div>
		);
	}

	return (
		<div className="space-y-4 w-full">
			{!hideHeader && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold tracking-tight">
								{title}
							</h2>
							<p className="text-muted-foreground">
								Total: {filteredCourses.length} course
								{filteredCourses.length !== 1 ? "s" : ""}
							</p>
						</div>
						<div className="flex gap-2">
							{permissions.canCreate && (
								<Button
									onClick={() => setIsCreateDialogOpen(true)}
									disabled={isLoading}
									className="gap-2"
								>
									<Plus className="h-4 w-4" />
									New Template
								</Button>
							)}
							{onRefresh && (
								<Button
									variant="outline"
									onClick={() => {
										refresh();
										onRefresh?.();
									}}
									disabled={isLoading}
								>
									Refresh
								</Button>
							)}
						</div>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								Course Templates
							</CardTitle>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={columns}
								data={filteredCourses || []}
								refreshing={isLoading}
							>
								{/* Custom Filters inside header */}
								<div className="flex gap-4 flex-wrap items-center">
									<div className="relative">
										<Input
											placeholder="Search by code or name..."
											value={search}
											onChange={(e) =>
												setSearch(e.target.value)
											}
											className="pl-8 h-9 w-[200px] lg:w-[300px]"
											disabled={isLoading}
										/>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
											/>
										</svg>
									</div>

									<div className="w-[150px]">
										<Select
											value={statusFilter}
											onValueChange={setStatusFilter}
											disabled={isLoading}
										>
											<SelectTrigger className="h-9">
												<SelectValue placeholder="Status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">
													All Statuses
												</SelectItem>
												<SelectItem value="1">
													Active
												</SelectItem>
												<SelectItem value="0">
													Inactive
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{(search || statusFilter !== "all") && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setSearch("");
												setStatusFilter("all");
											}}
											disabled={isLoading}
										>
											<X className="h-4 w-4 mr-1" />
											Clear
										</Button>
									)}
								</div>
							</DataTable>
						</CardContent>
					</Card>

					{permissions.canCreate && (
						<CourseFormDialog
							mode="create"
							courseType="base"
							open={isCreateDialogOpen}
							onOpenChange={setIsCreateDialogOpen}
							onSave={handleCreate}
							isLoading={saving}
						/>
					)}

					{permissions.canEdit && editingCourse && (
						<CourseFormDialog
							mode="edit"
							courseType="base"
							open={!!editingCourse}
							initialData={editingCourse}
							onOpenChange={(open) =>
								!open && setEditingCourse(null)
							}
							onSave={(data) =>
								handleUpdate(editingCourse.course_id, data)
							}
							isLoading={saving}
						/>
					)}

					{permissions.canDelete && deletingCourseId && (
						<DeleteCourseDialog
							open={!!deletingCourseId}
							course={
								{
									course_id: deletingCourseId,
									course_name:
										courses.find(
											(c) =>
												c.course_id ===
												deletingCourseId,
										)?.course_name || "this course",
								} as any
							}
							onOpenChange={(open) =>
								!open && setDeletingCourseId(null)
							}
							onConfirm={async () => handleDelete()}
							isLoading={saving}
						/>
					)}
				</div>
			)}
		</div>
	);
}
