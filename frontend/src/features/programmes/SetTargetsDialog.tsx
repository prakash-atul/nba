import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { actionPlanApi } from "@/services/api/actionPlans";
import { Target } from "lucide-react";

interface SetTargetsDialogProps {
	programmeId: number;
	batchYear: string;
	poList: string[];
	onSaved: () => void;
}

export function SetTargetsDialog({
	programmeId,
	batchYear,
	poList,
	onSaved,
}: SetTargetsDialogProps) {
	const [open, setOpen] = useState(false);
	const [targets, setTargets] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		const year = parseInt(batchYear, 10);
		if (!year) return;
		actionPlanApi.getTargets(programmeId, year).then((targets) => {
			const mapped: Record<string, string> = {};
			for (const po of poList) {
				mapped[po] = targets[po] != null ? String(targets[po]) : "";
			}
			setTargets(mapped);
		}).catch(() => {
			const mapped: Record<string, string> = {};
			for (const po of poList) mapped[po] = "";
			setTargets(mapped);
		});
	}, [open, programmeId, batchYear, poList]);

	const handleSave = async () => {
		const year = parseInt(batchYear, 10);
		if (!year) {
			toast.error("Invalid batch year");
			return;
		}
		const cleanTargets: Record<string, number> = {};
		for (const [po, val] of Object.entries(targets)) {
			const n = parseFloat(val);
			if (!isNaN(n) && n >= 0) cleanTargets[po] = n;
		}
		setLoading(true);
		try {
			await actionPlanApi.setTargets(programmeId, {
				batch_year: year,
				targets: cleanTargets,
			});
			toast.success("Targets saved");
			onSaved();
			setOpen(false);
		} catch {
			toast.error("Failed to save targets");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Target className="w-4 h-4 mr-1" />
					Set Targets
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Set PO/PSO Target Levels</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 py-2">
					<p className="text-sm text-muted-foreground">
						Set the target attainment level (0-3) for each PO/PSO.
					</p>
					<ScrollArea className="max-h-[300px] pr-3">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
							{poList.map((po) => (
								<div key={po} className="space-y-1">
									<Label className="font-medium text-xs">{po}</Label>
									<Input
										type="number"
										step="0.1"
										min="0"
										max="3"
										placeholder="e.g. 2.5"
										value={targets[po] ?? ""}
										onChange={(e) =>
											setTargets((prev) => ({
												...prev,
												[po]: e.target.value,
											}))
										}
									/>
								</div>
							))}
						</div>
					</ScrollArea>
					<Button
						onClick={handleSave}
						disabled={loading}
						className="w-full"
					>
						{loading ? "Saving..." : "Save Targets"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
