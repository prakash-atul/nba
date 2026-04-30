import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuickAccessItem {
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;
	gradient?: string;
	value?: string | number;
}

interface QuickAccessCardProps {
	item: QuickAccessItem;
	onClick: (id: string) => void;
	variant?: "default" | "elevated" | "compact";
	accentColor?: string;
}

export function QuickAccessCard({
	item,
	onClick,
	variant = "default",
	accentColor = "purple",
}: QuickAccessCardProps) {
	const Icon = item.icon;

	if (variant === "elevated") {
		return (
			<Card
				className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
				onClick={() => onClick(item.id)}
			>
				<CardHeader className="pb-2">
					<div
						className={`w-12 h-12 rounded-lg bg-linear-to-br ${
							item.gradient || "from-blue-500 to-indigo-600"
						} flex items-center justify-center mb-3`}
					>
						<Icon className="w-6 h-6 text-white" />
					</div>
					<CardTitle className="text-lg">{item.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						{item.description}
					</p>
				</CardContent>
			</Card>
		);
	}

	if (variant === "compact") {
		return (
			<Card
				className={`cursor-pointer hover:shadow-md transition-all hover:border-${accentColor}-300 dark:hover:border-${accentColor}-700 group`}
				onClick={() => onClick(item.id)}
			>
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<div
							className={`p-2 bg-${accentColor}-100 dark:bg-${accentColor}-900/30 rounded-lg`}
						>
							<Icon
								className={`w-5 h-5 text-${accentColor}-600 dark:text-${accentColor}-400`}
							/>
						</div>
						<Eye
							className={`w-4 h-4 text-gray-400 group-hover:text-${accentColor}-500 transition-colors`}
						/>
					</div>
				</CardHeader>
				<CardContent>
					<CardTitle
						className={`text-base mb-1 group-hover:text-${accentColor}-600 dark:group-hover:text-${accentColor}-400 transition-colors`}
					>
						{item.title}
					</CardTitle>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						{item.description}
					</p>
				</CardContent>
			</Card>
		);
	}

	// Default variant
	return (
		<Card
			className="cursor-pointer hover:shadow-lg transition-shadow"
			onClick={() => onClick(item.id)}
		>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Icon
						className={`h-5 w-5 text-${accentColor}-500`}
						style={{
							color: `var(--${accentColor}-500, currentColor)`,
						}}
					/>
					{item.title}
				</CardTitle>
				<p className="text-sm text-muted-foreground">
					{item.description}
				</p>
			</CardHeader>
			{item.value && (
				<CardContent>
					<p className="text-2xl font-bold">{item.value}</p>
				</CardContent>
			)}
		</Card>
	);
}

interface QuickAccessGridProps {
	items: QuickAccessItem[];
	onItemClick: (id: string) => void;
	variant?: "default" | "elevated" | "compact";
	columns?: 2 | 3 | 4 | 5 | 6;
	accentColor?: string;
}

export function QuickAccessGrid({
	items,
	onItemClick,
	variant = "default",
	columns = 3,
	accentColor = "purple",
}: QuickAccessGridProps) {
	const gridCols = {
		2: "md:grid-cols-2",
		3: "md:grid-cols-2 lg:grid-cols-3",
		4: "md:grid-cols-2 lg:grid-cols-4",
		5: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
		6: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
	};

	return (
		<div className={`grid gap-4 ${gridCols[columns]}`}>
			{items.map((item) => (
				<QuickAccessCard
					key={item.id}
					item={item}
					onClick={onItemClick}
					variant={variant}
					accentColor={accentColor}
				/>
			))}
		</div>
	);
}
