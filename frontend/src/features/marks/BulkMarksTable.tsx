import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { QuestionResponse, Enrollment } from "@/services/api";

/** CO badge colour map (CO1–CO6) */
const CO_COLORS: Record<string, string> = {
	"1": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
	"2": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
	"3": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
	"4": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	"5": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	"6": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
};

interface BulkMarksTableProps {
	/** Already-paginated slice of enrollments to display */
	questions: QuestionResponse[];
	enrollments: Enrollment[];
	marks: Record<string, Record<string, string>>;
	dirtyRows: Set<string>;
	onMarkChange: (
		studentRollno: string,
		questionId: string,
		value: string,
	) => void;
}

export function BulkMarksTable({
	questions,
	enrollments,
	marks,
	dirtyRows,
	onMarkChange,
}: BulkMarksTableProps) {
	const rowTotal = (rollno: string) =>
		questions.reduce((sum, q) => {
			const v = parseFloat(marks[rollno]?.[q.question_identifier] || "");
			return isNaN(v) ? sum : sum + v;
		}, 0);

	const rowHasInvalid = (rollno: string) =>
		questions.some((q) => {
			const v = parseFloat(marks[rollno]?.[q.question_identifier] || "");
			return !isNaN(v) && v > q.max_marks;
		});

	const isCellInvalid = (rollno: string, q: QuestionResponse) => {
		const v = parseFloat(marks[rollno]?.[q.question_identifier] || "");
		return !isNaN(v) && v > q.max_marks;
	};

	const hasAnyMark = (rollno: string) =>
		questions.some(
			(q) => (marks[rollno]?.[q.question_identifier] || "") !== "",
		);

	const maxTotal = questions
		.filter((q) => !q.is_optional)
		.reduce((sum, q) => sum + q.max_marks, 0);

	return (
		<table className="min-w-full border-collapse">
			<TableHeader className="bg-gray-50 dark:bg-muted sticky top-0 z-30 [&_tr]:border-0 shadow-sm">
				<TableRow className="hover:bg-transparent border-b border-border">
					<TableHead
						scope="col"
						className="sticky left-0 z-40 bg-gray-50 dark:bg-muted px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-[120px] min-w-[120px] shadow-[1px_0_0_0_hsl(var(--border))]"
					>
						Roll No
					</TableHead>
					<TableHead
						scope="col"
						className="sticky left-[120px] z-40 bg-gray-50 dark:bg-muted px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-[200px] min-w-[200px] shadow-[1px_0_0_0_hsl(var(--border))]"
					>
						Student Name
					</TableHead>
					{questions.map((q) => {
						const colorClass =
							CO_COLORS[String(q.co)] ??
							"bg-gray-100 text-gray-800 dark:bg-muted dark:text-muted-foreground";
						return (
							<TableHead
								key={q.id}
								scope="col"
								className="px-4 py-3 text-center border-b border-r border-border min-w-[90px] align-middle"
							>
								<div className="flex flex-col items-center gap-0.5">
									<span className="text-xs font-bold text-foreground">
										Q{q.question_identifier}
										{!!q.is_optional && (
											<span className="ml-0.5 text-orange-500">
												*
											</span>
										)}
									</span>
									<Badge
										className={cn(
											"text-[10px] font-bold h-auto py-0 px-1.5 rounded border-transparent",
											colorClass,
										)}
									>
										CO{q.co}
									</Badge>
									<span className="text-[10px] text-muted-foreground">
										({q.max_marks})
									</span>
								</div>
							</TableHead>
						);
					})}
					{/* Total column */}
					<TableHead
						scope="col"
						className="px-4 py-3 text-center border-b bg-blue-50/50 dark:bg-blue-950/40 min-w-20 align-middle backdrop-blur-sm"
					>
						<div className="flex flex-col items-center gap-0.5">
							<span className="text-xs font-bold text-blue-600 dark:text-blue-400">
								Total
							</span>
							<span className="text-[10px] text-muted-foreground">
								({maxTotal})
							</span>
						</div>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="bg-background [&_tr:last-child]:border-0">
				{enrollments.map((enrollment) => {
					const rollno = enrollment.student_rollno;
					const isInvalid = rowHasInvalid(rollno);
					const isDirty = dirtyRows.has(rollno);
					const hasMark = hasAnyMark(rollno);
					const total = hasMark ? rowTotal(rollno) : null;

					const stickyBg = isInvalid
						? "bg-red-50 group-hover:bg-red-100 dark:bg-red-950 dark:group-hover:bg-red-900"
						: isDirty
							? "bg-amber-50 group-hover:bg-amber-100 dark:bg-amber-950 dark:group-hover:bg-amber-900"
							: "bg-background group-hover:bg-muted";

					return (
						<TableRow
							key={rollno}
							className={cn(
								"transition-colors group border-b border-border",
								isInvalid
									? "bg-red-50/30 hover:bg-red-50/50 dark:bg-red-900/10 dark:hover:bg-red-900/20"
									: isDirty
										? "bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-900/10 dark:hover:bg-amber-900/20"
										: "hover:bg-muted/50",
							)}
						>
							{/* Sticky Roll No */}
							<TableCell
								className={cn(
									"sticky left-0 z-20 px-6 py-3 whitespace-nowrap font-medium text-foreground border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]",
									stickyBg,
								)}
							>
								<Badge variant="outline" className="font-mono">
									{rollno}
								</Badge>
							</TableCell>
							{/* Sticky Name */}
							<TableCell
								className={cn(
									"sticky left-[120px] z-20 px-6 py-3 whitespace-nowrap text-muted-foreground border-r border-border shadow-[1px_0_0_0_hsl(var(--border))]",
									stickyBg,
								)}
							>
								{enrollment.student_name}
							</TableCell>
							{/* Question inputs */}
							{questions.map((q) => {
								const invalid = isCellInvalid(rollno, q);
								return (
									<TableCell
										key={q.id}
										className="px-4 py-3 text-center border-r border-border"
									>
										<Input
											type="number"
											step="0.5"
											min="0"
											max={q.max_marks}
											value={
												marks[rollno]?.[
													q.question_identifier
												] || ""
											}
											onChange={(e) =>
												onMarkChange(
													rollno,
													q.question_identifier,
													e.target.value,
												)
											}
											onFocus={(e) => e.target.select()}
											placeholder="-"
											className={cn(
												"w-16 h-8 p-1.5 text-center text-sm bg-background/50",
												invalid &&
													"border-destructive border-2 text-destructive focus-visible:ring-destructive/30",
											)}
										/>
									</TableCell>
								);
							})}
							{/* Total cell */}
							<TableCell className="px-4 py-3 text-center text-sm font-bold bg-blue-50/20 dark:bg-blue-900/10 min-w-20 align-middle">
								{isInvalid ? (
									<span className="flex items-center justify-center text-destructive">
										<AlertCircle className="w-4 h-4" />
									</span>
								) : total !== null ? (
									<span className="text-foreground">
										{total % 1 === 0
											? total.toFixed(0)
											: total.toFixed(2)}
									</span>
								) : (
									<span className="text-muted-foreground">
										–
									</span>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</table>
	);
}
