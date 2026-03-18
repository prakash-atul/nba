import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Test } from "@/services/api";

interface AssessmentInfoCardProps {
	test: Test;
	questionsCount: number;
}

export function AssessmentInfoCard({
	test,
	questionsCount,
}: AssessmentInfoCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					Assessment Information
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex justify-between">
					<span className="text-sm text-gray-500">Test Name</span>
					<span className="font-medium">{test.name}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-sm text-gray-500">Full Marks</span>
					<Badge variant="outline">{test.full_marks}</Badge>
				</div>
				<div className="flex justify-between">
					<span className="text-sm text-gray-500">Pass Marks</span>
					<Badge variant="outline">{test.pass_marks}</Badge>
				</div>
				<div className="flex justify-between">
					<span className="text-sm text-gray-500">
						Total Questions
					</span>
					<Badge variant="secondary">{questionsCount}</Badge>
				</div>
			</CardContent>
		</Card>
	);
}
