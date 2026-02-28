import { useEffect, useState, Fragment } from "react";
import {
	Sheet,
	SheetContent,
	SheetClose,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	FileText,
	X,
	Printer,
	Pencil,
	School,
	BarChart3,
	CheckCircle2,
	XCircle,
	Info,
} from "lucide-react";
import { apiService } from "@/services/api";
import type { Test, QuestionResponse, Course } from "@/services/api";

interface ViewAssessmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	testId: number | null;
	onGoToMarks?: (test: Test) => void;
}

interface AssessmentDetails {
	test: Test;
	course: Course;
	questions: QuestionResponse[];
}

export function ViewAssessmentDialog({
	open,
	onOpenChange,
	testId,
	onGoToMarks,
}: ViewAssessmentDialogProps) {
	const [loading, setLoading] = useState(false);
	const [details, setDetails] = useState<AssessmentDetails | null>(null);

	useEffect(() => {
		if (open && testId) {
			loadAssessmentDetails();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, testId]);

	const loadAssessmentDetails = async () => {
		if (!testId) return;
		setLoading(true);
		try {
			const data = await apiService.getAssessment(testId);
			setDetails(data);
		} catch (error) {
			console.error("Failed to load assessment details:", error);
		} finally {
			setLoading(false);
		}
	};

	// Group questions by main question number
	const groupedQuestions = details?.questions.reduce(
		(acc, q) => {
			const key = q.question_number;
			if (!acc[key]) acc[key] = [];
			acc[key].push(q);
			return acc;
		},
		{} as Record<number, QuestionResponse[]>,
	);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-[min(92vw,1000px)] max-w-none sm:max-w-none p-0 flex flex-col gap-0 [&>button]:hidden"
			>
				<SheetTitle className="sr-only">Assessment Details</SheetTitle>
				<SheetDescription className="sr-only">
					View complete assessment information and question breakdown
				</SheetDescription>
				{/* ── Header ── */}
				<div className="px-8 py-6 border-b flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
					<div>
						<h3 className="text-xl font-bold text-gray-900 dark:text-white">
							Assessment Details
						</h3>
						<p className="text-sm text-muted-foreground mt-0.5">
							View complete assessment information and question
							breakdown
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Button size="sm">
							<Pencil className="mr-2 h-4 w-4" />
							Edit Details
						</Button>
						<SheetClose asChild>
							<Button
								variant="ghost"
								size="icon"
								className="rounded-full"
							>
								<X className="h-5 w-5" />
							</Button>
						</SheetClose>
					</div>
				</div>

				{/* ── Body ── */}
				<div className="flex-1 flex overflow-hidden">
					{loading ? (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center">
								<FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
								<p className="text-muted-foreground">
									Loading assessment details...
								</p>
							</div>
						</div>
					) : details ? (
						<>
							{/* Left column — info */}
							<ScrollArea className="w-2/5 border-r">
								<div className="p-8 space-y-8">
									{/* Course Information */}
									<section className="space-y-5">
										<h4 className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
											<School className="h-4 w-4" />
											Course Information
										</h4>
										<div className="space-y-4">
											<div>
												<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
													Course Code
												</p>
												<p className="text-base font-semibold">
													{details.course.course_code}
												</p>
											</div>
											<div>
												<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
													Course Name
												</p>
												<p className="text-base font-semibold">
													{details.course.course_name}
												</p>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
														Semester
													</p>
													<p className="font-semibold">
														{
															details.course
																.semester
														}
													</p>
												</div>
												<div>
													<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
														Year
													</p>
													<p className="font-semibold">
														{details.course.year}
													</p>
												</div>
											</div>
										</div>
									</section>

									<Separator />

									{/* Assessment Summary */}
									<section className="space-y-5">
										<h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
											<BarChart3 className="h-4 w-4" />
											Assessment Summary
										</h4>
										<div className="space-y-4">
											<div>
												<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
													Test Name
												</p>
												<p className="text-xl font-bold">
													{details.test.name}
												</p>
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
													<p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
														Full Marks
													</p>
													<p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
														{
															details.test
																.full_marks
														}
													</p>
												</div>
												<div className="p-3 rounded-xl bg-muted border">
													<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
														Pass Marks
													</p>
													<p className="text-2xl font-bold">
														{
															details.test
																.pass_marks
														}
													</p>
												</div>
											</div>
											<div>
												<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
													Total Questions
												</p>
												<p className="text-base font-semibold">
													{details.questions.length}
												</p>
											</div>
										</div>
									</section>

									{/* Info note */}
									<div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
										<Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
										<p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
											Review question mappings and mark
											distributions before finalizing
											marks entry for this assessment.
										</p>
									</div>
								</div>
							</ScrollArea>

							{/* Right column — question breakdown */}
							<div className="w-3/5 flex flex-col overflow-hidden">
								<div className="px-8 pt-8 pb-4 shrink-0">
									<h4 className="text-sm font-bold flex items-center gap-2">
										<span className="w-2 h-2 bg-purple-500 rounded-full" />
										Question Breakdown
									</h4>
								</div>
								<div className="flex-1 overflow-auto">
									<Table>
										<TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
											<TableRow>
												<TableHead className="text-[10px] uppercase tracking-widest">
													Q. No.
												</TableHead>
												<TableHead className="text-[10px] uppercase tracking-widest">
													Sub
												</TableHead>
												<TableHead className="text-[10px] uppercase tracking-widest">
													CO
												</TableHead>
												<TableHead className="text-[10px] uppercase tracking-widest text-center">
													Max Marks
												</TableHead>
												<TableHead className="text-[10px] uppercase tracking-widest text-center">
													Optional
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{groupedQuestions &&
												Object.keys(groupedQuestions)
													.sort(
														(a, b) =>
															Number(a) -
															Number(b),
													)
													.map((qNum) => (
														<Fragment key={qNum}>
															{groupedQuestions[
																Number(qNum)
															].map((q, idx) => (
																<TableRow
																	key={q.id}
																	className="hover:bg-muted/40"
																>
																	<TableCell className="font-mono font-semibold">
																		{idx ===
																		0
																			? q.question_number
																			: ""}
																	</TableCell>
																	<TableCell className="text-muted-foreground">
																		{q.sub_question ||
																			"—"}
																	</TableCell>
																	<TableCell>
																		<Badge
																			variant="outline"
																			className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
																		>
																			CO
																			{
																				q.co
																			}
																		</Badge>
																	</TableCell>
																	<TableCell className="text-center font-bold">
																		{
																			q.max_marks
																		}
																	</TableCell>
																	<TableCell className="text-center">
																		{q.is_optional ? (
																			<CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
																		) : (
																			<XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
																		)}
																	</TableCell>
																</TableRow>
															))}
														</Fragment>
													))}
										</TableBody>
									</Table>
								</div>
							</div>
						</>
					) : (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center">
								<FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
								<p className="text-muted-foreground">
									No assessment details available
								</p>
							</div>
						</div>
					)}
				</div>

				{/* ── Footer ── */}
				{details && (
					<div className="px-8 py-4 bg-muted/40 border-t flex justify-between items-center shrink-0">
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground gap-2"
						>
							<Printer className="h-4 w-4" />
							Print Assessment Spec
						</Button>
						<div className="flex gap-3">
							<SheetClose asChild>
								<Button variant="outline">Close</Button>
							</SheetClose>
							<Button
								className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-90"
								onClick={() => onGoToMarks?.(details.test)}
							>
								Go to Marks Entry
							</Button>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
