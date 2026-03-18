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

export interface DeleteStudentDialogProps {
	open: boolean;
	studentName: string | null;
	rollNo: string | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (rollNo: string) => Promise<void>;
	isLoading?: boolean;
}

export function DeleteStudentDialog({
	open,
	studentName,
	rollNo,
	onOpenChange,
	onConfirm,
	isLoading = false,
}: DeleteStudentDialogProps) {
	const handleConfirm = async () => {
		if (rollNo) {
			await onConfirm(rollNo);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Student</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-semibold">{studentName}</span>{" "}
						(Roll No: {rollNo})? This action cannot be undone.
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
						{isLoading ? "Deleting…" : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
