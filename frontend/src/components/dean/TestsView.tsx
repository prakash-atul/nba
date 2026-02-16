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
import { ClipboardList, Search } from "lucide-react";
import type { DeanTest } from "@/services/api";

interface TestsViewProps {
	tests: DeanTest[];
	isLoading: boolean;
}

export function TestsView({ tests, isLoading }: TestsViewProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");

	// Get unique departments for filter
	const departments = Array.from(
		new Set(tests.map((t) => t.department_code).filter(Boolean)),
	) as string[];

	// Filter tests
	const filteredTests = tests.filter((test) => {
		const matchesSearch =
			test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			test.course_code
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			test.course_name?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesDepartment =
			departmentFilter === "all" ||
			test.department_code === departmentFilter;

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
						<ClipboardList className="w-5 h-5" />
						All Assessments ({filteredTests.length})
					</CardTitle>
					<div className="flex flex-col sm:flex-row gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<Input
								placeholder="Search tests..."
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
								<TableHead>Test Name</TableHead>
								<TableHead>Course</TableHead>
								<TableHead>Faculty</TableHead>
								<TableHead>Department</TableHead>
								<TableHead className="text-center">
									Full Marks
								</TableHead>
								<TableHead className="text-center">
									Pass Marks
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredTests.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8 text-muted-foreground"
									>
										No assessments found
									</TableCell>
								</TableRow>
							) : (
								filteredTests.map((test) => (
									<TableRow key={test.test_id}>
										<TableCell className="font-medium">
											{test.test_name}
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<Badge
													variant="outline"
													className="font-mono w-fit"
												>
													{test.course_code}
												</Badge>
												<span className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
													{test.course_name}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{test.faculty_name || "N/A"}
										</TableCell>
										<TableCell>
											{test.department_code ? (
												<Badge
													variant="secondary"
													className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
												>
													{test.department_code}
												</Badge>
											) : (
												"N/A"
											)}
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant="secondary"
												className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
											>
												{test.full_marks}
											</Badge>
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant="secondary"
												className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
											>
												{test.pass_marks}
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
