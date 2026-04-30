import { useRef } from "react";
import { toast } from "sonner";

interface ParseError {
	row: number;
	message: string;
}

export interface CSVParseResult {
	headers: string[];
	rows: Record<string, string>[];
	dataStartCol: number;
	originalLines: string[][];
}

interface UseCSVParserOptions {
	onParseSuccess: (result: CSVParseResult) => void;
	onParseError?: (errors: ParseError[]) => void;
}

export function useCSVParser({
	onParseSuccess,
	onParseError,
}: UseCSVParserOptions) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			parseCSV(text);
		};
		reader.onerror = () => {
			toast.error("Failed to read file");
		};
		reader.readAsText(file);

		// Clear input so same file can be uploaded again if needed
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const parseCSV = (text: string) => {
		const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
		if (lines.length < 2) {
			toast.error("CSV file is empty or missing header");
			if (onParseError)
				onParseError([
					{ row: 0, message: "Empty file or missing header" },
				]);
			return;
		}

		const rawHeaders = lines[0].split(",");
		const headers = rawHeaders.map((h) => h.trim().toLowerCase());

		// Determine where marks actually start
		let dataStartCol = 1;
		if (headers.length > 1 && headers[1].includes("name")) {
			dataStartCol = 2;
		} else if (lines.length > 1) {
			const firstData = lines[1].split(",");
			if (firstData.length > 1 && isNaN(parseFloat(firstData[1]))) {
				// second column is string so probably name
				dataStartCol = 2;
			}
		}

		const parsedRows: Record<string, string>[] = [];
		const originalLines: string[][] = [];

		lines.slice(1).forEach((line) => {
			const values = line.split(",").map((v) => v.trim());
			if (values.length < 2) return;
			originalLines.push(values);

			const rowData: Record<string, string> = {};
			// Set rollno as a standard prop
			rowData.rollno = values[0];

			// Map rest by available headers
			values.forEach((v, idx) => {
				const header = headers[idx] || `col_${idx}`;
				rowData[header] = v;
				rowData[`col_${idx}`] = v; // fall-back indexing
			});

			parsedRows.push(rowData);
		});

		onParseSuccess({
			headers,
			rows: parsedRows,
			dataStartCol,
			originalLines,
		});
	};

	const triggerUpload = () => {
		fileInputRef.current?.click();
	};

	return {
		fileInputRef,
		handleFileUpload,
		triggerUpload,
		parseCSV,
	};
}
