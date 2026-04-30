import { Button } from "@/components/ui/button";
import { AlertCircle, FileText } from "lucide-react";

interface CSVFormatInfoProps {
	onDownloadTemplate: () => void;
}

export function CSVFormatInfo({ onDownloadTemplate }: CSVFormatInfoProps) {
	return (
		<div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
			<div className="flex items-start gap-3">
				<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
				<div className="flex-1">
					<p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
						CSV File Format
					</p>
					<p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
						Your CSV should have two columns: rollno and name
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={onDownloadTemplate}
						className="text-blue-600 dark:text-blue-400"
					>
						<FileText className="w-4 h-4 mr-2" />
						Download Template
					</Button>
				</div>
			</div>
		</div>
	);
}
