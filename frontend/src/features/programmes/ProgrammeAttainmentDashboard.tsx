import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { attainmentApi } from "@/services/api/attainment";
import { hodApi } from "@/services/api";
import { debugLogger } from "@/lib/debugLogger";
import type {
	CourseLevelProgrammeAttainmentResponse,
	Programme,
} from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { StatsGrid, type StatItem } from "@/features/shared";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Target,
	FileText,
	TrendingUp,
	ChevronDown,
	BarChart3,
} from "lucide-react";
import { StakeholderSurveyImport } from "@/features/surveys/StakeholderSurveyImport";
import { StakeholderSurveyResults } from "@/features/surveys/StakeholderSurveyResults";
import { SetTargetsDialog } from "@/features/programmes/SetTargetsDialog";
import { ActionPlansSection } from "@/features/programmes/ActionPlansSection";
import { AttainmentComparisonCharts } from "@/features/programmes/AttainmentComparisonCharts";

interface ProgrammeAttainmentRouteState {
	programmeId: number;
	programmeName: string;
	batchYear: string;
}

export function ProgrammeAttainmentDashboard() {
	const location = useLocation();
	const routeState = location.state as ProgrammeAttainmentRouteState | null;

	const [selectedProgrammeId, setSelectedProgrammeId] = useState<
		number | null
	>(routeState?.programmeId ?? null);
	const [batchYear, setBatchYear] = useState<string>(
		routeState?.batchYear ?? "",
	);
	const [loading, setLoading] = useState(false);
	const [calculating, setCalculating] = useState(false);
	const [data, setData] =
		useState<CourseLevelProgrammeAttainmentResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [programmes, setProgrammes] = useState<Programme[]>([]);
	const [programmesLoading, setProgrammesLoading] = useState(true);
	const [surveyOpen, setSurveyOpen] = useState(false);
	const [chartsOpen, setChartsOpen] = useState(false);
	const [stakeholderRefresh, setStakeholderRefresh] = useState(0);

	const loadAttainment = useCallback(async () => {
		if (!selectedProgrammeId) return;
		const year = batchYear.trim();
		if (year === "") return;
		setLoading(true);
		setError(null);
		try {
			const response = await attainmentApi.getCourseLevelProgrammeAttainment(
				selectedProgrammeId,
				Number(year),
			);
			setData(response);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setData(null);
		} finally {
			setLoading(false);
		}
	}, [selectedProgrammeId, batchYear]);

	const programmesLoadedRef = useRef(false);

	useEffect(() => {
		const loadProgrammes = async () => {
			try {
				const response = await hodApi.getDepartmentProgrammes({
					limit: 100,
				});
				setProgrammes(response.data ?? []);
				if (response.data?.length > 0 && !routeState?.programmeId) {
					setSelectedProgrammeId(response.data[0].programme_id);
				}
			} catch (err) {
				debugLogger.error(
					"ProgrammeAttainmentDashboard",
					"Failed to load programmes",
					err,
				);
			} finally {
				setProgrammesLoading(false);
				programmesLoadedRef.current = true;
			}
		};
		loadProgrammes();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (
			programmesLoadedRef.current &&
			routeState?.programmeId &&
			routeState?.batchYear
		) {
			loadAttainment();
		}
	}, [programmesLoadedRef.current, routeState?.programmeId, routeState?.batchYear]); // eslint-disable-line react-hooks/exhaustive-deps

	const selectedProgramme = useMemo(
		() =>
			programmes.find((p) => p.programme_id === selectedProgrammeId) ?? null,
		[programmes, selectedProgrammeId],
	);

	const handleCalculate = async () => {
		if (!selectedProgrammeId) return;
		const year = batchYear.trim();
		if (year === "") return;
		setCalculating(true);
		setError(null);
		try {
			await attainmentApi.calculateProgrammeAttainment(
				selectedProgrammeId,
				Number(year),
			);
		} catch (err) {
			setError(
				`Calculate warning: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setCalculating(false);
		}
	};

	const kpiStats: StatItem[] = useMemo(() => {
		if (!data) return [];

		const avgValues = Object.values(data.averages);
		const finalValues = Object.values(data.finals);
		const indirectValues = Object.values(data.indirect).filter(
			(v) => v !== null,
		) as number[];
		const targetValues = Object.values(data.targets);

		const overallDirect =
			avgValues.length > 0
				? avgValues.reduce((a, b) => a + b, 0) / avgValues.length
				: 0;
		const overallFinal =
			finalValues.length > 0
				? finalValues.reduce((a, b) => a + b, 0) / finalValues.length
				: 0;
		const overallIndirect =
			indirectValues.length > 0
				? indirectValues.reduce((a, b) => a + b, 0) /
					indirectValues.length
				: 0;

		const hasTargets = targetValues.some((v) => v > 0);
		const gapCount = hasTargets
			? finalValues.filter(
					(v, i) => v < (targetValues[i] ?? Infinity),
				).length
			: 0;
		const targetMet = !hasTargets || gapCount === 0;

		const stats: StatItem[] = [
			{
				label: "Overall Direct Attainment",
				value: Number(overallDirect.toFixed(2)),
				icon: Target,
				suffix: " / 3",
				color: "#3b82f6",
			},
			{
				label: "Overall Indirect Attainment",
				value: Number(overallIndirect.toFixed(2)),
				icon: FileText,
				suffix: " / 3",
				color: "#8b5cf6",
			},
			{
				label: "Final Blended Attainment",
				value: Number(overallFinal.toFixed(2)),
				icon: TrendingUp,
				suffix: " / 3",
				color: "#10b981",
			},
			{
				label: targetMet ? "Target Achieved" : "Gap Identified",
				value: gapCount,
				icon: Target,
				suffix: targetMet ? "" : " PO(s) below target",
				color: targetMet ? "#10b981" : "#ef4444",
				description: targetMet
					? "All PO targets met"
					: `${gapCount} PO(s) below target`,
			},
		];

		return stats;
	}, [data]);

	const poList = data?.po_list ?? [];

	return (
		<div className="space-y-6">
			{/* Controls */}
			<Card className="p-4">
				<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
					<div className="flex flex-col md:flex-row gap-3 md:items-end">
						{data && (
							<SetTargetsDialog
								programmeId={selectedProgrammeId!}
								batchYear={batchYear}
								poList={poList}
								onSaved={loadAttainment}
							/>
						)}
						<div className="space-y-1">
							<Label>Programme</Label>
							<Select
								value={String(selectedProgrammeId ?? "")}
								onValueChange={(v) => setSelectedProgrammeId(Number(v))}
								disabled={programmesLoading}
							>
								<SelectTrigger className="w-[280px]">
									<SelectValue placeholder="Select programme..." />
								</SelectTrigger>
								<SelectContent>
									{programmes.map((p) => (
										<SelectItem key={p.programme_id} value={String(p.programme_id)}>
											{p.programme_code} - {p.programme_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="pa-batch">Batch Year</Label>
							<Input
								id="pa-batch"
								value={batchYear}
								onChange={(e) => setBatchYear(e.target.value)}
								placeholder="e.g. 2022"
							/>
						</div>
						<Button
							onClick={loadAttainment}
							disabled={
								loading || !selectedProgrammeId || !batchYear.trim()
							}
							variant="outline"
						>
							{loading ? "Loading..." : "Load"}
						</Button>
						<Button
							onClick={handleCalculate}
							disabled={
								calculating ||
								!selectedProgrammeId ||
								!batchYear.trim()
							}
						>
							{calculating ? "Calculating..." : "Calculate"}
						</Button>
					</div>
					{selectedProgramme && (
						<div className="text-sm text-muted-foreground">
							{selectedProgramme.programme_name}
							{data?.batch_year
								? ` - Batch ${data.batch_year}`
								: ""}
						</div>
					)}
				</div>
			</Card>

			{error && (
				<div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
					{error}
				</div>
			)}

			{/* KPI Stats */}
			{data && kpiStats.length > 0 && (
				<StatsGrid stats={kpiStats} variant="outline" columns={4} />
			)}

			{/* Course × PO/PSO Matrix */}
			{data && (
				<Card className="p-4 space-y-3">
					<h3 className="text-lg font-semibold">
						Programme Articulation Matrix
					</h3>
					<p className="text-sm text-muted-foreground">
						Course-level PO/PSO attainment with summary footer rows.
					</p>
					<div className="rounded-md border overflow-x-auto">
						<table className="w-full text-sm whitespace-nowrap">
							<thead className="bg-muted/40">
								<tr>
									<th className="text-left px-2 py-2 w-10">#</th>
									<th className="text-left px-2 py-2 min-w-[80px]">
										Code
									</th>
									<th className="text-left px-2 py-2 min-w-[160px]">
										Course
									</th>
									{poList.map((po) => (
										<th
											key={po}
											className="text-right px-2 py-2 min-w-[56px]"
										>
											{po}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{data.courses.length === 0 ? (
									<tr>
										<td
											colSpan={3 + poList.length}
											className="px-3 py-4 text-muted-foreground text-center"
										>
											No courses found for this programme and
											batch.
										</td>
									</tr>
								) : (
									data.courses.map((course, idx) => (
										<tr key={course.offering_id} className="border-t">
											<td className="px-2 py-2 text-muted-foreground">
												{idx + 1}
											</td>
											<td className="px-2 py-2 font-mono text-xs">
												{course.course_code}
											</td>
											<td className="px-2 py-2 text-ellipsis overflow-hidden max-w-[200px]">
												{course.course_name}
											</td>
											{poList.map((po) => {
												const val = course.values[po];
												return (
													<td
														key={po}
														className="px-2 py-2 text-right"
													>
														{val != null
															? Number(val).toFixed(2)
															: "—"}
													</td>
												);
											})}
										</tr>
									))
								)}
							</tbody>
							{data.courses.length > 0 && (
								<tfoot className="border-t-2 border-border font-medium">
									{/* Average row */}
									<tr className="bg-muted/20">
										<td
											colSpan={3}
											className="px-2 py-2 text-xs text-muted-foreground"
										>
											Average
										</td>
										{poList.map((po) => (
											<td
												key={po}
												className="px-2 py-2 text-right"
											>
												{Number(
													data.averages[po] ?? 0,
												).toFixed(2)}
											</td>
										))}
									</tr>
									{/* Direct row */}
									<tr className="bg-muted/20">
										<td
											colSpan={3}
											className="px-2 py-2 text-xs text-muted-foreground"
										>
											Direct
										</td>
										{poList.map((po) => (
											<td
												key={po}
												className="px-2 py-2 text-right"
											>
												{Number(
													data.averages[po] ?? 0,
												).toFixed(2)}
											</td>
										))}
									</tr>
									{/* Indirect row */}
									<tr className="bg-muted/20">
										<td
											colSpan={3}
											className="px-2 py-2 text-xs text-muted-foreground"
										>
											Indirect
										</td>
										{poList.map((po) => {
											const val = data.indirect[po];
											return (
												<td
													key={po}
													className="px-2 py-2 text-right"
												>
													{val != null
														? Number(val).toFixed(2)
														: "—"}
												</td>
											);
										})}
									</tr>
									{/* Final row */}
									<tr className="bg-primary/5 font-semibold">
										<td
											colSpan={3}
											className="px-2 py-2 text-xs text-muted-foreground"
										>
											Final Attainment
										</td>
										{poList.map((po) => (
											<td
												key={po}
												className="px-2 py-2 text-right"
											>
												{Number(
													data.finals[po] ?? 0,
												).toFixed(2)}
											</td>
										))}
									</tr>
									{/* Target row */}
									<tr className="bg-muted/20">
										<td
											colSpan={3}
											className="px-2 py-2 text-xs text-muted-foreground"
										>
											Target Level
										</td>
										{poList.map((po) => {
											const val = data.targets[po];
											return (
												<td
													key={po}
													className="px-2 py-2 text-right"
												>
													{val != null
														? Number(val).toFixed(2)
														: "—"}
												</td>
											);
										})}
									</tr>
								</tfoot>
							)}
						</table>
					</div>
				</Card>
			)}

			{/* Consolidated Indirect Survey Breakdown */}
			<Collapsible
				open={surveyOpen}
				onOpenChange={setSurveyOpen}
				className="space-y-2"
			>
				<Card>
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							className="flex w-full justify-between p-4 h-auto"
						>
							<div className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-muted-foreground" />
								<span className="font-semibold">
									Stakeholder Surveys (Indirect Attainment)
								</span>
							</div>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${
									surveyOpen ? "rotate-180" : ""
								}`}
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="px-4 pb-4">
						{selectedProgrammeId ? (
							<Tabs defaultValue="import">
								<TabsList>
									<TabsTrigger value="import">
										Import CSV
									</TabsTrigger>
									<TabsTrigger value="results">
										Results
									</TabsTrigger>
								</TabsList>
								<TabsContent value="import" className="pt-4">
									<StakeholderSurveyImport
										programmeId={selectedProgrammeId}
										onImportComplete={() =>
											setStakeholderRefresh((n) => n + 1)
										}
									/>
								</TabsContent>
								<TabsContent value="results" className="pt-4">
									<StakeholderSurveyResults
										programmeId={selectedProgrammeId}
										refreshTrigger={stakeholderRefresh}
									/>
								</TabsContent>
							</Tabs>
						) : (
							<p className="text-sm text-muted-foreground">
								Select a programme to view stakeholder surveys.
							</p>
						)}
					</CollapsibleContent>
				</Card>
			</Collapsible>

			{/* Comparison Charts */}
			<Collapsible
				open={chartsOpen}
				onOpenChange={setChartsOpen}
				className="space-y-2"
			>
				<Card>
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							className="flex w-full justify-between p-4 h-auto"
						>
							<div className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5 text-muted-foreground" />
								<span className="font-semibold">
									Attainment Comparison Charts
								</span>
							</div>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${
									chartsOpen ? "rotate-180" : ""
								}`}
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="px-4 pb-4">
						{data ? (
							<AttainmentComparisonCharts data={data} />
						) : (
							<p className="text-sm text-muted-foreground text-center py-8">
								Load attainment data to view charts.
							</p>
						)}
					</CollapsibleContent>
				</Card>
			</Collapsible>

			{/* Action Plans */}
			{selectedProgrammeId && batchYear.trim() && (
				<ActionPlansSection
					programmeId={selectedProgrammeId}
					batchYear={batchYear}
				/>
			)}
		</div>
	);
}
