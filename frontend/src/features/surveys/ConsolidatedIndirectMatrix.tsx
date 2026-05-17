import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { StakeholderSurveyResultsResponse } from "@/services/api";

interface ConsolidatedIndirectMatrixProps {
	data: StakeholderSurveyResultsResponse;
}

export function ConsolidatedIndirectMatrix({
	data,
}: ConsolidatedIndirectMatrixProps) {
	if (!data.has_data || data.by_type.length === 0) return null;

	const poNames = data.averages.map((a) => a.po_name);
	const typeGroups: Record<
		string,
		Array<{ po_name: string; average_rating: number; respondent_count: number }>
	> = {};
	for (const row of data.by_type) {
		if (!typeGroups[row.stakeholder_type]) {
			typeGroups[row.stakeholder_type] = [];
		}
		typeGroups[row.stakeholder_type].push({
			po_name: row.po_name,
			average_rating: Number(row.average_rating),
			respondent_count: row.respondent_count,
		});
	}

	const typeNames = Object.keys(typeGroups);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Consolidated Indirect Survey Matrix
				</CardTitle>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="w-full text-sm whitespace-nowrap">
					<thead>
						<tr className="border-b">
							<th className="text-left py-2 px-2">Type</th>
							{poNames.map((po) => (
								<th key={po} className="text-right py-2 px-2">
									{po}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{typeNames.map((type) => {
							const rowMap: Record<string, number> = {};
							for (const r of typeGroups[type]) {
								rowMap[r.po_name] = r.average_rating;
							}
							return (
								<tr
									key={type}
									className="border-b last:border-0"
								>
									<td className="py-2 px-2 font-medium">
										{type}
									</td>
									{poNames.map((po) => (
										<td
											key={po}
											className="py-2 px-2 text-right"
										>
											{rowMap[po] !== undefined
												? Number(rowMap[po]).toFixed(2)
												: "—"}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
					<tfoot className="border-t-2 border-border font-medium">
						<tr className="bg-muted/20">
							<td className="py-2 px-2 text-xs text-muted-foreground">
								Average
							</td>
							{poNames.map((po) => {
								const avg = data.averages.find(
									(a) => a.po_name === po,
								);
								return (
									<td
										key={po}
										className="py-2 px-2 text-right font-semibold"
									>
										{avg
											? Number(avg.average_rating).toFixed(2)
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
