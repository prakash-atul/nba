import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { facultyApi } from "@/services/api/faculty";
import type { Course } from "@/services/api";
import { FacultyMarks as MarksComponent } from "@/components/faculty";
import { AppHeader } from "@/components/layout";
import { usePaginatedData } from "@/lib/usePaginatedData";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCw } from "lucide-react";

export function FacultyMarks() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
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

	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

	useEffect(() => {
		if (courses.length > 0 && !selectedCourse) {
			const activeCourse =
				courses.find((c) => c.is_active !== 0) || courses[0];
			setSelectedCourse(activeCourse);
		}
	}, [courses]);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="Marks Entry"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					window.location.href = "/login";
				}}
			>
				<div className="flex items-center gap-2">
					{courses.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
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
						onClick={() => refreshCourses()}
					>
						<RefreshCw
							className={`h-4 w-4 ${isLoadingCourses ? "animate-spin" : ""}`}
						/>
					</Button>
				</div>
			</AppHeader>

			<div className="flex-1 overflow-y-auto p-4 md:p-6 italic">
				{selectedCourse ? (
					<MarksComponent selectedCourse={selectedCourse} />
				) : (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						Please select a course to enter marks.
					</div>
				)}
			</div>
		</div>
	);
}
