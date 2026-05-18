import React, { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { surveyApi } from "@/services/api/surveys";
import { debugLogger } from "@/lib/debugLogger";
import type { CourseExitSurveyResultsResponse, CourseExitSurveyQuestionAnalysis } from "@/services/api";
import { CourseExitSurveyRawData } from "./CourseExitSurveyRawData";

interface CourseExitSurveyResultsProps {
	offeringId: number;
	refreshTrigger?: number;
}

export function CourseExitSurveyResults({
	offeringId,
	refreshTrigger = 0,
}: CourseExitSurveyResultsProps) {
	const [data, setData] = useState<CourseExitSurveyResultsResponse | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!offeringId) return;
		let cancelled = false;
		setLoading(true);
		debugLogger.info("CourseExitSurveyResults", "Fetching survey results", { offeringId });
		surveyApi
			.getCourseExitResults(offeringId)
			.then((res) => {
				if (!cancelled) {
					setData(res);
				}
			})
			.catch((err) => {
				debugLogger.error("CourseExitSurveyResults", "Failed to load results", err);
				if (!cancelled) setData(null);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [offeringId, refreshTrigger]);

	if (loading) {
		return <div className="p-4 text-muted-foreground">Loading results...</div>;
	}

	if (!data || !data.has_data) return null;

	// Group questions by CO for the matrix
	const coGroups: Record<number, { questions: CourseExitSurveyQuestionAnalysis[], avg: number | null }> = {};
	if (data.question_analysis) {
		for (const q of data.question_analysis) {
			if (!coGroups[q.co_number]) {
				const coResult = data.co_results.find(c => c.co_number === q.co_number);
				coGroups[q.co_number] = { questions: [], avg: coResult?.average_rating ?? null };
			}
			coGroups[q.co_number].questions.push(q);
		}
	}

	return (
		<div className="space-y-6">
			{/* Survey Analysis Matrix */}
			{data.question_analysis && data.question_analysis.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Survey Analysis Matrix</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="text-left py-2 px-3">Q#</th>
										<th className="text-left py-2 px-3">Question Text</th>
										<th className="text-center py-2 px-3">Map Weight</th>
										<th className="text-center py-2 px-3">Avg Rating</th>
										<th className="text-center py-2 px-3">Variance (σ)</th>
										<th className="text-right py-2 px-3">Weighted Value</th>
									</tr>
								</thead>
								<tbody>
									{[1,2,3,4,5,6].map(coNum => {
										const group = coGroups[coNum];
										if (!group) return null;

										return (
											<React.Fragment key={coNum}>
												{group.questions.map(q => (
													<tr key={q.question_id} className="border-b last:border-0 hover:bg-muted/10">
														<td className="py-2 px-3">{q.question_number}</td>
														<td className="py-2 px-3 text-muted-foreground">{q.question_text}</td>
														<td className="text-center py-2 px-3">{Number(q.mapping_weight).toFixed(2)}</td>
														<td className="text-center py-2 px-3">{q.average_rating ? Number(q.average_rating).toFixed(2) : '-'}</td>
														<td className="text-center py-2 px-3 text-muted-foreground">{q.rating_variance ? Number(q.rating_variance).toFixed(2) : '-'}</td>
														<td className="text-right py-2 px-3 font-medium">
															{q.average_rating ? (Number(q.average_rating) * Number(q.mapping_weight)).toFixed(2) : '-'}
														</td>
													</tr>
												))}
												<tr className="bg-primary/5 font-semibold text-primary">
													<td colSpan={5} className="py-2 px-3 text-right">CO{coNum} Indirect Subtotal:</td>
													<td className="py-2 px-3 text-right">{group.avg !== null ? group.avg.toFixed(2) : '-'}</td>
												</tr>
											</React.Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			<CourseExitSurveyRawData data={data} />
		</div>
	);
}
