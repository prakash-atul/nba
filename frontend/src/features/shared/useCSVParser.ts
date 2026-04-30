import { useState } from "react";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";

export interface CSVParserOptions<T> {
	requiredHeaders?: string[];
	transformHeader?: (header: string) => string;
	onParseStart?: () => void;
	onParseComplete?: (data: T[]) => void;
	onParseError?: (error: string) => void;
}

export function useCSVParser<T = any>() {
	const [isParsing, setIsParsing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const parseCSV = (file: File, options?: CSVParserOptions<T>) => {
		setIsParsing(true);
		setError(null);
		options?.onParseStart?.();

		Papa.parse<T>(file, {
			header: true,
			skipEmptyLines: true,
			transformHeader: options?.transformHeader,
			complete: (results: ParseResult<T>) => {
				setIsParsing(false);
				if (results.errors.length > 0) {
					const errorMessage = `Error on row ${results.errors[0].row}: ${results.errors[0].message}`;
					setError(errorMessage);
					options?.onParseError?.(errorMessage);
					return;
				}

				if (options?.requiredHeaders && results.meta.fields) {
					const missingHeaders = options.requiredHeaders.filter(
						(h) => !results.meta.fields?.includes(h),
					);
					if (missingHeaders.length > 0) {
						const errorMessage = `Missing required headers: ${missingHeaders.join(", ")}`;
						setError(errorMessage);
						options?.onParseError?.(errorMessage);
						return;
					}
				}

				options?.onParseComplete?.(results.data);
			},
			error: (err: Error) => {
				setIsParsing(false);
				setError(err.message);
				options?.onParseError?.(err.message);
			},
		});
	};

	return { parseCSV, isParsing, error, setError };
}
