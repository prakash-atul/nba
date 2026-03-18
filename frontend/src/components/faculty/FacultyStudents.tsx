import { useState, useEffect, useMemo, useCallback } from "react";
import { facultyApi } from "@/services/api/faculty";
import type { EnrolledStudent, UpdateStudentRequest } from "@/services/api";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ArrowUpDown,
	GraduationCap,
	Pencil,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Active", "Inactive", "Graduated", "Dropped"];

interface FacultyStudentsProps {
	hideHeader?: boolean;
}

export function FacultyStudents({
	hideHeader = false,
}: FacultyStudentsProps = {}) {
	// ── Data ──────────────────────────────────────────────────────────────────
	const [allStudents, setAllStudents] = useState<EnrolledStudent[]>([]);
	const [loading, setLoading] = useState(true);

	// ── Filters ───────────────────────────────────────────────────────────────
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [batchInput, setBatchInput] = useState("");
	const [batchFilter, setBatchFilter] = useState("");

	// Debounce batch year
	useEffect(() => {
		const t = setTimeout(() => setBatchFilter(batchInput), 500);
		return () => clearTimeout(t);
	}, [batchInput]);

	const hasFilters = statusFilter !== "all" || batchFilter !== "";

	// ── Edit state ────────────────────────────────────────────────────────────
	const [editTarget, setEditTarget] = useState<EnrolledStudent | null>(null);
	const [editForm, setEditForm] = useState<UpdateStudentRequest>({});
	const [editSaving, setEditSaving] = useState(false);

	// ── Delete state ──────────────────────────────────────────────────────────
	const [deleteTarget, setDeleteTarget] = useState<EnrolledStudent | null>(
		null,
	);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// ── Load ──────────────────────────────────────────────────────────────────
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

	// ── Client-side filter ────────────────────────────────────────────────────
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
			phone: student.phone ?? "",
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
		setEditSaving(true);
		try {
			await facultyApi.updateStudent(editTarget.roll_no, editForm);
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
								phone:
									(editForm.phone as
										| string
										| null
										| undefined) ?? s.phone,
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
					<Badge variant="outline" className="flex">
						{row.original.email ?? "—"}
					</Badge>
				),
			},
			{
				accessorKey: "phone",
				header: "Phone",
				cell: ({ row }) => (
					<div className="text-muted-foreground font-mono flex">
						{row.original.phone ?? "—"}
					</div>
				),
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
					return (
						<div className="flex flex-col gap-1">
							{courses.length > 0 ? (
								courses.map((course, idx) => (
									<Badge
										key={idx}
										variant="outline"
										className="py-0 px-1.5"
									>
										{course}
									</Badge>
								))
							) : (
								<span className="text-xs text-muted-foreground">
									—
								</span>
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

	// ── Render ──────────────────────────────────────────────────────────────────
	return (
		<div className="h-full overflow-y-auto">
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
							<Input
								placeholder="Batch Year"
								value={batchInput}
								onChange={(e) => setBatchInput(e.target.value)}
								className="h-9 w-[120px]"
							/>

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
									className="h-9 px-2"
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
								<Label>Phone</Label>
								<Input
									value={editForm.phone ?? ""}
									onChange={(e) =>
										setEditForm((f) => ({
											...f,
											phone: e.target.value || null,
										}))
									}
								/>
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

			{/* ── Delete Confirm ── */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Remove Student Enrollment
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove{" "}
							<strong>{deleteTarget?.student_name}</strong> (
							{deleteTarget?.roll_no}) from all of your course
							enrollments. Their marks and data will remain
							intact. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteLoading}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
							disabled={deleteLoading}
						>
							{deleteLoading ? "Removing…" : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
