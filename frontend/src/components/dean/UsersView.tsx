import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DeanUser } from "@/services/api";

interface UsersViewProps {
	users: DeanUser[];
	isLoading: boolean;
}

const getRoleBadgeColor = (role: string) => {
	switch (role) {
		case "admin":
			return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
		case "dean":
			return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
		case "hod":
			return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
		case "faculty":
			return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
		case "staff":
			return "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
		default:
			return "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300";
	}
};

export function UsersView({ users, isLoading }: UsersViewProps) {
	// Get unique departments for filter
	const departments = Array.from(
		new Set(users.map((u) => u.department_name).filter(Boolean)),
	) as string[];

	const columns: ColumnDef<DeanUser>[] = [
		{
			accessorKey: "employee_id",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Employee ID
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="font-mono">{row.getValue("employee_id")}</div>
			),
		},
		{
			accessorKey: "username",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("username")}</div>
			),
		},
		{
			accessorKey: "email",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Email
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="text-muted-foreground">
					{row.getValue("email")}
				</div>
			),
		},
		{
			accessorKey: "role",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Role
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const role = row.getValue("role") as string;
				const user = row.original;
				return (
					<div className="flex gap-1 flex-wrap">
						<Badge
							variant="secondary"
							className={getRoleBadgeColor(role)}
						>
							{role.toUpperCase()}
						</Badge>
						{user.is_hod === 1 && (
							<Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
								HOD
							</Badge>
						)}
						{user.is_dean === 1 && (
							<Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800">
								DEAN
							</Badge>
						)}
					</div>
				);
			},
			filterFn: (row, id, value) => {
				return value === "all" ? true : row.getValue(id) === value;
			},
		},
		{
			accessorKey: "department_name",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === "asc")
						}
					>
						Department
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const deptName = row.getValue("department_name") as string;
				const deptCode = row.original.department_code;
				return deptCode ? (
					<Badge variant="outline">{deptCode}</Badge>
				) : (
					<span className="text-muted-foreground italic">N/A</span>
				);
			},
			filterFn: (row, id, value) => {
				return value === "all" ? true : row.getValue(id) === value;
			},
		},
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="w-5 h-5" />
					All Users
				</CardTitle>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={users}
					searchKey="username"
					searchPlaceholder="Search users..."
				>
					{(table) => (
						<div className="flex gap-2">
							<Select
								value={
									(table
										.getColumn("role")
										?.getFilterValue() as string) ?? "all"
								}
								onValueChange={(value) =>
									table
										.getColumn("role")
										?.setFilterValue(
											value === "all" ? "" : value,
										)
								}
							>
								<SelectTrigger className="w-[150px]">
									<SelectValue placeholder="Role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Roles
									</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="dean">Dean</SelectItem>
									<SelectItem value="hod">HOD</SelectItem>
									<SelectItem value="faculty">
										Faculty
									</SelectItem>
									<SelectItem value="staff">Staff</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={
									(table
										.getColumn("department_name")
										?.getFilterValue() as string) ?? "all"
								}
								onValueChange={(value) =>
									table
										.getColumn("department_name")
										?.setFilterValue(
											value === "all" ? "" : value,
										)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Department" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										All Departments
									</SelectItem>
									{departments.map((dept) => (
										<SelectItem key={dept} value={dept}>
											{dept}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</DataTable>
			</CardContent>
		</Card>
	);
}
