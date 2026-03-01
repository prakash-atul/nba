import { ClipboardList } from "lucide-react";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { QuestionTableRow } from "./QuestionTableRow";
import type { Question } from "@/services/api";

interface QuestionsTableProps {
	questions: Question[];
	onUpdateQuestion: (index: number, updates: Partial<Question>) => void;
	onRemoveQuestion: (index: number) => void;
	onAddSubQuestion: (questionNumber: number) => void;
}

export function QuestionsTable({
	questions,
	onUpdateQuestion,
	onRemoveQuestion,
	onAddSubQuestion,
}: QuestionsTableProps) {
	if (questions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 px-8 text-center">
				<div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
					<ClipboardList className="w-6 h-6 text-muted-foreground" />
				</div>
				<p className="text-sm font-semibold text-muted-foreground mb-1">
					No questions added yet
				</p>
				<p className="text-xs text-muted-foreground/70">
					Use the button below to add your first question
				</p>
			</div>
		);
	}

	return (
		<Table className="w-full">
			<TableHeader className="bg-slate-50/50 dark:bg-gray-800/50 border-b">
				<TableRow className="hover:bg-transparent">
					<TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 pl-8 w-24 text-left">
						Q. No.
					</TableHead>
					<TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 w-28 text-center">
						Sub-Q
					</TableHead>
					<TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 w-32 text-center">
						CO
					</TableHead>
					<TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 w-36 text-center">
						Max Marks
					</TableHead>
					<TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 w-28 text-center">
						Optional
					</TableHead>
					<TableHead className="text-[10px] font-bold uppercase tracking-wider py-4 pr-8 w-28 text-center">
						Actions
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
				{questions.map((question, index) => (
					<QuestionTableRow
						key={`${question.question_number}-${question.sub_question}-${index}`}
						question={question}
						index={index}
						onUpdate={(updates) => onUpdateQuestion(index, updates)}
						onRemove={() => onRemoveQuestion(index)}
						onAddSubQuestion={() =>
							onAddSubQuestion(question.question_number)
						}
					/>
				))}
			</TableBody>
		</Table>
	);
}
