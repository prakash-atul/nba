import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ClipboardList, Search } from "lucide-react";
import type { Test } from "@/services/api";
import type { ReactNode } from "react";

interface TestInfoCardProps {
	test: Test;
	onSave: () => void;
	isSaving: boolean;
	isDisabled: boolean;
	extraActions?: ReactNode;
	children: ReactNode;
	searchTerm?: string;
	onSearch?: (value: string) => void;
	searchPlaceholder?: string;
}

export function TestInfoCard({
	test,
	onSave,
	isSaving,
	isDisabled,
	extraActions,
	children,
	searchTerm,
	onSearch,
	searchPlaceholder,
}: TestInfoCardProps) {
	return (
		<Card className="w-full gap-2 overflow-hidden">
			<CardHeader>
				<div className="flex flex-row items-center justify-between gap-4 flex-wrap">
					{/* Left: gradient icon + title */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
							<ClipboardList className="w-5 h-5 text-white" />
						</div>
						<div>
							<CardTitle>{test.name}</CardTitle>
							<p className="text-sm text-muted-foreground mt-0.5">
								Full Marks: {test.full_marks} | Pass Marks:{" "}
								{test.pass_marks}
							</p>
						</div>
					</div>

					{/* Right: search + actions + save */}
					<div className="flex items-center gap-2 shrink-0 flex-wrap">
						{onSearch && (
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
								<Input
									placeholder={
										searchPlaceholder ??
										"Search students..."
									}
									value={searchTerm ?? ""}
									onChange={(e) => onSearch(e.target.value)}
									className="pl-9 w-52"
								/>
							</div>
						)}
						{extraActions}
						<Button
							onClick={onSave}
							disabled={isSaving || isDisabled}
							className="gap-2"
						>
							<Save className="w-4 h-4" />
							{isSaving ? "Saving..." : "Save All Marks"}
						</Button>
					</div>
				</div>
			</CardHeader>
			{children}
		</Card>
	);
}
