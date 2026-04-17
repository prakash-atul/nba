import { DataTable } from "@/features/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2, Info, Calendar } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type { Department, School } from "@/services/api";
import { adminApi } from "@/services/api/admin";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { X } from "lucide-react";
import { sortableHeader } from "../../features/shared/tableUtils";
import { ConfirmDeleteDialog } from '../../features/shared';

export function DepartmentsView() {
	const {
		data: departments,
		loading: refreshing,
		refresh: onDataRefresh,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
		filters,
		setFilter,
	} = usePaginatedData<Department, { school_id: string }>({
		fetchFn: (params) => adminApi.getAllDepartments(params),
		limit: 20,
		defaultSort: "d.department_code",
	});

	const [schools, setSchools] = useState<School[]>([]);
	useEffect(() => {
		adminApi
			.getAllSchools()
			.then(setSchools)
			.catch(() => {});
	}, []);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedDepartment, setSelectedDepartment] =
		useState<Department | null>(null);
	const [formData, setFormData] = useState({
		department_name: "",
		department_code: "",
		school_id: "",
		description: "",
	});
	const [editFormData, setEditFormData] = useState({
		department_name: "",
		department_code: "",
		school_id: "",
		description: "",
	});

	const columns: ColumnDef<Department>[] = [
		{
			accessorKey: "department_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="font-mono bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
				>
					{row.getValue("department_code")}
				</Badge>
			),
		},
		{
			accessorKey: "department_name",
			header: sortableHeader("Name"),
			cell: ({ row }) => (
				<div className="font-medium flex">
					{row.getValue("department_name")}
				</div>
			),
		},
		{
			accessorKey: "school_name",
			header: "School",
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
			cell: ({ row }) => {
				const schoolName = row.getValue("school_name") as string;
				const schoolCode = row.original.school_code;
				return schoolName ? (
					<div className="text-sm flex flex-col items-start">
						<div className="font-medium">{schoolName}</div>
						<div className="text-xs text-muted-foreground font-mono">
							({schoolCode})
						</div>
					</div>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "hod_name",
			header: "HOD",
			cell: ({ row }) => {
				const hodName = row.getValue("hod_name") as string | null;
				const hodId = row.original.hod_employee_id;
				return hodName ? (
					<div className="text-sm flex flex-col items-start">
						<Badge
							variant="secondary"
							className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
						>
							{hodName}
						</Badge>
						{hodId && (
							<div className="text-[10px] text-muted-foreground font-mono mt-1 ml-1">
								ID: {hodId}
							</div>
						)}
					</div>
				) : (
					<Badge
						variant="outline"
						className="text-muted-foreground border-dashed"
					>
						Not Assigned
					</Badge>
				);
			},
		},
		{
			id: "counts",
			header: () => <div className="text-center">Statistics</div>,
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<div className="flex flex-wrap gap-1.5 justify-center max-w-[150px] mx-auto">
						{typeof dept.faculty_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								👨‍🏫 {dept.faculty_count}
							</Badge>
						)}
						{typeof dept.student_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								🎓 {dept.student_count}
							</Badge>
						)}
						{typeof dept.course_count !== "undefined" && (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0"
							>
								📚 {dept.course_count}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "active_offerings_count",
			header: () => <div className="text-center">Offerings</div>,
			filterFn: (row, id, value) => {
				const count = row.getValue(id) as number;
				return value.includes(String(count));
			},
			cell: ({ row }) => {
				const count = row.getValue("active_offerings_count") as number;
				const latest = row.original.latest_offering;
				return (
					<div className="text-center flex flex-col items-center">
						<Badge
							variant="secondary"
							className="font-semibold px-2"
						>
							{count} Courses
						</Badge>
						{latest && (
							<div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
								Latest: {latest}
							</div>
						)}
					</div>
				);
			},
		},
		{
			id: "info",
			header: "Info",
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-gray-500 hover:text-gray-700"
							>
								<Info className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="space-y-4">
								<h4 className="font-medium leading-none">
									{dept.department_name}
								</h4>
								<div className="space-y-2">
									<p className="text-sm text-gray-500">
										{dept.description ||
											"No description available."}
									</p>
									<div className="flex items-center pt-2 border-t text-xs text-gray-400">
										<Calendar className="mr-2 h-3 w-3" />
										Created:{" "}
										{dept.created_at
											? new Date(
													dept.created_at,
												).toLocaleDateString()
											: "N/A"}
									</div>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-center">Actions</div>,
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<div className="flex justify-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => openEditDialog(dept)}
							className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
						>
							<Pencil className="w-4 h-4" />
						</Button>
						<ConfirmDeleteDialog 
                title={<>Are you absolutely sure?</>}
                description={<>This will permanently delete the{" "}
										<strong>{dept.department_name}</strong>{" "}
										department. This action cannot be
										undone.</>}
                onConfirm={() => handleDeleteDepartment(dept)}
                trigger={<Button
									variant="ghost"
									size="icon"
									className="text-red-600 hover:text-red-700 hover:bg-red-50"
								>
									<Trash2 className="w-4 h-4" />
								</Button>}
            />
					</div>
				);
			},
		},
	];

	const resetForm = () => {
		setFormData({
			department_name: "",
			department_code: "",
			school_id: "",
			description: "",
		});
	};

	const handleCreateDepartment = async () => {
		if (!formData.department_name || !formData.department_code) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (formData.department_code.length > 10) {
			toast.error("Department code must be 10 characters or less");
			return;
		}

		setIsSubmitting(true);
		try {
			await apiService.createDepartment({
				department_name: formData.department_name,
				department_code: formData.department_code.toUpperCase(),
				school_id: formData.school_id
					? parseInt(formData.school_id)
					: undefined,
				description: formData.description,
			});
			toast.success("Department created successfully");
			setIsAddDialogOpen(false);
			resetForm();
			onDataRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create department",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const openEditDialog = (department: Department) => {
		setSelectedDepartment(department);
		setEditFormData({
			department_name: department.department_name,
			department_code: department.department_code,
			school_id: department.school_id
				? department.school_id.toString()
				: "",
			description: department.description || "",
		});
		setIsEditDialogOpen(true);
	};

	const handleUpdateDepartment = async () => {
		if (!selectedDepartment) return;

		if (!editFormData.department_name || !editFormData.department_code) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (editFormData.department_code.length > 10) {
			toast.error("Department code must be 10 characters or less");
			return;
		}

		setIsSubmitting(true);
		try {
			await apiService.updateDepartment(
				selectedDepartment.department_id,
				{
					department_name: editFormData.department_name,
					department_code: editFormData.department_code.toUpperCase(),
					school_id: editFormData.school_id
						? parseInt(editFormData.school_id)
						: null,
					description: editFormData.description,
				},
			);
			toast.success("Department updated successfully");
			setIsEditDialogOpen(false);
			setSelectedDepartment(null);
			onDataRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update department",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDepartment = async (department: Department) => {
		try {
			await apiService.deleteDepartment(department.department_id);
			toast.success(`Department "${department.department_name}" deleted`);
			onDataRefresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete department",
			);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="border-none shadow-none bg-transparent">
				<div className="flex flex-row items-center justify-between p-0 mb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
							<Building2 className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-xl font-bold">Departments</h3>
							<p className="text-sm text-muted-foreground">
								Manage university departments
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Dialog
							open={isAddDialogOpen}
							onOpenChange={setIsAddDialogOpen}
						>
							<DialogTrigger asChild>
								<Button className="gap-2 bg-blue-600 hover:bg-blue-700">
									<Plus className="w-4 h-4" />
									Add Department
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[450px]">
								<DialogHeader>
									<DialogTitle>
										Add New Department
									</DialogTitle>
									<DialogDescription>
										Create a new department in the system
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="space-y-2">
										<Label htmlFor="department_name">
											Department Name *
										</Label>
										<Input
											id="department_name"
											placeholder="e.g., Computer Science & Engineering"
											value={formData.department_name}
											onChange={(e) =>
												setFormData({
													...formData,
													department_name:
														e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="department_code">
											Department Code *
										</Label>
										<Input
											id="department_code"
											placeholder="e.g., CSE"
											maxLength={10}
											value={formData.department_code}
											onChange={(e) =>
												setFormData({
													...formData,
													department_code:
														e.target.value.toUpperCase(),
												})
											}
										/>
										<p className="text-xs text-muted-foreground">
											Short code (max 10 characters), will
											be auto-capitalized
										</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="school_id">
											School
										</Label>
										<Select
											value={formData.school_id || "none"}
											onValueChange={(val) =>
												setFormData({
													...formData,
													school_id:
														val === "none"
															? ""
															: val,
												})
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a school" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">
													None
												</SelectItem>
												{schools.map((school) => (
													<SelectItem
														key={school.school_id}
														value={school.school_id.toString()}
													>
														{school.school_name} (
														{school.school_code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="description">
											Description (Optional)
										</Label>
										<Input
											id="description"
											placeholder="Department description"
											value={formData.description}
											onChange={(e) =>
												setFormData({
													...formData,
													description: e.target.value,
												})
											}
										/>
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
										onClick={handleCreateDepartment}
										disabled={isSubmitting}
										className="bg-blue-600 hover:bg-blue-700"
									>
										{isSubmitting
											? "Creating..."
											: "Create Department"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</Card>

			<DataTable
				columns={columns}
				data={departments}
				searchPlaceholder="Search departments..."
				refreshing={refreshing}
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
				{() => (
					<>
						<Select
							value={filters.school_id || "all"}
							onValueChange={(val) =>
								setFilter(
									"school_id",
									val === "all" ? undefined : val,
								)
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All Schools" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Schools</SelectItem>
								{schools.map((school) => (
									<SelectItem
										key={school.school_id}
										value={school.school_id.toString()}
									>
										{school.school_code}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{filters.school_id && (
							<Button
								variant="ghost"
								onClick={() =>
									setFilter("school_id", undefined)
								}
								className="h-9 px-2 lg:px-3"
							>
								Reset
								<X className="ml-2 h-4 w-4" />
							</Button>
						)}
					</>
				)}
			</DataTable>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle>Edit Department</DialogTitle>
						<DialogDescription>
							Update department information
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit_department_name">
								Department Name *
							</Label>
							<Input
								id="edit_department_name"
								value={editFormData.department_name}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										department_name: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_department_code">
								Department Code *
							</Label>
							<Input
								id="edit_department_code"
								maxLength={10}
								value={editFormData.department_code}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										department_code:
											e.target.value.toUpperCase(),
									})
								}
							/>
							<p className="text-xs text-muted-foreground">
								Short code (max 10 characters)
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_school_id">School</Label>
							<Select
								value={editFormData.school_id || "none"}
								onValueChange={(val) =>
									setEditFormData({
										...editFormData,
										school_id: val === "none" ? "" : val,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a school" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									{schools.map((school) => (
										<SelectItem
											key={school.school_id}
											value={school.school_id.toString()}
										>
											{school.school_name} (
											{school.school_code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_description">
								Description (Optional)
							</Label>
							<Input
								id="edit_description"
								placeholder="Department description"
								value={editFormData.description || ""}
								onChange={(e) =>
									setEditFormData({
										...editFormData,
										description: e.target.value,
									})
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsEditDialogOpen(false);
								setSelectedDepartment(null);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateDepartment}
							disabled={isSubmitting}
							className="bg-blue-600 hover:bg-blue-700"
						>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
