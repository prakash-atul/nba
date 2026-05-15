import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/features/shared/tableUtils";
import { getBaseUserColumns } from "@/features/shared";
import { getRoleBadgeColor } from "@/features/users/utils";

import type { User } from "@/services/api";

interface UsersViewColumnsProps {
	onDelete: (user: User) => void;
	currentUserId?: number; // pass the current user id to hide delete button for self
}

export const getUsersViewColumns = ({
	onDelete,
	currentUserId,
}: UsersViewColumnsProps): ColumnDef<User>[] => [
	...getBaseUserColumns<User>(),
	{
		accessorKey: "designation",
		header: sortableHeader("Designation", "text-left"),
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground italic">
				{row.getValue("designation") || "—"}
			</span>
		),
	},
	{
		id: "phones",
		header: "Phones",
		cell: ({ row }) => {
			const phones = row.original.phones;
			return (
				<div className="text-muted-foreground flex flex-wrap gap-1">
					{phones && phones.length > 0
						? phones.map((phone, i) => (
								<Badge
									variant="secondary"
									key={i}
									className="font-mono"
								>
									{phone}
								</Badge>
							))
						: "—"}
				</div>
			);
		},
	},
	{
		accessorKey: "role",
		header: sortableHeader("Role"),
		cell: ({ row }) => {
			const user = row.original;
			const isHOD = user.role === "hod";
			const isDean = Number(user.is_dean) === 1;

			return (
				<div className="flex gap-1">
					<Badge
						variant="secondary"
						className={getRoleBadgeColor(user.role)}
					>
						{user.role.toUpperCase()}
					</Badge>
					{isDean && (
						<Badge
							variant="secondary"
							className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
						>
							DEAN
						</Badge>
					)}
					{isHOD && (
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
	},
	{
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
	},
	{
		id: "actions",
		header: () => <div className="text-center">Actions</div>,
		cell: ({ row }) => {
			const user = row.original;
			if (user.employee_id === currentUserId) return null;
			return (
				<div className="text-center">
					<Button
						variant="ghost"
						size="icon"
						className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
						onClick={() => onDelete(user)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			);
		},
	},
];
