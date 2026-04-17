import { ConfirmDeleteDialog } from '@/features/shared';
import { useState, useEffect, useMemo, useCallback } from "react";
import { facultyApi } from "@/services/api/faculty";
import type { EnrolledStudent, UpdateStudentRequest } from "@/services/api";
import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
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
import {
	GraduationCap,
	Pencil,
	RefreshCw,
	Trash2,
	X,
	Plus,
	ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { sortableHeader } from "../../features/shared/tableUtils";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];
const BATCH_OPTIONS = Array.from(
	{ length: 10 },
	(_, i) => new Date().getFullYear() - 4 + i,
);

interface FacultyStudentsProps {
	hideHeader?: boolean;
}

export function FacultyStudents({
	hideHeader = false,
}: FacultyStudentsProps = {}) {
	// -- Data ------------------------------------------------------------------
	const [allStudents, setAllStudents] = useState<EnrolledStudent[]>([]);
	const [loading, setLoading] = useState(true);

	// -- Filters ---------------------------------------------------------------
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [batchInput, setBatchInput] = useState("");
	const [batchFilter, setBatchFilter] = useState("");

	// Debounce batch year
	useEffect(() => {
		const t = setTimeout(() => setBatchFilter(batchInput), 500);
		return () => clearTimeout(t);
	}, [batchInput]);

	const hasFilters = statusFilter !== "all" || batchFilter !== "";

	// -- Edit state ------------------------------------------------------------
	const [editTarget, setEditTarget] = useState<EnrolledStudent | null>(null);
	const [editForm, setEditForm] = useState<UpdateStudentRequest>({});
	const [editSaving, setEditSaving] = useState(false);

	// -- Delete state ----------------------------------------------------------
	const [deleteTarget, setDeleteTarget] = useState<EnrolledStudent | null>(
		null,
	);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// -- Load ------------------------------------------------------------------
	const loadStudents = useCallback(async () => {
		setLoading(true);
		try {
			const data = await facultyApi.getEnrolledStudents();
			setAllStudents(data);
		} catch {
			toast.error("Failed to load students");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadStudents();
	}, [loadStudents]);

	// -- Client-side filter ----------------------------------------------------
	const filtered = useMemo(() => {
		let result = allStudents;
		if (statusFilter !== "all")
			result = result.filter(
				(s) =>
					s.student_status?.toLowerCase() ===
					statusFilter.toLowerCase(),
			);
		if (batchFilter)
			result = result.filter((s) => String(s.batch_year) === batchFilter);
		return result;
	}, [allStudents, statusFilter, batchFilter]);

	const handleEditOpen = (student: EnrolledStudent) => {
		setEditTarget(student);
		setEditForm({
			student_name: student.student_name,
			email: student.email ?? "",
			phones: student.phones?.length ? student.phones : [],
			student_status: student.student_status,
			batch_year: student.batch_year,
		});
	};

	const resetFilters = () => {
		setStatusFilter("all");
		setBatchInput("");
		setBatchFilter("");
	};

	const handleEditSave = async () => {
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
			const dataToSave = {
				...editForm,
				phones: validPhones,
				phone: validPhones.length > 0 ? validPhones[0] : null,
			};
			await facultyApi.updateStudent(editTarget.roll_no, dataToSave);
			toast.success("Student updated successfully");
			setEditTarget(null);
			// Patch local state to avoid full reload
			setAllStudents((prev) =>
				prev.map((s) =>
					s.roll_no === editTarget.roll_no
						? {
								...s,
								student_name:
									editForm.student_name ?? s.student_name,
								email:
									(editForm.email as
										| string
										| null
										| undefined) ?? s.email,
								phones: dataToSave.phones.length
									? dataToSave.phones
									: s.phones || [],
								student_status:
									editForm.student_status ?? s.student_status,
								batch_year: editForm.batch_year ?? s.batch_year,
							}
						: s,
				),
			);
		} catch {
			toast.error("Failed to update student");
		} finally {
			setEditSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await facultyApi.removeStudentEnrollment(deleteTarget.roll_no);
			toast.success(
				`${deleteTarget.student_name} removed from your course enrollments`,
			);
			setAllStudents((prev) =>
				prev.filter((s) => s.roll_no !== deleteTarget.roll_no),
			);
			setDeleteTarget(null);
		} catch {
			toast.error("Failed to remove student");
		} finally {
			setDeleteLoading(false);
		}
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

	const columns = useMemo<ColumnDef<EnrolledStudent>[]>(
		() => [
			{
				accessorKey: "roll_no",
				header: sortableHeader("Roll No"),
				cell: ({ row }) => (
					<Badge variant="outline" className="font-mono text-xs">
						{row.original.roll_no}
					</Badge>
				),
			},
			{
				accessorKey: "student_name",
				header: sortableHeader("Name"),
				cell: ({ row }) => (
					<div className="font-medium">
						{row.original.student_name}
					</div>
				),
			},
			{
				accessorKey: "department_code",
				header: "Department",
				cell: ({ row }) => (
					<Badge
						variant="secondary"
						className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
					>
						{row.original.department_code ??
							row.original.department_name}
					</Badge>
				),
			},
			{
				accessorKey: "batch_year",
				header: sortableHeader("Batch"),
				cell: ({ row }) => row.original.batch_year ?? "—",
			},
			{
				accessorKey: "email",
				header: "Email",
				cell: ({ row }) => (
					<Badge variant="outline" className="flex">
						{row.original.email ?? "—"}
					</Badge>
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
						return <div className="text-muted-foreground">—</div>;
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
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => handleEditOpen(row.original)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
							onClick={() => setDeleteTarget(row.original)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	// -- Render ------------------------------------------------------------------
	return (
		<div className="h-full">
			<div className="px-6 pt-4 pb-8 space-y-6">
				{/* Page header */}
				{!hideHeader && (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="p-3 rounded-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-emerald-500/20">
								<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
									Enrolled Students
								</h2>
								<p className="text-sm text-muted-foreground">
									Students across all your courses
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="icon"
							onClick={loadStudents}
							disabled={loading}
						>
							<RefreshCw
								className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
				)}

				{/* Table card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<GraduationCap className="w-5 h-5" />
							All Students
						</CardTitle>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={columns}
							data={filtered}
							searchPlaceholder="Search by roll no, name or email..."
							refreshing={loading}
						>
							{/* Batch Year */}
							<Select
								value={batchInput || "all"}
								onValueChange={(val) => {
									const actualVal = val === "all" ? "" : val;
									setBatchInput(actualVal);
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
								value={statusFilter}
								onValueChange={setStatusFilter}
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
			</div>

			{/* -- Edit Dialog -- */}
			<Dialog
				open={!!editTarget}
				onOpenChange={(open: boolean) => !open && setEditTarget(null)}
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
							{editSaving ? "Saving�" : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* -- Delete Confirm -- */}
			<ConfirmDeleteDialog
				open={!!deleteTarget}
				onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
				title="Remove Student Enrollment"
				description={
					<>
						This will remove{" "}
						<strong>{deleteTarget?.student_name}</strong> (
						{deleteTarget?.roll_no}) from all of your course
						enrollments. Their marks and data will remain
						intact. This action cannot be undone.
					</>
				}
				confirmText="Remove"
				isLoading={deleteLoading}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
