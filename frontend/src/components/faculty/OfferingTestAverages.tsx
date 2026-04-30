import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { facultyApi } from "@/services/api/faculty";
import type { TestAverage } from "@/services/api/types";

// ── Test type colour map ─────────────────────────────────────────────────────
const TEST_TYPE_COLORS: Record<string, string> = {
	"Mid Sem":
		"bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
	"End Sem":
		"bg-rose-50   text-rose-700   dark:bg-rose-950   dark:text-rose-300   border-rose-200   dark:border-rose-800",
	Assignment:
		"bg-amber-50  text-amber-700  dark:bg-amber-950  dark:text-amber-300  border-amber-200  dark:border-amber-800",
	Quiz: "bg-sky-50    text-sky-700    dark:bg-sky-950    dark:text-sky-300    border-sky-200    dark:border-sky-800",
};

/** Expanded sub-row: lazy-loads per-test averages for a course offering */
export function OfferingTestAverages({ offeringId }: { offeringId: number }) {
	const [averages, setAverages] = useState<TestAverage[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await facultyApi.getOfferingTestAverages(offeringId);
			setAverages(res);
		} catch {
			setError("Failed to load averages");
		} finally {
			setLoading(false);
		}
	}, [offeringId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 px-6 py-3 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading test averages…
			</div>
		);
	}
	if (error) {
		return (
			<div className="px-6 py-3 text-sm text-destructive">{error}</div>
		);
	}
	if (!averages || averages.length === 0) {
		return (
			<div className="px-6 py-3 text-sm text-muted-foreground">
				No tests found for this offering.
			</div>
		);
	}

	return (
		<div className="px-6 py-3">
			<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				Per-Test Averages
			</p>
			<div className="flex flex-wrap gap-3">
				{averages.map((t) => {
					const colorCls =
						TEST_TYPE_COLORS[t.test_type] ??
						"bg-gray-50 text-gray-600 border-gray-200";
					const pct = t.avg_pct != null ? `${t.avg_pct}%` : "—";
					const marks =
						t.avg_marks != null
							? `${t.avg_marks} / ${t.full_marks}`
							: `— / ${t.full_marks}`;
					return (
						<div
							key={t.test_id}
							className="flex flex-col gap-1 rounded-lg border bg-white dark:bg-slate-900 p-3 min-w-[140px]"
						>
							<div className="flex items-center justify-between gap-2">
								<Badge
									variant="secondary"
									className={`text-[10px] ${colorCls}`}
								>
									{t.test_type}
								</Badge>
								<span className="text-xs text-muted-foreground">
									{t.students_assessed} students
								</span>
							</div>
							<p
								className="text-sm font-medium truncate"
								title={t.test_name}
							>
								{t.test_name}
							</p>
							<div className="flex items-baseline gap-1">
								<span className="text-lg font-bold tabular-nums">
									{pct}
								</span>
								<span className="text-xs text-muted-foreground">
									({marks})
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
