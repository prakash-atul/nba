import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "../../components/ui/sheet";
import { type AuditLog } from "../../services/api/audit";
import { format } from "date-fns";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import { Button } from "../../components/ui/button";

interface ViewDiffModalProps {
	log: AuditLog;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ViewDiffModal({ log, open, onOpenChange }: ViewDiffModalProps) {
	const parseJsonValue = (value: unknown): unknown => {
		let current = value;

		for (let i = 0; i < 3; i += 1) {
			if (typeof current !== "string") {
				return current;
			}

			const candidate = current.trim();
			if (!candidate) {
				return current;
			}

			try {
				current = JSON.parse(candidate);
			} catch {
				return current;
			}
		}

		return current;
	};

	const formatJson = (value: unknown): string => {
		if (value === null || value === undefined || value === "") {
			return "None";
		}

		const parsedValue = parseJsonValue(value);
		if (typeof parsedValue === "string") {
			return parsedValue;
		}

		return JSON.stringify(parsedValue, null, 2);
	};

	const actionVariant: Record<
		string,
		"default" | "secondary" | "destructive" | "outline"
	> = {
		CREATE: "default",
		UPDATE: "secondary",
		DELETE: "destructive",
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full gap-0 p-0 sm:max-w-2xl"
			>
				<SheetHeader className="border-b bg-muted/20 px-5 py-4 pr-12">
					<SheetTitle className="flex items-center gap-2 text-base">
						Audit Detail
						<Badge variant={actionVariant[log.action] || "outline"}>
							{log.action}
						</Badge>
					</SheetTitle>
					<SheetDescription>
						{format(new Date(log.created_at), "PP pp")} |{" "}
						{log.entity_type} | ID: {log.entity_id || "N/A"}
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className="h-[calc(100vh-9rem)]">
					<div className="space-y-6 px-5 py-5">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="space-y-1 rounded-md border bg-muted/20 p-3">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Actor
								</p>
								<p className="font-medium">
									{log.username || "System"} (
									{log.user_id || "N/A"})
								</p>
							</div>
							<div className="space-y-1 rounded-md border bg-muted/20 p-3">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Source IP
								</p>
								<p className="font-medium">
									{log.ip_address || "Unknown"}
								</p>
							</div>
						</div>

						<Separator />

						<div className="space-y-4">
							<div className="rounded-md border bg-muted/20 p-4">
								<div className="mb-2 flex items-center justify-between">
									<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										Previous State
									</h4>
								</div>
								<pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-all rounded bg-background p-3 font-mono text-xs leading-relaxed">
									{formatJson(log.old_values)}
								</pre>
							</div>

							<div className="rounded-md border bg-muted/20 p-4">
								<div className="mb-2 flex items-center justify-between">
									<h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										New State
									</h4>
								</div>
								<pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-all rounded bg-background p-3 font-mono text-xs leading-relaxed">
									{formatJson(log.new_values)}
								</pre>
							</div>
						</div>
					</div>
				</ScrollArea>

				<SheetFooter className="border-t bg-muted/20 px-5 py-3">
					<SheetClose asChild>
						<Button variant="outline" className="w-full sm:w-auto">
							Close
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
