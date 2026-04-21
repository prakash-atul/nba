import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentMark {
	student_id: string;
	student_name: string;
	CO1: string | number;
	CO2: string | number;
	CO3: string | number;
	CO4: string | number;
	CO5: string | number;
	CO6: string | number;
}

interface StudentMarksTableProps {
	marks: StudentMark[];
	passMarks?: number;
	loading?: boolean;
}

export function StudentMarksTable({
	marks,
	loading = false,
}: StudentMarksTableProps) {
	if (loading) {
		return (
			<div className="space-y-2">
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className="h-12 w-full" />
				))}
			</div>
		);
	}

	if (!marks || marks.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">No marks data available</p>
			</div>
		);
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="font-semibold text-left">
							Student ID
						</TableHead>
						<TableHead className="font-semibold text-left">
							Student Name
						</TableHead>
						<TableHead className="text-center font-semibold">
							CO1
						</TableHead>
						<TableHead className="text-center font-semibold">
							CO2
						</TableHead>
						<TableHead className="text-center font-semibold">
							CO3
						</TableHead>
						<TableHead className="text-center font-semibold">
							CO4
						</TableHead>
						<TableHead className="text-center font-semibold">
							CO5
						</TableHead>
						<TableHead className="text-center font-semibold">
							CO6
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{marks.map((mark, idx) => (
						<TableRow
							key={`${mark.student_id}-${idx}`}
							className="hover:bg-muted/50 transition-colors"
						>
							<TableCell className="font-mono text-sm text-left">
								{mark.student_id}
							</TableCell>
							<TableCell className="font-medium text-left max-w-[180px] truncate">
								{mark.student_name}
							</TableCell>
							<TableCell className="text-center">
								{mark.CO1}
							</TableCell>
							<TableCell className="text-center">
								{mark.CO2}
							</TableCell>
							<TableCell className="text-center">
								{mark.CO3}
							</TableCell>
							<TableCell className="text-center">
								{mark.CO4}
							</TableCell>
							<TableCell className="text-center">
								{mark.CO5}
							</TableCell>
							<TableCell className="text-center">
								{mark.CO6}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
