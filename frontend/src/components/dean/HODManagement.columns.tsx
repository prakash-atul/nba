import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import type { DeanDepartment, HODHistoryRecord } from "@/services/api";
import { sortableHeader } from "../../features/shared/tableUtils";

interface StatusColumnProps {
	onAppointClick: (dept: DeanDepartment) => void;
	onDemoteClick: (dept: DeanDepartment) => void;
}

export function getStatusColumns({
	onAppointClick,
	onDemoteClick,
}: StatusColumnProps): ColumnDef<DeanDepartment>[] {
	return [
		{
			accessorKey: "department_code",
			header: sortableHeader("Code"),
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
				>
					{row.getValue("department_code")}
				</Badge>
			),
		},
		{
			accessorKey: "department_name",
			header: sortableHeader("Department"),
			cell: ({ row }) => (
				<div className="font-medium flex">
					{row.getValue("department_name")}
				</div>
			),
		},
		{
			accessorKey: "hod_name",
			header: "Serving HOD",
			cell: ({ row }) => {
				const hod = row.getValue("hod_name") as string;
				return hod ? (
					<Badge
						variant="secondary"
						className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
					>
						{hod}
					</Badge>
				) : (
					<Badge
						variant="secondary"
						className="bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300 border-gray-200 dark:border-gray-800"
					>
						No HOD
					</Badge>
				);
			},
		},
		{
			accessorKey: "faculty_count",
			header: sortableHeader("Faculty Count"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2 ml-4">
					<Users className="w-4 h-4 text-muted-foreground" />
					{row.getValue("faculty_count")}
				</div>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const dept = row.original;
				return (
					<div className="text-right">
						{dept.hod_name ? (
							<Button
								size="sm"
								variant="outline"
								onClick={() => onDemoteClick(dept)}
							>
								Replace Serving HOD
							</Button>
						) : (
							<Button
								size="sm"
								onClick={() => onAppointClick(dept)}
							>
								<UserPlus className="w-4 h-4 mr-2" />
								Record Serving HOD
							</Button>
						)}
					</div>
				);
			},
		},
	];
}

export function getHistoryColumns(): ColumnDef<HODHistoryRecord>[] {
	return [
		{
			accessorKey: "department_code",
			header: "Dept",
			cell: ({ row }) => (
				<Badge
					variant="secondary"
					className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
				>
					{row.getValue("department_code")}
				</Badge>
			),
		},
		{
			accessorKey: "username",
			header: sortableHeader("Faculty Name"),
			cell: ({ row }) => (
				<div className="font-medium">
					{row.getValue("username")}
					<div className="text-xs text-muted-foreground font-normal">
						{(row.original as HODHistoryRecord).email}
					</div>
				</div>
			),
		},
		{
			accessorKey: "appointment_order",
			header: "Appointment Order",
			cell: ({ row }) => (
				<span className="text-sm font-mono text-muted-foreground">
					{(row.getValue("appointment_order") as string | null) ??
						"—"}
				</span>
			),
		},
		{
			accessorKey: "start_date",
			header: sortableHeader("Start Date"),
			cell: ({ row }) => (
				<span className="text-sm">
					{new Date(
						row.getValue("start_date") as string,
					).toLocaleDateString()}
				</span>
			),
		},
		{
			accessorKey: "end_date",
			header: "End Date",
			cell: ({ row }) => {
				const end = row.getValue("end_date") as string | null;
				return (
					<span className="text-sm">
						{end ? new Date(end).toLocaleDateString() : "—"}
					</span>
				);
			},
		},
		{
			accessorKey: "is_current",
			header: "Status",
			cell: ({ row }) => {
				const current = row.getValue("is_current") as number;
				return current ? (
					<Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
						Current
					</Badge>
				) : (
					<Badge
						variant="secondary"
						className="bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400"
					>
						Past
					</Badge>
				);
			},
		},
	];
}
