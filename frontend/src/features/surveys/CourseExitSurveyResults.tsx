import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { surveyApi } from "@/services/api/surveys";
import { debugLogger } from "@/lib/debugLogger";
import type { CourseExitSurveyResultsResponse } from "@/services/api";

interface CourseExitSurveyResultsProps {
	offeringId: number;
	refreshTrigger?: number;
}

export function CourseExitSurveyResults({
	offeringId,
	refreshTrigger = 0,
}: CourseExitSurveyResultsProps) {
	const [data, setData] = useState<CourseExitSurveyResultsResponse | null>(
		null,
	);
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
					debugLogger.info("CourseExitSurveyResults", "Survey results received", {
						offeringId,
						hasData: res.has_data,
						coResults: res.co_results?.map((r) => ({
							co: r.co_name,
							avgRating: r.average_rating,
							respondents: r.respondent_count,
							// Likert 1-5 → percentage: (avg - 1) / 4 * 100
							impliedIndirectPct: r.average_rating !== null
								? Math.round(((r.average_rating - 1) / 4) * 100 * 100) / 100
								: null,
						})),
					});
					setData(res);
				}
			})
			.catch((err) => {
				debugLogger.error(
					"CourseExitSurveyResults",
					"Failed to load results",
					err,
				);
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
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Course Exit Survey — Results
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Loading...
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!data || !data.has_data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Course Exit Survey — Results
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No survey data imported yet. Use the Import tab to
						upload a CSV.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Course Exit Survey — Results
				</CardTitle>
			</CardHeader>
			<CardContent>
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b">
							<th className="text-left py-2 px-2">CO</th>
							<th className="text-right py-2 px-2">
								Avg. Rating
							</th>
							<th className="text-right py-2 px-2">
								Respondents
							</th>
						</tr>
					</thead>
					<tbody>
						{data.co_results.map((r) => (
							<tr
								key={r.co_number}
								className="border-b last:border-0"
							>
								<td className="py-2 px-2 font-medium">
									{r.co_name}
								</td>
								<td className="text-right py-2 px-2">
									{r.average_rating !== null
										? r.average_rating.toFixed(2)
										: "—"}
								</td>
								<td className="text-right py-2 px-2">
									{r.respondent_count}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}
