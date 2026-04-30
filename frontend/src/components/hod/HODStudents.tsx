import { useState } from "react";
import { hodApi } from "@/services/api/hod";
import { GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacultyStudents } from "@/components/faculty/FacultyStudents";
import { StudentList } from "@/features/users/StudentList";

export function HODStudents() {
const [activeTab, setActiveTab] = useState("department");
const [myCoursesVisited, setMyCoursesVisited] = useState(false);

const handleTabChange = (value: string) => {
setActiveTab(value);
if (value === "my-courses") setMyCoursesVisited(true);
};

return (
<div className="h-full">
<div className="px-6 pt-4 pb-8 space-y-6">
{/* Page header */}
<div className="flex items-center gap-4">
<div className="p-3 rounded-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 ring-1 ring-emerald-500/20">
<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
</div>
<div>
<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
Students
</h2>
<p className="text-sm text-muted-foreground">
Department roster and your course enrollments
</p>
</div>
</div>

<Tabs value={activeTab} onValueChange={handleTabChange}>
<TabsList className="mb-4">
<TabsTrigger value="department" className="gap-2">
Department Students
</TabsTrigger>
<TabsTrigger value="my-courses" className="gap-2">
My Course Students
</TabsTrigger>
</TabsList>

<TabsContent value="department" className="mt-0">
<StudentList
title="All Students"
fetchFn={(params) => hodApi.getDepartmentStudents(params)}
permissions={{
canEdit: true,
canDelete: false,
canViewDepartment: false,
allowDepartmentFilter: false,
}}
availableFilters={["batch", "status", "course"]}
showEnrolledCourses={true}
hideHeader={true}
/>
</TabsContent>
<TabsContent value="my-courses" className="mt-0">
{myCoursesVisited && <FacultyStudents />}
</TabsContent>
</Tabs>
</div>
</div>
);
}
