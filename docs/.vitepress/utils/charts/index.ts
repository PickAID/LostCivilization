/**
 * Chart utilities for CryChicDoc
 */

import * as github from "./github";

export * from "./github";

export const chartPalettes = {
    light: ["#3eaf7c", "#2c3e50", "#e74c3c", "#f39c12", "#9b59b6"],
    dark: ["#4ade80", "#e5e7eb", "#ef4444", "#f59e0b", "#a855f7"],
} as const;

export const chartsUtils = {
    palettes: chartPalettes,
    github,
} as const;

export default chartsUtils;
