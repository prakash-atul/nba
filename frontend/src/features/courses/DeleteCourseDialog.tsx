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

export interface DeleteCourseDialogProps {
	open: boolean;
	course: AdminCourse | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (courseId: number | undefined) => Promise<void>;
	isLoading?: boolean;
}

export function DeleteCourseDialog({
	open,
	course,
	onOpenChange,
	onConfirm,
	isLoading = false,
}: DeleteCourseDialogProps) {
	const handleConfirm = async () => {
		if (course?.course_id) {
			await onConfirm(course.course_id);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Course</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-mono font-semibold">
							{course?.course_code}
						</span>
						? This action cannot be undone and will also delete all
						associated tests, marks, and enrollments.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isLoading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isLoading ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
