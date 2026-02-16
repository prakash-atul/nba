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
import { GraduationCap, Search } from "lucide-react";
import type { DeanStudent } from "@/services/api";

interface StudentsViewProps {
	students: DeanStudent[];
	isLoading: boolean;
}

export function StudentsView({ students, isLoading }: StudentsViewProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");

	// Get unique departments for filter
	const departments = Array.from(
		new Set(students.map((s) => s.department_code).filter(Boolean)),
	) as string[];

	// Filter students
	const filteredStudents = students.filter((student) => {
		const matchesSearch =
			(student.roll_no || "")
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			(student.student_name || "")
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

		const matchesDepartment =
			departmentFilter === "all" ||
			student.department_code === departmentFilter;

		return matchesSearch && matchesDepartment;
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
						<GraduationCap className="w-5 h-5" />
						All Students ({filteredStudents.length})
					</CardTitle>
					<div className="flex flex-col sm:flex-row gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<Input
								placeholder="Search students..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-9 w-full sm:w-[200px]"
							/>
						</div>
						<Select
							value={departmentFilter}
							onValueChange={setDepartmentFilter}
						>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Filter by department" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									All Departments
								</SelectItem>
								{departments.map((dept) => (
									<SelectItem key={dept} value={dept}>
										{dept}
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
								<TableHead>Roll No</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Department</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredStudents.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="text-center py-8 text-muted-foreground"
									>
										No students found
									</TableCell>
								</TableRow>
							) : (
								filteredStudents.map((student) => (
									<TableRow key={student.roll_no}>
										<TableCell>
											<Badge
												variant="outline"
												className="font-mono"
											>
												{student.roll_no}
											</Badge>
										</TableCell>
										<TableCell className="font-medium">
											{student.student_name}
										</TableCell>
										<TableCell>
											<Badge
												variant="secondary"
												className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
											>
												{student.department_code}
											</Badge>
											<span className="ml-2 text-sm text-muted-foreground">
												{student.department_name}
											</span>
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
