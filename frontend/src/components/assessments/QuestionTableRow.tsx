import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2, Plus } from "lucide-react";
import type { Question } from "@/services/api";

interface QuestionTableRowProps {
	question: Question;
	index: number;
	onUpdate: (index: number, updates: Partial<Question>) => void;
	onRemove: (index: number) => void;
	onAddSubQuestion: (questionNumber: number) => void;
}

export function QuestionTableRow({
	question,
	index,
	onUpdate,
	onRemove,
	onAddSubQuestion,
}: QuestionTableRowProps) {
	return (
		<TableRow>
			{/* Question Number */}
			<TableCell className="text-left">
				<Input
					type="number"
					min="1"
					max="20"
					value={question.question_number}
					onChange={(e) =>
						onUpdate(index, {
							question_number: parseInt(e.target.value) || 1,
						})
					}
					onFocus={(e) => e.target.select()}
					className="w-20"
					required
				/>
			</TableCell>

			{/* Sub-Question */}
			<TableCell>
				<Input
					maxLength={1}
					value={question.sub_question}
					onChange={(e) => {
						const value = e.target.value.toLowerCase();
						if (value === "" || (value >= "a" && value <= "h")) {
							onUpdate(index, {
								sub_question: value,
							});
						}
					}}
					className="w-16"
					placeholder="a-h"
				/>
			</TableCell>

			{/* CO Selection */}
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="w-24 justify-between"
							size="sm"
						>
							CO{question.co}
							<ChevronDown className="w-4 h-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{[1, 2, 3, 4, 5, 6].map((co) => (
							<DropdownMenuItem
								key={co}
								onClick={() => onUpdate(index, { co })}
							>
								CO{co}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>

			{/* Max Marks */}
			<TableCell>
				<Input
					type="number"
					step="0.5"
					min="0.5"
					value={question.max_marks}
					onChange={(e) =>
						onUpdate(index, {
							max_marks: parseFloat(e.target.value) || 1,
						})
					}
					onFocus={(e) => e.target.select()}
					className="w-24"
					required
				/>
			</TableCell>

			{/* Optional Checkbox */}
			<TableCell className="text-center">
				<input
					type="checkbox"
					id={`optional-${index}`}
					checked={question.is_optional}
					onChange={(e) =>
						onUpdate(index, {
							is_optional: e.target.checked,
						})
					}
					className="w-4 h-4 cursor-pointer"
				/>
			</TableCell>

			{/* Action Buttons */}
			<TableCell className="text-center">
				<div className="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							onAddSubQuestion(question.question_number)
						}
						className="gap-1"
						title="Add Sub-Question"
					>
						<Plus className="w-3 h-3" />
						Sub-Q
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => onRemove(index)}
						className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
						title="Delete Question"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}
