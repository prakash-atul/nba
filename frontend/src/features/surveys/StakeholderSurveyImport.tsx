import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";
import { surveyApi } from "@/services/api/surveys";
import { useCSVParser } from "@/features/shared/useCSVParser";

const VALID_STAKEHOLDER_TYPES = [
	"Alumni",
	"Employer",
	"Graduate Exit",
	"Parent",
	"Academic Peer",
] as const;

const PO_PATTERNS = [
	/^PO\s*(\d+)$/i,
	/^P[SO]\s*(\d+)$/i,
	/^PSO\s*(\d+)$/i,
];

function detectPoName(header: string): string | null {
	const trimmed = header.trim();
	for (const pat of PO_PATTERNS) {
		const m = trimmed.match(pat);
		if (m) {
			const prefix = trimmed.toUpperCase().startsWith("PSO") ? "PSO" : "PO";
			return `${prefix}${m[1]}`;
		}
	}
	return null;
}

interface StakeholderSurveyImportProps {
	programmeId: number;
	onImportComplete?: () => void;
}

export function StakeholderSurveyImport({
	programmeId,
	onImportComplete,
}: StakeholderSurveyImportProps) {
	const { parseCSV, isParsing, error } = useCSVParser<any>();
	const [batchYear, setBatchYear] = useState("");
	const [stakeholderType, setStakeholderType] = useState("");
	const [columnMapping, setColumnMapping] = useState<
		Record<string, string | null>
	>({});
	const [parsedData, setParsedData] = useState<any[] | null>(null);
	const [headers, setHeaders] = useState<string[]>([]);
	const [importing, setImporting] = useState(false);
	const [hasData, setHasData] = useState(false);

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
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

				const mapping: Record<string, string | null> = {};
				for (const col of cols) {
					const po = detectPoName(col);
					mapping[col] = po;
				}
				setColumnMapping(mapping);
			},
		});
	};

	const handleMappingChange = (column: string, value: string) => {
		setColumnMapping((prev) => ({
			...prev,
			[column]: value || null,
		}));
	};

	const handleImport = async () => {
		if (!parsedData || !columnMapping) return;
		const year = parseInt(batchYear, 10);
		if (!year || year < 1900 || year > 2100) {
			toast.error("Please enter a valid batch year");
			return;
		}
		if (!stakeholderType) {
			toast.error("Please select a stakeholder type");
			return;
		}

		const responses: Array<{
			po_name: string;
			likert_rating: number;
			respondent_identifier: string | null;
		}> = [];

		for (const row of parsedData) {
			for (const [col, poName] of Object.entries(columnMapping)) {
				if (!poName) continue;
				const raw = row[col];
				const rating = parseInt(raw, 10);
				if (isNaN(rating) || rating < 1 || rating > 5) continue;

				responses.push({
					po_name: poName,
					likert_rating: rating,
					respondent_identifier: null,
				});
			}
		}

		if (responses.length === 0) {
			toast.error("No valid Likert ratings (1-5) found in mapped columns");
			return;
		}

		setImporting(true);
		try {
			const result = await surveyApi.importStakeholderCsv(programmeId, {
				batch_year: year,
				stakeholder_type: stakeholderType,
				responses,
			});
			toast.success(
				`Imported ${result.imported_count} responses` +
					(result.error_count > 0
						? ` (${result.error_count} errors)`
						: ""),
			);
			setHasData(true);
			onImportComplete?.();
		} catch {
			toast.error("Failed to import stakeholder survey");
		} finally {
			setImporting(false);
		}
	};

	const handleClear = async () => {
		const year = parseInt(batchYear, 10);
		if (!confirm("Clear all stakeholder survey data for this programme/batch?"))
			return;
		try {
			await surveyApi.clearStakeholder(programmeId, year, stakeholderType || undefined);
			toast.success("Stakeholder survey data cleared");
			setHasData(false);
			setParsedData(null);
			onImportComplete?.();
		} catch {
			toast.error("Failed to clear stakeholder data");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Stakeholder Survey — Import
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Upload a CSV export from Google Forms. PO/PSO columns (e.g. "PO1",
					"PSO1") are auto-detected. Each row = one respondent.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label htmlFor="stk-batch">Batch Year</Label>
						<Input
							id="stk-batch"
							value={batchYear}
							onChange={(e) => setBatchYear(e.target.value)}
							placeholder="e.g. 2022"
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="stk-type">Stakeholder Type</Label>
						<select
							id="stk-type"
							className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
							value={stakeholderType}
							onChange={(e) => setStakeholderType(e.target.value)}
						>
							<option value="">Select type...</option>
							{VALID_STAKEHOLDER_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<input
						type="file"
						accept=".csv"
						onChange={handleFileSelected}
						className="hidden"
						id="stk-csv-input"
					/>
					<Button
						variant="outline"
						disabled={isParsing}
						onClick={() =>
							document.getElementById("stk-csv-input")?.click()
						}
					>
						<Upload className="w-4 h-4 mr-2" />
						{isParsing ? "Parsing..." : "Upload CSV"}
					</Button>
					{error && (
						<p className="text-sm text-red-500 mt-1">{error}</p>
					)}
				</div>

				{headers.length > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium">Column Mapping</h4>
						<div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
							{headers.map((col) => (
								<div key={col} className="contents">
									<span className="truncate py-1">{col}</span>
									<select
										className="h-8 rounded border px-2 text-xs"
										value={columnMapping[col] ?? ""}
										onChange={(e) =>
											handleMappingChange(col, e.target.value)
										}
									>
										<option value="">Skip</option>
										{Array.from(
											new Set(
												Object.values(columnMapping).filter(
													(v): v is string => v !== null,
												),
											),
										).length === 0 ||
										!columnMapping[col] ? (
											<>
												{[...Array(12)].map((_, i) => (
													<option key={`PO${i + 1}`} value={`PO${i + 1}`}>
														PO{i + 1}
													</option>
												))}
												{[...Array(3)].map((_, i) => (
													<option
														key={`PSO${i + 1}`}
														value={`PSO${i + 1}`}
													>
														PSO{i + 1}
													</option>
												))}
											</>
										) : (
											<>
												{[...Array(12)].map((_, i) => (
													<option key={`PO${i + 1}`} value={`PO${i + 1}`}>
														PO{i + 1}
													</option>
												))}
												{[...Array(3)].map((_, i) => (
													<option
														key={`PSO${i + 1}`}
														value={`PSO${i + 1}`}
													>
														PSO{i + 1}
													</option>
												))}
											</>
										)}
									</select>
								</div>
							))}
						</div>

						<div className="flex gap-2 pt-2">
							<Button
								onClick={handleImport}
								disabled={
									importing ||
									!batchYear ||
									!stakeholderType ||
									!Object.values(columnMapping).some(
										(v) => v !== null,
									)
								}
							>
								{importing ? "Importing..." : "Import Responses"}
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
