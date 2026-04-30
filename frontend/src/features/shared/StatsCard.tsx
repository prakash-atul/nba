import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { LucideIcon } from "lucide-react";

export interface StatItem {
	label: string;
	value: number;
	icon: LucideIcon;
	gradient?: string;
	bgGradient?: string;
	color?: string;
	bgColor?: string;
	description?: string;
	suffix?: string;
}

interface StatsCardProps {
	stat: StatItem;
	isLoading?: boolean;
	variant?: "gradient" | "solid" | "outline";
}

export function StatsCard({
	stat,
	isLoading = false,
	variant = "outline",
}: StatsCardProps) {
	const Icon = stat.icon;

	if (variant === "gradient") {
		return (
			<Card
				className={`bg-linear-to-br ${
					stat.gradient || "from-blue-500 to-blue-600"
				} text-white border-0`}
			>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium opacity-90">
						{stat.label}
					</CardTitle>
					<Icon className="h-4 w-4 opacity-75" />
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">
						{isLoading ? (
							<span className="animate-pulse">--</span>
						) : (
							<>
								<NumberTicker value={stat.value} />
								{stat.suffix && <span>{stat.suffix}</span>}
							</>
						)}
					</div>
					{stat.description && (
						<p className="text-xs opacity-75 mt-1">
							{stat.description}
						</p>
					)}
				</CardContent>
			</Card>
		);
	}

	if (variant === "solid") {
		return (
			<Card
				className={`bg-linear-to-br ${
					stat.bgGradient ||
					"from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30"
				} border-0 shadow-sm hover:shadow-md transition-shadow`}
			>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
						{stat.label}
					</CardTitle>
					<div
						className={`w-10 h-10 rounded-lg bg-linear-to-br ${
							stat.gradient || "from-blue-500 to-blue-600"
						} flex items-center justify-center`}
					>
						<Icon className="w-5 h-5 text-white" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900 dark:text-white">
						{isLoading ? (
							<span className="animate-pulse">--</span>
						) : (
							<>
								<NumberTicker value={stat.value} />
								{stat.suffix && <span>{stat.suffix}</span>}
							</>
						)}
					</div>
				</CardContent>
			</Card>
		);
	}

	// Default: outline variant
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
					{stat.label}
				</CardTitle>
				<div
					className={`p-2 rounded-lg ${
						stat.bgColor || "bg-blue-50 dark:bg-blue-950"
					}`}
				>
					<Icon
						className={`w-4 h-4 ${stat.color || "text-blue-500"}`}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold text-gray-900 dark:text-white">
					{isLoading ? (
						<span className="animate-pulse">--</span>
					) : (
						<>
							<NumberTicker value={stat.value} />
							{stat.suffix && <span>{stat.suffix}</span>}
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

interface StatsGridProps {
	stats: StatItem[];
	isLoading?: boolean;
	variant?: "gradient" | "solid" | "outline";
	columns?: 3 | 4 | 5;
}

export function StatsGrid({
	stats,
	isLoading = false,
	variant = "outline",
	columns = 4,
}: StatsGridProps) {
	const gridCols = {
		3: "md:grid-cols-3",
		4: "md:grid-cols-2 lg:grid-cols-4",
		5: "md:grid-cols-2 lg:grid-cols-5",
	};

	return (
		<div className={`grid gap-4 ${gridCols[columns]}`}>
			{stats.map((stat) => (
				<StatsCard
					key={stat.label}
					stat={stat}
					isLoading={isLoading}
					variant={variant}
				/>
			))}
		</div>
	);
}

// Loading skeleton for stats
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{[...Array(count)].map((_, i) => (
				<Card key={i}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						<div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
					</CardHeader>
					<CardContent>
						<div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
