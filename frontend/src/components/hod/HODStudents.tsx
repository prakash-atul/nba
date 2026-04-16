import { useState, useEffect, useMemo, useRef } from "react";
import { hodApi } from "@/services/api/hod";
import type { Student, UpdateStudentRequest } from "@/services/api";
import { debugLogger } from "@/lib/debugLogger";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowUpDown,
	GraduationCap,
	Pencil,
	Building2,
	BookOpen,
	X,
	Trash2,
	Plus,
	ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { FacultyStudents } from "@/components/faculty/FacultyStudents";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];
const BATCH_OPTIONS = Array.from(
	{ length: 10 },
	(_, i) => new Date().getFullYear() - 4 + i,
);

type StudentFilters = {
	student_status: string | undefined;
	batch_year: string | undefined;
};

export function HODStudents() {
	useEffect(() => {
		debugLogger.info("HODStudents", "Mounted");
	}, []);

	const [activeTab, setActiveTab] = useState("department");
	// Only mount FacultyStudents once the user first opens that tab
	const [myCoursesVisited, setMyCoursesVisited] = useState(false);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
		if (value === "my-courses") setMyCoursesVisited(true);
	};

	const {
		data: students,
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
		refresh,
	} = usePaginatedData<Student, StudentFilters>({
		fetchFn: hodApi.getDepartmentStudents,
		limit: 20,
	});

	useEffect(() => {
		if (students && students.length > 0) {
			debugLogger.info("HODStudents", "Data loaded", {
				count: students.length,
				first: students[0],
			});
		}
	}, [students]);

	// Batch year debounce — skip first render to avoid triggering an extra fetch
	const [batchInput, setBatchInput] = useState(
		(filters.batch_year as string | undefined) || "",
	);
	const batchMounted = useRef(false);
	useEffect(() => {
		if (!batchMounted.current) {
			batchMounted.current = true;
			return;
		}
		const t = setTimeout(() => {
			setFilter("batch_year", batchInput || undefined);
		}, 500);
		return () => clearTimeout(t);
	}, [batchInput, setFilter]);

	const hasFilters = !!filters.student_status || !!filters.batch_year;

	// ── Edit state ────────────────────────────────────────────────────────────
	const [editTarget, setEditTarget] = useState<Student | null>(null);
	const [editForm, setEditForm] = useState<UpdateStudentRequest>({});
	const [editSaving, setEditSaving] = useState(false);

	const handleEditOpen = (student: Student) => {
		setEditTarget(student);
		setEditForm({
			student_name: student.student_name,
			email: student.email ?? "",
			phones: student.phones?.length ? student.phones : [],
			student_status: student.student_status,
			batch_year: student.batch_year,
		});
	};

	const handleEditSave = async () => {
		debugLogger.info("HODStudents", "handleEditSave starting", {
			editTarget,
			editForm,
		});
		if (!editTarget) return;

		const validPhones = (editForm.phones || []).filter(
			(p) => p.trim() !== "",
		);
		if (
			validPhones.length > 0 &&
			validPhones.some((p) => !/^\d{10}$/.test(p))
		) {
			toast.error("Phone number must be exactly 10 digits");
			return;
		}

		setEditSaving(true);
		try {
			await hodApi.updateStudent(editTarget.roll_no, {
				...editForm,
				phones: validPhones,
				phone: validPhones.length > 0 ? validPhones[0] : null,
			});
			toast.success("Student updated successfully");
			setEditTarget(null);
			refresh();
		} catch (error) {
			debugLogger.error("HODStudents", "handleEditSave failed", error);
			toast.error("Failed to update student");
		} finally {
			setEditSaving(false);
		}
	};

	const resetFilters = () => {
		setBatchInput("");
		setFilter("batch_year", undefined);
		setFilter("student_status", undefined);
	};

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
					>
						Roll No
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<Badge variant="outline" className="font-mono text-xs">
						{row.original.roll_no}
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
					>
						Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => (
					<div className="font-medium">
						{row.original.student_name}
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
					>
						Batch
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => row.original.batch_year ?? "—",
			},
			{
				accessorKey: "email",
				header: "Email",
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground">
						{row.original.email ?? "—"}
					</span>
				),
			},
			{
				accessorKey: "phones",
				header: "Phones",
				cell: ({ row }) => {
					const phones = row.original.phones?.length
						? row.original.phones
						: (row.original as any).phone
							? [(row.original as any).phone]
							: [];
					if (!phones || phones.length === 0) {
						return (
							<span className="text-sm text-muted-foreground">
								—
							</span>
						);
					}
					return (
						<div className="flex flex-wrap gap-1">
							{phones.map((p, i) => (
								<Badge
									key={i}
									variant="outline"
									className="font-mono text-xs"
								>
									{p}
								</Badge>
							))}
						</div>
					);
				},
			},
			{
				accessorKey: "student_status",
				header: "Status",
				cell: ({ row }) => (
					<Badge variant={statusVariant(row.original.student_status)}>
						{row.original.student_status}
					</Badge>
				),
			},
			{
				accessorKey: "enrolled_courses",
				header: "Enrolled In",
				cell: ({ row }) => {
					const courses = row.original.enrolled_courses
						? row.original.enrolled_courses.split(", ")
						: [];
					const isExpanded = row.getIsExpanded();
					const visibleCourses = isExpanded
						? courses
						: courses.slice(0, 2);
					const hasMore = courses.length > 2;

					return (
						<div className="flex items-start justify-center gap-2 py-1">
							<div className="flex flex-col items-center justify-center">
								<AnimatePresence initial={false}>
									{visibleCourses.length > 0 ? (
										visibleCourses.map((course, idx) => (
											<motion.div
												key={`${course}-${idx}`}
												initial={{
													opacity: 0,
													height: 0,
													overflow: "hidden",
												}}
												animate={{
													opacity: 1,
													height: "auto",
												}}
												exit={{ opacity: 0, height: 0 }}
												transition={{
													duration: 0.2,
													ease: "easeInOut",
												}}
											>
												<div className="pb-1">
													<Badge
														variant="outline"
														className="px-1.5 py-0 font-normal"
													>
														{course}
													</Badge>
												</div>
											</motion.div>
										))
									) : (
										<span className="text-xs text-muted-foreground pb-1">
											—
										</span>
									)}
								</AnimatePresence>
							</div>
							{hasMore && (
								<Button
									variant="ghost"
									size="sm"
									className="h-5 w-5 p-0 mt-0.5 group hover:bg-primary/5 hover:text-primary transition-colors shrink-0"
									onClick={row.getToggleExpandedHandler()}
									title={
										isExpanded
											? "Show less"
											: `Show ${courses.length - 2} more`
									}
								>
									<ChevronDown
										className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${
											isExpanded ? "rotate-180" : ""
										}`}
									/>
								</Button>
							)}
						</div>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => handleEditOpen(row.original)}
					>
						<Pencil className="h-4 w-4" />
					</Button>
				),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="h-full">
			<div className="px-6 pt-4 pb-8 space-y-6">
				{/* Page header */}
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-emerald-500/20">
						<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
							Students
						</h2>
						<p className="text-sm text-muted-foreground">
							Department roster and your course enrollments
						</p>
					</div>
				</div>

				<Tabs value={activeTab} onValueChange={handleTabChange}>
					<TabsList className="mb-4">
						<TabsTrigger value="department" className="gap-2">
							<Building2 className="w-4 h-4" />
							Department
						</TabsTrigger>
						<TabsTrigger value="my-courses" className="gap-2">
							<BookOpen className="w-4 h-4" />
							My Course Enrollments
						</TabsTrigger>
					</TabsList>

					{/* ── Department Students tab ── */}
					<TabsContent value="department" className="mt-0">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<GraduationCap className="w-5 h-5" />
									All Students
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
									{/* Batch Year */}
									<Select
										value={batchInput || "all"}
										onValueChange={(v) => {
											const val = v === "all" ? "" : v;
											setBatchInput(val);
											setFilter(
												"batch_year",
												val || undefined,
											);
										}}
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

									{/* Status */}
									<Select
										value={filters.student_status ?? "all"}
										onValueChange={(v) =>
											setFilter(
												"student_status",
												v === "all" ? undefined : v,
											)
										}
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

									{/* Reset */}
									{hasFilters && (
										<Button
											variant="ghost"
											className="h-9 px-2 shrink-0"
											onClick={resetFilters}
										>
											Reset
											<X className="ml-2 h-4 w-4" />
										</Button>
									)}
								</DataTable>
							</CardContent>
						</Card>
					</TabsContent>

					{/* ── My Course Enrollments tab ── */}
					<TabsContent value="my-courses" className="mt-0">
						{myCoursesVisited && <FacultyStudents hideHeader />}
					</TabsContent>
				</Tabs>
			</div>

			{/* ── Edit Dialog ── */}
			<Dialog
				open={!!editTarget}
				onOpenChange={(open) => !open && setEditTarget(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							Edit Student — {editTarget?.roll_no}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label>Full Name</Label>
							<Input
								value={editForm.student_name ?? ""}
								onChange={(e) =>
									setEditForm((f) => ({
										...f,
										student_name: e.target.value,
									}))
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Email</Label>
								<Input
									type="email"
									value={editForm.email ?? ""}
									onChange={(e) =>
										setEditForm((f) => ({
											...f,
											email: e.target.value || null,
										}))
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Phone Numbers</Label>
								{(editForm.phones?.length
									? editForm.phones
									: [""]
								).map((phone, index, arr) => (
									<div
										key={index}
										className="flex gap-2 mb-2"
									>
										<Input
											type="tel"
											maxLength={10}
											pattern="\d{10}"
											value={phone}
											placeholder="10-digit phone number"
											onChange={(e) => {
												const val =
													e.target.value.replace(
														/\D/g,
														"",
													);
												const newPhones = [...arr];
												newPhones[index] = val;
												setEditForm((f) => ({
													...f,
													phones: newPhones,
												}));
											}}
										/>
										{arr.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="shrink-0 text-destructive hover:bg-destructive/10"
												onClick={() => {
													const newPhones =
														arr.filter(
															(_, i) =>
																i !== index,
														);
													setEditForm((f) => ({
														...f,
														phones: newPhones,
													}));
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-1 flex items-center gap-1 w-full border-dashed"
									onClick={() => {
										setEditForm((f) => ({
											...f,
											phones: [...(f.phones || []), ""],
										}));
									}}
								>
									<Plus className="h-4 w-4" />
									Add Phone Number
								</Button>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Batch Year</Label>
								<Input
									type="number"
									value={editForm.batch_year ?? ""}
									onChange={(e) =>
										setEditForm((f) => ({
											...f,
											batch_year: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Status</Label>
								<Select
									value={editForm.student_status ?? "Active"}
									onValueChange={(v) =>
										setEditForm((f) => ({
											...f,
											student_status: v,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{STATUS_OPTIONS.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
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
							onClick={() => setEditTarget(null)}
							disabled={editSaving}
						>
							Cancel
						</Button>
						<Button onClick={handleEditSave} disabled={editSaving}>
							{editSaving ? "Saving…" : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
