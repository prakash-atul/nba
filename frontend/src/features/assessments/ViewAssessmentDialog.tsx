import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetClose,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, X, Printer, Pencil } from "lucide-react";
import { apiService } from "@/services/api";
import type { Test, QuestionResponse, Course } from "@/services/api";
import { AssessmentSummaryPanel } from "./AssessmentSummaryPanel";
import { AssessmentQuestionBreakdown } from "./AssessmentQuestionBreakdown";

interface ViewAssessmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    testId: number | null;
    onGoToMarks?: (test: Test) => void;
}

export interface AssessmentDetails {
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[min(92vw,1000px)] max-w-none sm:max-w-none p-0 flex flex-col gap-0 [&>button]:hidden">
                <SheetTitle className="sr-only">Assessment Details</SheetTitle>
                <SheetDescription className="sr-only">View complete assessment information and question breakdown</SheetDescription>
                
                <div className="px-8 py-6 border-b flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assessment Details</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">View complete assessment information and question breakdown</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Details
                        </Button>
                        <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </SheetClose>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
                                <p className="text-muted-foreground">Loading assessment details...</p>
                            </div>
                        </div>
                    ) : details ? (
                        <>
                            <ScrollArea className="w-2/5 border-r">
                                <AssessmentSummaryPanel details={details} />
                            </ScrollArea>
                            
                            <div className="w-3/5 flex flex-col overflow-hidden">
                                <div className="px-8 pt-8 pb-4 shrink-0">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full" />
                                        Question Breakdown
                                    </h4>
                                </div>
                                <AssessmentQuestionBreakdown questions={details.questions} />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No assessment details available</p>
                            </div>
                        </div>
                    )}
                </div>

                {details && (
                    <div className="px-8 py-4 bg-muted/40 border-t flex justify-between items-center shrink-0">
                        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                            <Printer className="h-4 w-4" />
                            Print Assessment Spec
                        </Button>
                        <div className="flex gap-3">
                            <SheetClose asChild>
                                <Button variant="outline">Close</Button>
                            </SheetClose>
                            <Button className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-90" onClick={() => onGoToMarks?.(details.test)}>
                                Go to Marks Entry
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
