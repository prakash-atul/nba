import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Course, Test } from "@/services/api";

interface TestHeaderProps {
	test: Test;
	course: Course | null;
	onBack: () => void;
}

export function TestHeader({ test, course, onBack }: TestHeaderProps) {
	return (
		<div className="relative flex items-center justify-center min-h-16 mb-2">
			<Button
				variant="ghost"
				onClick={onBack}
				className="absolute left-0 gap-2 text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="w-4 h-4" />
				Back
			</Button>

			<div className="text-center">
				<h2 className="text-2xl font-bold text-foreground">
					{test.name} - All Marks
				</h2>
				{course && (
					<p className="text-sm text-muted-foreground">
						{course.course_code} - {course.course_name}
					</p>
				)}
			</div>

			<div className="absolute right-0 flex items-center gap-4">
				<div className="text-right">
					<p className="text-xs text-muted-foreground uppercase tracking-wider">
						Full Marks
					</p>
					<p className="text-lg font-bold text-foreground">
						{test.full_marks}
					</p>
				</div>
				<div className="text-right">
					<p className="text-xs text-muted-foreground uppercase tracking-wider">
						Pass Marks
					</p>
					<p className="text-lg font-bold text-foreground">
						{test.pass_marks}
					</p>
				</div>
			</div>
		</div>
	);
}
