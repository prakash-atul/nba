import { Separator } from "@/components/ui/separator";
import { School, BarChart3, Info } from "lucide-react";
import type { Test, Course, QuestionResponse } from "@/services/api";

interface AssessmentSummaryPanelProps {
    details: {
        test: Test;
        course: Course;
        questions: QuestionResponse[];
    };
}

export function AssessmentSummaryPanel({ details }: AssessmentSummaryPanelProps) {
    return (
        <div className="p-8 space-y-8">
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
                        <p className="text-base font-semibold">{details.course.course_code}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Course Name
                        </p>
                        <p className="text-base font-semibold">{details.course.course_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                Semester
                            </p>
                            <p className="font-semibold">{details.course.semester}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                Year
                            </p>
                            <p className="font-semibold">{details.course.year}</p>
                        </div>
                    </div>
                </div>
            </section>
            <Separator />
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
                        <p className="text-xl font-bold">{details.test.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                                Full Marks
                            </p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {details.test.full_marks}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                Pass Marks
                            </p>
                            <p className="text-2xl font-bold">{details.test.pass_marks}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Total Questions
                        </p>
                        <p className="text-base font-semibold">{details.questions.length}</p>
                    </div>
                </div>
            </section>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    Review question mappings and mark distributions before finalizing marks entry for this assessment.
                </p>
            </div>
        </div>
    );
}
