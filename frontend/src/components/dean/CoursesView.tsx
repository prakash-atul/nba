import { CourseList } from "@/features/courses/CourseList";
import { deanApi } from "@/services/api/dean";

export function CoursesView() {
    return (
        <CourseList
            title="All Courses"
            fetchFn={(params) => deanApi.getAllCourses(params) as any}
            permissions={{
                canEdit: false,
                canDelete: false,
                canCreate: false,
                canViewDepartment: true,
                allowDepartmentFilter: true,
                canViewCOPO: true,
            }}
            availableFilters={["department", "year", "semester", "status"]}
            showFaculty={true}
            showYear={true}
            showSemester={true}
            showDepartment={true}
            showCredits={true}
            showLevel={true}
            showType={true}
        />
    );
}
