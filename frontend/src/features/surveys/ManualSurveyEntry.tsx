import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";
import { Save } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import type { CourseSurveyQuestion, SurveyEnrollment } from "@/services/api";

interface ManualSurveyEntryProps {
	offeringId: number;
	onSaved?: () => void;
}

const LIKERT_OPTIONS = [
	{ value: "5", label: "5 - Strongly Agree" },
	{ value: "4", label: "4 - Agree" },
	{ value: "3", label: "3 - Neutral" },
	{ value: "2", label: "2 - Disagree" },
	{ value: "1", label: "1 - Strongly Disagree" },
];

export function ManualSurveyEntry({ offeringId, onSaved }: ManualSurveyEntryProps) {
	const [enrollments, setEnrollments] = useState<SurveyEnrollment[]>([]);
	const [questions, setQuestions] = useState<CourseSurveyQuestion[]>([]);
	const [entries, setEntries] = useState<Record<string, Record<number, string>>>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const hasConfig = questions.length > 0;

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const data = await surveyApi.getCourseExitEnrollments(offeringId);
			setEnrollments(data.enrollments ?? []);
			setQuestions(data.questions ?? []);

			const initial: Record<string, Record<number, string>> = {};
			for (const e of data.enrollments ?? []) {
				initial[e.roll_no] = {};
				for (const q of data.questions ?? []) {
					const qid = q.question_id!;
					const existing = e.responses[qid];
					initial[e.roll_no][qid] = existing !== undefined ? String(existing) : "";
				}
			}
			setEntries(initial);
		} catch {
			toast.error("Failed to load enrollment data");
		} finally {
			setLoading(false);
		}
	}, [offeringId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const updateEntry = (rollNo: string, questionId: number, value: string) => {
		setEntries((prev) => ({
			...prev,
			[rollNo]: { ...prev[rollNo], [questionId]: value },
		}));
	};

	const handleSave = async () => {
		const responses: Array<{ student_rollno: string; question_id: number; likert_rating: number }> = [];
		for (const [rollNo, ratings] of Object.entries(entries)) {
			for (const [qIdStr, val] of Object.entries(ratings)) {
				if (val === "" || val === undefined) continue;
				const num = parseInt(val, 10);
				if (num >= 1 && num <= 5) {
					responses.push({ student_rollno: rollNo, question_id: parseInt(qIdStr), likert_rating: num });
				}
			}
		}

		if (responses.length === 0) {
			toast.error("No entries to save");
			return;
		}

		setSaving(true);
		try {
			const result = await surveyApi.saveManualResponses(offeringId, responses);
			toast.success(`Saved ${result.imported_count} responses`);
			onSaved?.();
		} catch {
			toast.error("Failed to save responses");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="text-muted-foreground p-4">Loading enrollments...</div>;
	}

	if (!hasConfig) {
		return (
			<Card>
				<CardHeader><CardTitle className="text-base">Manual Data Entry</CardTitle></CardHeader>
				<CardContent>
					<p className="text-sm text-amber-600">Configure survey questions first before entering data.</p>
				</CardContent>
			</Card>
		);
	}

	if (enrollments.length === 0) {
		return (
			<Card>
				<CardHeader><CardTitle className="text-base">Manual Data Entry</CardTitle></CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">No students enrolled in this course.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-base font-semibold">Manual Data Entry</CardTitle>
				<Button onClick={handleSave} disabled={saving}>
					<Save className="w-4 h-4 mr-2" />
					{saving ? "Saving..." : "Save All Responses"}
				</Button>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<table className="w-full text-sm whitespace-nowrap">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="text-left py-2 px-3 sticky left-0 bg-muted/50 z-10 dark:bg-muted/50">S.No</th>
							<th className="text-left py-2 px-3 sticky left-10 bg-muted/50 z-10 dark:bg-muted/50">Student</th>
							{questions.map((q) => (
								<th key={q.question_id} className="text-center py-2 px-2 min-w-[120px]">
									<div className="text-xs font-medium">Q{q.question_number}</div>
									<div className="text-[10px] font-normal text-muted-foreground truncate max-w-[120px]">
										{q.question_text.length > 25
											? q.question_text.slice(0, 25) + "..."
											: q.question_text}
									</div>
									<div className="text-[10px] font-normal text-muted-foreground">
										CO{q.co_number} (w={Number(q.mapping_weight).toFixed(1)})
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{enrollments.map((e, idx) => (
							<tr key={e.roll_no} className="border-b last:border-0 hover:bg-muted/10">
								<td className="py-2 px-3 text-muted-foreground text-xs sticky left-0 bg-background z-10">{idx + 1}</td>
								<td className="py-2 px-3 font-medium text-xs sticky left-10 bg-background z-10">
									<div>{e.roll_no}</div>
									<div className="text-muted-foreground font-normal">{e.student_name}</div>
								</td>
								{questions.map((q) => {
									const qid = q.question_id!;
									const val = entries[e.roll_no]?.[qid] ?? "";
									return (
										<td key={qid} className="py-2 px-2 text-center">
											<select
												className="h-8 w-20 rounded-md border border-input bg-background px-1 text-xs text-center shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow]"
												value={val}
												onChange={(ev) => updateEntry(e.roll_no, qid, ev.target.value)}
											>
												<option value="">—</option>
												{LIKERT_OPTIONS.map((opt) => (
													<option key={opt.value} value={opt.value}>{opt.label}</option>
												))}
											</select>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
				<div className="mt-4 flex justify-end">
					<Button onClick={handleSave} disabled={saving}>
						<Save className="w-4 h-4 mr-2" />
						{saving ? "Saving..." : "Save All Responses"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
