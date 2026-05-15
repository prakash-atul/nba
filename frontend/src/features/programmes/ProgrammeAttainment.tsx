import { useEffect, useMemo, useState } from "react";
import { attainmentApi } from "@/services/api/attainment";
import { debugLogger } from "@/lib/debugLogger";
import type { Programme, ProgrammeAttainmentResponse } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProgrammeAttainmentProps {
	programmes: Programme[];
}

export function ProgrammeAttainment({ programmes }: ProgrammeAttainmentProps) {
	const [selectedProgrammeId, setSelectedProgrammeId] = useState<number | null>(
		null,
	);
	const [batchYear, setBatchYear] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<ProgrammeAttainmentResponse | null>(null);

	useEffect(() => {
		if (!selectedProgrammeId && programmes.length > 0) {
			setSelectedProgrammeId(programmes[0].programme_id);
		}
	}, [programmes, selectedProgrammeId]);

	const selectedProgramme = useMemo(
		() =>
			programmes.find((p) => p.programme_id === selectedProgrammeId) || null,
		[programmes, selectedProgrammeId],
	);

	const loadAttainment = async () => {
		if (!selectedProgrammeId) return;
		setLoading(true);
		try {
			const response = await attainmentApi.getProgrammeAttainment(
				selectedProgrammeId,
				batchYear.trim() === "" ? undefined : Number(batchYear),
			);
			debugLogger.info("ProgrammeAttainment", "Data received", {
				programmeId: selectedProgrammeId,
				batchYear: response.batch_year,
				poCount: response.po_attainment?.length ?? 0,
				po_attainment: response.po_attainment?.map((p) => ({
					po: p.po_name,
					value: p.attainment_value,
				})),
			});
			setData(response);
		} catch (err) {
			debugLogger.error("ProgrammeAttainment", "Failed to load attainment", {
				programmeId: selectedProgrammeId,
				error: err instanceof Error ? err.message : String(err),
			});
			setData(null);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="p-4 space-y-4">
			<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<h3 className="text-lg font-semibold">Programme Attainment</h3>
					<p className="text-sm text-muted-foreground">
						PO averages from locked offerings.
					</p>
				</div>
				<div className="flex flex-col md:flex-row gap-3 md:items-end">
					<div className="space-y-1">
						<Label htmlFor="programme-select">Programme</Label>
						<select
							id="programme-select"
							className="h-10 rounded-md border border-input bg-background px-3 text-sm"
							value={selectedProgrammeId ?? ""}
							onChange={(e) => setSelectedProgrammeId(Number(e.target.value))}
						>
							{programmes.map((programme) => (
								<option
									key={programme.programme_id}
									value={programme.programme_id}
								>
									{programme.programme_code} - {programme.programme_name}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-1">
						<Label htmlFor="batch-year">Batch Year</Label>
						<Input
							id="batch-year"
							value={batchYear}
							onChange={(e) => setBatchYear(e.target.value)}
							placeholder="e.g. 2022"
						/>
					</div>
					<Button onClick={loadAttainment} disabled={loading || !selectedProgrammeId}>
						{loading ? "Loading..." : "Load"}
					</Button>
				</div>
			</div>

			{selectedProgramme && (
				<div className="text-sm text-muted-foreground">
					{selectedProgramme.programme_name}
					{data?.batch_year ? ` - Batch ${data.batch_year}` : " - All batches"}
				</div>
			)}

			<div className="rounded-md border overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-muted/40">
						<tr>
							<th className="text-left px-3 py-2">PO</th>
							<th className="text-left px-3 py-2">Attainment</th>
						</tr>
					</thead>
					<tbody>
						{data?.po_attainment?.length ? (
							data.po_attainment.map((po) => (
								<tr key={po.po_name} className="border-t">
									<td className="px-3 py-2 font-medium">{po.po_name}</td>
									<td className="px-3 py-2">{po.attainment_value.toFixed(2)}</td>
								</tr>
							))
						) : (
							<tr>
								<td className="px-3 py-4 text-muted-foreground" colSpan={2}>
									No attainment data available.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
