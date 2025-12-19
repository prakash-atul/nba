import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Users, BookOpen, GraduationCap, ClipboardList } from "lucide-react";
import type { AdminStats } from "@/services/api";

interface StatsCardsProps {
	stats: AdminStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white border-0">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium opacity-90">
						Total Users
					</CardTitle>
					<Users className="h-4 w-4 opacity-75" />
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">
						<NumberTicker value={stats.totalUsers} />
					</div>
					<p className="text-xs opacity-75 mt-1">
						All registered users
					</p>
				</CardContent>
			</Card>

			<Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-0">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium opacity-90">
						Total Courses
					</CardTitle>
					<BookOpen className="h-4 w-4 opacity-75" />
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">
						<NumberTicker value={stats.totalCourses} />
					</div>
					<p className="text-xs opacity-75 mt-1">Active courses</p>
				</CardContent>
			</Card>

			<Card className="bg-linear-to-br from-green-500 to-green-600 text-white border-0">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium opacity-90">
						Total Students
					</CardTitle>
					<GraduationCap className="h-4 w-4 opacity-75" />
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">
						<NumberTicker value={stats.totalStudents} />
					</div>
					<p className="text-xs opacity-75 mt-1">Enrolled students</p>
				</CardContent>
			</Card>

			<Card className="bg-linear-to-br from-orange-500 to-orange-600 text-white border-0">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium opacity-90">
						Assessments
					</CardTitle>
					<ClipboardList className="h-4 w-4 opacity-75" />
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">
						<NumberTicker value={stats.totalAssessments} />
					</div>
					<p className="text-xs opacity-75 mt-1">Tests created</p>
				</CardContent>
			</Card>
		</div>
	);
}
