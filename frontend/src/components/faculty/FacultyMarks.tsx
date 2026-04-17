import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import type { Course, Test } from "@/services/api";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { MarksEntryByCO } from "@/features/marks/MarksEntryByCO";
import { ViewTestMarks } from "@/features/marks/ViewTestMarks";
import { FacultyMarksByQuestion } from "./FacultyMarksByQuestion";

type ViewMode = "by-question" | "by-co" | "bulk";

interface FacultyMarksProps {
	selectedCourse: Course | null;
}

export function FacultyMarks({ selectedCourse }: FacultyMarksProps) {
	const [tests, setTests] = useState<Test[]>([]);
	const [testsLoading, setTestsLoading] = useState(false);
	const [selectedTest, setSelectedTest] = useState<Test | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("by-question");
	const [stats, setStats] = useState<{
		entered: number;
		total: number;
		average: string;
	} | null>(null);

	useEffect(() => {
		if (selectedCourse) {
			loadTests();
		} else {
			setTests([]);
			setSelectedTest(null);
		}
	}, [selectedCourse]);

	const loadTests = async () => {
		if (!selectedCourse) return;
		setTestsLoading(true);
		try {
			const testsData = await apiService.getCourseTests(
				selectedCourse.offering_id ?? selectedCourse.course_id,
			);
			const list: Test[] = Array.isArray(testsData) ? testsData : [];
			setTests(list);
			if (list.length > 0) {
				setSelectedTest(list[0]);
			}
		} catch (err) {
			console.error("Failed to load tests:", err);
			setTests([]);
		} finally {
			setTestsLoading(false);
		}
	};

	const handleTabSelect = (test: Test) => {
		if (test.id === selectedTest?.id) return;
		setSelectedTest(test);
		setStats(null);
	};

	const getTabStatus = (test: Test) => {
		if (
			test.id !== selectedTest?.id ||
			viewMode !== "by-question" ||
			!stats ||
			stats.total === 0
		) {
			return {
				dot: "bg-muted-foreground/30",
				subtitle: `Full: ${test.full_marks || "?"}`,
			};
		}
		const pct = Math.round((stats.entered / stats.total) * 100);
		const dot =
			stats.entered === 0
				? "bg-muted-foreground/30"
				: stats.entered === stats.total
					? "bg-green-500"
					: "bg-yellow-500";
		const label =
			stats.entered === 0
				? "Pending"
				: stats.entered === stats.total
					? "Completed"
					: `${pct}% Entered`;
		return {
			dot,
			subtitle: `${label} | Full: ${test.full_marks || "?"}`,
		};
	};

	if (!selectedCourse) {
		return (
			<div className="flex flex-col items-center justify-center h-full py-20 text-center">
				<FileText className="w-12 h-12 text-muted-foreground/20 mb-3" />
				<p className="text-muted-foreground">
					Select a course to enter marks
				</p>
			</div>
		);
	}

	const renderTabs = () => (
		<Tabs
			value={viewMode}
			onValueChange={(v) => setViewMode(v as ViewMode)}
		>
			<TabsList className="h-auto p-1">
				<TabsTrigger
					value="by-question"
					className="text-xs px-4 py-1.5 font-semibold"
				>
					By Question
				</TabsTrigger>
				<TabsTrigger
					value="by-co"
					className="text-xs px-4 py-1.5 font-semibold"
				>
					By CO
				</TabsTrigger>
				<TabsTrigger
					value="bulk"
					className="text-xs px-4 py-1.5 font-semibold"
				>
					Bulk View
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);

	return (
		<div className="flex flex-col h-full bg-background border rounded-lg shadow-sm overflow-hidden">
			{/* Tests Header */}
			<div className="shrink-0 bg-muted/30 border-b border-border">
				{testsLoading ? (
					<div className="p-4 text-sm text-muted-foreground text-center animate-pulse">
						Loading assessments...
					</div>
				) : tests.length === 0 ? (
					<div className="p-4 text-sm text-muted-foreground text-center">
						No assessments found for this course.
					</div>
				) : (
					<ScrollArea className="w-full whitespace-nowrap">
						<div className="flex w-full p-2 gap-2">
							{tests.map((test) => {
								const { dot, subtitle } = getTabStatus(test);
								return (
									<button
										key={test.id}
										onClick={() => handleTabSelect(test)}
										className={`flex flex-col items-start min-w-[200px] border rounded-md px-4 py-3 text-left transition-all ${
											selectedTest?.id === test.id
												? "border-primary bg-primary/5 ring-1 ring-primary/20"
												: "bg-background hover:bg-muted"
										}`}
									>
										<div className="flex items-center gap-2 mb-1.5 font-semibold text-sm w-full">
											<span
												className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`}
											/>
											<span className="truncate">
												{test.name}
											</span>
										</div>
										<div className="text-xs text-muted-foreground">
											{subtitle}
										</div>
									</button>
								);
							})}
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>

			{/* Main Content Area */}
			<div className="flex-1 overflow-hidden flex flex-col min-h-0">
				{!selectedTest ? (
					<div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
						<FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
						<p className="text-sm text-muted-foreground">
							Select an assessment tab above
						</p>
					</div>
				) : viewMode === "by-question" ? (
					<FacultyMarksByQuestion
						selectedCourse={selectedCourse}
						selectedTest={selectedTest}
						headerContent={renderTabs()}
						onStatsUpdate={setStats}
					/>
				) : viewMode === "by-co" ? (
					<div className="flex-1 overflow-auto flex flex-col">
						<MarksEntryByCO
							test={selectedTest}
							course={selectedCourse}
							onBack={() => setViewMode("by-question")}
							embedded
							headerContent={renderTabs()}
						/>
					</div>
				) : (
					<div className="flex-1 overflow-auto flex flex-col min-h-0">
						<div className="px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-border bg-background">
							<div className="flex items-center gap-3 flex-wrap">
								{renderTabs()}
							</div>
						</div>
						<div className="flex-1 overflow-auto">
							<ViewTestMarks
								test={selectedTest}
								course={selectedCourse}
								onBack={() => setViewMode("by-question")}
								embedded
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
