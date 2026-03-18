import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowUpDown,
	Plus,
	Pencil,
	Trash2,
	BookOpen,
	X,
	CalendarDays,
	History,
	ChevronRight,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type {
	BaseCourse,
	DepartmentCourse,
	DepartmentFaculty,
	TestAverage,
	CreateCourseRequest,
	UpdateCourseRequest,
} from "@/services/api";
import { hodApi } from "@/services/api/hod";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef, Row } from "@tanstack/react-table";

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];
const semesters = ["Spring", "Autumn"] as const;
// Jan–Jun → Spring, Jul–Dec → Autumn
const currentSemester: string = new Date().getMonth() < 6 ? "Spring" : "Autumn";

// ── Test type colour map ─────────────────────────────────────────────────────
const TEST_TYPE_COLORS: Record<string, string> = {
	"Mid Sem":
		"bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
	"End Sem":
		"bg-rose-50   text-rose-700   dark:bg-rose-950   dark:text-rose-300   border-rose-200   dark:border-rose-800",
	Assignment:
		"bg-amber-50  text-amber-700  dark:bg-amber-950  dark:text-amber-300  border-amber-200  dark:border-amber-800",
	Quiz: "bg-sky-50    text-sky-700    dark:bg-sky-950    dark:text-sky-300    border-sky-200    dark:border-sky-800",
};

