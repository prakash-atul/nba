import * as React from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type ExpandedState,
	type Row,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type Table as TableType,
} from "@tanstack/react-table";
import { ChevronDown, RefreshCw, X, Search, Loader2 } from "lucide-react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PaginationMeta } from "@/services/api/types";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * When provided, DataTable operates in "server-side" mode:
 * pagination, sorting and search are all controlled externally.
 */
export interface ServerPaginationProps {
	/** Metadata from the last server response */
	pagination: PaginationMeta | null;
	/** Navigate to next page */
	onNext: () => void;
	/** Navigate to previous page */
	onPrev: () => void;
	/** Whether backward navigation is available */
	canPrev: boolean;
	/** Current zero-based page index (for display) */
	pageIndex: number;
	/** Controlled search string */
	search: string;
	/** Called whenever search input changes */
	onSearch: (value: string) => void;
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchKey?: string;
	searchPlaceholder?: string;
	refreshing?: boolean;
	children?: React.ReactNode | ((table: TableType<TData>) => React.ReactNode);
	/** Pass to enable server-side pagination mode */
	serverPagination?: ServerPaginationProps;
	/** Optional renderer for an expanded sub-row beneath each data row */
	renderSubRow?: (row: Row<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchPlaceholder = "Search...",
	refreshing = false,
	children,
	serverPagination,
	renderSubRow,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [expanded, setExpanded] = React.useState<ExpandedState>({});

	const isServerMode = !!serverPagination;

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			expanded,
		},
		// When server manages pagination, prevent TanStack from slicing rows
		// client-side (its default pageSize=10 would truncate server pages).
		manualPagination: isServerMode,
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onExpandedChange: setExpanded,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	const isFiltered = table.getState().columnFilters.length > 0;

	// ----- pagination footer helpers -----
	const sp = serverPagination;
	const serverCanNext = !!sp?.pagination?.has_more;
	const serverCanPrev = !!sp?.canPrev;
	const serverPage = sp ? sp.pageIndex + 1 : null;
	const serverTotal = sp?.pagination?.total ?? null;
	const serverLimit = sp?.pagination?.limit ?? null;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center space-x-2">
					{/* Server-side search input */}
					{isServerMode && (
						<div className="relative">
							{refreshing ? (
								<Loader2 className="absolute left-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
							) : (
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							)}
							<Input
								placeholder={searchPlaceholder}
								value={sp!.search}
								onChange={(e) => sp!.onSearch(e.target.value)}
								className="pl-8 h-9 w-[150px] lg:w-[250px]"
							/>
						</div>
					)}
					{/* Client-side search input */}
					{!isServerMode && searchKey && (
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={searchPlaceholder}
								value={
									(table
										.getColumn(searchKey)
										?.getFilterValue() as string) ?? ""
								}
								onChange={(event) =>
									table
										.getColumn(searchKey)
										?.setFilterValue(event.target.value)
								}
								className="pl-8 h-9 w-[150px] lg:w-[250px]"
							/>
						</div>
					)}
					{typeof children === "function"
						? children(table)
						: children}
					{!isServerMode && isFiltered && (
						<Button
							variant="ghost"
							onClick={() => table.resetColumnFilters()}
							className="h-9 px-2 lg:px-3"
						>
							Reset
							<X className="ml-2 h-4 w-4" />
						</Button>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							{refreshing && (
								<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							)}
							Columns <ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="rounded-md border bg-white dark:bg-slate-950">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											className="text-center"
										>
											<div className="flex justify-center">
												{header.isPlaceholder
													? null
													: flexRender(
															header.column
																.columnDef
																.header,
															header.getContext(),
														)}
											</div>
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{refreshing ? (
							<>
								{Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										{columns.map((_, j) => (
											<TableCell key={j}>
												<Skeleton className="h-6 w-full" />
											</TableCell>
										))}
									</TableRow>
								))}
							</>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<React.Fragment key={row.id}>
									<TableRow
										data-state={
											row.getIsSelected() && "selected"
										}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className="text-center font-medium"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
									{row.getIsExpanded() && renderSubRow && (
										<TableRow className="bg-muted/30 hover:bg-muted/40">
											<TableCell
												colSpan={
													row.getVisibleCells().length
												}
												className="p-0"
											>
												{renderSubRow(row)}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									No results found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				{isServerMode ? (
					<>
						<div className="flex-1 text-sm text-muted-foreground">
							{serverTotal !== null && serverLimit !== null
								? `${serverTotal.toLocaleString()} total rows · ${serverLimit} per page`
								: ""}
						</div>
						<div className="text-sm text-muted-foreground">
							Page {serverPage}
						</div>
						<div className="space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={sp!.onPrev}
								disabled={!serverCanPrev}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={sp!.onNext}
								disabled={!serverCanNext}
							>
								Next
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="flex-1 text-sm text-muted-foreground">
							{table.getFilteredSelectedRowModel().rows.length} of{" "}
							{table.getFilteredRowModel().rows.length} row(s)
							selected.
						</div>
						<div className="text-sm text-muted-foreground">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
