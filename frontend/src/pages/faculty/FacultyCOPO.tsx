import { useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { facultyApi } from "@/services/api/faculty";
import { apiService } from "@/services/api";
import type { Course, User } from "@/services/api";
import { FacultyCOPO as COPOComponent } from "@/components/faculty";
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
import { debugLogger } from "@/lib/debugLogger";

export function FacultyCOPO() {
	const { sidebarOpen, setSidebarOpen } = useOutletContext<{
		sidebarOpen: boolean;
		setSidebarOpen: (open: boolean) => void;
	}>();

	debugLogger.info("FacultyCOPO", "Component mounted");

	const [user, setUser] = useState<User | null>(null);
	const [searchParams] = useSearchParams();
	const urlOfferingId = searchParams.get("offering_id");

	debugLogger.debug("FacultyCOPO", "URL parameter", { urlOfferingId });

	const {
		data: courses,
		loading: isLoadingCourses,
		refresh: refreshCourses,
	} = usePaginatedData<Course>({
		fetchFn: facultyApi.getCourses,
		limit: 100,
	});

	debugLogger.debug("FacultyCOPO", "Courses fetch state", {
		loading: isLoadingCourses,
		count: courses.length,
		courses: courses.map(c => ({
			id: c.offering_id,
			code: c.course_code,
			name: c.course_name,
			isActive: c.is_active
		}))
	});

	// Filter out concluded courses for the dropdown only
	const activeCourses = courses.filter(c => c.is_active !== 0);

	debugLogger.debug("FacultyCOPO", "Active courses filtered", {
		totalCourses: courses.length,
		activeCount: activeCourses.length,
		activeCourses: activeCourses.map(c => ({ id: c.offering_id, code: c.course_code }))
	});

	const [selectedCourse, setSelectedCourseState] = useState<Course | null>(null);
	const setSelectedCourse = (course: Course | null) => {
		setSelectedCourseState(course);
		if (course) {
			localStorage.setItem("faculty_last_course", String(course.offering_id || course.course_id || ""));
		}
	};

	useEffect(() => {
		debugLogger.debug("FacultyCOPO", "Loading stored user");
		const storedUser = apiService.getStoredUser();
		if (storedUser) {
			setUser(storedUser);
			debugLogger.info("FacultyCOPO", "User loaded", { username: storedUser.username });
		}
	}, []);

	useEffect(() => {
		debugLogger.debug("FacultyCOPO", "Course selection useEffect triggered", {
			hasUrlOfferingId: !!urlOfferingId,
			coursesCount: courses.length,
			activeCoursesCount: activeCourses.length,
			hasSelectedCourse: !!selectedCourse
		});

		// Handle URL parameter for viewing concluded courses
		if (urlOfferingId && courses.length > 0) {
			debugLogger.debug("FacultyCOPO", "Looking for course from URL", { urlOfferingId });
			const foundCourse = courses.find(
				c => String(c.offering_id || c.course_id) === urlOfferingId
			);
			if (foundCourse) {
				debugLogger.info("FacultyCOPO", "Course found from URL parameter", {
					courseId: foundCourse.offering_id,
					courseCode: foundCourse.course_code
				});
				setSelectedCourse(foundCourse);
				return;
			} else {
				debugLogger.warn("FacultyCOPO", "Course not found from URL parameter", { urlOfferingId });
			}
		}

		if (activeCourses.length > 0 && !selectedCourse) {
			let activeCourse = activeCourses.find((c) => c.is_active !== 0) || activeCourses[0];
			const savedCourseId = localStorage.getItem("faculty_last_course");
			
			debugLogger.debug("FacultyCOPO", "Selecting course", {
				savedCourseId,
				selectedCourseCode: activeCourse?.course_code
			});

			if (savedCourseId) {
				const foundCourse = activeCourses.find(c => String(c.offering_id || c.course_id) === savedCourseId);
				if (foundCourse) {
					activeCourse = foundCourse;
					debugLogger.info("FacultyCOPO", "Restored course from localStorage", {
						courseId: foundCourse.offering_id,
						courseCode: foundCourse.course_code
					});
				}
			}
			setSelectedCourse(activeCourse);
			debugLogger.info("FacultyCOPO", "Course selected", {
				courseId: activeCourse?.offering_id,
				courseCode: activeCourse?.course_code
			});
		}
	}, [courses, activeCourses, selectedCourse, urlOfferingId]);

	return (
		<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
			<AppHeader
				title="CO-PO Mapping"
				sidebarOpen={sidebarOpen}
				onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				onLogout={async () => {
					window.location.href = "/login";
				}}
			>
				<div className="flex items-center gap-2">
					{activeCourses.length > 0 && (
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
								{activeCourses.map((course) => (
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
				{selectedCourse && user ? (
					<COPOComponent
						selectedCourse={selectedCourse}
						user={user}
					/>
				) : (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						{!user
							? "Loading user profile..."
							: "Please select a course to configure mappings."}
					</div>
				)}
			</div>
		</div>
	);
}
