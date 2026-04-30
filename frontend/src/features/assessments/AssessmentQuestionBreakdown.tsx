import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuestionResponse } from "@/services/api";

interface AssessmentQuestionBreakdownProps {
    questions: QuestionResponse[];
}

export function AssessmentQuestionBreakdown({ questions }: AssessmentQuestionBreakdownProps) {
    const groupedQuestions = questions.reduce((acc, q) => {
        const key = q.question_number;
        if (!acc[key]) acc[key] = [];
        acc[key].push(q);
        return acc;
    }, {} as Record<number, QuestionResponse[]>);

    return (
        <div className="flex-1 overflow-auto">
            <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                    <TableRow>
                        <TableHead className="text-[10px] uppercase tracking-widest">Q. No.</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest">Sub</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest">CO</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-center">Max Marks</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-center">Optional</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.keys(groupedQuestions)
                        .sort((a, b) => Number(a) - Number(b))
                        .map((qNum) => (
                            <Fragment key={qNum}>
                                {groupedQuestions[Number(qNum)].map((q, idx) => (
                                    <TableRow key={q.id} className="hover:bg-muted/40">
                                        <TableCell className="font-mono font-semibold">
                                            {idx === 0 ? q.question_number : ""}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {q.sub_question || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                                                CO{q.co}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                            {q.max_marks}
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
    );
}
