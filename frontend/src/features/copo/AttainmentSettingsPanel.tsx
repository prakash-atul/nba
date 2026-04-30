import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2 } from "lucide-react";
import type { AttainmentThreshold } from "./types";

interface AttainmentSettingsPanelProps {
	showSettings: boolean;
	coThreshold: number;
	setCoThreshold: (value: number) => void;
	passingThreshold: number;
	setPassingThreshold: (value: number) => void;
	attainmentThresholds: AttainmentThreshold[];
	addThreshold: () => void;
	updateThreshold: (id: number, value: number) => void;
	removeThreshold: (id: number) => void;
	saveSettings: () => void;
}

export function AttainmentSettingsPanel({
	showSettings,
	coThreshold,
	setCoThreshold,
	passingThreshold,
	setPassingThreshold,
	attainmentThresholds,
	addThreshold,
	updateThreshold,
	removeThreshold,
	saveSettings,
}: AttainmentSettingsPanelProps) {
	if (!showSettings) return null;

	return (
		<Card className="border-2 border-blue-500 dark:border-blue-700">
			<CardHeader className="bg-blue-50 dark:bg-blue-950">
				<CardTitle className="text-lg flex items-center justify-between">
					<span>Attainment Configuration</span>
					<Button
						onClick={saveSettings}
						size="sm"
						className="flex items-center gap-2"
					>
						<Save className="h-4 w-4" />
						Save Settings
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-6 space-y-6">
				{/* Passing Thresholds */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="coThreshold">
							CO Attainment Threshold (%)
						</Label>
						<Input
							id="coThreshold"
							type="number"
							min="0"
							max="100"
							value={coThreshold}
							onChange={(e) =>
								setCoThreshold(Number(e.target.value))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="passingThreshold">
							Student Passing Threshold (%)
						</Label>
						<Input
							id="passingThreshold"
							type="number"
							min="0"
							max="100"
							value={passingThreshold}
							onChange={(e) =>
								setPassingThreshold(Number(e.target.value))
							}
						/>
					</div>
				</div>

				{/* Attainment Level Thresholds */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label className="text-base font-semibold">
								Attainment Level Thresholds
							</Label>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Define percentage thresholds in descending
								order. Levels are auto-assigned.
							</p>
						</div>
						<Button
							onClick={addThreshold}
							size="sm"
							variant="outline"
							className="flex items-center gap-2"
						>
							<Plus className="h-4 w-4" />
							Add Threshold
						</Button>
					</div>

					{/* Visual Bar Representation */}
					<div className="space-y-3">
						<div className="relative h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex">
							{(() => {
								const sorted = [...attainmentThresholds].sort(
									(a, b) => b.percentage - a.percentage,
								); // Descending: high to low

								// Green to red colors (for high to low levels)
								const colors = [
									"bg-green-500 dark:bg-green-600",
									"bg-lime-500 dark:bg-lime-600",
									"bg-yellow-400 dark:bg-yellow-500",
									"bg-orange-400 dark:bg-orange-500",
									"bg-red-400 dark:bg-red-500",
									"bg-red-600 dark:bg-red-700",
								];

								const sections: Array<{
									id: number | string;
									width: number;
									level: number;
									color: string;
								}> = [];

								// Build sections from 100% to 0%
								// First section: 100% to highest threshold
								const highestThreshold = sorted[0].percentage;
								sections.push({
									id: `top-${sorted[0].id}`,
									width: 100 - highestThreshold,
									level: sorted.length,
									color: colors[0],
								});

								// Middle sections: between thresholds
								for (let i = 0; i < sorted.length - 1; i++) {
									const currentThreshold =
										sorted[i].percentage;
									const nextThreshold =
										sorted[i + 1].percentage;
									sections.push({
										id: sorted[i].id,
										width: currentThreshold - nextThreshold,
										level: sorted.length - i - 1,
										color: colors[
											Math.min(i + 1, colors.length - 1)
										],
									});
								}

								// Last section: lowest threshold to 0% (Level 0)
								const lowestThreshold =
									sorted[sorted.length - 1].percentage;
								sections.push({
									id: `level-0`,
									width: lowestThreshold,
									level: 0,
									color: "bg-red-600 dark:bg-red-700",
								});

								return sections.map((section) => (
									<div
										key={section.id}
										style={{
											width: `${section.width}%`,
										}}
										className={`${section.color} flex items-center justify-center text-white font-bold text-sm border-r-2 border-white dark:border-gray-900`}
									>
										L{section.level}
									</div>
								));
							})()}
						</div>
						<div className="relative h-6">
							{/* 100% label at the start */}
							<span className="absolute left-0 text-xs text-gray-600 dark:text-gray-400 font-medium">
								100%
							</span>
							{/* Threshold labels at their positions */}
							{[...attainmentThresholds]
								.sort((a, b) => b.percentage - a.percentage)
								.map((t) => (
									<span
										key={t.id}
										className="absolute text-xs font-medium text-green-600 dark:text-green-400 -translate-x-1/2"
										style={{
											left: `${100 - t.percentage}%`,
										}}
									>
										{t.percentage}%
									</span>
								))}
							{/* 0% label at the end */}
							<span className="absolute right-0 text-xs text-gray-600 dark:text-gray-400 font-medium">
								0%
							</span>
						</div>
					</div>

					{/* Threshold Inputs - Horizontal Pills */}
					<div className="flex flex-wrap gap-2">
						{[...attainmentThresholds]
							.sort((a, b) => b.percentage - a.percentage)
							.map((threshold, idx) => {
								const level = attainmentThresholds.length - idx;
								// Green to red gradient (high to low)
								const bgColors = [
									"bg-green-100 dark:bg-green-950 border-green-500 dark:border-green-600",
									"bg-lime-100 dark:bg-lime-950 border-lime-500 dark:border-lime-600",
									"bg-yellow-100 dark:bg-yellow-950 border-yellow-400 dark:border-yellow-500",
									"bg-orange-100 dark:bg-orange-950 border-orange-400 dark:border-orange-500",
									"bg-red-100 dark:bg-red-950 border-red-400 dark:border-red-500",
									"bg-red-200 dark:bg-red-900 border-red-600 dark:border-red-700",
								];
								return (
									<div
										key={threshold.id}
										className={`flex items-center gap-2 px-3 py-2 border-2 rounded-full ${
											bgColors[idx % bgColors.length]
										}`}
									>
										<Badge
											variant="secondary"
											className="text-xs font-bold px-2 py-0.5"
										>
											L{level}
										</Badge>
										<Input
											type="number"
											min="0"
											max="100"
											value={threshold.percentage}
											onChange={(e) =>
												updateThreshold(
													threshold.id,
													Number(e.target.value),
												)
											}
											className="w-16 h-8 text-center font-semibold text-sm border-0 bg-transparent"
											placeholder="%"
										/>
										<span className="text-xs text-gray-600 dark:text-gray-400">
											%
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												removeThreshold(threshold.id)
											}
											disabled={
												attainmentThresholds.length <= 1
											}
											className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-transparent"
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								);
							})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
