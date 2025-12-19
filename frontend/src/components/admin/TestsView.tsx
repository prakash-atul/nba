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
import type { AdminTest } from "@/services/api";

interface TestsViewProps {
	tests: AdminTest[];
	refreshing: boolean;
}

export function TestsView({ tests, refreshing }: TestsViewProps) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold">Tests / Assessments</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All tests and assessments in the system
				</p>
			</div>

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Test Name</TableHead>
								<TableHead>Course</TableHead>
								<TableHead>Full Marks</TableHead>
								<TableHead>Pass Marks</TableHead>
								<TableHead>Year</TableHead>
								<TableHead>Semester</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{refreshing ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-center py-8"
									>
										<RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
									</TableCell>
								</TableRow>
							) : tests.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-center py-8 text-gray-500"
									>
										No tests found
									</TableCell>
								</TableRow>
							) : (
								tests.map((test) => (
									<TableRow key={test.id}>
										<TableCell className="font-medium">
											{test.id}
										</TableCell>
										<TableCell>{test.name}</TableCell>
										<TableCell>
											<div>
												<span className="font-medium">
													{test.course_code}
												</span>
												<span className="block text-xs text-gray-500">
													{test.course_name}
												</span>
											</div>
										</TableCell>
										<TableCell>{test.full_marks}</TableCell>
										<TableCell>{test.pass_marks}</TableCell>
										<TableCell>{test.year}</TableCell>
										<TableCell>
											<Badge variant="secondary">
												Sem {test.semester}
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
