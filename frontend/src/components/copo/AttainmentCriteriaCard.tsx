import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttainmentCriteria } from "./types";
import { formatCriteriaRange } from "./utils";

interface AttainmentCriteriaCardProps {
	attainmentCriteria: AttainmentCriteria[];
	getLevelColor: (level: number) => string;
}

export function AttainmentCriteriaCard({
	attainmentCriteria,
	getLevelColor,
}: AttainmentCriteriaCardProps) {
	return (
		<Card>
			<CardHeader className="bg-gray-50 dark:bg-gray-900">
				<CardTitle className="text-lg">Attainment Criteria</CardTitle>
			</CardHeader>
			<CardContent className="pt-6">
				<div className="flex gap-4 flex-wrap">
					{attainmentCriteria
						.sort((a, b) => b.level - a.level)
						.map((criteria) => (
							<div
								key={criteria.id}
								className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
							>
								<Badge
									className={getLevelColor(criteria.level)}
								>
									{criteria.level}
								</Badge>
								<span className="text-sm text-gray-700 dark:text-gray-300">
									{formatCriteriaRange(
										criteria.minPercentage,
										criteria.maxPercentage
									)}
								</span>
							</div>
						))}
				</div>
			</CardContent>
		</Card>
	);
}
