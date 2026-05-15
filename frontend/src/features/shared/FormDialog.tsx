import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface FormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: ReactNode;
	children: ReactNode;
	onSave?: () => void;
	saveLabel?: string;
	cancelLabel?: string;
	isLoading?: boolean;
	className?: string; // e.g. "max-w-2xl max-h-[90vh] overflow-y-auto"
	footer?: ReactNode;
}

export function FormDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	onSave,
	saveLabel = "Save Changes",
	cancelLabel = "Cancel",
	isLoading = false,
	className = "max-w-2xl max-h-[90vh] overflow-y-auto",
	footer,
}: FormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={className}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && (
						<DialogDescription>{description}</DialogDescription>
					)}
				</DialogHeader>

				<div className="py-2">{children}</div>

				{footer ? (
					<DialogFooter>{footer}</DialogFooter>
				) : (
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							{cancelLabel}
						</Button>
						{onSave && (
							<Button onClick={onSave} disabled={isLoading}>
								{isLoading ? "Saving..." : saveLabel}
							</Button>
						)}
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
