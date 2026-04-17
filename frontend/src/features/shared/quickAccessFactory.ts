
import type { QuickAccessItem } from "./QuickAccessCard";
import type { AdminStats } from "@/services/api";
import { Users, BookOpen, GraduationCap, ClipboardList, FileCheck, Network, UserPlus, History } from "lucide-react";

export function createAdminQuickAccess(stats: AdminStats): QuickAccessItem[] {
        return [
                { id: "users", title: "Manage Users", description: "View, add, or remove system users", icon: Users, value: stats.totalUsers + " Users" },
                { id: "courses", title: "View Courses", description: "Browse all courses in the system", icon: BookOpen, value: stats.totalCourses + " Courses" },
                { id: "students", title: "View Students", description: "Browse all registered students", icon: GraduationCap, value: stats.totalStudents + " Students" },
                { id: "logs", title: "Audit Logs", description: "View system-wide activity logs", icon: History },
        ];
}

export function createHODQuickAccess(): QuickAccessItem[] {
        return [
                { id: "courses", title: "Manage Courses", description: "Add, edit, or remove department courses", icon: BookOpen, gradient: "from-emerald-500 to-teal-600" },
                { id: "faculty", title: "Faculty & Staff", description: "Manage department members", icon: Users, gradient: "from-cyan-500 to-blue-600" },
                { id: "students", title: "Students", description: "View and manage department students", icon: GraduationCap, gradient: "from-purple-500 to-pink-600" },
                { id: "logs", title: "Audit Logs", description: "View recent activity logs in your department", icon: History, gradient: "from-blue-500 to-indigo-600" },
        ];
}

export function createFacultyQuickAccess(): QuickAccessItem[] {
        return [
                { id: "assessments", title: "Manage Assessments", description: "Create and manage course assessments", icon: ClipboardList, gradient: "from-blue-500 to-indigo-600" },
                { id: "marks", title: "Enter Marks", description: "Record student assessment scores", icon: FileCheck, gradient: "from-purple-500 to-pink-600" },
                { id: "copo", title: "CO-PO Analysis", description: "View course outcome attainment", icon: Network, gradient: "from-emerald-500 to-teal-600" },
                { id: "logs", title: "Activity Logs", description: "View your recent activity logs", icon: History, gradient: "from-orange-500 to-red-600" },
        ];
}

export function createStaffQuickAccess(): QuickAccessItem[] {
        return [
                { id: "courses", title: "View Courses", description: "Browse all department courses and their details", icon: BookOpen, gradient: "from-blue-500 to-indigo-600" },
                { id: "enrollments", title: "Enroll Students", description: "Add students to courses via CSV upload", icon: UserPlus, gradient: "from-emerald-500 to-teal-600" },
        ];
}
