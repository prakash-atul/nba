import { CourseList } from "@/features/courses/CourseList";
import { adminApi } from "@/services/api/admin";

export function CoursesView() {
    return (
        <CourseList
            title="All Courses"
            fetchFn={(params) => adminApi.getAllCourses(params)}
            permissions={{
                canEdit: true,
                canDelete: true,
                canCreate: true,
                canViewDepartment: true,
                allowDepartmentFilter: true,
                canViewCOPO: false,
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
