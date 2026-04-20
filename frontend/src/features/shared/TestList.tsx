import type { ReactNode } from "react";
import { DataTable } from "./DataTable";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { sortableHeader } from "./tableUtils";

export interface BaseTestType {
	id?: number;
	test_id?: number;
	name?: string;
	test_name?: string;
	course_code?: string;
	course_name?: string;
	full_marks?: number;
	pass_marks?: number;
	[key: string]: any;
}

export function getBaseTestColumns<T extends BaseTestType>(): ColumnDef<T>[] {
	return [
		{
			id: "test_identifier",
			accessorFn: (row) => row.test_id ?? row.id,
			header: sortableHeader("ID"),
			cell: ({ row }) => (
				<span className="font-medium">
					{row.getValue("test_identifier")}
				</span>
			),
		},
		{
			id: "test_label",
			accessorFn: (row) => row.test_name ?? row.name,
			header: sortableHeader("Test Name"),
			cell: ({ row }) => <span>{row.getValue("test_label")}</span>,
		},
		{
			accessorKey: "full_marks",
			header: "Full Marks",
			cell: ({ row }) => <span>{row.getValue("full_marks")}</span>,
		},
		{
			accessorKey: "pass_marks",
			header: "Pass Marks",
			cell: ({ row }) => <span>{row.getValue("pass_marks")}</span>,
		},
	];
}

interface TestListProps<TData> {
	data: TData[];
	columns: ColumnDef<TData>[];
	refreshing?: boolean;
	searchPlaceholder?: string;
	searchKey?: string;
	serverPagination?: any;
	renderSubRow?: (row: Row<TData>) => ReactNode;
	children?: ReactNode | (() => ReactNode);
}

export function TestList<TData extends BaseTestType>({
	data,
	columns,
	refreshing,
	searchPlaceholder = "Search tests...",
	searchKey,
	serverPagination,
	renderSubRow,
	children,
}: TestListProps<TData>) {
	return (
		<DataTable
			columns={columns}
			data={data || []}
			searchPlaceholder={searchPlaceholder}
			searchKey={searchKey}
			refreshing={refreshing}
			serverPagination={serverPagination}
			renderSubRow={renderSubRow}
		>
			{children}
		</DataTable>
	);
}
