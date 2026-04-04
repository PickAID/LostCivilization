import type { ChartConfig } from './types';

export interface ChartLayoutMetrics {
    hasTitleBlock: boolean;
    titleTop: number;
    titleBlockHeight: number;
    legendTop: number;
    contentTop: number;
    pieCenterY: string;
    pieRadius: string;
    doughnutInnerRadius: string;
    doughnutOuterRadius: string;
    radarCenterY: string;
    radarRadius: string;
    gaugeCenterY: string;
    gaugeRadius: string;
    sunburstCenterY: string;
    sunburstInnerRadius: string;
    sunburstOuterRadius: string;
}

export function isPlainObject(value: unknown): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function deepMerge<T>(base: T, override: any): T {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override as T;
    }

    const result: Record<string, any> = { ...base };
    for (const [key, value] of Object.entries(override)) {
        if (value === undefined) continue;
        if (isPlainObject(result[key]) && isPlainObject(value)) {
            result[key] = deepMerge(result[key], value);
        } else if (Array.isArray(value)) {
            result[key] = value.map((item) => (isPlainObject(item) ? deepMerge({}, item) : item));
        } else {
            result[key] = value;
        }
    }
    return result as T;
}

export function mergeAxisOption(base: any, override: any): any {
    if (!override) return base;
    if (Array.isArray(override)) {
        if (Array.isArray(base)) {
            return override.map((item, index) =>
                isPlainObject(item) && isPlainObject(base[index]) ? deepMerge(base[index], item) : item,
            );
        }
        return override;
    }
    if (Array.isArray(base)) {
        return base.map((item) => (isPlainObject(item) ? deepMerge(item, override) : item));
    }
    if (isPlainObject(base) && isPlainObject(override)) {
        return deepMerge(base, override);
    }
    return override;
}

export function buildInitOptions(config: ChartConfig): Record<string, any> | undefined {
    const next = isPlainObject(config.initOptions) ? { ...config.initOptions } : {};
    if (config.renderer && !next.renderer) next.renderer = config.renderer;
    if (typeof config.devicePixelRatio === 'number' && Number.isFinite(config.devicePixelRatio)) {
        next.devicePixelRatio = config.devicePixelRatio;
    }
    if (typeof config.useDirtyRect === 'boolean') {
        next.useDirtyRect = config.useDirtyRect;
    }
    return Object.keys(next).length ? next : undefined;
}

export function buildUpdateOptions(config: ChartConfig): Record<string, any> | undefined {
    const next = isPlainObject(config.updateOptions) ? { ...config.updateOptions } : {};
    if (typeof config.notMerge === 'boolean') next.notMerge = config.notMerge;
    if (typeof config.lazyUpdate === 'boolean') next.lazyUpdate = config.lazyUpdate;
    return Object.keys(next).length ? next : undefined;
}

export function buildLoadingOptions(config: ChartConfig): Record<string, any> | undefined {
    return isPlainObject(config.loadingOptions) && Object.keys(config.loadingOptions).length
        ? config.loadingOptions
        : undefined;
}

export function buildAutoResize(config: ChartConfig): boolean | Record<string, any> {
    if (config.autoresize === undefined) return true;
    if (config.autoresize === false) return false;
    if (config.autoresize === true) return true;
    return isPlainObject(config.autoresize) ? config.autoresize : true;
}

export function encodeAttrValue(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function encodeJsonAttr(value: unknown): string {
    return JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function isAxisChart(chartType: string): boolean {
    return ['line', 'bar', 'area', 'scatter', 'heatmap', 'candlestick', 'k', 'boxplot', 'pictorialBar', 'parallel', 'themeRiver'].includes(chartType);
}

export function resolveTooltipTemplate(template?: string): string | undefined {
    const text = String(template || '').trim();
    if (!text) return undefined;
    return text
        .replace(/\{series\}/g, '{a}')
        .replace(/\{name\}/g, '{b}')
        .replace(/\{value\}/g, '{c}')
        .replace(/\{percent\}/g, '{d}');
}

export function resolveTreeLabelTemplate(config: ChartConfig): string {
    return config.treeShowValueInLabel ? '{b}: {c}' : '{b}';
}

export function computeChartLayout(config: ChartConfig): ChartLayoutMetrics {
    const titleTop = 10;
    const titleLines = countVisualLines(config.title);
    const subtitleLines = countVisualLines(config.subtitle);
    const hasTitleBlock = titleLines > 0 || subtitleLines > 0;
    const titleHeight = titleLines * 22;
    const subtitleHeight = subtitleLines * 18;
    const textGap = titleLines > 0 && subtitleLines > 0 ? 6 : 0;
    const titleBlockHeight = hasTitleBlock
        ? titleTop + titleHeight + textGap + subtitleHeight + 12
        : 0;
    const legendSpace = config.legend === false ? 0 : 28;
    const contentTop = hasTitleBlock
        ? Math.max(88, titleBlockHeight + legendSpace + 12)
        : 16;
    const contentDelta = Math.max(0, contentTop - 16);

    return {
        hasTitleBlock,
        titleTop,
        titleBlockHeight,
        legendTop: hasTitleBlock ? titleBlockHeight + 4 : 8,
        contentTop,
        pieCenterY: `${clamp(50 + contentDelta * 0.18, 50, 63)}%`,
        pieRadius: `${clamp(50 - contentDelta * 0.12, 38, 50)}%`,
        doughnutInnerRadius: `${clamp(40 - contentDelta * 0.08, 28, 40)}%`,
        doughnutOuterRadius: `${clamp(70 - contentDelta * 0.12, 52, 70)}%`,
        radarCenterY: `${clamp(52 + contentDelta * 0.18, 52, 64)}%`,
        radarRadius: `${clamp(72 - contentDelta * 0.16, 50, 72)}%`,
        gaugeCenterY: `${clamp(55 + contentDelta * 0.2, 55, 68)}%`,
        gaugeRadius: `${clamp(90 - contentDelta * 0.14, 68, 90)}%`,
        sunburstCenterY: `${clamp(50 + contentDelta * 0.18, 50, 64)}%`,
        sunburstInnerRadius: `${clamp(18 + contentDelta * 0.08, 18, 28)}%`,
        sunburstOuterRadius: `${clamp(90 - contentDelta * 0.18, 62, 90)}%`,
    };
}

function countVisualLines(input?: unknown): number {
    if (typeof input !== 'string') {
        return 0;
    }
    const normalized = input
        .replace(/<br\s*\/?>/gi, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    return normalized.length;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Math.round(value)));
}
