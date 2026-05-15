// This file has been moved to utils.tsx
// Re-exporting for backward compatibility
export {
	getStatusVariant,
	createSortableHeader,
	createStudentColumns,
	type StudentListColumnConfig,
} from "./utils.tsx";
export const getRoleBadgeColor = (role: string) => {
switch (role.toLowerCase()) {
case "admin":
return "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
case "dean":
return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800";
case "hod":
return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
case "faculty":
return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800";
case "staff":
return "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800";
default:
return "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800";
}
};
