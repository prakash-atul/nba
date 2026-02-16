import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { BookOpen, Search, Users, ClipboardList } from "lucide-react";
import type { DeanCourse } from "@/services/api";

interface CoursesViewProps {
	courses: DeanCourse[];
	isLoading: boolean;
}

export function CoursesView({ courses, isLoading }: CoursesViewProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [yearFilter, setYearFilter] = useState<string>("all");

	// Get unique departments and years for filters
	const departments = Array.from(
		new Set(courses.map((c) => c.department_code).filter(Boolean)),
	) as string[];
	const years = Array.from(new Set(courses.map((c) => c.year))).sort(
		(a, b) => b - a,
	);

	// Filter courses
	const filteredCourses = courses.filter((course) => {
		const matchesSearch =
			course.course_code
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			course.course_name
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			course.faculty_name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase());

		const matchesDepartment =
			departmentFilter === "all" ||
			course.department_code === departmentFilter;
		const matchesYear =
			yearFilter === "all" || course.year.toString() === yearFilter;

		return matchesSearch && matchesDepartment && matchesYear;
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="w-5 h-5" />
						All Courses ({filteredCourses.length})
					</CardTitle>
					<div className="flex flex-col sm:flex-row gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<Input
								placeholder="Search courses..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 w-full sm:w-[200px]"
							/>
						</div>
						<Select
							value={departmentFilter}
							onValueChange={setDepartmentFilter}
						>
							<SelectTrigger className="w-full sm:w-[150px]">
								<SelectValue placeholder="Department" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Depts</SelectItem>
								{departments.map((dept) => (
									<SelectItem key={dept} value={dept}>
										{dept}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={yearFilter}
							onValueChange={setYearFilter}
						>
							<SelectTrigger className="w-full sm:w-[120px]">
								<SelectValue placeholder="Year" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Years</SelectItem>
								{years.map((year) => (
									<SelectItem
										key={year}
										value={year.toString()}
									>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Course Name</TableHead>
								<TableHead>Faculty</TableHead>
								<TableHead>Dept</TableHead>
								<TableHead className="text-center">
									Year
								</TableHead>
								<TableHead className="text-center">
									Sem
								</TableHead>
								<TableHead className="text-center">
									Credit
								</TableHead>
								<TableHead className="text-center">
									<Users className="w-4 h-4 inline mr-1" />
									Enrolled
								</TableHead>
								<TableHead className="text-center">
									<ClipboardList className="w-4 h-4 inline mr-1" />
									Tests
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredCourses.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={9}
										className="text-center py-8 text-muted-foreground"
									>
										No courses found
									</TableCell>
								</TableRow>
							) : (
								filteredCourses.map((course) => (
									<TableRow key={course.course_id}>
										<TableCell>
											<Badge
												variant="outline"
												className="font-mono"
											>
												{course.course_code}
											</Badge>
										</TableCell>
										<TableCell className="font-medium max-w-[200px] truncate">
											{course.course_name}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{course.faculty_name || "N/A"}
										</TableCell>
										<TableCell>
											{course.department_code ? (
												<Badge
													variant="secondary"
													className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
												>
													{course.department_code}
												</Badge>
											) : (
												"N/A"
											)}
										</TableCell>
										<TableCell className="text-center">
											{course.year}
										</TableCell>
										<TableCell className="text-center">
											{course.semester}
										</TableCell>
										<TableCell className="text-center">
											{course.credit}
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant="secondary"
												className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
											>
												{course.enrollment_count}
											</Badge>
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant="secondary"
												className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
											>
												{course.test_count}
											</Badge>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
