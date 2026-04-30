/**
 * Stats Factory - Unified mapping of API stats to UI StatItem configurations
 * Reduces duplication across role-specific dashboard components
 */

import type { StatItem } from "./StatsCard";
import {
	Users,
	BookOpen,
	GraduationCap,
	ClipboardList,
	TrendingUp,
	Building,
} from "lucide-react";

/**
 * Create stat items for Admin dashboard
 */
export function createAdminStats(stats: {
	totalUsers: number;
	totalCourses: number;
	totalStudents: number;
	totalAssessments: number;
}): StatItem[] {
	return [
		{
			label: "Total Users",
			value: stats.totalUsers,
			icon: Users,
			gradient: "from-blue-500 to-blue-600",
			description: "All registered users",
		},
		{
			label: "Total Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			gradient: "from-purple-500 to-purple-600",
			description: "Active courses",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			gradient: "from-green-500 to-green-600",
			description: "Enrolled students",
		},
		{
			label: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
			gradient: "from-orange-500 to-orange-600",
			description: "Tests created",
		},
	];
}

/**
 * Create stat items for HOD dashboard
 */
export function createHODStats(stats: {
	totalCourses: number;
	totalFaculty: number;
	totalStudents: number;
	totalAssessments: number;
}): StatItem[] {
	return [
		{
			label: "Department Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			bgGradient:
				"from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30",
			description: "Active courses",
		},
		{
			label: "Faculty Members",
			value: stats.totalFaculty,
			icon: Users,
			bgGradient:
				"from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30",
			description: "Teaching staff",
		},
		{
			label: "Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			bgGradient:
				"from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30",
			description: "Enrolled",
		},
		{
			label: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
			bgGradient:
				"from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30",
			description: "Tests",
		},
	];
}

/**
 * Create stat items for Faculty dashboard
 */
export function createFacultyStats(stats: {
	totalCourses: number;
	totalAssessments: number;
	totalStudents: number;
	averageAttainment: number;
}): StatItem[] {
	return [
		{
			label: "My Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			bgGradient:
				"from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30",
			description: "Teaching",
		},
		{
			label: "Assessments Created",
			value: stats.totalAssessments,
			icon: ClipboardList,
			bgGradient:
				"from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30",
			description: "Tests",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			bgGradient:
				"from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30",
			description: "Enrolled",
		},
		{
			label: "Avg. Attainment",
			value: stats.averageAttainment,
			icon: TrendingUp,
			bgGradient:
				"from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30",
			description: "Performance",
			suffix: "%",
		},
	];
}

/**
 * Create stat items for Dean dashboard
 */
export function createDeanStats(stats: {
	totalDepartments: number;
	totalUsers: number;
	totalCourses: number;
	totalStudents: number;
	totalAssessments: number;
}): StatItem[] {
	return [
		{
			label: "Departments",
			value: stats.totalDepartments,
			icon: Building,
			color: "text-blue-500",
			bgColor: "bg-blue-50 dark:bg-blue-950",
			description: "Active departments",
		},
		{
			label: "Total Users",
			value: stats.totalUsers,
			icon: Users,
			color: "text-purple-500",
			bgColor: "bg-purple-50 dark:bg-purple-950",
			description: "All users",
		},
		{
			label: "Total Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			color: "text-green-500",
			bgColor: "bg-green-50 dark:bg-green-950",
			description: "Active courses",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			color: "text-orange-500",
			bgColor: "bg-orange-50 dark:bg-orange-950",
			description: "Enrolled",
		},
		{
			label: "Assessments",
			value: stats.totalAssessments,
			icon: ClipboardList,
			color: "text-pink-500",
			bgColor: "bg-pink-50 dark:bg-pink-950",
			description: "Tests",
		},
	];
}

/**
 * Create stat items for Staff dashboard
 */
export function createStaffStats(stats: {
	totalCourses: number;
	totalStudents: number;
	totalEnrollments: number;
}): StatItem[] {
	return [
		{
			label: "Total Courses",
			value: stats.totalCourses,
			icon: BookOpen,
			bgGradient:
				"from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30",
			description: "Available courses",
		},
		{
			label: "Total Students",
			value: stats.totalStudents,
			icon: GraduationCap,
			bgGradient:
				"from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30",
			description: "Enrolled",
		},
		{
			label: "Total Enrollments",
			value: stats.totalEnrollments,
			icon: Users,
			bgGradient:
				"from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30",
			description: "Course registrations",
		},
	];
}
