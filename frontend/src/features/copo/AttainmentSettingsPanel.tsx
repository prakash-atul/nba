import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Save, Plus, Trash2, SlidersHorizontal, ListOrdered } from "lucide-react";
import type { AttainmentThreshold } from "./types";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

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

	const sortedThresholds = [...attainmentThresholds].sort(
		(a, b) => b.percentage - a.percentage,
	);

	return (
		<div className="flex flex-col gap-6 bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
						CO-PO Attainment Configuration
					</h1>
					<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
						Configure threshold levels and attainment targets for Course Outcomes.
					</p>
				</div>

				{/* Visualization Bar */}
				<div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl flex flex-col gap-4">
					<div className="flex justify-between items-center mb-2">
						<span className="text-base font-bold text-gray-900 dark:text-gray-100">
							Current Threshold Distribution
						</span>
						<span className="text-sm font-bold text-blue-600 dark:text-blue-400">
							Preview
						</span>
					</div>
					<div className="h-8 w-full flex rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
						{(() => {
							const sections: Array<{
								id: string | number;
								width: number;
								label: string;
								color: string;
							}> = [];

							const lowestThreshold = sortedThresholds[sortedThresholds.length - 1].percentage;
							
							// Below lowest (Level 0)
							sections.push({
								id: "level-0",
								width: lowestThreshold,
								label: `Below ${lowestThreshold}% (L0)`,
								color: "bg-red-400 dark:bg-red-500",
							});

							// Between thresholds
							for (let i = sortedThresholds.length - 1; i > 0; i--) {
								const current = sortedThresholds[i].percentage;
								const next = sortedThresholds[i - 1].percentage;
								const level = attainmentThresholds.length - i;
								sections.push({
									id: `level-${level}`,
									width: next - current,
									label: `${current}% - ${next}% (L${level})`,
									color: ["bg-orange-400 dark:bg-orange-500", "bg-yellow-400 dark:bg-yellow-500", "bg-lime-500 dark:bg-lime-600"][(sortedThresholds.length - 1 - i) % 3] || "bg-yellow-400 dark:bg-yellow-500",
								});
							}

							// Highest threshold to 100%
							const highestThreshold = sortedThresholds[0].percentage;
							const highestLevel = sortedThresholds.length;
							sections.push({
								id: `level-${highestLevel}`,
								width: 100 - highestThreshold,
								label: `≥ ${highestThreshold}% (L${highestLevel})`,
								color: "bg-green-500 dark:bg-green-600",
							});

							return sections.map((section) => (
								<div
									key={section.id}
									style={{ width: `${section.width}%` }}
									className={`${section.color} h-full flex items-center justify-center text-white font-bold text-xs px-2 truncate border-r border-white/20 last:border-r-0`}
									title={section.label}
								>
									{section.label}
								</div>
							));
						})()}
					</div>
				</div>
			</div>

			{/* Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Global Parameters */}
				<div className="lg:col-span-1 flex flex-col gap-6">
					<Card className="flex flex-col h-full shadow-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
						<CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4">
							<CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
								<SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-500" />
								Global Parameters
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 flex flex-col gap-6 flex-1">
							<div className="flex flex-col gap-4">
								<div className="flex justify-between items-center">
									<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
										Student Passing Threshold (%)
									</Label>
									<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
										{passingThreshold}%
									</span>
								</div>
								<Slider
									min={0}
									max={100}
									step={5}
									value={[passingThreshold]}
									onValueChange={(val) => setPassingThreshold(val[0])}
									className="py-4"
								/>
								<p className="text-xs font-medium text-gray-500 dark:text-gray-400">
									Minimum score for a student to be considered passed.
								</p>
							</div>
							
							<div className="flex flex-col gap-4">
								<div className="flex justify-between items-center">
									<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
										CO Attainment Target (%)
									</Label>
									<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
										{coThreshold}%
									</span>
								</div>
								<Slider
									min={0}
									max={100}
									step={5}
									value={[coThreshold]}
									onValueChange={(val) => setCoThreshold(val[0])}
									className="py-4"
								/>
								<p className="text-xs font-medium text-gray-500 dark:text-gray-400">
									Target percentage of students expected to pass.
								</p>
							</div>
						</CardContent>
						<div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
							<Button
								onClick={saveSettings}
								className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-lg flex items-center justify-center gap-2"
							>
								<Save className="h-5 w-5" />
								Save Parameters
							</Button>
						</div>
					</Card>
				</div>

				{/* Right Column: Attainment Level Settings */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					<Card className="flex flex-col h-full shadow-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
						<CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 flex flex-row justify-between items-center space-y-0">
							<CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
								<ListOrdered className="w-5 h-5 text-blue-600 dark:text-blue-500" />
								Attainment Level Settings
							</CardTitle>
							<Button
								onClick={addThreshold}
								variant="ghost"
								className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1 h-8 px-3"
							>
								<Plus className="h-4 w-4" />
								Add Level
							</Button>
						</CardHeader>
						<CardContent className="p-0 overflow-x-auto">
							<Table>
								<TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
									<TableRow className="border-b border-gray-200 dark:border-gray-800">
										<TableHead className="py-4 px-6 text-sm font-bold text-gray-500 dark:text-gray-400">Level</TableHead>
										<TableHead className="py-4 px-6 text-sm font-bold text-gray-500 dark:text-gray-400">Description</TableHead>
										<TableHead className="py-4 px-6 text-sm font-bold text-gray-500 dark:text-gray-400">Range (%)</TableHead>
										<TableHead className="py-4 px-6 text-sm font-bold text-gray-500 dark:text-gray-400 text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedThresholds.map((threshold, idx) => {
										const level = sortedThresholds.length - idx;
										const nextThreshold = sortedThresholds[idx - 1]?.percentage;
										
										// Descriptions based on level relation
										let description = "High Attainment";
										if (level === 1) description = "Low Attainment";
										else if (level > 1 && level < sortedThresholds.length) description = "Medium Attainment";

										// Level Badge colors
										const badgeColors = [
											"bg-green-500 text-white",
											"bg-lime-500 text-white",
											"bg-yellow-400 text-gray-900",
											"bg-orange-400 text-white",
											"bg-red-400 text-white"
										];
										const colorClass = badgeColors[idx % badgeColors.length] || "bg-gray-500 text-white";

										return (
											<TableRow key={threshold.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
												<TableCell className="py-4 px-6">
													<div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${colorClass}`}>
														{level}
													</div>
												</TableCell>
												<TableCell className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
													{description}
												</TableCell>
												<TableCell className="py-4 px-6">
													<div className="flex items-center gap-2">
														<span className="text-sm font-bold text-gray-500 dark:text-gray-400">≥</span>
														<Input
															type="number"
															min="0"
															max="100"
															value={threshold.percentage}
															onChange={(e) => updateThreshold(threshold.id, Number(e.target.value))}
															className="w-20 py-1 px-2 h-8 text-sm font-bold bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
														/>
														{nextThreshold !== undefined && (
															<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
																and &lt; {nextThreshold}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="py-4 px-6 text-right">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => removeThreshold(threshold.id)}
														disabled={attainmentThresholds.length <= 1}
														className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
									{/* Level 0 Row */}
									<TableRow className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
										<TableCell className="py-4 px-6">
											<div className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-red-600 text-white">
												0
											</div>
										</TableCell>
										<TableCell className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
											No Attainment
										</TableCell>
										<TableCell className="py-4 px-6">
											<div className="flex items-center gap-2">
												<span className="text-sm font-bold text-gray-500 dark:text-gray-400">&lt;</span>
												<Input
													type="number"
													disabled
													value={sortedThresholds[sortedThresholds.length - 1]?.percentage || 0}
													className="w-20 py-1 px-2 h-8 text-sm font-bold bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 cursor-not-allowed"
												/>
											</div>
										</TableCell>
										<TableCell className="py-4 px-6 text-right">
											<span className="text-sm font-medium italic text-gray-400">Default</span>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
