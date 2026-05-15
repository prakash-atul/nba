import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { Question } from "@/services/api";

interface QuestionTableRowProps {
	question: Question;
	index: number;
	onUpdate: (updates: Partial<Question>) => void;
	onRemove: () => void;
	onAddSubQuestion: () => void;
}

export function QuestionTableRow({
	question,
	index,
	onUpdate,
	onRemove,
	onAddSubQuestion,
}: QuestionTableRowProps) {
	const questionLabel = question.sub_question
		? `Q${question.question_number}${question.sub_question}`
		: `Q${question.question_number}`;

	return (
		<TableRow className="hover:bg-slate-50/50 transition-colors">
			{/* Q. No. */}
			<TableCell className="py-4 pl-8 border-r-0">
				<Badge
					variant="outline"
					className="font-mono font-bold h-7 px-3 flex items-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
				>
					{questionLabel}
				</Badge>
			</TableCell>

			{/* Sub-Q */}
			<TableCell className="py-4 text-center">
				<div className="flex justify-center">
					<Input
						type="text"
						value={question.sub_question}
						onChange={(e) =>
							onUpdate({ sub_question: e.target.value })
						}
						className="w-16 h-10 text-center font-medium shadow-sm bg-white dark:bg-slate-950 focus-visible:ring-1 border-slate-200 dark:border-slate-800"
						placeholder="-"
						maxLength={2}
					/>
				</div>
			</TableCell>

			{/* CO */}
			<TableCell className="py-4">
				<div className="flex justify-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="rounded-full h-8 px-4 text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/80 hover:text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 shadow-sm gap-1.5 transition-all"
							>
								CO{question.co}
								<ChevronDown className="w-3 h-3 opacity-60" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center">
							{[1, 2, 3, 4, 5, 6].map((co) => (
								<DropdownMenuItem
									key={co}
									onSelect={() => onUpdate({ co })}
								>
									<span className="font-semibold text-xs mr-2">
										CO{co}
									</span>
									<span className="text-xs text-muted-foreground">
										Course Outcome {co}
									</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</TableCell>

			{/* Max Marks */}
			<TableCell className="py-4">
				<div className="flex justify-center">
					<Input
						type="number"
						step="0.5"
						min="0.5"
						value={question.max_marks}
						onChange={(e) =>
							onUpdate({
								max_marks: parseFloat(e.target.value) || 0,
							})
						}
						onFocus={(e) => e.target.select()}
						className="w-24 h-10 text-center font-medium shadow-sm focus-visible:ring-1 border-slate-200 dark:border-slate-800"
						required
					/>
				</div>
			</TableCell>

			{/* Optional */}
			<TableCell className="py-4">
				<div className="flex justify-center">
					<Checkbox
						id={`optional-${index}`}
						checked={question.is_optional}
						onCheckedChange={(checked) =>
							onUpdate({ is_optional: !!checked })
						}
						className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
					/>
				</div>
			</TableCell>

			{/* Actions */}
			<TableCell className="py-4 pr-8">
				<div className="flex items-center justify-center gap-1.5">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onAddSubQuestion}
						title="Add sub-question"
						className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
					>
						<Plus className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onRemove}
						title="Remove question"
						className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}
