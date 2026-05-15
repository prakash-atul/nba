import { Upload } from "lucide-react";
import type { Course, Test } from "@/services/api";
import { MarksEntryHeader } from "./MarksEntryHeader";
import { TestInfoCard } from "./TestInfoCard";
import { BulkMarksTable } from "./BulkMarksTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMarksEntryByQuestion } from "./useMarksEntryByQuestion";

interface MarksEntryByQuestionProps {
	test: Test;
	course: Course | null;
	onBack: () => void;
}

export function MarksEntryByQuestion({
	test,
	course,
	onBack,
}: MarksEntryByQuestionProps) {
	const {
		questions,
		enrollments,
		marks,
		dirtyRows,
		loading,
		submitting,
		searchTerm,
		setSearchTerm,
		validateMarks,
		setValidateMarks,
		fileInputRef,
		handleFileUpload,
		handleMarkChange,
		handleSubmit,
	} = useMarksEntryByQuestion(test, course);

	const filteredEnrollments = enrollments.filter(
		(e) =>
			e.student_rollno.toLowerCase().includes(searchTerm.toLowerCase()) ||
			e.student_name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="space-y-2 w-full min-w-0">
			<MarksEntryHeader
				title="Bulk Marks Entry (By Question)"
				course={course}
				onBack={onBack}
			/>

			<TestInfoCard
				test={test}
				onSave={handleSubmit}
				isSaving={submitting}
				isDisabled={enrollments.length === 0}
				searchTerm={searchTerm}
				onSearch={setSearchTerm}
				searchPlaceholder="Search by roll no or name..."
				extraActions={
					<>
						<div className="flex items-center space-x-2 mr-2">
							<Switch
								id="validate-marks"
								checked={validateMarks}
								onCheckedChange={setValidateMarks}
							/>
							<Label
								htmlFor="validate-marks"
								className="whitespace-nowrap"
							>
								Validate Marks
							</Label>
						</div>
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept=".csv"
							onChange={handleFileUpload}
						/>
						<Button
							variant="outline"
							onClick={() => fileInputRef.current?.click()}
							className="gap-2"
						>
							<Upload className="w-4 h-4" />
							Import CSV
						</Button>
					</>
				}
			>
				{loading ? (
					<div className="text-center py-8 text-muted-foreground">
						Loading students and questions...
					</div>
				) : (
					<BulkMarksTable
						questions={questions}
						enrollments={filteredEnrollments}
						marks={marks}
						dirtyRows={dirtyRows}
						onMarkChange={handleMarkChange}
						validateMarks={validateMarks}
					/>
				)}
			</TestInfoCard>
		</div>
	);
}