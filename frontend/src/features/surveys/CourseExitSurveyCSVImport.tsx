import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import { useCSVParser } from "@/features/shared/useCSVParser";
import type {
	CourseExitSurveyConfig,
	CourseExitSurveyRow,
} from "@/services/api";

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

interface CourseExitSurveyCSVImportProps {
	offeringId: number;
	config: CourseExitSurveyConfig | null;
	onImportComplete: () => void;
}

export function CourseExitSurveyCSVImport({
	offeringId,
	config,
	onImportComplete,
}: CourseExitSurveyCSVImportProps) {
	const { parseCSV, error: parseError } = useCSVParser<any>();
	const [parsedData, setParsedData] = useState<any[] | null>(null);
	const [headers, setHeaders] = useState<string[]>([]);
	const [columnMapping, setColumnMapping] = useState<
		Record<string, number | null>
	>({});
	const [importing, setImporting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !config?.questions?.length) {
			if (!config?.questions?.length)
				toast.error("Configure questions first.");
			return;
		}

		parseCSV(file, {
			requiredHeaders: [],
			onParseComplete: (data: any[]) => {
				if (!data.length) {
					toast.error("CSV is empty");
					return;
				}
				const cols = Object.keys(data[0]);
				setHeaders(cols);
				setParsedData(data);

				const mapping: Record<string, number | null> = {};
				let foundRollNo = false;
				let qIdx = 0;
				for (const col of cols) {
					const lower = col.toLowerCase();
					if (
						!foundRollNo &&
						(lower.includes("roll") ||
							lower.includes("student") ||
							lower.includes("id"))
					) {
						mapping[col] = 0;
						foundRollNo = true;
					} else if (
						qIdx < config.questions.length &&
						lower !== "timestamp"
					) {
						mapping[col] = config.questions[qIdx].question_id!;
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
		setColumnMapping((prev) => ({
			...prev,
			[column]: value === "" ? null : Number(value),
		}));
	};

	const handleImport = async () => {
		if (!parsedData || !columnMapping) return;
		const rollnoCol = Object.entries(columnMapping).find(
			([, v]) => v === 0,
		)?.[0];
		if (!rollnoCol) {
			toast.error("Map a column to Roll No");
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
		if (!responses.length) {
			toast.error("No valid responses");
			return;
		}

		setImporting(true);
		try {
			const result = await surveyApi.importCourseExitCsv(offeringId, {
				responses,
			});
			toast.success(`Imported ${result.imported_count} responses`);
			setParsedData(null);
			onImportComplete();
		} catch {
			toast.error("Import failed");
		} finally {
			setImporting(false);
		}
	};

	const rollnoCol = Object.entries(columnMapping).find(
		([, v]) => v === 0,
	)?.[0];

	return (
		<Card>
			<CardContent className="p-5">
				<div className="flex items-center gap-2 mb-4">
					<Upload className="w-5 h-5 text-primary" />
					<h3 className="font-semibold text-sm">
						Course Exit Survey Integration
					</h3>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv"
					className="hidden"
					onChange={handleFileSelected}
				/>
				{!parsedData ? (
					<div
						className="border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 flex flex-col items-center justify-center p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group"
						onClick={() => fileInputRef.current?.click()}
					>
						<Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary mb-2" />
						<p className="text-sm font-semibold text-foreground">
							Drag and drop CSV uploader
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							or click to browse from your computer
						</p>
					</div>
				) : (
					<div className="space-y-3">
						<p className="text-xs text-muted-foreground">
							{parsedData.length} rows, {headers.length} columns
							parsed. Verify column mapping below.
						</p>
						{parseError && (
							<p className="text-xs text-destructive">
								{parseError}
							</p>
						)}
						<div className="max-h-40 overflow-y-auto space-y-1.5 border rounded-md p-2">
							{headers.map((col) => (
								<div
									key={col}
									className="flex items-center gap-2 text-xs"
								>
									<span className="w-1/3 truncate font-medium">
										{col}
									</span>
									<select
										className="flex-1 h-7 rounded border px-1.5 text-xs"
										value={
											columnMapping[col] !==
												undefined &&
											columnMapping[col] !== null
												? String(columnMapping[col])
												: ""
										}
										onChange={(e) =>
											handleMappingChange(
												col,
												e.target.value,
											)
										}
									>
										<option value="">Skip</option>
										<option value="0">
											Student Roll No
										</option>
										{config?.questions.map((q) => (
											<option
												key={q.question_id}
												value={String(q.question_id)}
											>
												Q{q.question_number}:{" "}
												{q.question_text.substring(
													0,
													24,
												)}
												... (CO{q.co_number})
											</option>
										))}
									</select>
								</div>
							))}
						</div>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={handleImport}
								disabled={importing || !rollnoCol}
							>
								{importing
									? "Importing..."
									: "Import Responses"}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									setParsedData(null);
									setHeaders([]);
								}}
							>
								Cancel
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
