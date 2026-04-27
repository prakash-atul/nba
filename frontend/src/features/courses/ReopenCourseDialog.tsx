import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdminCourse } from "@/services/api";

export interface ReopenCourseDialogProps {
	open: boolean;
	course: AdminCourse | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (courseId: number | undefined) => Promise<void>;
	isLoading?: boolean;
}

export function ReopenCourseDialog({
	open,
	course,
	onOpenChange,
	onConfirm,
	isLoading = false,
}: ReopenCourseDialogProps) {
	const handleConfirm = async () => {
		const courseId = course?.offering_id || course?.course_id;
		if (courseId) {
			await onConfirm(courseId);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Reopen Course</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to reopen{" "}
						<span className="font-mono font-semibold">
							{course?.course_code}
						</span>
						? The faculty will be able to edit marks and CO-PO mappings
						again.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isLoading}
						className="bg-amber-600 hover:bg-amber-700"
					>
						{isLoading ? "Reopening..." : "Reopen"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}