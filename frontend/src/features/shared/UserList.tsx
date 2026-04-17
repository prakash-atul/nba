import type { ReactNode } from "react";
import { DataTable } from "./DataTable";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

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
                        header: ({ column }) => (
                                <Button
                                        variant="ghost"
                                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                >
                                        Employee ID
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                        ),
                        cell: ({ row }) => (
                                <Badge variant="outline" className="font-mono">
                                        {row.getValue("employee_id") || "N/A"}
                                </Badge>
                        ),
                },
                {
                        accessorKey: "username",
                        header: ({ column }) => (
                                <Button
                                        variant="ghost"
                                        className="mr-auto"
                                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                >
                                        Name
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                        ),
                        cell: ({ row }) => <div className="flex">{row.getValue("username")}</div>,
                },
                {
                        accessorKey: "email",
                        header: ({ column }) => (
                                <Button
                                        variant="ghost"
                                        className="mr-auto"
                                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                >
                                        Email
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
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
        children?: ReactNode | (() => ReactNode);
}

export function UserList<TData extends BaseUserType>({
        data,
        columns,
        refreshing,
        searchPlaceholder = "Search users...",
        serverPagination,
        renderSubRow,
        children
}: UserListProps<TData>) {
        return (
                <DataTable
                        columns={columns}
                        data={data}
                        searchPlaceholder={searchPlaceholder}
                        refreshing={refreshing}
                        serverPagination={serverPagination}
				renderSubRow={renderSubRow}
                >
                        {children}
                </DataTable>
        );
}
