import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";

interface StudentEntry {
	rollno: string;
	name: string;
}

interface StudentPreviewTableProps {
	students: StudentEntry[];
}

export function StudentPreviewTable({ students }: StudentPreviewTableProps) {
	if (students.length === 0) return null;

	return (
		<div className="space-y-2">
			<Label>Preview ({students.length} students)</Label>
			<div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-[250px] overflow-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Roll No</TableHead>
							<TableHead>Name</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{students.map((student, index) => (
							<TableRow key={index}>
								<TableCell>{student.rollno}</TableCell>
								<TableCell>{student.name}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
