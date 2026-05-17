import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { actionPlanApi } from "@/services/api/actionPlans";
import { debugLogger } from "@/lib/debugLogger";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import type { ActionPlan } from "@/services/api";

interface ActionPlansSectionProps {
	programmeId: number;
	batchYear: string;
}

const STATUS_COLORS: Record<string, string> = {
	Open: "bg-yellow-100 text-yellow-800 border-yellow-300",
	"In Progress": "bg-blue-100 text-blue-800 border-blue-300",
	Completed: "bg-green-100 text-green-800 border-green-300",
};

export function ActionPlansSection({
	programmeId,
	batchYear,
}: ActionPlansSectionProps) {
	const [plans, setPlans] = useState<ActionPlan[]>([]);
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<ActionPlan | null>(null);
	const [form, setForm] = useState({
		po_name: "",
		gap_description: "",
		action_text: "",
		responsible_person: "",
		target_date: "",
	});

	const year = parseInt(batchYear, 10);

	const loadPlans = useCallback(async () => {
		if (!programmeId || !year) return;
		setLoading(true);
		try {
			const plans = await actionPlanApi.listByProgramme(programmeId, year);
			setPlans(plans);
		} catch (err) {
			debugLogger.error("ActionPlansSection", "Failed to load", err);
		} finally {
			setLoading(false);
		}
	}, [programmeId, year]);

	useEffect(() => {
		loadPlans();
	}, [loadPlans]);

	const resetForm = () => {
		setForm({
			po_name: "",
			gap_description: "",
			action_text: "",
			responsible_person: "",
			target_date: "",
		});
		setEditing(null);
	};

	const openEdit = (plan: ActionPlan) => {
		setEditing(plan);
		setForm({
			po_name: plan.po_name ?? "",
			gap_description: plan.gap_description,
			action_text: plan.action_text,
			responsible_person: plan.responsible_person ?? "",
			target_date: plan.target_date ?? "",
		});
		setDialogOpen(true);
	};

	const handleSave = async () => {
		if (!form.gap_description || !form.action_text) {
			toast.error("Gap description and action text are required");
			return;
		}
		try {
			if (editing) {
				await actionPlanApi.update(editing.id, form);
				toast.success("Action plan updated");
			} else {
				await actionPlanApi.create(programmeId, {
					...form,
					batch_year: year,
				});
				toast.success("Action plan created");
			}
			setDialogOpen(false);
			resetForm();
			loadPlans();
		} catch {
			toast.error("Failed to save action plan");
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Delete this action plan?")) return;
		try {
			await actionPlanApi.delete(id);
			toast.success("Action plan deleted");
			loadPlans();
		} catch {
			toast.error("Failed to delete action plan");
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base flex items-center gap-2">
					<ClipboardCheck className="h-4 w-4" />
					Action Plans
				</CardTitle>
				<Dialog
					open={dialogOpen}
					onOpenChange={(o) => {
						setDialogOpen(o);
						if (!o) resetForm();
					}}
				>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="w-4 h-4 mr-1" />
							Add Plan
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>
								{editing ? "Edit Action Plan" : "New Action Plan"}
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-3 py-2">
							<div className="space-y-1">
								<Label>PO/PSO (optional)</Label>
								<Input
									value={form.po_name}
									onChange={(e) =>
										setForm((f) => ({ ...f, po_name: e.target.value }))
									}
									placeholder="e.g. PO1"
								/>
							</div>
							<div className="space-y-1">
								<Label>Gap Description *</Label>
								<Textarea
									value={form.gap_description}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											gap_description: e.target.value,
										}))
									}
									placeholder="Describe the gap..."
								/>
							</div>
							<div className="space-y-1">
								<Label>Action Text *</Label>
								<Textarea
									value={form.action_text}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											action_text: e.target.value,
										}))
									}
									placeholder="Describe the action to take..."
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<Label>Responsible Person</Label>
									<Input
										value={form.responsible_person}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												responsible_person: e.target.value,
											}))
										}
										placeholder="Name"
									/>
								</div>
								<div className="space-y-1">
									<Label>Target Date</Label>
									<Input
										type="date"
										value={form.target_date}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												target_date: e.target.value,
											}))
										}
									/>
								</div>
							</div>
							<Button onClick={handleSave} className="w-full">
								{editing ? "Update" : "Create"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-muted-foreground">Loading...</p>
				) : plans.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No action plans yet for this batch.
					</p>
				) : (
					<div className="space-y-3">
						{plans.map((plan) => (
							<div
								key={plan.id}
								className="border rounded-lg p-3 space-y-2"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="space-y-1 flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											{plan.po_name && (
												<span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
													{plan.po_name}
												</span>
											)}
											<Badge
												variant="outline"
												className={
													STATUS_COLORS[plan.status] ?? ""
												}
											>
												{plan.status}
											</Badge>
										</div>
										<p className="text-sm font-medium mt-1">
											{plan.gap_description}
										</p>
										<p className="text-xs text-muted-foreground">
											{plan.action_text}
										</p>
										{plan.responsible_person && (
											<p className="text-xs text-muted-foreground">
												Responsible: {plan.responsible_person}
											</p>
										)}
										{plan.target_date && (
											<p className="text-xs text-muted-foreground">
												Target: {plan.target_date}
											</p>
										)}
									</div>
									<div className="flex gap-1 shrink-0">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => openEdit(plan)}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-red-500"
											onClick={() => handleDelete(plan.id)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
