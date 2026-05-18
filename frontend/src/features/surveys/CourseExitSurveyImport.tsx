import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import { useCSVParser } from "@/features/shared/useCSVParser";
import { debugLogger } from "@/lib/debugLogger";
import type { CourseExitSurveyRow, CourseExitSurveyConfig } from "@/services/api";

interface CourseExitSurveyImportProps {
	offeringId: number;
	onImportComplete?: () => void;
}

const LIKERT_TEXT_MAP: Record<string, number> = {
	"strongly agree": 5,
	agree: 4,
	neutral: 3,
	disagree: 2,
	"strongly disagree": 1,
};

function parseLikertValue(raw: unknown): number | null {
	if (raw === undefined || raw === null) return null;
	if (typeof raw === "number" && raw >= 1 && raw <= 5) return raw;
	const s = String(raw).trim().toLowerCase();
	if (s === "") return null;
	const n = parseInt(s, 10);
	if (!isNaN(n) && n >= 1 && n <= 5) return n;
	const mapped = LIKERT_TEXT_MAP[s];
	if (mapped !== undefined) return mapped;
	return null;
}

export function CourseExitSurveyImport({
	offeringId,
	onImportComplete,
}: CourseExitSurveyImportProps) {
	const { parseCSV, isParsing, error } = useCSVParser<any>();
	const [config, setConfig] = useState<CourseExitSurveyConfig | null>(null);
	const [loadingConfig, setLoadingConfig] = useState(true);
	
	const [columnMapping, setColumnMapping] = useState<Record<string, number | null>>({});
	const [parsedData, setParsedData] = useState<any[] | null>(null);
	const [headers, setHeaders] = useState<string[]>([]);
	const [importing, setImporting] = useState(false);

	useEffect(() => {
		loadConfig();
	}, [offeringId]);

	const loadConfig = async () => {
		setLoadingConfig(true);
		try {
			const data = await surveyApi.getCourseExitSurvey(offeringId);
			setConfig(data);
		} catch (err) {
			debugLogger.error("CourseExitSurveyImport", "Failed to load config", err);
		} finally {
			setLoadingConfig(false);
		}
	};

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		
		if (!config || !config.questions || config.questions.length === 0) {
			toast.error("Please configure survey questions first.");
			return;
		}

		parseCSV(file, {
			requiredHeaders: [],
			onParseComplete: (data: any[]) => {
				if (data.length === 0) {
					toast.error("CSV file is empty");
					return;
				}
				const cols = Object.keys(data[0]);
				setHeaders(cols);
				setParsedData(data);
				
				// Auto-map chronologically. Skip rollno column, then map questions 1..N
				const mapping: Record<string, number | null> = {};
				let foundRollNo = false;
				let qIdx = 0;
				
				for (const col of cols) {
					const lower = col.toLowerCase();
					if (!foundRollNo && (lower.includes("roll") || lower.includes("student") || lower.includes("id"))) {
						mapping[col] = 0; // 0 = rollno
						foundRollNo = true;
					} else if (qIdx < config.questions.length && lower !== 'timestamp') {
						mapping[col] = config.questions[qIdx].question_id!; // mapping value is question_id
						qIdx++;
					} else {
						mapping[col] = null;
					}
				}
				
				setColumnMapping(mapping);
			},
		});
	};

	const handleMappingChange = (column: string, value: string) => {
		const num = value === "" ? null : Number(value);
		setColumnMapping((prev) => ({ ...prev, [column]: num }));
	};

	const handleImport = async () => {
		if (!parsedData || !columnMapping) return;

		const rollnoCol = Object.entries(columnMapping).find(([, v]) => v === 0)?.[0];
		if (!rollnoCol) {
			toast.error("Please map a column to Student Roll No");
			return;
		}

		const responses: CourseExitSurveyRow[] = [];

		for (const row of parsedData) {
			const rollno = String(row[rollnoCol] ?? "").trim();
			if (!rollno) continue;

			for (const [col, questionId] of Object.entries(columnMapping)) {
				if (questionId === null || questionId === 0) continue;
				const rating = parseLikertValue(row[col]);
				if (rating === null) continue;

				responses.push({
					student_rollno: rollno,
					question_id: questionId,
					likert_rating: rating,
				});
			}
		}

		if (responses.length === 0) {
			toast.error("No valid responses found in CSV");
			return;
		}

		setImporting(true);
		try {
			const result = await surveyApi.importCourseExitCsv(offeringId, { responses });
			toast.success(`Imported ${result.imported_count} responses`);
			setParsedData(null);
			onImportComplete?.();
		} catch (err) {
			toast.error("Failed to import survey responses");
		} finally {
			setImporting(false);
		}
	};

	const rollnoCol = Object.entries(columnMapping).find(([, v]) => v === 0)?.[0];

	if (loadingConfig) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Import CSV Responses</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Upload a Google Forms CSV export. Columns will be auto-mapped chronologically to the questions configured above.
				</p>

				<div>
					<input type="file" accept=".csv" onChange={handleFileSelected} className="hidden" id="survey-csv-input" />
					<Button variant="outline" disabled={isParsing || !config || !config.questions} onClick={() => document.getElementById("survey-csv-input")?.click()}>
						<Upload className="w-4 h-4 mr-2" />
						{isParsing ? "Parsing..." : "Upload CSV"}
					</Button>
					{(!config || !config.questions || config.questions.length === 0) && (
						<p className="text-sm text-amber-600 mt-2">Configure questions first before importing.</p>
					)}
					{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
				</div>

				{headers.length > 0 && config && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium">Column Mapping Verification</h4>
						<div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
							{headers.map((col) => (
								<div key={col} className="contents">
									<span className="truncate py-1">{col}</span>
									<select
										className="h-8 rounded border px-2 text-xs max-w-[200px] truncate"
										value={columnMapping[col] !== undefined && columnMapping[col] !== null ? String(columnMapping[col]) : ""}
										onChange={(e) => handleMappingChange(col, e.target.value)}
									>
										<option value="">Skip</option>
										<option value="0">Student Roll No</option>
										{config.questions.map((q) => (
											<option key={q.question_id} value={String(q.question_id)}>
												Q{q.question_number}: {q.question_text.substring(0, 30)}... (CO{q.co_number})
											</option>
										))}
									</select>
								</div>
							))}
						</div>

						<div className="flex gap-2 pt-2">
							<Button onClick={handleImport} disabled={importing || !rollnoCol}>
								{importing ? "Importing..." : "Import Responses"}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
