import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
	title: string;
	description: string;
	icon?: LucideIcon;
	action?: {
		label: string;
		onClick: () => void;
	};
	variant?: "card" | "inline";
	className?: string;
}

export function EmptyState({
	title,
	description,
	icon: Icon = FileText,
	action,
	variant = "card",
	className = "",
}: EmptyStateProps) {
	const content = (
		<div className="flex flex-col items-center gap-4">
			<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
				<Icon className="w-8 h-8 text-gray-400" />
			</div>
			<div className="text-center">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
					{title}
				</h3>
				<p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
					{description}
				</p>
			</div>
			{action && (
				<Button onClick={action.onClick} className="mt-2">
					{action.label}
				</Button>
			)}
		</div>
	);

	if (variant === "inline") {
		return <div className={`p-12 text-center ${className}`}>{content}</div>;
	}

	return (
		<Card className={className}>
			<CardContent className="p-12 text-center">{content}</CardContent>
		</Card>
	);
}

// Specific empty states for common use cases
interface TableEmptyStateProps {
	colSpan: number;
	message?: string;
}

export function TableEmptyState({
	colSpan,
	message = "No data found",
}: TableEmptyStateProps) {
	return (
		<tr>
			<td
				colSpan={colSpan}
				className="text-center py-8 text-gray-500 dark:text-gray-400"
			>
				{message}
			</td>
		</tr>
	);
}
