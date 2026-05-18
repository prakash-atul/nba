import { useState, useEffect, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Database,
	Download,
	RefreshCw,
	Settings2,
	BarChart3,
	ChevronDown,
	ChevronRight,
	Pen,
	Search,
	ArrowLeft,
} from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import { debugLogger } from "@/lib/debugLogger";
import { CourseSurveyConfig } from "@/features/surveys/CourseSurveyConfig";
import { ManualSurveyEntry } from "@/features/surveys/ManualSurveyEntry";
import { ClearSurveyConfirm } from "@/features/surveys/ClearSurveyConfirm";
import { CourseExitSurveyCSVImport } from "@/features/surveys/CourseExitSurveyCSVImport";
import { AttainmentWeightageConfig } from "@/features/surveys/AttainmentWeightageConfig";
import { BlendedAttainmentTable } from "@/features/surveys/BlendedAttainmentTable";
import { AttainmentBarChart } from "@/features/surveys/AttainmentBarChart";
import { attainmentApi } from "@/services/api/attainment";
import { coursesApi } from "@/services/api/courses";
import type { Course } from "@/services/api";
import type { OfferingAttainmentCO, AttainmentConfig } from "@/services/api/types";
import type {
	CourseExitSurveyResultsResponse,
	CourseExitSurveyQuestionAnalysis,
	CourseExitSurveyConfig as CourseExitSurveyConfigType,
} from "@/services/api";

interface FacultyCourseSurveyProps {
	selectedCourse: Course;
}

