import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { type AuditLog } from "../../services/api/audit";
import { DataTable } from "../../features/shared/DataTable";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { ViewDiffModal } from "./ViewDiffModal";
import { RefreshCw, Eye, Activity } from "lucide-react";

const ACTION_FILTERS = ["ALL", "CREATE", "UPDATE", "DELETE"] as const;

export interface AuditLogsViewProps {
	fetchFn: (params: { page?: number; limit?: number }) => Promise<any>;
}

export function AuditLogsView({ fetchFn }: AuditLogsViewProps) {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [actionFilter, setActionFilter] =
		useState<(typeof ACTION_FILTERS)[number]>("ALL");

	const fetchLogs = async (p = page) => {
		setIsLoading(true);
		try {
			const res: any = await fetchFn({ page: p, limit: 15 });
			if (res.success) {
				setLogs(res.data);
				if (res.pagination) {
					setTotalPages(res.pagination.total_pages);
				}
			}
		} catch (error) {
			console.error("Failed to fetch logs", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs(1);
	}, []);

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
		fetchLogs(newPage);
	};

	const filteredLogs = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();

		return logs.filter((log) => {
			const matchesAction =
				actionFilter === "ALL" || log.action === actionFilter;
			const matchesSearch =
				!query ||
				(log.entity_type || "").toLowerCase().includes(query) ||
				(log.entity_id || "").toLowerCase().includes(query) ||
				(log.username || "").toLowerCase().includes(query) ||
				(log.action || "").toLowerCase().includes(query);

			return matchesAction && matchesSearch;
		});
	}, [logs, searchTerm, actionFilter]);

	const columns = useMemo(
		() => [
			{
				accessorKey: "created_at",
				header: "Timestamp",
				cell: ({ row }: any) => {
					return (
						<span>
							{format(new Date(row.original.created_at), "PP p")}
						</span>
					);
				},
			},
			{
				accessorKey: "action",
				header: "Action",
				cell: ({ row }: any) => {
					const action = row.original.action;
					const variants: any = {
						CREATE: "default",
						UPDATE: "secondary",
						DELETE: "destructive",
					};
					return (
						<Badge variant={variants[action] || "outline"}>
							{action}
						</Badge>
					);
				},
			},
			{
				accessorKey: "entity_type",
				header: "Entity",
			},
			{
				accessorKey: "entity_id",
				header: "Entity ID",
			},
			{
				accessorKey: "username",
				header: "Actor",
				cell: ({ row }: any) => {
					if (row.original.username) {
						return (
							<span>
								{row.original.username} ({row.original.user_id})
							</span>
						);
					}
					return (
						<span className="text-muted-foreground">System</span>
					);
				},
			},
			{
				id: "actions",
				header: "Details",
				cell: ({ row }: any) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSelectedLog(row.original)}
					>
						<Eye className="mr-2 h-4 w-4" />
						View
					</Button>
				),
			},
		],
		[],
	);

	return (
		<Card>
			<CardHeader className="space-y-4 pb-4">
				<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							System Audit Trail
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							High-density event stream for user and system
							changes.
						</p>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchLogs()}
						disabled={isLoading}
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{ACTION_FILTERS.map((action) => (
						<Button
							key={action}
							size="sm"
							variant={
								actionFilter === action ? "default" : "outline"
							}
							onClick={() => setActionFilter(action)}
						>
							{action}
						</Button>
					))}
					<Badge variant="outline" className="ml-auto">
						Showing {filteredLogs.length} of {logs.length} on this
						page
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={filteredLogs}
					refreshing={isLoading}
					searchPlaceholder="Search actor, entity, or action..."
					serverPagination={{
						pagination: {
							total: totalPages * 15,
							limit: 15,
							next_cursor: page < totalPages ? "next" : null,
							prev_cursor: page > 1 ? "prev" : null,
							has_more: page < totalPages,
						},
						onNext: () => handlePageChange(page + 1),
						onPrev: () => handlePageChange(page - 1),
						canPrev: page > 1,
						pageIndex: page,
						search: searchTerm,
						onSearch: setSearchTerm,
					}}
				/>

				{selectedLog && (
					<ViewDiffModal
						log={selectedLog}
						open={!!selectedLog}
						onOpenChange={(op) => !op && setSelectedLog(null)}
					/>
				)}
			</CardContent>
		</Card>
	);
}
