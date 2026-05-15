import type { ReactNode } from "react";
import { DataTable } from "./DataTable";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "./tableUtils";

export interface BaseUserType {
	id?: string | number;
	employee_id?: string | number;
	username?: string;
	email?: string;
	role?: string;
	[key: string]: any;
}

export function getBaseUserColumns<T extends BaseUserType>(): ColumnDef<T>[] {
	return [
		{
			accessorKey: "employee_id",
			header: sortableHeader("Employee ID"),
			cell: ({ row }) => (
				<Badge variant="outline" className="font-mono">
					{row.getValue("employee_id") || "N/A"}
				</Badge>
			),
		},
		{
			accessorKey: "username",
			header: sortableHeader("Name", "text-left"),
			cell: ({ row }) => (
				<div className="font-medium text-left">{row.getValue("username")}</div>
			),
		},
		{
			accessorKey: "email",
			header: sortableHeader("Email", "text-left"),
			cell: ({ row }) => (
				<div className="text-sm text-muted-foreground text-left max-w-[200px] truncate">
					{row.getValue("email") || "—"}
				</div>
			),
		},
	];
}

interface UserListProps<TData> {
	data: TData[];
	columns: ColumnDef<TData>[];
	refreshing?: boolean;
	searchPlaceholder?: string;
	serverPagination?: any;
	renderSubRow?: (row: Row<TData>) => ReactNode;
	children?:
		| ReactNode
		| ((table: any, currentFilters: any, setFilter: any) => ReactNode);
}
export function UserList<TData extends BaseUserType>({
	data,
	columns,
	refreshing,
	searchPlaceholder = "Search users...",
	serverPagination,
	renderSubRow,
	children,
}: UserListProps<TData>) {
	return (
		<DataTable
			columns={columns}
			data={data || []}
			searchPlaceholder={searchPlaceholder}
			refreshing={refreshing}
			serverPagination={serverPagination}
			renderSubRow={renderSubRow}
		>
			{children}
		</DataTable>
	);
}
