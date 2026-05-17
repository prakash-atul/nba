import { DataTable } from "@/features/shared/DataTable";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap, BarChart3, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { hodApi } from "@/services/api/hod";
import { usePaginatedData } from "@/lib/usePaginatedData";
import type { Programme, ProgrammeWithBatch } from "@/services/api";
import { getProgrammeColumns } from "../admin/ProgrammesView.columns";
import { BulkEnrollStudentsDialog } from "../admin/BulkEnrollStudentsDialog";
import { ProgrammeCoursesDialog } from "../admin/ProgrammeCoursesDialog";

export function HODProgrammesView() {
	const navigate = useNavigate();

	const {
		data: programmes,
		loading: refreshing,
		refresh: onDataRefresh,
		pagination,
		goNext,
		goPrev,
		canPrev,
		pageIndex,
		search,
		setSearch,
	} = usePaginatedData<Programme>({
		fetchFn: (params) => hodApi.getDepartmentProgrammes(params),
		limit: 20,
		defaultSort: "p.programme_code",
	});

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
	const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);

	const [batches, setBatches] = useState<ProgrammeWithBatch[]>([]);
	const [batchesLoading, setBatchesLoading] = useState(false);

	useEffect(() => {
		const loadBatches = async () => {
			setBatchesLoading(true);
			try {
				const result = await hodApi.getProgrammesWithBatches();
				setBatches(result);
			} catch {
				// silently fail - batch table is supplementary
			} finally {
				setBatchesLoading(false);
			}
		};
		loadBatches();
	}, []);

	const [formData, setFormData] = useState({
		programme_name: "",
		programme_code: "",
		degree_level: "UG" as Programme['degree_level'],
		duration_years: 4,
	});

	const [editFormData, setEditFormData] = useState({
		programme_name: "",
		programme_code: "",
		degree_level: "UG" as Programme['degree_level'],
		duration_years: 4,
	});

	const openEditDialog = (programme: Programme) => {
		setSelectedProgramme(programme);
		setEditFormData({
			programme_name: programme.programme_name,
			programme_code: programme.programme_code,
			degree_level: programme.degree_level,
			duration_years: programme.duration_years,
		});
		setIsEditDialogOpen(true);
	};

	const openEnrollDialog = (programme: Programme) => {
		setSelectedProgramme(programme);
		setIsEnrollDialogOpen(true);
	};

	const openCoursesDialog = (programme: Programme) => {
		setSelectedProgramme(programme);
		setIsCoursesDialogOpen(true);
	};

	const handleDeleteProgramme = async (programme: Programme) => {
		try {
			await hodApi.deleteProgramme(programme.programme_id);
			toast.success(`Programme "${programme.programme_name}" deleted`);
			onDataRefresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to delete programme");
		}
	};

	const columns = useMemo(
		() =>
			getProgrammeColumns({
				onEdit: openEditDialog,
				onDelete: handleDeleteProgramme,
				onEnroll: openEnrollDialog,
				onManageCourses: openCoursesDialog,
			}),
		[],
	);

	const resetForm = () => {
		setFormData({
			programme_name: "",
			programme_code: "",
			degree_level: "UG",
			duration_years: 4,
		});
	};

	const handleCreateProgramme = async () => {
		if (!formData.programme_name || !formData.programme_code) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await hodApi.createProgramme({
				programme_name: formData.programme_name,
				programme_code: formData.programme_code.toUpperCase(),
				degree_level: formData.degree_level,
				duration_years: formData.duration_years,
			});
			toast.success("Programme created successfully");
			setIsAddDialogOpen(false);
			resetForm();
			onDataRefresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to create programme");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUpdateProgramme = async () => {
		if (!selectedProgramme) return;

		if (!editFormData.programme_name || !editFormData.programme_code) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await hodApi.updateProgramme(selectedProgramme.programme_id, {
				programme_name: editFormData.programme_name,
				programme_code: editFormData.programme_code.toUpperCase(),
				degree_level: editFormData.degree_level,
				duration_years: editFormData.duration_years,
			});
			toast.success("Programme updated successfully");
			setIsEditDialogOpen(false);
			setSelectedProgramme(null);
			onDataRefresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to update programme");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="border-none shadow-none bg-transparent">
				<div className="flex flex-row items-center justify-between p-0 mb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
							<GraduationCap className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-xl font-bold">Programmes</h3>
							<p className="text-sm text-muted-foreground">
								Department academic programmes
							</p>
						</div>
					</div>
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger asChild>
							<Button className="gap-2 bg-blue-600 hover:bg-blue-700">
								<Plus className="w-4 h-4" />
								Add Programme
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[450px]">
							<DialogHeader>
								<DialogTitle>Add New Programme</DialogTitle>
								<DialogDescription>Create a new academic programme for your department</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="programme_name">Programme Name *</Label>
									<Input
										id="programme_name"
										placeholder="e.g., Bachelor of Technology"
										value={formData.programme_name}
										onChange={(e) => setFormData({ ...formData, programme_name: e.target.value })}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="programme_code">Programme Code *</Label>
									<Input
										id="programme_code"
										placeholder="e.g., BTECH"
										value={formData.programme_code}
										onChange={(e) => setFormData({ ...formData, programme_code: e.target.value.toUpperCase() })}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="degree_level">Degree Level</Label>
										<Select
											value={formData.degree_level}
											onValueChange={(val: any) => setFormData({ ...formData, degree_level: val })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="UG">UG</SelectItem>
												<SelectItem value="PG">PG</SelectItem>
												<SelectItem value="Diploma">Diploma</SelectItem>
												<SelectItem value="PhD">PhD</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="duration_years">Duration (Years)</Label>
										<Input
											id="duration_years"
											type="number"
											min={1}
											max={10}
											value={formData.duration_years}
											onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
										/>
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
								<Button onClick={handleCreateProgramme} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
									{isSubmitting ? "Creating..." : "Create Programme"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</Card>

			<DataTable
				columns={columns}
				data={programmes || []}
				searchPlaceholder="Search programmes..."
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
			/>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle>Edit Programme</DialogTitle>
						<DialogDescription>Update programme information</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit_programme_name">Programme Name *</Label>
							<Input
								id="edit_programme_name"
								value={editFormData.programme_name}
								onChange={(e) => setEditFormData({ ...editFormData, programme_name: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_programme_code">Programme Code *</Label>
							<Input
								id="edit_programme_code"
								value={editFormData.programme_code}
								onChange={(e) => setEditFormData({ ...editFormData, programme_code: e.target.value.toUpperCase() })}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit_degree_level">Degree Level</Label>
								<Select
									value={editFormData.degree_level}
									onValueChange={(val: any) => setEditFormData({ ...editFormData, degree_level: val })}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="UG">UG</SelectItem>
										<SelectItem value="PG">PG</SelectItem>
										<SelectItem value="Diploma">Diploma</SelectItem>
										<SelectItem value="PhD">PhD</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit_duration_years">Duration (Years)</Label>
								<Input
									id="edit_duration_years"
									type="number"
									min={1}
									max={10}
									value={editFormData.duration_years}
									onChange={(e) => setEditFormData({ ...editFormData, duration_years: parseInt(e.target.value) })}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedProgramme(null); }}>Cancel</Button>
						<Button onClick={handleUpdateProgramme} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Bulk Enroll Dialog */}
			<BulkEnrollStudentsDialog
				open={isEnrollDialogOpen}
				onOpenChange={setIsEnrollDialogOpen}
				programme={selectedProgramme}
				onSuccess={onDataRefresh}
				api={hodApi}
			/>

			{/* Courses Dialog */}
			<ProgrammeCoursesDialog
				open={isCoursesDialogOpen}
				onOpenChange={setIsCoursesDialogOpen}
				programme={selectedProgramme}
				onSuccess={onDataRefresh}
				api={hodApi}
			/>

			{/* Batch-wise Programme Attainment */}
			<Card className="border-none shadow-none bg-transparent">
				<div className="flex flex-row items-center gap-3 mb-4">
					<div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
						<BarChart3 className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="text-xl font-bold">Programme Attainment</h3>
						<p className="text-sm text-muted-foreground">
							Batch-wise programme attainment dashboard
						</p>
					</div>
				</div>
			</Card>

			<Card className="p-0">
				<div className="rounded-md border">
					<table className="w-full text-sm">
						<thead className="bg-muted/40">
							<tr>
								<th className="text-left px-3 py-2.5 font-medium">Code</th>
								<th className="text-left px-3 py-2.5 font-medium">Programme</th>
								<th className="text-left px-3 py-2.5 font-medium">Batch</th>
								<th className="text-left px-3 py-2.5 font-medium">Level</th>
								<th className="text-center px-3 py-2.5 font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{batchesLoading ? (
								<tr>
									<td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
										Loading...
									</td>
								</tr>
							) : batches.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
										No programmes with batch data found.
									</td>
								</tr>
							) : (
								batches.map((b, idx) => (
									<tr key={`${b.programme_id}-${b.batch_year}`} className={idx < batches.length - 1 ? "border-t" : ""}>
										<td className="px-3 py-2 font-mono text-xs">{b.programme_code}</td>
										<td className="px-3 py-2">{b.programme_name}</td>
										<td className="px-3 py-2">{b.batch_year}</td>
										<td className="px-3 py-2">{b.degree_level}</td>
										<td className="px-3 py-2 text-center">
											<Button
												variant="outline"
												size="sm"
												className="gap-1.5"
												onClick={() =>
													navigate("/hod/programme-attainment", {
														state: {
															programmeId: b.programme_id,
															programmeName: b.programme_name,
															batchYear: String(b.batch_year),
														},
													})
												}
											>
												<ExternalLink className="w-3.5 h-3.5" />
												View Attainment
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
}
