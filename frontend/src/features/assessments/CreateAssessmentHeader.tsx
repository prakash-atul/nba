import { ArrowLeft } from "lucide-react";

interface AssessmentsHeaderProps {
	onBack: () => void;
}

export function AssessmentsHeader({ onBack }: AssessmentsHeaderProps) {
	return (
		<div className="flex relative items-center gap-4">
			<button
				type="button"
				onClick={onBack}
				className="flex items-center absolute gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft className="w-5 h-5" />
				Back to Assessments
			</button>
			<div className="flex-1">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Create New Assessment
				</h2>
			</div>
		</div>
	);
}