export function FacultyCourseSurvey({
	selectedCourse,
}: FacultyCourseSurveyProps) {
	const offeringId = selectedCourse.offering_id!;

	const [results, setResults] =
		useState<CourseExitSurveyResultsResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [config, setConfig] = useState<CourseExitSurveyConfigType | null>(
		null,
	);
	const [attainmentCoData, setAttainmentCoData] = useState<
		OfferingAttainmentCO[]
	>([]);
	const [attainmentConfig, setAttainmentConfig] =
		useState<AttainmentConfig | null>(null);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const refresh = useCallback(() => setRefreshTrigger((p) => p + 1), []);

	const [directWeight, setDirectWeight] = useState(80);

	const [metricsOpen, setMetricsOpen] = useState(true);
	const [configOpen, setConfigOpen] = useState(false);
	const [showManualEntry, setShowManualEntry] = useState(false);
	const [filterText, setFilterText] = useState("");

	useEffect(() => {
		if (!offeringId) return;
		setLoading(true);
		Promise.all([
			surveyApi.getCourseExitResults(offeringId),
			surveyApi.getCourseExitSurvey(offeringId),
			attainmentApi.getOfferingAttainment(offeringId),
			coursesApi.getAttainmentConfig(offeringId),
		])
			.then(([res, cfg, attainResp, attainCfg]) => {
				setResults(res);
				setConfig(cfg);
				setAttainmentCoData(attainResp.co_attainment ?? []);
				setAttainmentConfig(attainCfg);
				setDirectWeight(attainCfg.direct_weightage ?? 80);
			})
			.catch((err) => {
				debugLogger.error(
					"FacultyCourseSurvey",
					"Failed to load data",
					err,
				);
			})
			.finally(() => setLoading(false));
	}, [offeringId, refreshTrigger]);

	const coGroups: Record<
		number,
		{ questions: CourseExitSurveyQuestionAnalysis[]; avg: number | null }
	> = {};
	if (results?.question_analysis) {
		for (const q of results.question_analysis) {
			if (!coGroups[q.co_number]) {
				const coResult = results.co_results.find(
					(c) => c.co_number === q.co_number,
				);
				coGroups[q.co_number] = {
					questions: [],
					avg: coResult?.normalized_rating ?? null,
				};
			}
			coGroups[q.co_number].questions.push(q);
		}
	}

	const indirectWeight = 100 - directWeight;

	return (
		<div className="flex flex-col min-w-0 h-full">
			<div className="h-14 bg-background border-b flex items-center justify-between px-6 shrink-0 z-10">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Database className="w-5 h-5 text-muted-foreground" />
						<h2 className="font-semibold text-base">
							Survey Integration Console
						</h2>
					</div>
					<Separator orientation="vertical" className="h-5" />
					<Badge
						variant="secondary"
						className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5"
					>
						Live Sync
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<ClearSurveyConfirm
						offeringId={offeringId}
						onCleared={refresh}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setConfigOpen(true)}
					>
						<Settings2 className="w-4 h-4 mr-1.5" />
						Question Config
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowManualEntry(true)}
					>
						<Pen className="w-4 h-4 mr-1.5" />
						Manual Entry
					</Button>
					<Button variant="outline" size="sm">
						<Download className="w-4 h-4 mr-1.5" />
						Export CSV
					</Button>
					<Button size="sm">
						<RefreshCw className="w-4 h-4 mr-1.5" />
						Sync Survey Platform
					</Button>
				</div>
			</div>

			{showManualEntry ? (
				<div className="flex-1 flex flex-col min-w-0">
					<div className="h-14 bg-background border-b flex items-center px-6 shrink-0 z-10">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowManualEntry(false)}
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Survey Dashboard
						</Button>
					</div>
					<div className="flex-1 overflow-y-auto p-6">
						<ManualSurveyEntry
							offeringId={offeringId}
							onSaved={() => {
								refresh();
								setShowManualEntry(false);
							}}
						/>
					</div>
				</div>
			) : (
				<>
					<div className="flex-1 overflow-y-auto p-6 space-y-4">
						{loading ? (
							<div className="flex items-center justify-center h-32 text-muted-foreground">
								Loading survey data...
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									<CourseExitSurveyCSVImport
										offeringId={offeringId}
										config={config}
										onImportComplete={refresh}
									/>
									<AttainmentWeightageConfig
										offeringId={offeringId}
										attainmentConfig={attainmentConfig}
										directWeight={directWeight}
										onDirectWeightChange={setDirectWeight}
										onSaved={refresh}
									/>
								</div>

								<Card>
									<button
										className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors border-b cursor-pointer group"
										onClick={() =>
											setMetricsOpen(!metricsOpen)
										}
									>
										<div className="flex items-center gap-2">
											<BarChart3 className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors" />
											<h3 className="font-semibold text-sm">
												Metrics Overview: Blended
												Attainment
											</h3>
										</div>
										{metricsOpen ? (
											<ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
										) : (
											<ChevronRight className="w-5 h-5 text-muted-foreground transition-transform" />
										)}
									</button>

									{metricsOpen && (
										<div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
											<BlendedAttainmentTable
												attainmentCoData={
													attainmentCoData
												}
												directWeight={directWeight}
												indirectWeight={indirectWeight}
											/>
											<AttainmentBarChart
												attainmentCoData={
													attainmentCoData
												}
											/>
										</div>
									)}
								</Card>

								<Card>
									<div className="px-5 py-4 border-b flex justify-between items-center">
										<div>
											<h2 className="font-semibold text-base">
												Course Exit Survey Analysis
												Matrix
											</h2>
											<p className="text-xs text-muted-foreground mt-0.5">
												Detailed breakdown of indirect
												assessment responses mapped to
												Course Outcomes.
											</p>
										</div>
										<div className="flex gap-2">
											<div className="relative">
												<Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
												<Input
													className="pl-8 pr-3 py-1.5 h-8 text-xs w-44"
													placeholder="Filter questions..."
													value={filterText}
													onChange={(e) =>
														setFilterText(
															e.target.value,
														)
													}
												/>
											</div>
										</div>
									</div>
									<div className="overflow-x-auto w-full">
										<table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px] text-sm">
											<thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
												<tr>
													<th className="py-2.5 px-3 border-b border-r font-bold w-14 text-center">
														CO
													</th>
													<th className="py-2.5 px-3 border-b border-r font-bold">
														Survey Question / Metric
													</th>
													<th className="py-2.5 px-3 border-b border-r font-bold w-24 text-right">
														Avg Score (0-3)
													</th>
													<th className="py-2.5 px-3 border-b border-r font-bold w-24 text-right">
														Mapping Wt.
													</th>
													<th className="py-2.5 px-3 border-b border-r font-bold w-24 text-right">
														Weighted Val.
													</th>
													<th className="py-2.5 px-3 border-b font-bold w-28">
														Statistical Var.
													</th>
												</tr>
											</thead>
											<tbody className="font-mono text-xs">
												{results?.question_analysis
													?.length ? (
													[1, 2, 3, 4, 5, 6].map(
														(coNum) => {
															const group =
																coGroups[coNum];
															if (
																!group ||
																!group.questions
																	.length
															)
																return null;
															const filtered =
																group.questions.filter(
																	(q) =>
																		!filterText ||
																		q.question_text
																			.toLowerCase()
																			.includes(
																				filterText.toLowerCase(),
																			),
																);
															if (
																!filtered.length
															)
																return null;
															return (
																<Fragment
																	key={coNum}
																>
																	{filtered.map(
																		(
																			q,
																			qIdx,
																		) => {
																			const weightedVal =
																				q.normalized_rating !==
																					null &&
																				q.normalized_rating !==
																					undefined
																					? Number(
																							q.normalized_rating,
																						) *
																						Number(
																							q.mapping_weight,
																						)
																					: null;
																			return (
																				<tr
																					key={
																						q.question_id
																					}
																					className="hover:bg-muted/30 transition-colors border-b border-muted/50"
																				>
																					{qIdx ===
																						0 && (
																						<td
																							className="py-1.5 px-3 border-r text-center font-bold bg-muted/20"
																							rowSpan={
																								filtered.length
																							}
																						>
																							CO
																							{
																								coNum
																							}
																						</td>
																					)}
																					<td className="py-1.5 px-3 border-r font-sans text-xs truncate max-w-[260px]">
																						{
																							q.question_text
																						}
																					</td>
																					<td className="py-1.5 px-3 border-r text-right">
																						{q.normalized_rating !==
																							null &&
																						q.normalized_rating !==
																							undefined
																							? Number(
																									q.normalized_rating,
																								).toFixed(
																									2,
																								)
																							: "-"}
																					</td>
																					<td className="py-1.5 px-3 border-r text-right text-muted-foreground">
																						{Number(
																							q.mapping_weight,
																						).toFixed(
																							2,
																						)}
																					</td>
																					<td className="py-1.5 px-3 border-r text-right font-semibold">
																						{weightedVal !==
																						null
																							? weightedVal.toFixed(
																									2,
																								)
																							: "-"}
																					</td>
																					<td className="py-1.5 px-3 text-muted-foreground text-xs">
																						{q.rating_variance
																							? `σ: ${Number(q.rating_variance).toFixed(2)}`
																							: "-"}
																					</td>
																				</tr>
																			);
																		},
																	)}
																	<tr className="border-b-2 border-muted-foreground/20 bg-muted/10">
																		<td
																			className="py-1.5 px-3 border-r font-semibold italic text-muted-foreground text-right font-sans"
																			colSpan={
																				1
																			}
																		>
																			CO
																			{
																				coNum
																			}{" "}
																			Indirect
																			Subtotal
																		</td>
																		<td className="py-1.5 px-3 border-r" />
																		<td className="py-1.5 px-3 border-r text-right font-bold bg-primary/5">
																			{group.avg !==
																			null
																				? Number(
																						group.avg,
																					).toFixed(
																						2,
																					)
																				: "-"}
																		</td>
																		<td className="py-1.5 px-3 border-r text-right text-muted-foreground">
																			-
																		</td>
																		<td className="py-1.5 px-3 border-r text-right">
																			-
																		</td>
																		<td className="py-1.5 px-3" />
																	</tr>
																</Fragment>
															);
														},
													)
												) : (
													<tr>
														<td
															colSpan={6}
															className="py-8 text-center text-muted-foreground font-sans text-sm"
														>
															No survey data
															available. Import
															CSV or enter
															responses manually
															to populate the
															analysis matrix.
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
									<div className="px-4 py-2 border-t bg-muted/10 flex justify-between items-center text-xs text-muted-foreground">
										<span>
											Showing{" "}
											{results?.question_analysis
												?.length ?? 0}{" "}
											questions mapped to{" "}
											{results?.co_results?.length ?? 0}{" "}
											outcomes
										</span>
										<span className="flex items-center gap-1">
											<span className="w-2 h-2 rounded-full bg-green-500 block" />
											Data up to date
										</span>
									</div>
								</Card>
							</>
						)}
					</div>

					<Sheet open={configOpen} onOpenChange={setConfigOpen}>
						<SheetContent
							side="right"
							className="w-full sm:max-w-2xl p-0"
						>
							<SheetHeader className="px-5 py-4 border-b">
								<SheetTitle>
									Survey Question Configuration
								</SheetTitle>
							</SheetHeader>
							<div className="flex-1 overflow-y-auto px-5 py-4">
								<CourseSurveyConfig
									offeringId={offeringId}
									onConfigSaved={() => {
										refresh();
										setConfigOpen(false);
									}}
								/>
							</div>
						</SheetContent>
					</Sheet>
				</>
			)}
		</div>
	);
}
