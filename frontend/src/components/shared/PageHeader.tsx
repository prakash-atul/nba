import { type LucideIcon } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	count?: number;
	children?: React.ReactNode;
	variant?: "default" | "card" | "section";
	className?: string;
}

export function PageHeader({
	title,
	description,
	icon: Icon,
	count,
	children,
	variant = "default",
	className,
}: PageHeaderProps) {
	// Render as card header (with CardTitle)
	if (variant === "card") {
		return (
			<div
				className={cn(
					"flex flex-col md:flex-row md:items-center justify-between gap-4",
					className
				)}
			>
				<CardTitle className="flex items-center gap-2">
					{Icon && <Icon className="w-5 h-5" />}
					{title}
					{count !== undefined && (
						<span className="text-muted-foreground font-normal">
							({count})
						</span>
					)}
				</CardTitle>
				{children}
			</div>
		);
	}

	// Render as section header
	if (variant === "section") {
		return (
			<div className={cn("space-y-1", className)}>
				<div className="flex items-center gap-2">
					{Icon && <Icon className="w-6 h-6" />}
					<h2 className="text-2xl font-bold">{title}</h2>
					{count !== undefined && (
						<span className="text-muted-foreground">({count})</span>
					)}
				</div>
				{description && (
					<p className="text-gray-500 dark:text-gray-400">
						{description}
					</p>
				)}
				{children}
			</div>
		);
	}

	// Default: page-level header with flex layout
	return (
		<div
			className={cn(
				"flex flex-col md:flex-row md:items-center justify-between gap-4",
				className
			)}
		>
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					{Icon && <Icon className="w-6 h-6" />}
					<h2 className="text-2xl font-bold">{title}</h2>
					{count !== undefined && (
						<span className="text-muted-foreground">({count})</span>
					)}
				</div>
				{description && (
					<p className="text-gray-500 dark:text-gray-400">
						{description}
					</p>
				)}
			</div>
			{children}
		</div>
	);
}
