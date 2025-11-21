// Utility functions for CO-PO Mapping
import type { AttainmentThreshold, AttainmentCriteria } from "./types";

export const getLevelColor = (level: number, maxLevel: number): string => {
	if (level === 0) return "bg-red-500 dark:bg-red-600 text-white";

	// Color gradient: green (high) to red (low)
	const colors = [
		"bg-green-500 dark:bg-green-600 text-white", // Highest
		"bg-lime-500 dark:bg-lime-600 text-white",
		"bg-yellow-400 dark:bg-yellow-500 text-gray-900",
		"bg-orange-400 dark:bg-orange-500 text-white",
		"bg-red-400 dark:bg-red-500 text-white", // Lowest
	];

	// Map level to color index (reverse: highest level gets first color)
	const colorIndex = Math.min(maxLevel - level, colors.length - 1);
	return colors[colorIndex] || "bg-gray-500 text-white";
};

export const getPercentageColor = (
	percentage: number,
	getAttainmentLevel: (percentage: number) => number,
	maxLevel: number
): string => {
	const level = getAttainmentLevel(percentage);
	return getLevelColor(level, maxLevel);
};

export const formatCriteriaRange = (
	minPct: number,
	maxPct: number | null
): string => {
	if (maxPct === null) {
		return `≥ ${minPct}%`;
	}
	return `${minPct}% - <${maxPct}%`;
};

export const getAttainmentCriteria = (
	attainmentThresholds: AttainmentThreshold[],
	zeroLevelThreshold: number
): AttainmentCriteria[] => {
	const sorted = [...attainmentThresholds].sort(
		(a, b) => b.percentage - a.percentage
	);
	const criteria = sorted.map((threshold, index) => ({
		id: threshold.id,
		minPercentage: threshold.percentage,
		maxPercentage: index > 0 ? sorted[index - 1].percentage : null,
		level: sorted.length - index, // Highest threshold gets highest level
	}));

	// Add Level 0 criteria (below zero level threshold)
	criteria.push({
		id: 0,
		minPercentage: 0,
		maxPercentage: zeroLevelThreshold,
		level: 0,
	});

	return criteria;
};

export const getAttainmentLevel = (
	percentage: number,
	attainmentThresholds: AttainmentThreshold[],
	zeroLevelThreshold: number
): number => {
	// Check if below zero level threshold first
	if (percentage < zeroLevelThreshold) {
		return 0;
	}

	const criteria = getAttainmentCriteria(
		attainmentThresholds,
		zeroLevelThreshold
	).filter((c) => c.level > 0); // Exclude Level 0, already checked

	for (const c of criteria) {
		if (c.maxPercentage === null) {
			if (percentage >= c.minPercentage) return c.level;
		} else {
			if (percentage >= c.minPercentage && percentage < c.maxPercentage) {
				return c.level;
			}
		}
	}
	// If no criteria matched but >= zeroLevelThreshold, return level 1
	return percentage >= zeroLevelThreshold ? 1 : 0;
};
