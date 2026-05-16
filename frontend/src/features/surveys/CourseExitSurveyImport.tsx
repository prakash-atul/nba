import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import { useCSVParser } from "@/features/shared/useCSVParser";
import { debugLogger } from "@/lib/debugLogger";
import type { CourseExitSurveyRow } from "@/services/api";

interface CourseExitSurveyImportProps {
	offeringId: number;
	onImportComplete?: () => void;
}

/* Auto‑detect CO column by looking for "CO1:", "CO2:", etc. in the header. */
function detectCoColumn(
	header: string,
): number | null {
	const m = header.match(/^CO([1-6])[:.\s]/i);
	return m ? parseInt(m[1], 10) : null;
}

export function CourseExitSurveyImport({
	offeringId,
	onImportComplete,
}: CourseExitSurveyImportProps) {
	const { parseCSV, isParsing, error } = useCSVParser<any>();
	const [columnMapping, setColumnMapping] = useState<
		Record<string, number | null>
	>({});
	const [parsedData, setParsedData] = useState<any[] | null>(null);
	const [headers, setHeaders] = useState<string[]>([]);
	const [importing, setImporting] = useState(false);
	const [hasData, setHasData] = useState(false);

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		debugLogger.info("CourseExitSurveyImport", "CSV file selected", {
			name: file.name,
			size: file.size,
		});
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
				debugLogger.info("CourseExitSurveyImport", "CSV parsed", {
					rowCount: data.length,
					detectedHeaders: cols,
					firstRow: data[0],
				});

				// Auto-detect column mapping
				const mapping: Record<string, number | null> = {};
				let foundRollNo = false;
				for (const col of cols) {
					const lower = col.toLowerCase();
					if (
						!foundRollNo &&
						(lower.includes("roll") ||
							lower.includes("student") ||
							lower.includes("id"))
					) {
						mapping[col] = 0; // 0 = student_rollno
						foundRollNo = true;
					} else {
						const co = detectCoColumn(col);
						mapping[col] = co;
					}
				}
				debugLogger.info("CourseExitSurveyImport", "Auto-detected column mapping", {
					mapping,
					rollNoColumn: Object.entries(mapping).find(([, v]) => v === 0)?.[0],
					coColumns: Object.entries(mapping).filter(([, v]) => v !== null && v !== 0).length,
				});
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

		// Find which column maps to rollno (value = 0)
		const rollnoCol = Object.entries(columnMapping).find(
			([, v]) => v === 0,
		)?.[0];
		if (!rollnoCol) {
			toast.error("Please map a column to Student Roll No");
			return;
		}

		const responses: CourseExitSurveyRow[] = [];

		for (const row of parsedData) {
			const rollno = String(row[rollnoCol] ?? "").trim();
			if (!rollno) continue;

			for (const [col, coNum] of Object.entries(columnMapping)) {
				if (coNum === null || coNum === 0) continue; // skip rollno col & unmapped
				const rating = parseInt(row[col], 10);
				if (isNaN(rating) || rating < 1 || rating > 5) continue;

				responses.push({
					student_rollno: rollno,
					co_number: coNum,
					likert_rating: rating,
				});
			}
		}

		if (responses.length === 0) {
			toast.error("No valid responses found in CSV");
			return;
		}

		debugLogger.info("CourseExitSurveyImport", "Preparing to import survey responses", {
			offeringId,
			totalResponses: responses.length,
			uniqueStudents: [...new Set(responses.map((r) => r.student_rollno))].length,
			coDistribution: Object.fromEntries(
				[1, 2, 3, 4, 5, 6].map((n) => [
					`CO${n}`,
					responses.filter((r) => r.co_number === n).length,
				]),
			),
			sampleRow: responses[0],
		});

		setImporting(true);
		try {
			const result = await surveyApi.importCourseExitCsv(offeringId, {
				responses,
			});
			debugLogger.info("CourseExitSurveyImport", "Import completed", {
				imported: result.imported_count,
				errors: result.error_count,
				errorDetails: result.errors,
			});
			toast.success(
				`Imported ${result.imported_count} responses` +
					(result.error_count > 0
						? ` (${result.error_count} errors)`
						: ""),
			);
			setHasData(true);
			onImportComplete?.();
		} catch (err) {
			debugLogger.error("CourseExitSurveyImport", "Import failed", err);
			toast.error("Failed to import survey responses");
		} finally {
			setImporting(false);
		}
	};

	const handleClear = async () => {
		debugLogger.info("CourseExitSurveyImport", "Clearing survey data", { offeringId });
		if (!confirm("Clear all course exit survey data for this offering?"))
			return;
		try {
			await surveyApi.clearCourseExit(offeringId);
			debugLogger.info("CourseExitSurveyImport", "Survey data cleared", { offeringId });
			toast.success("Survey data cleared");
			setHasData(false);
			setParsedData(null);
			onImportComplete?.();
		} catch {
			debugLogger.error("CourseExitSurveyImport", "Failed to clear survey data");
			toast.error("Failed to clear survey data");
		}
	};

	const rollnoCol = Object.entries(columnMapping).find(
		([, v]) => v === 0,
	)?.[0];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Course Exit Survey — Import
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Download your Google Form CSV export and upload it here.
					Columns containing CO numbers (e.g. "CO1: ...") will be
					auto-detected.
				</p>

				{/* File upload */}
				<div>
					<input
						type="file"
						accept=".csv"
						onChange={handleFileSelected}
						className="hidden"
						id="survey-csv-input"
					/>
					<Button
						variant="outline"
						disabled={isParsing}
						onClick={() =>
							document
								.getElementById("survey-csv-input")
								?.click()
						}
					>
						<Upload className="w-4 h-4 mr-2" />
						{isParsing ? "Parsing..." : "Upload CSV"}
					</Button>
					{error && (
						<p className="text-sm text-red-500 mt-1">{error}</p>
					)}
				</div>

				{/* Column mapping */}
				{headers.length > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium">
							Column Mapping
						</h4>
						<div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
							{headers.map((col) => (
								<div
									key={col}
									className="contents"
								>
									<span className="truncate py-1">
										{col}
									</span>
									<select
										className="h-8 rounded border px-2 text-xs"
										value={
											columnMapping[col] !== undefined
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
										{[1, 2, 3, 4, 5, 6].map((n) => (
											<option
												key={n}
												value={String(n)}
											>
												CO{n}
											</option>
										))}
									</select>
								</div>
							))}
						</div>

						<div className="flex gap-2 pt-2">
							<Button
								onClick={handleImport}
								disabled={importing || !rollnoCol}
							>
								{importing
									? "Importing..."
									: "Import Responses"}
							</Button>
							{hasData && (
								<Button
									variant="destructive"
									size="sm"
									onClick={handleClear}
								>
									<Trash2 className="w-4 h-4 mr-1" />
									Clear
								</Button>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
