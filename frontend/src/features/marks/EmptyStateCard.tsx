import { EmptyState } from "@/features/shared";

interface EmptyStateCardProps {
	title: string;
	description: string;
}

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
	return <EmptyState title={title} description={description} />;
}
