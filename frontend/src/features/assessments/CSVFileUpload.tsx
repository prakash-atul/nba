import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import type { RefObject } from "react";

interface CSVFileUploadProps {
	fileInputRef: RefObject<HTMLInputElement | null>;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	uploading: boolean;
	enrolling: boolean;
}

export function CSVFileUpload({
	fileInputRef,
	onFileChange,
	uploading,
	enrolling,
}: CSVFileUploadProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor="csv-file">Upload CSV File</Label>
			<div className="flex gap-2">
				<Input
					id="csv-file"
					ref={fileInputRef}
					type="file"
					accept=".csv"
					onChange={onFileChange}
					disabled={uploading || enrolling}
					className="flex-1"
				/>
				<Button
					type="button"
					variant="outline"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading || enrolling}
				>
					<Upload className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
