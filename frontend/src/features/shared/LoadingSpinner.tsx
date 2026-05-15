import { RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	color?: string;
	className?: string;
}

export function LoadingSpinner({
	size = "md",
	color = "text-blue-500",
	className = "",
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-8 h-8",
		lg: "w-12 h-12",
	};

	return (
		<RefreshCw
			className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}
		/>
	);
}

interface LoadingContainerProps {
	isLoading: boolean;
	children: React.ReactNode;
	spinnerColor?: string;
	minHeight?: string;
}

export function LoadingContainer({
	isLoading,
	children,
	spinnerColor = "text-blue-500",
	minHeight = "h-64",
}: LoadingContainerProps) {
	if (isLoading) {
		return (
			<div className={`flex items-center justify-center ${minHeight}`}>
				<LoadingSpinner color={spinnerColor} />
			</div>
		);
	}

	return <>{children}</>;
}

export function PageLoader({ color = "text-blue-500" }: { color?: string }) {
	return (
		<div className="flex items-center justify-center h-64">
			<LoadingSpinner size="lg" color={color} />
		</div>
	);
}
