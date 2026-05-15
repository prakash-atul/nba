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
import type { User, DeanUser } from "@/services/api";

export interface DeleteUserDialogProps {
	open: boolean;
	user: (User | DeanUser) | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (employeeId: number) => Promise<void>;
	isLoading?: boolean;
}

export function DeleteUserDialog({
	open,
	user,
	onOpenChange,
	onConfirm,
	isLoading = false,
}: DeleteUserDialogProps) {
	const handleConfirm = async () => {
		if (user?.employee_id) {
			await onConfirm(user.employee_id);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete User</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-mono font-semibold">
							{user?.username}
						</span>{" "}
						(ID: {user?.employee_id})? This action cannot be undone
						and will remove all associated records.
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
