import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { CreateAssessmentForm } from "@/components/assessments/CreateAssessmentForm";
import { TestsList } from "@/components/assessments/TestsList";
import { EnrollStudentsDialog } from "@/components/assessments/EnrollStudentsDialog";
import type { Course } from "@/services/api";

interface FacultyAssessmentsProps {
	selectedCourse: Course | null;
}

export function FacultyAssessments({
	selectedCourse,
}: FacultyAssessmentsProps) {
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEnrollDialog, setShowEnrollDialog] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const handleAssessmentCreated = () => {
		setShowCreateForm(false);
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Actions Toolbar */}
			<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50">
				<Button
					variant="outline"
					onClick={() => setShowEnrollDialog(true)}
					disabled={!selectedCourse}
				>
					<Users className="w-4 h-4 mr-2" />
					Enroll Students
				</Button>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="w-4 h-4 mr-2" />
					Create Assessment
				</Button>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="p-6">
						{showCreateForm ? (
							<CreateAssessmentForm
								selectedCourse={selectedCourse}
								onSuccess={handleAssessmentCreated}
								onCancel={() => setShowCreateForm(false)}
							/>
						) : (
							<TestsList
								course={selectedCourse}
								refreshTrigger={refreshTrigger}
							/>
						)}
					</div>
				</ScrollArea>
			</div>

			{/* Enroll Students Dialog */}
			<EnrollStudentsDialog
				open={showEnrollDialog}
				onOpenChange={setShowEnrollDialog}
				course={selectedCourse}
			/>
		</div>
	);
}
