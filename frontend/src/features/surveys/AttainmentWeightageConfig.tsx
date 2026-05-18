import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { SlidersHorizontal, RefreshCw } from "lucide-react";
import { coursesApi } from "@/services/api/courses";
import type { AttainmentConfig } from "@/services/api/types";

interface AttainmentWeightageConfigProps {
	offeringId: number;
	attainmentConfig: AttainmentConfig | null;
	directWeight: number;
	onDirectWeightChange: (val: number) => void;
	onSaved: () => void;
}

export function AttainmentWeightageConfig({
	offeringId,
	attainmentConfig,
	directWeight,
	onDirectWeightChange,
	onSaved,
}: AttainmentWeightageConfigProps) {
	const indirectWeight = 100 - directWeight;
	const [savingWeightage, setSavingWeightage] = useState(false);

	const saveWeightage = async () => {
		if (!attainmentConfig) {
			toast.error("Config not loaded");
			return;
		}
		setSavingWeightage(true);
		try {
			await coursesApi.saveAttainmentConfig({
				offering_id: offeringId,
				co_threshold: attainmentConfig.co_threshold,
				passing_threshold: attainmentConfig.passing_threshold,
				direct_weightage: directWeight,
				indirect_weightage: indirectWeight,
				attainment_thresholds:
					attainmentConfig.attainment_thresholds.map((t) => ({
						id: t.id,
						percentage: t.percentage,
					})),
			});
			toast.success("Weightage updated");
			onSaved();
		} catch {
			toast.error("Failed to save weightage");
		} finally {
			setSavingWeightage(false);
		}
	};

	return (
		<Card>
			<CardContent className="p-5">
				<div className="flex items-center gap-2 mb-4">
					<SlidersHorizontal className="w-5 h-5 text-primary" />
					<h3 className="font-semibold text-sm">
						Attainment Weightage Configuration
					</h3>
				</div>
				<div className="space-y-4">
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between items-center">
							<label className="text-sm font-medium">
								Direct Attainment (%)
							</label>
							<span className="text-sm font-bold text-primary">
								{directWeight}%
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step={5}
							value={directWeight}
							onChange={(e) =>
								onDirectWeightChange(Number(e.target.value))
							}
							className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<div className="flex justify-between items-center">
							<label className="text-sm font-medium">
								Indirect Attainment (%)
							</label>
							<span className="text-sm font-bold text-primary">
								{indirectWeight}%
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step={5}
							value={indirectWeight}
							onChange={(e) =>
								onDirectWeightChange(
									100 - Number(e.target.value),
								)
							}
							className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary"
						/>
					</div>
					<div className="pt-1">
						<Button
							className="w-full"
							size="sm"
							onClick={saveWeightage}
							disabled={savingWeightage}
						>
							<RefreshCw
								className={`w-4 h-4 mr-1.5 ${savingWeightage ? "animate-spin" : ""}`}
							/>
							Update Weightage
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
