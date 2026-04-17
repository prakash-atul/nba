import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { facultyApi } from "@/services/api/faculty";
import type { User, FacultyStats, Course } from "@/services/api";
import { RefreshCw } from "lucide-react";
import {
	StatsGrid,
	QuickAccessGrid,
	
} from "@/features/shared";
import { createFacultyStats } from "@/features/shared/statsFactory";
import { createFacultyQuickAccess } from "@/features/shared/quickAccessFactory";
import { FacultyOverview } from "@/components/faculty";
import { AppHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { usePaginatedData } from "@/lib/usePaginatedData";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function FacultyHome() {
	const navigate = useNavigate();
	const { user, sidebarOpen, setSidebarOpen } = useOutletContext<{
		user: User;
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	const {
		data: courses,
		loading: isLoadingCourses,
		refresh: refreshCourses,
	} = usePaginatedData<Course>({
		fetchFn: facultyApi.getCourses,
		limit: 100,
	});

	const [selectedCourse, setSelectedCourseState] = useState<Course | null>(null);
	const setSelectedCourse = (course: Course | null) => {
		setSelectedCourseState(course);
		if (course) {
			localStorage.setItem("faculty_last_course", String(course.offering_id || course.course_id || ""));
		}
	};
	const [stats, setStats] = useState<FacultyStats>({
		totalCourses: 0,
		totalAssessments: 0,
		totalStudents: 0,
		averageAttainment: 0,
	});
	const [statsLoading, setStatsLoading] = useState(true);

	useEffect(() => {
		loadStats();
	}, []);

	useEffect(() => {
		if (courses.length > 0 && !selectedCourse) {
			let activeCourse = courses.find((c) => c.is_active !== 0) || courses[0];
			const savedCourseId = localStorage.getItem("faculty_last_course");
			
			if (savedCourseId) {
				const foundCourse = courses.find(c => String(c.offering_id || c.course_id) === savedCourseId);
				if (foundCourse) {
					activeCourse = foundCourse;
				}
			}
			setSelectedCourse(activeCourse);
		}
	}, [courses, selectedCourse]);

	const loadStats = async () => {
		setStatsLoading(true);
		try {
			const statsData = await apiService.getFacultyStats();
			setStats(statsData);
		} catch (error) {
			console.error("Failed to load faculty stats:", error);
			setStats({
				totalCourses: courses.length,
				totalAssessments: 0,
				totalStudents: 0,
				averageAttainment: 0,
			});
		} finally {
			setStatsLoading(false);
		}
	};

	const handleRefresh = () => {
		loadStats();
		refreshCourses();
	};

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Faculty Dashboard"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					await apiService.logout();
					window.location.href = "/login";
				}}
			>
				<div className="flex items-center gap-2">
					{courses.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="hidden md:flex"
								>
									{selectedCourse
										? selectedCourse.course_code
										: "Select Course"}
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{courses.map((course) => (
									<DropdownMenuItem
										key={
											course.offering_id ||
											course.course_id
										}
										onClick={() =>
											setSelectedCourse(course)
										}
									>
										{course.course_code} -{" "}
										{course.course_name}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<Button
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						disabled={statsLoading}
					>
						<RefreshCw
							className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
						/>
					</Button>
				</div>
			</AppHeader>

			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Welcome, {user.username}
					</h1>
					<p className="text-muted-foreground">
						{selectedCourse
							? `Currently managing ${selectedCourse.course_name}`
							: "Overview of your assigned courses and student performance."}
					</p>
				</div>

				<StatsGrid
					stats={createFacultyStats(stats)}
					isLoading={statsLoading}
					variant="solid"
					columns={4}
				/>
				<QuickAccessGrid
					items={createFacultyQuickAccess()}
					onItemClick={(nav) => navigate(`/faculty/${nav}`)}
					variant="elevated"
					columns={4}
				/>
				<FacultyOverview
					courses={courses}
					isLoading={isLoadingCourses}
				/>
			</div>
		</div>
	);
}
