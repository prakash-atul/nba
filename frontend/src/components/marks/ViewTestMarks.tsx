import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/services/api";
import type { Course, Test } from "@/services/api";
import { BarChart2 } from "lucide-react";
import { TestHeader } from "./TestHeader";
import { StudentMarksTable } from "./StudentMarksTable";

interface ViewTestMarksProps {
	test: Test;
	course: Course | null;
	onBack: () => void;
	/** When true, suppresses the back-header */
	embedded?: boolean;
}

export function ViewTestMarks({
	test,
	course,
	onBack,
	embedded = false,
}: ViewTestMarksProps) {
	const [marks, setMarks] = useState<
		Array<{
			student_id: string;
			student_name: string;
			CO1: string | number;
			CO2: string | number;
			CO3: string | number;
			CO4: string | number;
			CO5: string | number;
			CO6: string | number;
		}>
	>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		loadMarks();
	}, [test.id]);

	const loadMarks = async () => {
		setLoading(true);
		try {
			const result = await apiService.getTestMarks(test.id);
			setMarks(result.marks || []);
		} catch (error) {
			console.error("Failed to load marks:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			{!embedded && (
				<TestHeader test={test} course={course} onBack={onBack} />
			)}

			{embedded ? (
				// ── Flat embedded layout matching FacultyMarks style ──
				<div className="flex flex-col h-full">
					<div className="flex-1 overflow-auto bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full">
						<StudentMarksTable
							marks={marks}
							passMarks={test.pass_marks}
							loading={loading}
						/>
					</div>
				</div>
			) : (
				<Card>
					<CardHeader>
						<div className="flex flex-row items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
								<BarChart2 className="w-5 h-5 text-white" />
							</div>
							<div>
								<CardTitle>Student Marks Summary</CardTitle>
								<p className="text-sm text-muted-foreground mt-0.5">
									CO-aggregated marks for all students
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<StudentMarksTable
							marks={marks}
							passMarks={test.pass_marks}
							loading={loading}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
