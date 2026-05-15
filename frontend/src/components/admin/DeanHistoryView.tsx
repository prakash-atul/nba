import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/features/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/services/api/admin";

interface DeanHistoryRecord {
	assignment_id: number;
	school_id: number;
	user_id: number;
	start_date: string;
	end_date: string | null;
	appointment_order: string;
	status: "active" | "completed";
	username: string;
	email: string;
	school_name: string;
	school_code: string;
}

export function DeanHistoryView() {
	const {
		data: history = [],
		isLoading,
	} = useQuery({
		queryKey: ["deanHistory"],
		queryFn: () => adminApi.getDeanHistory(),
	});

	const columns: ColumnDef<DeanHistoryRecord>[] = [
		{
			accessorKey: "school_code",
			header: "School",
			cell: ({ row }) => (
				<span className="font-semibold text-gray-700">
					{row.getValue("school_code")}
				</span>
			),
		},
		{
			accessorKey: "username",
			header: "Dean Name",
			cell: ({ row }) => (
				<div className="font-medium">
					{row.getValue("username")}
					<div className="text-xs text-muted-foreground font-normal">
						{(row.original as DeanHistoryRecord).email}
					</div>
				</div>
			),
		},
		{
			accessorKey: "start_date",
			header: "From",
			cell: ({ row }) => {
				const date = row.getValue("start_date") as string;
				return date ? new Date(date).toLocaleDateString() : "N/A";
			},
		},
		{
			accessorKey: "end_date",
			header: "To",
			cell: ({ row }) => {
				const date = row.getValue("end_date") as string;
				return date ? new Date(date).toLocaleDateString() : "Present";
			},
		},
		{
			accessorKey: "appointment_order",
			header: "Order Ref",
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("status") as string;
				return (
					<Badge
						variant={status === "active" ? "default" : "secondary"}
					>
						{status}
					</Badge>
				);
			},
		},
	];

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle>Dean Assignment History</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
					</div>
				) : (
					<DataTable
						columns={columns}
						data={history}
						refreshing={isLoading}
						searchPlaceholder="Search by name or school..."
						searchKey="username"
					/>
				)}
			</CardContent>
		</Card>
	);
}

