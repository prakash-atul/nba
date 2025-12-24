import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DataColumn<T> {
	key: keyof T | string;
	header: string;
	render?: (item: T) => React.ReactNode;
	sortable?: boolean;
}

export interface FilterConfig {
	key: string;
	label: string;
	options: { value: string; label: string }[];
}

interface DataTableViewProps<T> {
	data: T[];
	columns: DataColumn<T>[];
	title?: string;
	titleIcon?: LucideIcon;
	isLoading?: boolean;
	searchPlaceholder?: string;
	searchKeys?: (keyof T)[];
	filters?: FilterConfig[];
	emptyMessage?: string;
	getRowKey: (item: T) => string | number;
	showSearch?: boolean;
	headerContent?: React.ReactNode;
}

export function DataTableView<T>({
	data,
	columns,
	title,
	titleIcon: TitleIcon,
	isLoading = false,
	searchPlaceholder = "Search...",
	searchKeys = [],
	filters = [],
	emptyMessage = "No data found",
	getRowKey,
	showSearch = true,
	headerContent,
}: DataTableViewProps<T>) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterValues, setFilterValues] = useState<Record<string, string>>(
		filters.reduce((acc, f) => ({ ...acc, [f.key]: "all" }), {})
	);

	// Filter and search data
	const filteredData = useMemo(() => {
		return data.filter((item) => {
			// Search filter
			const matchesSearch =
				!searchTerm ||
				searchKeys.some((key) => {
					const value = item[key];
					return (
						value &&
						String(value)
							.toLowerCase()
							.includes(searchTerm.toLowerCase())
					);
				});

			// Custom filters
			const matchesFilters = filters.every((filter) => {
				const filterValue = filterValues[filter.key];
				if (filterValue === "all") return true;
				const itemValue = (item as Record<string, unknown>)[filter.key];
				return String(itemValue) === filterValue;
			});

			return matchesSearch && matchesFilters;
		});
	}, [data, searchTerm, searchKeys, filters, filterValues]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		);
	}

	const renderCellContent = (item: T, column: DataColumn<T>) => {
		if (column.render) {
			return column.render(item);
		}
		const value = (item as Record<string, unknown>)[column.key as string];
		return value != null ? String(value) : "-";
	};

	return (
		<Card>
			{(title || showSearch || filters.length > 0 || headerContent) && (
				<CardHeader>
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						{title && (
							<CardTitle className="flex items-center gap-2">
								{TitleIcon && <TitleIcon className="w-5 h-5" />}
								{title} ({filteredData.length})
							</CardTitle>
						)}
						<div className="flex flex-col sm:flex-row gap-2">
							{showSearch && (
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										placeholder={searchPlaceholder}
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										className="pl-9 w-full sm:w-[200px]"
									/>
								</div>
							)}
							{filters.map((filter) => (
								<Select
									key={filter.key}
									value={filterValues[filter.key]}
									onValueChange={(value) =>
										setFilterValues((prev) => ({
											...prev,
											[filter.key]: value,
										}))
									}
								>
									<SelectTrigger className="w-full sm:w-[180px]">
										<SelectValue
											placeholder={filter.label}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											All {filter.label}
										</SelectItem>
										{filter.options.map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
											>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							))}
							{headerContent}
						</div>
					</div>
				</CardHeader>
			)}
			<CardContent className={title ? "" : "p-0"}>
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((column) => (
								<TableHead key={String(column.key)}>
									{column.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="text-center py-8 text-gray-500"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((item) => (
								<TableRow key={getRowKey(item)}>
									{columns.map((column) => (
										<TableCell key={String(column.key)}>
											{renderCellContent(item, column)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

// Role badge helper
export function getRoleBadgeColor(role: string) {
	const colors: Record<string, string> = {
		admin: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
		dean: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
		hod: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
		faculty: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
		staff: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
	};
	return (
		colors[role] ||
		"bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
	);
}

export function RoleBadge({ role }: { role: string }) {
	return (
		<Badge className={getRoleBadgeColor(role)}>
			{role.charAt(0).toUpperCase() + role.slice(1)}
		</Badge>
	);
}
