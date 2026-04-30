import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { apiService } from "@/services/api";
import type { Course, Test } from "@/services/api";
import { formatOrdinal } from "@/lib/utils";
import { EmptyStateCard } from "./EmptyStateCard";
import { TestsListTable } from "./TestsListTable";

interface MarksEntrySelectorProps {
	course: Course | null;
	onTestSelected: (test: Test) => void;
}

export function MarksEntrySelector({
	course,
	onTestSelected,
}: MarksEntrySelectorProps) {
	const [tests, setTests] = useState<Test[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (course) {
			loadTests();
		} else {
			setTests([]);
		}
	}, [course]);

	const loadTests = async () => {
		if (!course) return;

		setLoading(true);
		try {
			const testsData = await apiService.getCourseTests(
				course.offering_id ?? course.course_id,
			);
			setTests(Array.isArray(testsData) ? testsData : []);
		} catch (error) {
			console.error("Failed to load tests:", error);
			setTests([]);
		} finally {
			setLoading(false);
		}
	};

	if (!course) {
		return (
			<EmptyStateCard
				title="No Course Selected"
				description="Select a course from the dropdown above to enter marks"
			/>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Select Assessment for {course.course_code} -{" "}
					{course.course_name}
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					{formatOrdinal(course.semester)} Semester, Year{" "}
					{course.year}
				</p>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="text-center py-8 text-muted-foreground">
						Loading...
					</div>
				) : tests.length === 0 ? (
					<div className="text-center py-12">
						<FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
						<p className="text-muted-foreground">
							No assessments found for this course
						</p>
						<p className="text-sm text-muted-foreground/60 mt-1">
							Create an assessment first
						</p>
					</div>
				) : (
					<TestsListTable
						tests={Array.isArray(tests) ? tests : []}
						onTestSelect={onTestSelected}
					/>
				)}
			</CardContent>
		</Card>
	);
}
