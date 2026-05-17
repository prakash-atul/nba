import { useEffect, useState, useCallback } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Users, Table2 } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import { debugLogger } from "@/lib/debugLogger";
import type { StakeholderSurveyResultsResponse } from "@/services/api";
import { StakeholderSurveyDetailTable } from "./StakeholderSurveyDetailTable";
import { ConsolidatedIndirectMatrix } from "./ConsolidatedIndirectMatrix";

interface StakeholderSurveyResultsProps {
	programmeId: number;
	refreshTrigger?: number;
}

export function StakeholderSurveyResults({
	programmeId,
	refreshTrigger = 0,
}: StakeholderSurveyResultsProps) {
	const [batchYear, setBatchYear] = useState("");
	const [data, setData] = useState<StakeholderSurveyResultsResponse | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [matrixOpen, setMatrixOpen] = useState(false);

	const fetchResults = useCallback(async () => {
		const year = parseInt(batchYear, 10);
		if (!year) return;
		setLoading(true);
		try {
			const res = await surveyApi.getStakeholderResults(programmeId, year);
			setData(res);
		} catch (err) {
			debugLogger.error("StakeholderSurveyResults", "Failed to load", err);
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [programmeId, batchYear]);

	useEffect(() => {
		if (refreshTrigger > 0) fetchResults();
	}, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Stakeholder Survey — Results
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-end gap-3">
					<div className="space-y-1">
						<Label htmlFor="ssr-batch">Batch Year</Label>
						<Input
							id="ssr-batch"
							value={batchYear}
							onChange={(e) => setBatchYear(e.target.value)}
							placeholder="e.g. 2022"
							className="w-32"
						/>
					</div>
					<Button onClick={fetchResults} disabled={loading || !batchYear}>
						{loading ? "Loading..." : "Load"}
					</Button>
				</div>

				{!data || !data.has_data ? (
					<p className="text-sm text-muted-foreground">
						No stakeholder survey data for this programme/batch. Import
						a CSV first.
					</p>
				) : (
					<div className="space-y-6">
						{/* Overall averages */}
						<div>
							<h4 className="text-sm font-medium mb-2">
								Overall PO/PSO Averages
							</h4>
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left py-2 px-2">PO</th>
										<th className="text-right py-2 px-2">
											Avg Rating
										</th>
										<th className="text-right py-2 px-2">
											Attainment %
										</th>
										<th className="text-right py-2 px-2">
											Respondents
										</th>
									</tr>
								</thead>
								<tbody>
									{data.averages.map((r) => (
										<tr
											key={r.po_name}
											className="border-b last:border-0"
										>
											<td className="py-2 px-2 font-medium">
												{r.po_name}
											</td>
											<td className="text-right py-2 px-2">
												{Number(r.average_rating).toFixed(2)}
											</td>
											<td className="text-right py-2 px-2">
												{Number(r.attainment_percentage).toFixed(2)}%
											</td>
											<td className="text-right py-2 px-2">
												{r.respondent_count}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Individual Detail Table (collapsible) */}
						<Collapsible
							open={detailOpen}
							onOpenChange={setDetailOpen}
						>
							<div className="rounded-md border">
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										className="flex w-full justify-between p-3 h-auto"
									>
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">
												Individual Responses ({data.individual.length})
											</span>
										</div>
										<ChevronDown
											className={`h-4 w-4 transition-transform ${
												detailOpen ? "rotate-180" : ""
											}`}
										/>
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="p-3 pt-0">
									<StakeholderSurveyDetailTable data={data} />
								</CollapsibleContent>
							</div>
						</Collapsible>

						{/* Consolidated Indirect Survey Matrix (collapsible) */}
						<Collapsible
							open={matrixOpen}
							onOpenChange={setMatrixOpen}
						>
							<div className="rounded-md border">
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										className="flex w-full justify-between p-3 h-auto"
									>
										<div className="flex items-center gap-2">
											<Table2 className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">
												Consolidated Indirect Survey Matrix
												({data.stakeholder_types.length} types)
											</span>
										</div>
										<ChevronDown
											className={`h-4 w-4 transition-transform ${
												matrixOpen ? "rotate-180" : ""
											}`}
										/>
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="p-3 pt-0">
									<ConsolidatedIndirectMatrix data={data} />
								</CollapsibleContent>
							</div>
						</Collapsible>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
