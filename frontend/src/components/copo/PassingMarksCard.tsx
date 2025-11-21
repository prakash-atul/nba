import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface PassingMarksCardProps {
	coThreshold: number;
	passingThreshold: number;
}

export function PassingMarksCard({
	coThreshold,
	passingThreshold,
}: PassingMarksCardProps) {
	return (
		<Card>
			<CardHeader className="bg-orange-50 dark:bg-orange-950">
				<CardTitle className="text-lg text-orange-900 dark:text-orange-100">
					Passing Marks (%)
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-6">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border-2 border-green-300 dark:border-green-800">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
							For CO Attainment
						</span>
						<span className="text-lg font-bold text-green-600 dark:text-green-400">
							{coThreshold}%
						</span>
					</div>
					<div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border-2 border-blue-300 dark:border-blue-800">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
							For Student Pass
						</span>
						<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
							{passingThreshold}%
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
