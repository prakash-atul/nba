import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { debugLogger } from "@/lib/debugLogger";
import { Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export function AdminDebugPanel() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [logs, setLogs] = useState(() => debugLogger.getLogs());

	const handleRefresh = () => {
		setLogs(debugLogger.getLogs());
	};

	const handleClear = () => {
		debugLogger.clearLogs();
		setLogs([]);
	};

	const handleDownload = () => {
		debugLogger.downloadLogs();
	};

	const getLevelColor = (level: string) => {
		switch (level) {
			case "debug":
				return "bg-slate-100 text-slate-800";
			case "info":
				return "bg-blue-100 text-blue-800";
			case "warn":
				return "bg-yellow-100 text-yellow-800";
			case "error":
				return "bg-red-100 text-red-800";
			default:
				return "bg-slate-100 text-slate-800";
		}
	};

	return (
		<Card className="fixed bottom-4 right-4 w-96 shadow-lg border-slate-300">
			<CardHeader
				className="cursor-pointer pb-3"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<CardTitle className="text-sm">
								Debug Logs
							</CardTitle>
							<Badge variant="outline" className="text-xs">
								{logs.length}
							</Badge>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="h-auto p-0"
						onClick={(e) => {
							e.stopPropagation();
							setIsExpanded(!isExpanded);
						}}
					>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronUp className="h-4 w-4" />
						)}
					</Button>
				</div>
				<CardDescription className="text-xs mt-1">
					Development debugging tool - visible only in dev mode
				</CardDescription>
			</CardHeader>

			{isExpanded && (
				<>
					<CardContent className="pb-3 space-y-3">
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleRefresh}
								className="flex-1 text-xs"
							>
								Refresh
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleDownload}
								className="flex-1 text-xs"
							>
								<Download className="h-3 w-3 mr-1" />
								Export
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleClear}
								className="flex-1 text-xs"
							>
								<Trash2 className="h-3 w-3 mr-1" />
								Clear
							</Button>
						</div>

						<ScrollArea className="h-64 border rounded p-3 bg-slate-50">
							<div className="space-y-1">
								{logs.length === 0 ? (
									<p className="text-xs text-slate-500 text-center py-8">
										No logs yet
									</p>
								) : (
									logs.map((log, idx) => (
										<div
											key={idx}
											className="text-xs font-mono space-y-0.5 pb-1 border-b border-slate-200 last:border-b-0"
										>
											<div className="flex items-center gap-2">
												<Badge
													variant="secondary"
													className={`text-xs ${getLevelColor(log.level)}`}
												>
													{log.level.toUpperCase()}
												</Badge>
												<span className="text-slate-600">
													{log.timestamp}
												</span>
												<span className="font-semibold text-slate-700">
													{log.module}
												</span>
											</div>
											<div className="text-slate-700 ml-8">
												{log.message}
											</div>
											{log.data && (
												<details className="ml-8 mt-1">
													<summary className="cursor-pointer text-slate-500 hover:text-slate-700 text-xs">
														Data
													</summary>
													<pre className="text-xs bg-white p-1 mt-1 overflow-x-auto border border-slate-200 rounded max-h-20 overflow-y-auto">
														{JSON.stringify(
															log.data,
															null,
															2,
														)}
													</pre>
												</details>
											)}
										</div>
									))
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</>
			)}
		</Card>
	);
}
