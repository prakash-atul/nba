import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";

export function sortableHeader<TData, TValue>(
	title: string,
	className?: string,
) {
	return ({ column }: { column: Column<TData, TValue> }) => {
		return (
			<div className="flex w-full items-center justify-start">
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
					className={`justify-start font-semibold text-left p-0 hover:bg-transparent ${className ?? ""}`}
				>
					{title}
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			</div>
		);
	};
}
