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
import {
	ChevronDown,
	RefreshCw,
	X,
	Search,
	Loader2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
export interface ServerPaginationProps<F extends Record<string, any> = any> {
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
	/** Current filter state */
	filters?: Partial<F>;
	/** Method to update filters */
	setFilter?: (key: keyof F, value: any) => void;
	/** Current sort field */
	sort?: string;
	/** Current sort direction */
	sortDir?: "ASC" | "DESC";
	/** Method to update sorting */
	setSort?: (field: string, dir?: "ASC" | "DESC") => void;
}

interface DataTableProps<TData, TValue, F extends Record<string, any> = any> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchKey?: string;
	searchPlaceholder?: string;
	refreshing?: boolean;
	children?:
		| React.ReactNode
		| ((
				table: TableType<TData>,
				filters?: Partial<F>,
				setFilter?: (key: keyof F, value: any) => void,
		  ) => React.ReactNode);
	/** Pass to enable server-side pagination mode */
	serverPagination?: ServerPaginationProps<F>;
	/** Optional renderer for an expanded sub-row beneath each data row */
	renderSubRow?: (row: Row<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue, F extends Record<string, any> = any>({
	columns,
	data,
	searchKey,
	searchPlaceholder = "Search...",
	refreshing = false,
	children,
	serverPagination,
	renderSubRow,
}: DataTableProps<TData, TValue, F>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [expanded, setExpanded] = React.useState<ExpandedState>({});

	const isServerMode = !!serverPagination;

	// Merge server sorting state or use local
	const tableSorting: SortingState = React.useMemo(() => {
		if (serverPagination?.sort) {
			return [
				{
					id: serverPagination.sort,
					desc: serverPagination.sortDir === "DESC",
				},
			];
		}
		return sorting;
	}, [serverPagination?.sort, serverPagination?.sortDir, sorting]);

	const table = useReactTable({
		data: data || [],
		columns,
		state: {
			sorting: tableSorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			expanded,
		},
		// When server manages pagination, prevent TanStack from slicing rows
		// client-side (its default pageSize=10 would truncate server pages).
		manualPagination: isServerMode,
		manualSorting: isServerMode,
		enableRowSelection: true,
		getRowCanExpand: () => true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: (updaterOrValue) => {
			if (isServerMode && serverPagination?.setSort) {
				const newValue =
					typeof updaterOrValue === "function"
						? updaterOrValue(tableSorting)
						: updaterOrValue;
				if (newValue.length > 0) {
					serverPagination.setSort(
						newValue[0].id,
						newValue[0].desc ? "DESC" : "ASC",
					);
				} else {
					serverPagination.setSort("");
				}
			}
			setSorting(updaterOrValue);
		},
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
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-wrap items-center gap-2">
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
						? children(table, sp?.filters, sp?.setFilter as any)
						: children}
					{!isServerMode && isFiltered && (
						<Button
							variant="ghost"
							onClick={() => table.resetColumnFilters()}
							className="h-9 px-2 lg:px-3 shrink-0"
						>
							Reset
							<X className="ml-2 h-4 w-4" />
						</Button>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto shrink-0">
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
									<AnimatePresence initial={false}>
										{row.getIsExpanded() &&
											renderSubRow && (
												<motion.tr
													key={`sub-${row.id}`}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{
														duration: 0.2,
														ease: "easeInOut",
													}}
													data-slot="table-row"
													className="bg-muted/10 hover:bg-muted/20 data-[state=selected]:bg-muted transition-colors border-b-0"
												>
													<TableCell
														colSpan={
															row.getVisibleCells()
																.length
														}
														className="p-0 border-b-0"
													>
														<motion.div
															initial={{
																height: 0,
																opacity: 0,
															}}
															animate={{
																height: "auto",
																opacity: 1,
															}}
															exit={{
																height: 0,
																opacity: 0,
															}}
															transition={{
																duration: 0.2,
																ease: "easeInOut",
															}}
															className="overflow-hidden"
														>
															<div className="p-4 border-t">
																{renderSubRow(
																	row,
																)}
															</div>
														</motion.div>
													</TableCell>
												</motion.tr>
											)}
									</AnimatePresence>
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
			<div className="flex items-center justify-between px-2 py-4">
				{isServerMode ? (
					<>
						<div className="flex-1 text-sm text-muted-foreground hidden sm:block">
							{serverTotal !== null
								? `${serverTotal.toLocaleString()} row(s) total.`
								: null}
						</div>
						<div className="flex items-center space-x-6 lg:space-x-8">
							{serverTotal !== null && serverLimit !== null && (
								<div className="flex items-center space-x-2 hidden sm:flex">
									<p className="text-sm font-medium text-muted-foreground">
										Rows per page
									</p>
									<div className="text-sm font-medium border rounded px-2 py-1 bg-muted/20">
										{serverLimit}
									</div>
								</div>
							)}
							<div className="flex w-[100px] items-center justify-center text-sm font-medium">
								Page {serverPage}{" "}
								{serverTotal !== null && serverLimit !== null
									? `of ${Math.ceil(serverTotal / serverLimit)}`
									: ""}
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									className="h-8 w-8 p-0"
									onClick={sp!.onPrev}
									disabled={!serverCanPrev}
								>
									<span className="sr-only">
										Go to previous page
									</span>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									className="h-8 w-8 p-0"
									onClick={sp!.onNext}
									disabled={!serverCanNext}
								>
									<span className="sr-only">
										Go to next page
									</span>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="flex-1 text-sm text-muted-foreground hidden sm:block">
							{table.getFilteredSelectedRowModel().rows.length > 0
								? `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`
								: `${table.getFilteredRowModel().rows.length} row(s) total.`}
						</div>
						<div className="flex items-center space-x-6 lg:space-x-8">
							<div className="flex items-center space-x-2 hidden sm:flex">
								<p className="text-sm font-medium text-muted-foreground">
									Rows per page
								</p>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="h-8 w-[70px] justify-between"
										>
											{
												table.getState().pagination
													.pageSize
											}
											<ChevronDown className="ml-2 h-4 w-4 opacity-50" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{[10, 20, 30, 40, 50].map(
											(pageSize) => (
												<DropdownMenuCheckboxItem
													key={pageSize}
													checked={
														table.getState()
															.pagination
															.pageSize ===
														pageSize
													}
													onCheckedChange={() =>
														table.setPageSize(
															pageSize,
														)
													}
												>
													{pageSize}
												</DropdownMenuCheckboxItem>
											),
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="flex w-[100px] items-center justify-center text-sm font-medium">
								Page {table.getState().pagination.pageIndex + 1}{" "}
								of {table.getPageCount() || 1}
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									className="hidden h-8 w-8 p-0 lg:flex"
									onClick={() => table.setPageIndex(0)}
									disabled={!table.getCanPreviousPage()}
								>
									<span className="sr-only">
										Go to first page
									</span>
									<ChevronsLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									className="h-8 w-8 p-0"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									<span className="sr-only">
										Go to previous page
									</span>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									className="h-8 w-8 p-0"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									<span className="sr-only">
										Go to next page
									</span>
									<ChevronRight className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									className="hidden h-8 w-8 p-0 lg:flex"
									onClick={() =>
										table.setPageIndex(
											table.getPageCount() - 1,
										)
									}
									disabled={!table.getCanNextPage()}
								>
									<span className="sr-only">
										Go to last page
									</span>
									<ChevronsRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
