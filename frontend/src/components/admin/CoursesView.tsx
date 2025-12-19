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
import type { AdminCourse } from "@/services/api";

interface CoursesViewProps {
	courses: AdminCourse[];
	refreshing: boolean;
}

export function CoursesView({ courses, refreshing }: CoursesViewProps) {
	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold">Courses</h2>
				<p className="text-gray-500 dark:text-gray-400">
					All courses in the system
				</p>
			</div>

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Credits</TableHead>
								<TableHead>Faculty</TableHead>
								<TableHead>Year</TableHead>
								<TableHead>Semester</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{refreshing ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8"
									>
										<RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
									</TableCell>
								</TableRow>
							) : courses.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8 text-gray-500"
									>
										No courses found
									</TableCell>
								</TableRow>
							) : (
								courses.map((course) => (
									<TableRow key={course.id}>
										<TableCell className="font-medium">
											{course.course_code}
										</TableCell>
										<TableCell>{course.name}</TableCell>
										<TableCell>
											<Badge variant="outline">
												{course.credit}
											</Badge>
										</TableCell>
										<TableCell>
											{course.faculty_name}
										</TableCell>
										<TableCell>{course.year}</TableCell>
										<TableCell>
											<Badge variant="secondary">
												Sem {course.semester}
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
