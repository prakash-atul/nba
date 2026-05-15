import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import type { CSVParserOptions } from "./useCSVParser";
import { useCSVParser } from "./useCSVParser";

export interface CSVUploaderProps<T> {
	onDataParsed: (data: T[]) => void;
	options?: Omit<
		CSVParserOptions<T>,
		"onParseComplete" | "onParseError" | "onParseStart"
	>;
	buttonText?: string;
	accept?: string;
	isLoading?: boolean;
}

export function CSVUploader<T = any>({
	onDataParsed,
	options,
	buttonText = "Upload CSV",
	accept = ".csv",
	isLoading = false,
}: CSVUploaderProps<T>) {
	const { parseCSV, isParsing, error, setError } = useCSVParser<T>();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		parseCSV(file, {
			...options,
			onParseStart: () => {},
			onParseError: () => {
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			},
			onParseComplete: (data) => {
				onDataParsed(data);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			},
		});
	};

	const handleButtonClick = () => {
		setError(null);
		fileInputRef.current?.click();
	};

	return (
		<div className="flex flex-col gap-2">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept={accept}
				className="hidden"
			/>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					onClick={handleButtonClick}
					disabled={isLoading || isParsing}
				>
					<Upload className="w-4 h-4 mr-2" />
					{isParsing ? "Parsing..." : buttonText}
				</Button>
			</div>
			{error && <p className="text-sm text-red-500">{error}</p>}
		</div>
	);
}
