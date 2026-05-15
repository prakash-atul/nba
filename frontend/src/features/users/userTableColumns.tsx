import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ChevronDownIcon,
	ChevronRight,
	Phone,
	Pencil,
	Trash2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { User, DeanUser } from "@/services/api";
import { sortableHeader } from "../shared/tableUtils";
import { getRoleBadgeColor } from "./utils";

interface UseUserColumnsProps {
	showEmail?: boolean;
	showDesignation?: boolean;
	showPhone?: boolean;
	showRole?: boolean;
	showDeanStatus?: boolean;
	effectiveShowDepartment?: boolean;
	permissions: {
		canEdit?: boolean;
		canDelete?: boolean;
	};
	isLoading: boolean;
	setSelectedUser: (user: User | DeanUser) => void;
	setEditDialogOpen: (open: boolean) => void;
	setDeleteDialogOpen: (open: boolean) => void;
}

export function useUserColumns({
	showEmail,
	showDesignation,
	showPhone,
	showRole,
	showDeanStatus,
	effectiveShowDepartment,
	permissions,
	isLoading,
	setSelectedUser,
	setEditDialogOpen,
	setDeleteDialogOpen,
}: UseUserColumnsProps): ColumnDef<User | DeanUser>[] {
	return useMemo(() => {
		const cols: ColumnDef<User | DeanUser>[] = [
			{
				id: "expander",
				header: () => <div className="w-8" />,
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => row.toggleExpanded()}
					>
						{row.getIsExpanded() ? (
							<ChevronDownIcon className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</Button>
				),
			},
			{
				accessorKey: "employee_id",
				header: sortableHeader("Employee ID"),
				cell: ({ row }) => (
					<Badge variant="outline" className="font-mono">
						{row.getValue("employee_id")}
					</Badge>
				),
			},
			{
				accessorKey: "username",
				header: sortableHeader("Name", "text-left"),
				cell: ({ row }) => (
					<div className="font-medium text-left">
						{row.getValue("username")}
					</div>
				),
			},
		];

		if (showEmail) {
			cols.push({
				accessorKey: "email",
				header: sortableHeader("Email", "text-left"),
				cell: ({ row }) => (
					<div className="text-sm text-muted-foreground text-left max-w-[200px] truncate">
						{row.getValue("email") || "—"}
					</div>
				),
			});
		}

		if (showDesignation) {
			cols.push({
				accessorKey: "designation",
				header: sortableHeader("Designation", "text-left"),
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground italic">
						{row.getValue("designation") || "—"}
					</span>
				),
			});
		}

		if (showPhone) {
			cols.push({
				id: "phone_action",
				header: "Phones",
				cell: ({ row }) => (
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-2 font-mono text-xs"
						onClick={() => row.toggleExpanded()}
					>
						<Phone className="h-3 w-3" />
						View
					</Button>
				),
			});
		}

		if (showRole) {
			cols.push({
				accessorKey: "role",
				header: sortableHeader("Role"),
				cell: ({ row }) => {
					const user = row.original as any;
					return (
						<div className="flex gap-1">
							<Badge
								variant="secondary"
								className={getRoleBadgeColor(user.role)}
							>
								{user.role.toUpperCase()}
							</Badge>
							{user.role !== "dean" &&
								showDeanStatus &&
								!!user.is_dean && (
									<Badge
										variant="secondary"
										className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
									>
										DEAN
									</Badge>
								)}
							{user.role !== "hod" &&
								showDeanStatus &&
								!!user.is_hod && (
									<Badge
										variant="secondary"
										className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
									>
										HOD
									</Badge>
								)}
						</div>
					);
				},
			});
		}

		if (effectiveShowDepartment) {
			cols.push({
				accessorKey: "department_code",
				header: sortableHeader("Department"),
				cell: ({ row }) => {
					const deptCode = row.getValue("department_code") as string;
					return deptCode ? (
						<Badge
							variant="secondary"
							className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
						>
							{deptCode}
						</Badge>
					) : (
						<span className="text-muted-foreground">—</span>
					);
				},
			});
		}

		if (permissions.canEdit || permissions.canDelete) {
			cols.push({
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const user = row.original as User | DeanUser;
					return (
						<div className="flex gap-2">
							{permissions.canEdit && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedUser(user);
										setEditDialogOpen(true);
									}}
									disabled={isLoading}
								>
									<Pencil className="h-4 w-4" />
								</Button>
							)}
							{permissions.canDelete && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedUser(user);
										setDeleteDialogOpen(true);
									}}
									disabled={isLoading}
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					);
				},
			});
		}

		return cols;
	}, [
		showEmail,
		showDesignation,
		showPhone,
		showRole,
		showDeanStatus,
		effectiveShowDepartment,
		permissions.canEdit,
		permissions.canDelete,
		isLoading,
		setSelectedUser,
		setEditDialogOpen,
		setDeleteDialogOpen,
	]);
}
