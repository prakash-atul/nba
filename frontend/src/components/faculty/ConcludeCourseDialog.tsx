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
import type { Course } from "@/services/api";

interface ConcludeCourseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	canConclude: boolean;
	isConcluding: boolean;
	course?: Course | null;
	incompleteTests: string[];
	onConclude: () => void;
}

export function ConcludeCourseDialog({
	open,
	onOpenChange,
	canConclude,
	isConcluding,
	course,
	incompleteTests,
	onConclude,
}: ConcludeCourseDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{canConclude
							? "Are you absolutely sure?"
							: "Action Not Allowed"}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div>
							{!canConclude ? (
								<>
									<span className="text-destructive font-semibold">
										Cannot conclude the session for{" "}
										{course?.course_name}.
									</span>
									<br />
									<br />
									The following assessments have incomplete
									marks entries:
									<ul className="list-disc list-inside mt-2 ml-4">
										{incompleteTests.map((testName, i) => (
											<li
												key={i}
												className="text-foreground"
											>
												{testName}
											</li>
										))}
									</ul>
									<br />
									Please ensure that ALL enrolled students
									have been graded for these assessments or
									the assessments have appropriate max marks
									set up.
									<br />
								</>
							) : (
								<>
									This will conclude the current session for{" "}
									<strong>{course?.course_name}</strong>. All
									internal marks will be locked, and
									attainments will be calculated.
									<br />
									<br />
									<strong>Note:</strong> You will no longer be
									able to modify marks for the current
									assessments once concluded. This action
									cannot be undone.
								</>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isConcluding}>
						{canConclude ? "Cancel" : "Close"}
					</AlertDialogCancel>
					{canConclude && (
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								onConclude();
							}}
							disabled={isConcluding}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isConcluding
								? "Concluding Session..."
								: "Yes, Conclude Session"}
						</AlertDialogAction>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
