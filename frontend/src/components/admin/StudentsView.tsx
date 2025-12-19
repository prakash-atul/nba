import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import type { Student } from "@/services/api";

interface StudentsViewProps {
	students: Student[];
	refreshing: boolean;
}

export function StudentsView({ students, refreshing }: StudentsViewProps) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold">Students</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All registered students
				</p>
			</div>

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Roll No</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Department</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{refreshing ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="text-center py-8"
									>
										<RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
									</TableCell>
								</TableRow>
							) : students.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="text-center py-8 text-gray-500"
									>
										No students found
									</TableCell>
								</TableRow>
							) : (
								students.map((student) => (
									<TableRow key={student.rollno}>
										<TableCell className="font-medium">
											{student.rollno}
										</TableCell>
										<TableCell>{student.name}</TableCell>
										<TableCell>
											<Badge>
												{student.department_code ||
													student.dept}
											</Badge>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
