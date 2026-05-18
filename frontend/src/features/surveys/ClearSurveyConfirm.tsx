import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";

interface ClearSurveyConfirmProps {
	offeringId: number;
	onCleared?: () => void;
}

export function ClearSurveyConfirm({ offeringId, onCleared }: ClearSurveyConfirmProps) {
	const [open, setOpen] = useState(false);
	const [clearing, setClearing] = useState(false);

	const handleClear = async () => {
		setClearing(true);
		try {
			await surveyApi.clearCourseExit(offeringId);
			toast.success("All survey data cleared");
			setOpen(false);
			onCleared?.();
		} catch {
			toast.error("Failed to clear survey data");
		} finally {
			setClearing(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="sm">
					<Trash2 className="w-4 h-4 mr-2" /> Clear All Data
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Clear all survey data?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete all responses <strong>and</strong> the question
						configuration for this course. You will need to reconfigure the questions
						before importing or entering data again. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
					<Button variant="destructive" onClick={handleClear} disabled={clearing}>
						{clearing ? "Clearing..." : "Yes, clear everything"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
