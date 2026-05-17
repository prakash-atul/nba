import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { StakeholderSurveyResultsResponse } from "@/services/api";

interface StakeholderSurveyDetailTableProps {
	data: StakeholderSurveyResultsResponse;
}

export function StakeholderSurveyDetailTable({
	data,
}: StakeholderSurveyDetailTableProps) {
	if (!data.has_data || data.individual.length === 0) return null;

	const poNames = data.averages.map((a) => a.po_name);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Stakeholder Survey — Individual Responses
				</CardTitle>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="w-full text-sm whitespace-nowrap">
					<thead>
						<tr className="border-b">
							<th className="text-left py-2 px-2">S.No</th>
							<th className="text-left py-2 px-2">Name</th>
							<th className="text-left py-2 px-2">Qualification</th>
							{poNames.map((po) => (
								<th key={po} className="text-center py-2 px-2">
									{po}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.individual.map((row, idx) => (
							<tr
								key={row.respondent_identifier ?? idx}
								className="border-b last:border-0"
							>
								<td className="py-2 px-2 text-muted-foreground">
									{idx + 1}
								</td>
								<td className="py-2 px-2">
									{row.respondent_name || "—"}
								</td>
								<td className="py-2 px-2 text-xs text-muted-foreground">
									{row.qualification || "—"}
								</td>
								{poNames.map((po) => (
									<td
										key={po}
										className="py-2 px-2 text-center"
									>
										{row.ratings[po] ?? "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
					<tfoot className="border-t-2 border-border font-medium">
						<tr className="bg-muted/20">
							<td
								colSpan={3}
								className="py-2 px-2 text-xs text-muted-foreground"
							>
								Attainment %
							</td>
							{poNames.map((po) => {
								const avg = data.averages.find(
									(a) => a.po_name === po,
								);
								const pct = avg
									? ((Number(avg.average_rating) - 1) / 4) * 100
									: null;
								return (
									<td
										key={po}
										className="py-2 px-2 text-center font-semibold"
									>
										{pct !== null
											? `${pct.toFixed(1)}%`
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
