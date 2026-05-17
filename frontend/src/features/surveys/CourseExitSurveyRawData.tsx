import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { CourseExitSurveyResultsResponse } from "@/services/api";

interface CourseExitSurveyRawDataProps {
	data: CourseExitSurveyResultsResponse;
}

export function CourseExitSurveyRawData({
	data,
}: CourseExitSurveyRawDataProps) {
	if (!data.has_data || data.raw_responses.length === 0) return null;

	const coNumbers = data.co_results.map((r) => r.co_number).filter(
		(n) => n >= 1 && n <= 6,
	);
	const coLabels = coNumbers.map((n) => `CO${n}`);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Course Exit Survey — Individual Responses
				</CardTitle>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="w-full text-sm whitespace-nowrap">
					<thead>
						<tr className="border-b">
							<th className="text-left py-2 px-2">S.No</th>
							<th className="text-left py-2 px-2">Roll No</th>
							{coLabels.map((co) => (
								<th key={co} className="text-center py-2 px-2">
									{co}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.raw_responses.map((row, idx) => (
							<tr
								key={row.student_rollno}
								className="border-b last:border-0"
							>
								<td className="py-2 px-2 text-muted-foreground">
									{idx + 1}
								</td>
								<td className="py-2 px-2 font-mono text-xs">
									{row.student_rollno}
								</td>
								{coLabels.map((co) => (
									<td
										key={co}
										className="py-2 px-2 text-center"
									>
										{row.ratings[co] ?? "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
					<tfoot className="border-t-2 border-border font-medium">
						<tr className="bg-muted/20">
							<td
								colSpan={2}
								className="py-2 px-2 text-xs text-muted-foreground"
							>
								Attainment %
							</td>
							{coLabels.map((co) => {
								const cr = data.co_results.find(
									(r) => r.co_name === co,
								);
								const impliedPct =
									cr?.average_rating !== null &&
									cr?.average_rating !== undefined
										? ((Number(cr.average_rating) - 1) /
												4) *
											100
										: null;
								return (
									<td
										key={co}
										className="py-2 px-2 text-center font-semibold"
									>
										{impliedPct !== null
											? `${impliedPct.toFixed(1)}%`
											: "—"}
									</td>
								);
							})}
						</tr>
					</tfoot>
				</table>
			</CardContent>
		</Card>
	);
}
