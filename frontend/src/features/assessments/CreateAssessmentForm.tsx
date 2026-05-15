import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ArrowLeft,
	ChevronDown,
	Plus,
	X,
	Check,
	AlertCircle,
	Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { QuestionsTable } from "./QuestionsTable";
import { apiService } from "@/services/api";
import type { Course, Question } from "@/services/api";

interface ContextStats {
	assessments: number;
	students: number;
}

interface CreateAssessmentFormProps {
	selectedCourse: Course | null;
	onSuccess: (courseId?: number) => void;
	onCancel: () => void;
	contextStats?: ContextStats | null;
}

const TEST_TYPES = ["Test-1", "Mid-Term", "Test-2", "End-Term", "Other"];

const TEST_MARKS: Record<string, number> = {
	"Test-1": 10,
	"Mid-Term": 30,
	"Test-2": 10,
	"End-Term": 50,
	Other: 0,
};

export function CreateAssessmentForm({
	selectedCourse,
	onSuccess,
	onCancel,
	contextStats,
}: CreateAssessmentFormProps) {
	const [name, setName] = useState("");
	const [fullMarks, setFullMarks] = useState("");
	const [passMarks, setPassMarks] = useState("");
	const [questions, setQuestions] = useState<Question[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const totalMarks = questions.reduce((sum, q) => sum + q.max_marks, 0);
	const fullMarksNum = parseFloat(fullMarks) || 0;
	const marksMatch = fullMarksNum > 0 && totalMarks === fullMarksNum;

	const handleTestTypeChange = (testType: string) => {
		setName(testType === "Other" ? "" : testType);
		const fm = TEST_MARKS[testType] || 0;
		if (testType !== "Other") {
			setFullMarks(fm.toString());
			setPassMarks((Math.round(fm * 0.34 * 2) / 2).toString());
		} else {
			setFullMarks("");
			setPassMarks("");
		}
	};

	const handleFullMarksChange = (val: string) => {
		setFullMarks(val);
		const fm = parseFloat(val);
		if (!isNaN(fm))
			setPassMarks((Math.round(fm * 0.34 * 2) / 2).toString());
	};

	const addQuestion = () => {
		if (fullMarksNum && totalMarks + 1 > fullMarksNum) {
			toast.error(
				`Total marks (${totalMarks}) would exceed full marks (${fullMarksNum})`,
			);
			return;
		}
		setQuestions((prev) => {
			const maxNum =
				prev.length > 0
					? Math.max(...prev.map((q) => q.question_number))
					: 0;
			return [
				...prev,
				{
					question_number: maxNum + 1,
					sub_question: "",
					is_optional: false,
					co: 1,
					max_marks: 1,
				},
			];
		});
	};

	const addSubQuestion = (questionNumber: number) => {
		if (fullMarksNum && totalMarks + 1 > fullMarksNum) {
			toast.error(
				`Total marks (${totalMarks}) would exceed full marks (${fullMarksNum})`,
			);
			return;
		}
		setQuestions((prev) => {
			const sameNum = prev.filter(
				(q) => q.question_number === questionNumber,
			);
			if (sameNum.length === 0) return prev;

			const existingSubs = sameNum
				.map((q) => q.sub_question)
				.filter((s) => s !== "");
			const updated = [...prev];

			if (existingSubs.length === 0) {
				const idx = updated.findIndex(
					(q) => q.question_number === questionNumber,
				);
				updated[idx] = { ...updated[idx], sub_question: "a" };
				updated.splice(idx + 1, 0, {
					question_number: questionNumber,
					sub_question: "b",
					is_optional: false,
					co: updated[idx].co,
					max_marks: 1,
				});
			} else {
				const highest = [...existingSubs].sort().pop() || "a";
				const nextCode = highest.charCodeAt(0) + 1;
				if (nextCode > "h".charCodeAt(0)) {
					toast.error("Maximum 8 sub-questions (a-h) allowed");
					return prev;
				}
				const next = String.fromCharCode(nextCode);
				const lastIdx = updated
					.map((q, i) => ({ q, i }))
					.filter((x) => x.q.question_number === questionNumber)
					.pop()?.i;
				if (lastIdx !== undefined) {
					updated.splice(lastIdx + 1, 0, {
						question_number: questionNumber,
						sub_question: next,
						is_optional: false,
						co: updated[lastIdx].co,
						max_marks: 1,
					});
				}
			}
			return updated;
		});
	};

	const removeQuestion = (index: number) => {
		setQuestions((prev) => {
			const removed = prev[index];
			if (!removed) return prev;
			let remaining = prev.filter((_, i) => i !== index);
			const sameNum = remaining.filter(
				(q) => q.question_number === removed.question_number,
			);
			if (sameNum.length === 1 && sameNum[0].sub_question !== "") {
				const idx = remaining.findIndex(
					(q) => q.question_number === removed.question_number,
				);
				remaining[idx] = { ...remaining[idx], sub_question: "" };
			}

			// Renumber main questions sequentially (1, 2, 3...)
			const uniqueNums = Array.from(
				new Set(remaining.map((q) => q.question_number)),
			).sort((a, b) => a - b);
			const numMap = new Map(uniqueNums.map((num, i) => [num, i + 1]));

			// Renumber sub-questions sequentially (a, b, c...)
			const subQMap = new Map<number, number>();

			return remaining.map((q) => {
				const newNum =
					numMap.get(q.question_number) || q.question_number;
				let newSub = q.sub_question;

				if (newSub !== "") {
					const offset = subQMap.get(newNum) || 0;
					newSub = String.fromCharCode("a".charCodeAt(0) + offset);
					subQMap.set(newNum, offset + 1);
				}

				return { ...q, question_number: newNum, sub_question: newSub };
			});
		});
	};

	const updateQuestion = (index: number, updates: Partial<Question>) => {
		setQuestions((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], ...updates };
			return updated;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCourse) {
			toast.error("Please select a course");
			return;
		}
		if (!name || !fullMarks || !passMarks) {
			toast.error("Please fill in all required fields");
			return;
		}
		if (questions.length === 0) {
			toast.error("Please add at least one question");
			return;
		}
		if (totalMarks !== fullMarksNum) {
			toast.error(
				`Total marks (${totalMarks}) must equal full marks (${fullMarksNum})`,
			);
			return;
		}
		for (const q of questions) {
			if (q.max_marks < 0.5) {
				toast.error(
					`Q${q.question_number}${q.sub_question || ""}: marks must be >=0.5`,
				);
				return;
			}
			if (q.co < 1 || q.co > 6) {
				toast.error(
					`Q${q.question_number}${q.sub_question || ""}: CO must be 1-6`,
				);
				return;
			}
		}
		setIsSubmitting(true);
		try {
			const result = await apiService.createAssessment({
				offering_id:
					selectedCourse.offering_id ?? selectedCourse.course_id,
				name,
				full_marks: parseFloat(fullMarks),
				pass_marks: parseFloat(passMarks),
				questions,
			});
			toast.success(
				`Assessment created! Test ID: ${result.data.test.id}`,
			);
			onSuccess(selectedCourse.offering_id ?? selectedCourse.course_id);
		} catch (err) {
			console.error("Failed to create assessment:", err);
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to create assessment",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="h-full flex flex-col">
			{/* Top header bar */}
			<header className="h-14 shrink-0 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-6 gap-4">
				<div className="flex items-center gap-3 min-w-0">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onCancel}
						className="rounded-full shrink-0 h-8 w-8"
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>
					<h1 className="text-base font-bold truncate">
						Create New Assessment
					</h1>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					{selectedCourse && (
						<div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
							<span className="text-[11px] font-semibold text-muted-foreground">
								Course:
							</span>
							<span className="text-[11px] font-bold text-primary truncate max-w-[200px]">
								{selectedCourse.course_code} -{" "}
								{selectedCourse.course_name}
							</span>
						</div>
					)}
					<Button
						type="submit"
						size="sm"
						disabled={isSubmitting || !selectedCourse}
						className="gap-2"
					>
						<Rocket className="w-3.5 h-3.5" />
						{isSubmitting ? "Creating..." : "Create Assessment"}
					</Button>
				</div>
			</header>

			{/* Two-column body */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left panel */}
				<aside className="w-80 lg:w-96 bg-white dark:bg-gray-900 border-r flex flex-col shrink-0 overflow-y-auto">
					<div className="p-6 space-y-8">
						{/* Context */}
						<div>
							<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
								Context
							</p>
							{selectedCourse ? (
								<div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
									<p className="text-sm font-semibold text-primary">
										{selectedCourse.course_code} -{" "}
										{selectedCourse.course_name}
									</p>
									<p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
										Semester {selectedCourse.semester}, Year{" "}
										{selectedCourse.year}
									</p>
									{contextStats != null && (
										<div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-800/40 flex gap-4">
											<div className="flex-1">
												<p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
													Assessments
												</p>
												<p className="text-xl font-bold text-primary">
													{contextStats.assessments}
												</p>
											</div>
											<div className="flex-1">
												<p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
													Students
												</p>
												<p className="text-xl font-bold text-primary">
													{contextStats.students}
												</p>
											</div>
										</div>
									)}
								</div>
							) : (
								<div className="p-4 rounded-xl border bg-muted/50 text-sm text-muted-foreground">
									Select a course from the dropdown above.
								</div>
							)}
						</div>

						{/* Configuration */}
						<div>
							<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
								Configuration
							</p>
							<div className="space-y-5">
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold">
										Assessment Type
									</Label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												type="button"
												variant="outline"
												className="w-full justify-between"
											>
												<span className="text-sm">
													{TEST_TYPES.includes(name)
														? name
														: name
															? "Other"
															: "Select type..."}
												</span>
												<ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
											{TEST_TYPES.map((t) => (
												<DropdownMenuItem
													key={t}
													onSelect={() =>
														handleTestTypeChange(t)
													}
												>
													{t}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{(!TEST_TYPES.includes(name) ||
									name === "Other") && (
									<div className="space-y-1.5">
										<Label
											htmlFor="customName"
											className="text-xs font-semibold"
										>
											Custom Assessment Name
										</Label>
										<Input
											id="customName"
											type="text"
											value={name === "Other" ? "" : name}
											onChange={(e) =>
												setName(e.target.value)
											}
											placeholder="e.g. Quiz 1"
											required
										/>
									</div>
								)}

								<div className="space-y-1.5">
									<Label
										htmlFor="fullMarks"
										className="text-xs font-semibold"
									>
										Full Marks
									</Label>
									<Input
										id="fullMarks"
										type="number"
										step="0.5"
										min="0"
										value={fullMarks}
										onChange={(e) =>
											handleFullMarksChange(
												e.target.value,
											)
										}
										placeholder="e.g. 10"
										required
									/>
								</div>

								<div className="space-y-1.5">
									<Label
										htmlFor="passMarks"
										className="text-xs font-semibold"
									>
										Pass Marks
									</Label>
									<Input
										id="passMarks"
										type="number"
										step="0.5"
										min="0"
										value={passMarks}
										onChange={(e) =>
											setPassMarks(e.target.value)
										}
										placeholder="e.g. 4"
										required
									/>
									<p className="text-[10px] text-muted-foreground">
										Auto-calculated at 34% of full marks
									</p>
								</div>
							</div>
						</div>

						{/* Cancel */}
						<div className="pt-2 border-t">
							<Button
								type="button"
								variant="ghost"
								onClick={onCancel}
								className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
							>
								<X className="w-4 h-4" />
								Cancel Creation
							</Button>
						</div>
					</div>
				</aside>

				{/* Right panel */}
				<section className="flex-1 bg-slate-50 dark:bg-gray-950 flex flex-col overflow-hidden">
					{/* Sticky sub-header */}
					<div className="px-8 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b flex items-center justify-between sticky top-0 z-10">
						<div className="flex items-center gap-5">
							<h3 className="text-sm font-bold flex items-center gap-2">
								<span className="w-1.5 h-5 bg-primary rounded-full" />
								Questions Configuration
							</h3>
							<div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
							<span className="text-xs text-muted-foreground hidden sm:block">
								Define structure and CO mapping
							</span>
						</div>
						<div className="flex items-center bg-white dark:bg-gray-800 border rounded-full pl-2 pr-4 py-1 shadow-sm gap-2.5">
							<div
								className={`flex items-center justify-center w-7 h-7 rounded-full text-white ${
									marksMatch
										? "bg-green-500"
										: fullMarksNum > 0
											? "bg-amber-500"
											: "bg-slate-300"
								}`}
							>
								{marksMatch ? (
									<Check className="w-3.5 h-3.5" />
								) : (
									<AlertCircle className="w-3.5 h-3.5" />
								)}
							</div>
							<div className="flex flex-col leading-none">
								<span className="text-[10px] text-muted-foreground font-medium">
									Total Marks
								</span>
								<div className="flex items-baseline gap-0.5 mt-0.5">
									<span
										className={`text-sm font-bold ${
											marksMatch
												? "text-green-600"
												: fullMarksNum > 0
													? "text-amber-600"
													: "text-muted-foreground"
										}`}
									>
										{totalMarks}
									</span>
									<span className="text-xs text-muted-foreground">
										/ {fullMarks || "-"}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Scrollable questions area */}
					<div className="flex-1 overflow-y-auto p-6 lg:p-8">
						<div className="max-w-7xl mx-auto w-full pb-4">
							<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border overflow-hidden">
								<QuestionsTable
									questions={questions}
									onUpdateQuestion={updateQuestion}
									onRemoveQuestion={removeQuestion}
									onAddSubQuestion={addSubQuestion}
								/>
							</div>
						</div>
					</div>

					{/* True Sticky Add Button Footer */}
					<div className="shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t p-4 flex justify-center relative z-10 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addQuestion}
							disabled={
								fullMarksNum > 0 && totalMarks >= fullMarksNum
							}
							className="gap-2 rounded-full h-10 px-8 shadow-sm hover:shadow-md hover:-translate-y-px transition-all bg-white dark:bg-gray-900 border border-primary/20 hover:border-primary text-primary font-bold"
						>
							<Plus className="w-5 h-5" />
							Add Main Question
						</Button>
					</div>
				</section>
			</div>
		</form>
	);
}
