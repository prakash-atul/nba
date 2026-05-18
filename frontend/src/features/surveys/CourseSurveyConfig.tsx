import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import type { CourseSurveyQuestion } from "@/services/api";

interface CourseSurveyConfigProps {
	offeringId: number;
	onConfigSaved?: () => void;
}

export function CourseSurveyConfig({ offeringId, onConfigSaved }: CourseSurveyConfigProps) {
	const [questions, setQuestions] = useState<CourseSurveyQuestion[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadSurvey();
	}, [offeringId]);

	const loadSurvey = async () => {
		setLoading(true);
		try {
			const data = await surveyApi.getCourseExitSurvey(offeringId);
			if (data && data.questions && data.questions.length > 0) {
				setQuestions(data.questions);
			} else {
				// Default template: 1 question per CO
				setQuestions([
					{ question_number: 1, question_text: "Rate your attainment for CO1", co_number: 1, mapping_weight: 1.0 },
					{ question_number: 2, question_text: "Rate your attainment for CO2", co_number: 2, mapping_weight: 1.0 },
					{ question_number: 3, question_text: "Rate your attainment for CO3", co_number: 3, mapping_weight: 1.0 },
					{ question_number: 4, question_text: "Rate your attainment for CO4", co_number: 4, mapping_weight: 1.0 },
					{ question_number: 5, question_text: "Rate your attainment for CO5", co_number: 5, mapping_weight: 1.0 },
					{ question_number: 6, question_text: "Rate your attainment for CO6", co_number: 6, mapping_weight: 1.0 },
				]);
			}
		} catch (err) {
			toast.error("Failed to load survey configuration");
		} finally {
			setLoading(false);
		}
	};

	const addQuestion = () => {
		const nextNum = questions.length > 0 ? Math.max(...questions.map(q => q.question_number)) + 1 : 1;
		setQuestions([
			...questions,
			{ question_number: nextNum, question_text: "", co_number: 1, mapping_weight: 1.0 }
		]);
	};

	const removeQuestion = (idx: number) => {
		const newQ = [...questions];
		newQ.splice(idx, 1);
		// renumber
		setQuestions(newQ.map((q, i) => ({ ...q, question_number: i + 1 })));
	};

	const updateQuestion = (idx: number, field: keyof CourseSurveyQuestion, value: any) => {
		const newQ = [...questions];
		newQ[idx] = { ...newQ[idx], [field]: value };
		setQuestions(newQ);
	};

	const handleSave = async () => {
		for (const q of questions) {
			if (!q.question_text.trim()) {
				toast.error(`Question ${q.question_number} is missing text`);
				return;
			}
			if (q.mapping_weight < 0 || q.mapping_weight > 1) {
				toast.error(`Question ${q.question_number} mapping weight must be between 0.0 and 1.0`);
				return;
			}
		}

		setSaving(true);
		try {
			await surveyApi.saveCourseExitQuestions(offeringId, questions);
			toast.success("Survey questions configured successfully");
			onConfigSaved?.();
		} catch (err) {
			toast.error("Failed to save configuration");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="text-muted-foreground p-4">Loading configuration...</div>;
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-base font-semibold">Survey Integration Console</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Define the questions for this course's exit survey. The chronological order below corresponds to the column order in your Google Forms CSV export.
				</p>

				<div className="space-y-2 border rounded-md p-4 bg-muted/20">
					<div className="grid grid-cols-[auto_1fr_80px_100px_auto] gap-4 items-center font-medium text-sm text-muted-foreground mb-2">
						<div className="w-8 text-center">#</div>
						<div>Question Text</div>
						<div className="text-center">Map to CO</div>
						<div className="text-center">Weight</div>
						<div className="w-8"></div>
					</div>
					
					{questions.map((q, idx) => (
						<div key={idx} className="grid grid-cols-[auto_1fr_80px_100px_auto] gap-4 items-start">
							<div className="w-8 text-center pt-2 font-medium">{q.question_number}</div>
							<div>
								<Input 
									value={q.question_text} 
									onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
									placeholder="Question text..."
								/>
							</div>
							<div>
								<select 
									className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
									value={q.co_number}
									onChange={(e) => updateQuestion(idx, 'co_number', parseInt(e.target.value))}
								>
									{[1,2,3,4,5,6].map(n => <option key={n} value={n}>CO{n}</option>)}
								</select>
							</div>
							<div>
								<Input 
									type="number"
									step="0.1"
									min="0"
									max="1"
									value={q.mapping_weight}
									onChange={(e) => updateQuestion(idx, 'mapping_weight', parseFloat(e.target.value))}
								/>
							</div>
							<div className="pt-0.5">
								<Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeQuestion(idx)}>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>

				<div className="flex gap-2 justify-between">
					<Button variant="outline" size="sm" onClick={addQuestion}>
						<Plus className="w-4 h-4 mr-2" /> Add Question
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
