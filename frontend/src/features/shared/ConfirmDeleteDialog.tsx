import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ReactNode } from "react";

interface ConfirmDeleteDialogProps {
	title?: ReactNode;
	description: ReactNode;
	onConfirm: () => void | Promise<void>;
	isLoading?: boolean;
	trigger?: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	confirmText?: string;
}

export function ConfirmDeleteDialog({
	title = "Confirm Deletion",
	description,
	onConfirm,
	isLoading = false,
	trigger,
	open,
	onOpenChange,
	confirmText = "Delete",
}: ConfirmDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			{trigger && (
				<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			)}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
