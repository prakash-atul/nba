import { StudentList } from "@/features/users/StudentList";
import { deanApi } from "@/services/api/dean";

export function StudentsView() {
return (
<StudentList
title="All Students"
fetchFn={(params) => deanApi.getAllStudents(params) as any}
permissions={{
canEdit: false,
canDelete: false,
canViewDepartment: true,
allowDepartmentFilter: true,
}}
availableFilters={["department", "batch", "status", "course"]}
showEnrolledCourses={true}
/>
);
}
