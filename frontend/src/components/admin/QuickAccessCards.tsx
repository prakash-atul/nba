import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, FileText } from "lucide-react";
import type { AdminStats } from "@/services/api";

interface QuickAccessCardsProps {
	stats: AdminStats;
	onNavChange: (navId: string) => void;
}

export function QuickAccessCards({
	stats,
	onNavChange,
}: QuickAccessCardsProps) {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card
				className="cursor-pointer hover:shadow-lg transition-shadow"
				onClick={() => onNavChange("users")}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5 text-blue-500" />
						Manage Users
					</CardTitle>
					<CardDescription>
						View, add, or remove system users
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">
						{stats.totalUsers} Users
					</p>
				</CardContent>
			</Card>

			<Card
				className="cursor-pointer hover:shadow-lg transition-shadow"
				onClick={() => onNavChange("courses")}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5 text-purple-500" />
						View Courses
					</CardTitle>
					<CardDescription>
						Browse all courses in the system
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">
						{stats.totalCourses} Courses
					</p>
				</CardContent>
			</Card>

			<Card
				className="cursor-pointer hover:shadow-lg transition-shadow"
				onClick={() => onNavChange("students")}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GraduationCap className="h-5 w-5 text-green-500" />
						View Students
					</CardTitle>
					<CardDescription>
						Browse all registered students
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">
						{stats.totalStudents} Students
					</p>
				</CardContent>
			</Card>

			<Card
				className="cursor-pointer hover:shadow-lg transition-shadow"
				onClick={() => onNavChange("tests")}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-orange-500" />
						View Tests
					</CardTitle>
					<CardDescription>
						Browse all assessments/tests
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-bold">
						{stats.totalAssessments} Tests
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