/** Expanded sub-row: lazy-loads per-test averages for a course offering */
function OfferingTestAverages({ offeringId }: { offeringId: number }) {
	const [averages, setAverages] = useState<TestAverage[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await hodApi.getOfferingTestAverages(offeringId);
			setAverages(res);
		} catch {
			setError("Failed to load averages");
		} finally {
			setLoading(false);
		}
	}, [offeringId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 px-6 py-3 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading test averages…
			</div>
		);
	}
	if (error) {
		return (
			<div className="px-6 py-3 text-sm text-destructive">{error}</div>
		);
	}
	if (!averages || averages.length === 0) {
		return (
			<div className="px-6 py-3 text-sm text-muted-foreground">
				No tests found for this offering.
			</div>
		);
	}

	return (
		<div className="px-6 py-3">
			<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				Per-Test Averages
			</p>
			<div className="flex flex-wrap gap-3">
				{averages.map((t) => {
					const colorCls =
						TEST_TYPE_COLORS[t.test_type] ??
						"bg-gray-50 text-gray-600 border-gray-200";
					const pct = t.avg_pct != null ? `${t.avg_pct}%` : "—";
					const marks =
						t.avg_marks != null
							? `${t.avg_marks} / ${t.full_marks}`
							: `— / ${t.full_marks}`;
					return (
						<div
							key={t.test_id}
							className="flex flex-col gap-1 rounded-lg border bg-white dark:bg-slate-900 p-3 min-w-[140px]"
						>
							<div className="flex items-center justify-between gap-2">
								<Badge
									variant="secondary"
									className={`text-[10px] ${colorCls}`}
								>
									{t.test_type}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{t.students_assessed} students
								</span>
							</div>
							<p
								className="text-sm font-medium truncate"
								title={t.test_name}
							>
								{t.test_name}
							</p>
							<div className="flex items-baseline gap-1">
								<span className="text-lg font-bold tabular-nums">
									{pct}
								</span>
								<span className="text-xs text-muted-foreground">
									({marks})
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function CoursesManagement() {
	// --- Base Courses Tab Data ---
	const {
		data: baseCourses,
		loading: isLoadingBase,
		refresh: refreshBase,
		pagination: basePagination,
		goNext: baseGoNext,
		goPrev: baseGoPrev,
		canPrev: baseCanPrev,
		pageIndex: basePageIndex,
		search: baseSearch,
		setSearch: setBaseSearch,
	} = usePaginatedData<BaseCourse>({
		fetchFn: (params) => hodApi.getBaseCourses(params),
		limit: 20,
		defaultSort: "course_code",
	});

	// For the dropdown in "Offer Course"
	const [allBaseCourses, setAllBaseCourses] = useState<BaseCourse[]>([]);
	useEffect(() => {
		hodApi.getAllBaseCourses().then(setAllBaseCourses).catch(console.error);
	}, []);

	// ── Current semester data (locked to currentYear + currentSemester) ─────
	const {
		data: currentCourses,
		loading: isLoadingCurrent,
		refresh: refreshCurrent,
		pagination: currentPagination,
		goNext: currentGoNext,
		goPrev: currentGoPrev,
		canPrev: currentCanPrev,
		pageIndex: currentPageIndex,
		search: currentSearch,
		setSearch: setCurrentSearch,
	} = usePaginatedData<DepartmentCourse, { year: number; semester: string }>({
		fetchFn: (params) => hodApi.getDepartmentCourses(params),
		limit: 20,
		defaultSort: "c.course_code",
		initialFilters: { year: currentYear, semester: currentSemester },
	});

	// ── All offerings data (user-filtered) ──────────────────────────────────
	const {
		data: allCourses,
		loading: isLoadingAll,
		refresh: refreshAll,
		pagination: allPagination,
		goNext: allGoNext,
		goPrev: allGoPrev,
		canPrev: allCanPrev,
		pageIndex: allPageIndex,
		search: allSearch,
		setSearch: setAllSearch,
		filters,
		setFilter,
	} = usePaginatedData<
		DepartmentCourse,
		{ year: number | undefined; semester: string | undefined }
	>({
		fetchFn: (params) => hodApi.getDepartmentCourses(params),
		limit: 20,
		defaultSort: "c.course_code",
	});

	const { data: faculty, loading: isLoadingFaculty } =
		usePaginatedData<DepartmentFaculty>({
			fetchFn: (params) => hodApi.getDepartmentFaculty(params),
			limit: 100,
			defaultSort: "u.username",
		});
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] =
		useState(false);
	const [templateFormData, setTemplateFormData] = useState({
		course_code: "",
		course_name: "",
		credit: 3,
		course_type: "Theory",
		course_level: "UG",
		is_active: 1,
	});
	const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] =
		useState(false);
	const [selectedBaseCourse, setSelectedBaseCourse] =
		useState<BaseCourse | null>(null);
	const [editTemplateFormData, setEditTemplateFormData] = useState({
		course_code: "",
		course_name: "",
		credit: 3,
		course_type: "Theory",
		course_level: "UG",
		is_active: 1,
	});
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedCourse, setSelectedCourse] =
		useState<DepartmentCourse | null>(null);
	const [formData, setFormData] = useState<CreateCourseRequest>({
		course_code: "",
		name: "",
		credit: 3,
		faculty_id: 0,
		year: currentYear,
		semester: currentSemester,
	});
	const [editFormData, setEditFormData] = useState<UpdateCourseRequest>({
		course_code: "",
		name: "",
		credit: 3,
		faculty_id: 0,
		year: currentYear,
		semester: currentSemester,
	});

	const handleSelectBaseCourse = (code: string) => {
		const base = allBaseCourses.find((b) => b.course_code === code);
		if (base) {
			setFormData({
				...formData,
				course_code: base.course_code,
				name: base.course_name,
				credit: base.credit,
			});
		}
	};

	const resetForm = () => {
		setFormData({
			course_code: "",
			name: "",
			credit: 3,
			faculty_id: 0,
			year: currentYear,
			semester: currentSemester,
		});
	};

	const baseColumns: ColumnDef<BaseCourse>[] = [
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
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Course Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("course_name")}</div>
			),
		},
		{
			accessorKey: "course_type",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Type
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{row.getValue("course_type") || "—"}
				</div>
			),
		},
		{
			accessorKey: "course_level",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Level
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{row.getValue("course_level") || "—"}
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
			accessorKey: "is_active",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Status
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="text-center">
					<Badge
						variant={
							row.getValue("is_active") ? "default" : "secondary"
						}
					>
						{row.getValue("is_active") ? "Active" : "Inactive"}
					</Badge>
				</div>
			),
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => {
				const course = row.original;
				return (
					<div className="flex items-center justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
							onClick={() => openEditBaseCourseDialog(course)}
						>
							<Pencil className="w-4 h-4" />
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Delete Base Course
									</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to delete "
										{course.course_name}"? This action
										cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											handleDeleteBaseCourse(
												course.course_id,
												course.course_name,
											)
										}
										className="bg-red-600 hover:bg-red-700"
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				);
			},
		},
	];

	const columns: ColumnDef<DepartmentCourse>[] = [
		// ── Expand toggle ──────────────────────────────────────────────────
		{
			id: "expand",
			header: () => null,
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-muted-foreground"
					onClick={() => row.toggleExpanded()}
					aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
				>
					<ChevronRight
						className={`h-4 w-4 transition-transform duration-150 ${
							row.getIsExpanded() ? "rotate-90" : ""
						}`}
					/>
				</Button>
			),
			enableSorting: false,
			enableHiding: false,
		},
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
			cell: ({ row }) => {
				const sem = row.getValue("semester") as string;
				return (
					<div className="text-center">
						<Badge
							variant="secondary"
							className={
								sem === "Spring"
									? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800"
									: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
							}
						>
							{sem}
						</Badge>
					</div>
				);
			},
		},
		{
			id: "offering_status",
			header: "Status",
			cell: ({ row }) => {
				const year = row.original.year ?? 0;
				const semester = row.original.semester ?? "";
				const isCurrentYear = year === currentYear;
				const isFuture =
					year > currentYear ||
					(isCurrentYear &&
						semester === "Autumn" &&
						currentSemester === "Spring");
				const isConcluded = row.original.cfa_is_active === 0;
				const isActive =
					!isConcluded &&
					isCurrentYear &&
					semester === currentSemester;
				const label = isActive
					? "Active"
					: isFuture
						? "Scheduled"
						: "Completed";
				const cls = isActive
					? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
					: isFuture
						? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800"
						: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-700";
				return (
					<Badge variant="secondary" className={cls}>
						{label}
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
						className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
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
						className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
					>
						{(row.getValue("test_count") as number) ?? 0}
					</Badge>
				</div>
			),
		},
		{
			accessorKey: "avg_score_pct",
			header: ({ column }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Avg Score
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				</div>
			),
			cell: ({ row }) => {
				const pct = row.original.avg_score_pct;
				if (pct == null) {
					return (
						<div className="text-center text-muted-foreground text-sm">
							—
						</div>
					);
				}
				const color =
					pct >= 75
						? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
						: pct >= 50
							? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
							: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
				return (
					<div className="text-center">
						<Badge variant="secondary" className={color}>
							{pct}%
						</Badge>
					</div>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => {
				const course = row.original;
				return (
					<div className="flex items-center justify-end gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
							onClick={() => openEditDialog(course)}
						>
							<Pencil className="w-4 h-4" />
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Delete Course
									</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to delete "
										{course.course_name}"? This will also
										delete all associated tests, marks, and
										enrollments. This action cannot be
										undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={() =>
											handleDeleteCourse(
												course.offering_id!,
												course.course_name,
											)
										}
										className="bg-red-600 hover:bg-red-700"
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				);
			},
		},
	];

	const handleCreateCourse = async () => {
		if (!formData.course_code || !formData.name || !formData.faculty_id) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await hodApi.createCourse(formData);
			toast.success("Course created successfully");
			setIsAddDialogOpen(false);
			resetForm();
			refreshCurrent();
			refreshAll();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create course",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const openEditBaseCourseDialog = (course: BaseCourse) => {
		setSelectedBaseCourse(course);
		setEditTemplateFormData({
			course_code: course.course_code,
			course_name: course.course_name,
			credit: course.credit,
			course_type: course.course_type ?? "Theory",
			course_level: course.course_level ?? "UG",
			is_active: course.is_active ?? 1,
		});
		setIsEditTemplateDialogOpen(true);
	};

	const handleUpdateBaseCourse = async () => {
		if (!selectedBaseCourse) return;
		if (
			!editTemplateFormData.course_code ||
			!editTemplateFormData.course_name
		) {
			toast.error("Please fill in required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await hodApi.updateBaseCourse(
				selectedBaseCourse.course_id,
				editTemplateFormData,
			);
			toast.success("Base course updated successfully");
			setIsEditTemplateDialogOpen(false);
			setSelectedBaseCourse(null);
			refreshBase();
			hodApi
				.getAllBaseCourses()
				.then(setAllBaseCourses)
				.catch(console.error);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update base course",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteBaseCourse = async (
		courseId: number,
		courseName: string,
	) => {
		try {
			await hodApi.deleteBaseCourse(courseId);
			toast.success(`Base course "${courseName}" deleted successfully`);
			refreshBase();
			hodApi
				.getAllBaseCourses()
				.then(setAllBaseCourses)
				.catch(console.error);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete base course",
			);
		}
	};
	const handleDeleteCourse = async (courseId: number, courseName: string) => {
		try {
			await hodApi.deleteCourse(courseId);
			toast.success(`Course "${courseName}" deleted successfully`);
			refreshCurrent();
			refreshAll();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete course",
			);
		}
	};

	const openEditDialog = (course: DepartmentCourse) => {
		setSelectedCourse(course);
		setEditFormData({
			course_code: course.course_code,
			name: course.course_name,
			credit: course.credit,
			faculty_id: course.faculty_id ?? 0,
			year: course.year ?? currentYear,
			semester: course.semester ?? currentSemester,
		});
		setIsEditDialogOpen(true);
	};

	const handleUpdateCourse = async () => {
		if (!selectedCourse) return;

		if (
			!editFormData.course_code ||
			!editFormData.name ||
			!editFormData.faculty_id
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await hodApi.updateCourse(
				selectedCourse.offering_id!,
				editFormData,
			);
			toast.success("Course updated successfully");
			setIsEditDialogOpen(false);
			setSelectedCourse(null);
			refreshCurrent();
			refreshAll();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update course",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderSubRow = (row: Row<DepartmentCourse>) => {
		const offeringId = row.original.offering_id;
		if (!offeringId) return null;
		return <OfferingTestAverages offeringId={offeringId} />;
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
						<BookOpen className="w-5 h-5 text-white" />
					</div>
					<div>
						<CardTitle>Department Courses</CardTitle>
						<p className="text-sm text-muted-foreground">
							Manage courses for your department
						</p>
					</div>
				</div>
				{/* Add Course Dialog */}
				<Dialog
					open={isAddDialogOpen}
					onOpenChange={setIsAddDialogOpen}
				>
					<DialogTrigger asChild>
						<Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
							<Plus className="w-4 h-4" />
							Add Course
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Add New Course</DialogTitle>
							<DialogDescription>
								Create a new course offering for your department
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="course_code">
										Select Base Course
									</Label>
									<Select
										value={formData.course_code}
										onValueChange={handleSelectBaseCourse}
									>
										<SelectTrigger
											id="course_code"
											className="w-full"
										>
											<SelectValue placeholder="Select course..." />
										</SelectTrigger>
										<SelectContent className="max-w-[400px]">
											{allBaseCourses
												.filter(
													(c) => c.is_active !== 0,
												)
												.map((c) => (
													<SelectItem
														key={c.course_id}
														value={c.course_code}
													>
														<span className="truncate block">
															{c.course_code} -{" "}
															{c.course_name}
														</span>
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="course_code_input">
										Course Code *
									</Label>
									<Input
										id="course_code_input"
										placeholder="e.g., CS301"
										value={formData.course_code}
										onChange={(e) =>
											setFormData({
												...formData,
												course_code: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="credit">Credits *</Label>
									<Select
										value={String(formData.credit)}
										onValueChange={(value) =>
											setFormData({
												...formData,
												credit: parseInt(value),
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{[1, 2, 3, 4, 5, 6].map((c) => (
												<SelectItem
													key={c}
													value={String(c)}
												>
													{c}{" "}
													{c === 1
														? "Credit"
														: "Credits"}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="name">Course Name *</Label>
								<Input
									id="name"
									placeholder="e.g., Database Management Systems"
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="faculty">
									Assign Faculty *
								</Label>
								<Select
									value={
										formData.faculty_id
											? String(formData.faculty_id)
											: ""
									}
									onValueChange={(value) =>
										setFormData({
											...formData,
											faculty_id: parseInt(value),
										})
									}
									disabled={isLoadingFaculty}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												isLoadingFaculty
													? "Loading..."
													: "Select faculty member"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{faculty
											.filter(
												(f) =>
													f.role === "faculty" ||
													f.role === "hod",
											)
											.map((f) => (
												<SelectItem
													key={f.employee_id}
													value={String(
														f.employee_id,
													)}
												>
													{f.username}{" "}
													{f.role === "hod"
														? "(HOD)"
														: ""}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="year">Year *</Label>
									<Select
										value={String(formData.year)}
										onValueChange={(value) =>
											setFormData({
												...formData,
												year: parseInt(value),
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{years.map((y) => (
												<SelectItem
													key={y}
													value={String(y)}
												>
													{y}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="semester">Semester *</Label>
									<Select
										value={formData.semester}
										onValueChange={(value) =>
											setFormData({
												...formData,
												semester: value,
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{semesters.map((s) => (
												<SelectItem key={s} value={s}>
													{s} Semester
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									setIsAddDialogOpen(false);
									resetForm();
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreateCourse}
								disabled={isSubmitting}
								className="bg-emerald-600 hover:bg-emerald-700"
							>
								{isSubmitting ? "Creating..." : "Create Course"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardHeader>

			<CardContent>
				<Tabs defaultValue="current">
					<TabsList className="mb-4">
						<TabsTrigger
							value="current"
							className="flex items-center gap-2"
						>
							<CalendarDays className="w-4 h-4" />
							{currentSemester} {currentYear}
						</TabsTrigger>
						<TabsTrigger
							value="all"
							className="flex items-center gap-2"
						>
							<History className="w-4 h-4" />
							All Offerings
						</TabsTrigger>
						<TabsTrigger
							value="base"
							className="flex items-center gap-2"
						>
							<BookOpen className="w-4 h-4" />
							Base Courses
						</TabsTrigger>
					</TabsList>

					<TabsContent value="base">
						<DataTable
							columns={baseColumns}
							data={baseCourses}
							refreshing={isLoadingBase}
							serverPagination={{
								pagination: basePagination,
								onNext: baseGoNext,
								onPrev: baseGoPrev,
								canPrev: baseCanPrev,
								pageIndex: basePageIndex,
								search: baseSearch,
								onSearch: setBaseSearch,
							}}
						>
							{() => (
								<Dialog
									open={isAddTemplateDialogOpen}
									onOpenChange={setIsAddTemplateDialogOpen}
								>
									<DialogTrigger asChild>
										<Button className="h-9 gap-2">
											<Plus className="mr-2 h-4 w-4" />
											Add Course Template
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Add Course Template
											</DialogTitle>
											<DialogDescription>
												Create a new base course.
											</DialogDescription>
										</DialogHeader>
										<div className="grid gap-4 py-4">
											<div className="space-y-2">
												<Label>Course Code</Label>
												<Input
													placeholder="e.g. CS101"
													value={
														templateFormData.course_code
													}
													onChange={(e) =>
														setTemplateFormData({
															...templateFormData,
															course_code:
																e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Course Name</Label>
												<Input
													placeholder="e.g. Intro to CS"
													value={
														templateFormData.course_name
													}
													onChange={(e) =>
														setTemplateFormData({
															...templateFormData,
															course_name:
																e.target.value,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label>Credits</Label>
												<Input
													type="number"
													min={1}
													max={10}
													value={
														templateFormData.credit
													}
													onChange={(e) =>
														setTemplateFormData({
															...templateFormData,
															credit:
																parseInt(
																	e.target
																		.value,
																) || 3,
														})
													}
												/>
											</div>

											<div className="space-y-2">
												<Label>Course Type</Label>
												<Select
													value={
														templateFormData.course_type
													}
													onValueChange={(v) =>
														setTemplateFormData({
															...templateFormData,
															course_type: v,
														})
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Theory">
															Theory
														</SelectItem>
														<SelectItem value="Lab">
															Lab
														</SelectItem>
														<SelectItem value="Project">
															Project
														</SelectItem>
														<SelectItem value="Seminar">
															Seminar
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Course Level</Label>
												<Select
													value={
														templateFormData.course_level
													}
													onValueChange={(v) =>
														setTemplateFormData({
															...templateFormData,
															course_level: v,
														})
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select level" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="UG">
															UG
														</SelectItem>
														<SelectItem value="PG">
															PG
														</SelectItem>
														<SelectItem value="UG & PG">
															UG & PG
														</SelectItem>
														<SelectItem value="PHD">
															PHD
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Status</Label>
												<Select
													value={templateFormData.is_active.toString()}
													onValueChange={(v) =>
														setTemplateFormData({
															...templateFormData,
															is_active:
																parseInt(v),
														})
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="1">
															Active
														</SelectItem>
														<SelectItem value="0">
															Inactive
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => {
													setIsAddTemplateDialogOpen(
														false,
													);
													setTemplateFormData({
														course_code: "",
														course_name: "",
														credit: 3,
														course_type: "Theory",
														course_level: "UG",
														is_active: 1,
													});
												}}
											>
												Cancel
											</Button>
											<Button
												disabled={isSubmitting}
												onClick={async () => {
													try {
														setIsSubmitting(true);
														await hodApi.createBaseCourse(
															templateFormData,
														);
														toast.success(
															"Template created",
														);
														setIsAddTemplateDialogOpen(
															false,
														);
														setTemplateFormData({
															course_code: "",
															course_name: "",
															credit: 3,
															course_type:
																"Theory",
															course_level: "UG",
															is_active: 1,
														});
														refreshBase();
														hodApi
															.getAllBaseCourses()
															.then(
																setAllBaseCourses,
															)
															.catch(
																console.error,
															);
													} catch (e) {
														toast.error(
															"Failed to create template",
														);
													} finally {
														setIsSubmitting(false);
													}
												}}
											>
												Save Template
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							)}
						</DataTable>
					</TabsContent>

					{/* ── Current Semester Tab ─────────────────────────── */}
					<TabsContent value="current">
						<DataTable
							columns={columns}
							data={currentCourses}
							refreshing={isLoadingCurrent}
							renderSubRow={renderSubRow}
							serverPagination={{
								pagination: currentPagination,
								onNext: currentGoNext,
								onPrev: currentGoPrev,
								canPrev: currentCanPrev,
								pageIndex: currentPageIndex,
								search: currentSearch,
								onSearch: setCurrentSearch,
							}}
						>
							{() => (
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 px-3 py-1"
									>
										{currentSemester} {currentYear}
									</Badge>
								</div>
							)}
						</DataTable>
					</TabsContent>

					{/* ── All Offerings Tab ────────────────────────────── */}
					<TabsContent value="all">
						<DataTable
							columns={columns}
							data={allCourses}
							refreshing={isLoadingAll}
							renderSubRow={renderSubRow}
							serverPagination={{
								pagination: allPagination,
								onNext: allGoNext,
								onPrev: allGoPrev,
								canPrev: allCanPrev,
								pageIndex: allPageIndex,
								search: allSearch,
								onSearch: setAllSearch,
							}}
						>
							{() => (
								<div className="flex items-center gap-2 flex-wrap">
									{/* Year filter */}
									<Select
										value={
											filters.year !== undefined
												? String(filters.year)
												: ""
										}
										onValueChange={(v) =>
											setFilter(
												"year",
												v ? parseInt(v) : undefined,
											)
										}
									>
										<SelectTrigger className="w-[110px]">
											<SelectValue placeholder="All Years" />
										</SelectTrigger>
										<SelectContent>
											{years.map((y) => (
												<SelectItem
													key={y}
													value={String(y)}
												>
													{y}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{filters.year !== undefined && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() =>
												setFilter("year", undefined)
											}
										>
											<X className="h-4 w-4" />
										</Button>
									)}
									{/* Semester filter */}
									<Select
										value={filters.semester ?? ""}
										onValueChange={(v) =>
											setFilter(
												"semester",
												v || undefined,
											)
										}
									>
										<SelectTrigger className="w-[150px]">
											<SelectValue placeholder="All Semesters" />
										</SelectTrigger>
										<SelectContent>
											{semesters.map((s) => (
												<SelectItem key={s} value={s}>
													{s} Semester
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{filters.semester !== undefined && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() =>
												setFilter("semester", undefined)
											}
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							)}
						</DataTable>
					</TabsContent>
				</Tabs>
			</CardContent>

			{/* ── Edit Base Course Dialog ──────────────────────────────── */}
			<Dialog
				open={isEditTemplateDialogOpen}
				onOpenChange={setIsEditTemplateDialogOpen}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Course Template</DialogTitle>
						<DialogDescription>
							Update an existing base course.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label>Course Code</Label>
							<Input
								placeholder="e.g. CS101"
								value={editTemplateFormData.course_code}
								onChange={(e) =>
									setEditTemplateFormData({
										...editTemplateFormData,
										course_code: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Course Name</Label>
							<Input
								placeholder="e.g. Intro to CS"
								value={editTemplateFormData.course_name}
								onChange={(e) =>
									setEditTemplateFormData({
										...editTemplateFormData,
										course_name: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Credits</Label>
							<Input
								type="number"
								min={1}
								max={10}
								value={editTemplateFormData.credit}
								onChange={(e) =>
									setEditTemplateFormData({
										...editTemplateFormData,
										credit: parseInt(e.target.value) || 3,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Course Type</Label>
							<Select
								value={editTemplateFormData.course_type}
								onValueChange={(v) =>
									setEditTemplateFormData({
										...editTemplateFormData,
										course_type: v,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Theory">
										Theory
									</SelectItem>
									<SelectItem value="Lab">Lab</SelectItem>
									<SelectItem value="Project">
										Project
									</SelectItem>
									<SelectItem value="Seminar">
										Seminar
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Course Level</Label>
							<Select
								value={editTemplateFormData.course_level}
								onValueChange={(v) =>
									setEditTemplateFormData({
										...editTemplateFormData,
										course_level: v,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select level" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="UG">UG</SelectItem>
									<SelectItem value="PG">PG</SelectItem>
									<SelectItem value="UG & PG">
										UG & PG
									</SelectItem>
									<SelectItem value="PHD">PHD</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={editTemplateFormData.is_active.toString()}
								onValueChange={(v) =>
									setEditTemplateFormData({
										...editTemplateFormData,
										is_active: parseInt(v),
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">Active</SelectItem>
									<SelectItem value="0">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsEditTemplateDialogOpen(false);
								setSelectedBaseCourse(null);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={isSubmitting}
							onClick={handleUpdateBaseCourse}
						>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Edit Course Dialog ───────────────────────────────────── */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit Course</DialogTitle>
						<DialogDescription>
							Update course information
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit_course_code">
									Course Code *
								</Label>
								<Input
									id="edit_course_code"
									placeholder="e.g., CS301"
									value={editFormData.course_code || ""}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											course_code: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit_credit">Credits *</Label>
								<Select
									value={String(editFormData.credit)}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											credit: parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5, 6].map((c) => (
											<SelectItem
												key={c}
												value={String(c)}
											>
												{c}{" "}
												{c === 1 ? "Credit" : "Credits"}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_name">Course Name *</Label>
							<Input
								id="edit_name"
								placeholder="e.g., Database Management Systems"
								value={editFormData.name || ""}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										name: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_faculty">
								Assign Faculty *
							</Label>
							<Select
								value={
									editFormData.faculty_id
										? String(editFormData.faculty_id)
										: ""
								}
								onValueChange={(value) =>
									setEditFormData({
										...editFormData,
										faculty_id: parseInt(value),
									})
								}
								disabled={isLoadingFaculty}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											isLoadingFaculty
												? "Loading..."
												: "Select faculty member"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{faculty
										.filter(
											(f) =>
												f.role === "faculty" ||
												f.role === "hod",
										)
										.map((f) => (
											<SelectItem
												key={f.employee_id}
												value={String(f.employee_id)}
											>
												{f.username}{" "}
												{f.role === "hod"
													? "(HOD)"
													: ""}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit_year">Year *</Label>
								<Select
									value={String(editFormData.year)}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											year: parseInt(value),
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{years.map((y) => (
											<SelectItem
												key={y}
												value={String(y)}
											>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit_semester">
									Semester *
								</Label>
								<Select
									value={
										editFormData.semester ?? currentSemester
									}
									onValueChange={(value) =>
										setEditFormData({
											...editFormData,
											semester: value,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{semesters.map((s) => (
											<SelectItem key={s} value={s}>
												{s} Semester
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsEditDialogOpen(false);
								setSelectedCourse(null);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateCourse}
							disabled={isSubmitting}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
