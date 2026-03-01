import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Course } from "@/services/api";

interface MarksEntryHeaderProps {
	title: string;
	course: Course | null;
	onBack: () => void;
}

export function MarksEntryHeader({
	title,
	course,
	onBack,
}: MarksEntryHeaderProps) {
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
				<h2 className="text-2xl font-bold text-foreground">{title}</h2>
				{course && (
					<p className="text-sm text-muted-foreground">
						{course.course_code} - {course.course_name}
					</p>
				)}
			</div>
		</div>
	);
}
