import type { OfferingAttainmentCO } from "@/services/api/types";

interface BlendedAttainmentTableProps {
	attainmentCoData: OfferingAttainmentCO[];
	directWeight: number;
	indirectWeight: number;
}

export function BlendedAttainmentTable({
	attainmentCoData,
	directWeight,
	indirectWeight,
}: BlendedAttainmentTableProps) {
	return (
		<div>
			<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
				Calculated Attainment (Direct + Indirect)
			</h4>
			<div className="border rounded-lg overflow-hidden h-full">
				<table className="w-full text-left border-collapse text-sm">
					<thead className="bg-muted/50">
						<tr>
							<th className="p-2 border-b border-r font-semibold">
								Outcome
							</th>
							<th className="p-2 border-b border-r font-semibold">
								Direct ({directWeight}%)
							</th>
							<th className="p-2 border-b border-r font-semibold">
								Indirect ({indirectWeight}%)
							</th>
							<th className="p-2 border-b font-bold text-primary">
								Blended Final
							</th>
						</tr>
					</thead>
					<tbody>
						{[1, 2, 3, 4, 5, 6].map((coNum) => {
							const coData = attainmentCoData.find(
								(c) => c.co_name === `CO${coNum}`,
							);
							if (!coData) return null;
							const directVal =
								coData.attainment_level ?? 0;
							const indirectVal =
								coData.indirect_attainment_level ?? 0;
							const finalVal =
								coData.final_attainment_level ?? directVal;
							return (
								<tr
									key={coNum}
									className="border-b last:border-0 hover:bg-muted/30 transition-colors"
								>
									<td className="p-2 border-r font-semibold">
										CO{coNum}
									</td>
									<td className="p-2 border-r font-mono text-xs">
										{directVal.toFixed(2)}
									</td>
									<td className="p-2 border-r font-mono text-xs">
										{indirectVal.toFixed(2)}
									</td>
									<td className="p-2 font-mono text-xs font-bold bg-primary/5">
										{finalVal.toFixed(2)}
									</td>
								</tr>
							);
						})}
						{!attainmentCoData.length && (
							<tr>
								<td
									colSpan={4}
									className="p-4 text-center text-muted-foreground text-xs"
								>
									No attainment data yet. Import survey
									responses to see blended attainment.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
