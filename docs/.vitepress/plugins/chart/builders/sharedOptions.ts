import { deepMerge, isAxisChart, mergeAxisOption, resolveTooltipTemplate, type ChartLayoutMetrics } from '../helpers';
import type { ChartConfig } from '../types';

export function createBaseOption(config: ChartConfig): any {
    const option: any = {
        animation: config.animation !== false,
        animationDuration: typeof config.animationDuration === 'number' ? config.animationDuration : 750,
    };
    if (config.backgroundColor) {
        option.backgroundColor = config.backgroundColor;
    }
    return option;
}

export function applyTitleAndTooltip(option: any, chartType: string, config: ChartConfig, layout: ChartLayoutMetrics): void {
    if (config.title || config.subtitle || isObject(config.titleOptions)) {
        const baseTitle = {
            text: config.title,
            subtext: config.subtitle || '',
            left: 'center',
            top: layout.titleTop,
            padding: [0, 0, 0, 0],
            textStyle: { fontSize: 16, fontWeight: 'bold' },
            subtextStyle: { fontSize: 12, lineHeight: 18 },
        };
        option.title = isObject(config.titleOptions) ? deepMerge(baseTitle, config.titleOptions) : baseTitle;
    }

    const tooltipTrigger = config.tooltipTrigger === 'axis' || config.tooltipTrigger === 'item'
        ? config.tooltipTrigger
        : undefined;
    const tooltipTemplate = resolveTooltipTemplate(config.tooltipTemplate);

    if (config.tooltip !== false && ['pie', 'doughnut'].includes(chartType)) {
        option.tooltip = { trigger: tooltipTrigger || 'item', formatter: tooltipTemplate || '{b}: {c} ({d}%)' };
    } else if (config.tooltip !== false && chartType === 'radar') {
        option.tooltip = { trigger: tooltipTrigger || 'item' };
    } else if (config.tooltip !== false && chartType === 'gauge') {
        option.tooltip = { trigger: tooltipTrigger || 'item', formatter: '{a} <br/>{b}: {c}%' };
    } else if (config.tooltip !== false && ['heatmap', 'tree', 'treemap', 'sunburst', 'sankey', 'graph', 'funnel', 'parallel', 'themeRiver'].includes(chartType)) {
        option.tooltip = { trigger: tooltipTrigger || 'item' };
    } else if (config.tooltip !== false) {
        option.tooltip = { trigger: tooltipTrigger || 'axis', axisPointer: { type: 'shadow' } };
    }

    if (option.tooltip && tooltipTemplate) {
        option.tooltip.formatter = tooltipTemplate;
        option.tooltip.__m1Template = config.tooltipTemplate;
    }
    if (option.tooltip && Array.isArray(config.tooltipRules) && config.tooltipRules.length) {
        option.tooltip.__m1Rules = config.tooltipRules
            .filter((rule) => isObject(rule))
            .map((rule) => ({
                name: typeof rule.name === 'string' ? rule.name : '',
                series: typeof rule.series === 'string' ? rule.series : '',
                min: typeof rule.min === 'number' && Number.isFinite(rule.min) ? rule.min : undefined,
                max: typeof rule.max === 'number' && Number.isFinite(rule.max) ? rule.max : undefined,
                template: typeof rule.template === 'string' ? rule.template : '',
            }))
            .filter((rule) => rule.template || rule.name || rule.series || rule.min != null || rule.max != null);
    }
    if (option.tooltip && Array.isArray(config.tooltipOverrides) && config.tooltipOverrides.length) {
        option.tooltip.__m1Overrides = config.tooltipOverrides
            .filter((rule) => isObject(rule))
            .map((rule) => ({
                name: typeof rule.name === 'string' ? rule.name : '',
                series: typeof rule.series === 'string' ? rule.series : '',
                source: typeof rule.source === 'string' ? rule.source : '',
                target: typeof rule.target === 'string' ? rule.target : '',
                index: typeof rule.index === 'number' && Number.isFinite(rule.index) ? rule.index : undefined,
                seriesIndex: typeof rule.seriesIndex === 'number' && Number.isFinite(rule.seriesIndex) ? rule.seriesIndex : undefined,
                template: typeof rule.template === 'string' ? rule.template : '',
            }))
            .filter((rule) => rule.template || rule.name || rule.series || rule.source || rule.target || rule.index != null || rule.seriesIndex != null);
    }
    if (option.tooltip && isObject(config.tooltip)) {
        option.tooltip = deepMerge(option.tooltip, config.tooltip);
    }

    const hasLegendConfigObject = isObject(config.legend);
    const shouldShowLegend = config.legend !== false && (
        (option.series && option.series.length > 1) ||
        config.legend === true ||
        hasLegendConfigObject ||
        (chartType === 'radar' && option.series?.[0]?.data?.length > 1)
    );

    if (shouldShowLegend) {
        const legendData = chartType === 'radar'
            ? (option.series?.[0]?.data || []).map((item: any) => item.name).filter(Boolean)
            : (option.series || []).map((series: any) => series.name).filter(Boolean);
        const baseLegend = { top: layout.legendTop, left: 'center', data: legendData };
        option.legend = hasLegendConfigObject ? deepMerge(baseLegend, config.legend) : baseLegend;
    }
}

export function applyRuntimeFeatures(option: any, chartType: string, config: ChartConfig): any {
    const paletteConfig = normalizePaletteConfig(config.palette);
    const fallbackPalette = paletteConfig.light.length ? paletteConfig.light : paletteConfig.dark;
    if (fallbackPalette.length) {
        option.color = fallbackPalette;
        option.__m1Palettes = paletteConfig;
        if (chartType === 'heatmap' && option.visualMap) {
            option.visualMap = {
                ...option.visualMap,
                inRange: {
                    ...(isObject(option.visualMap.inRange) ? option.visualMap.inRange : {}),
                    color: fallbackPalette,
                },
            };
        }
    }

    if (config.toolbox) {
        const baseToolbox = {
            show: true,
            right: 12,
            feature: {
                saveAsImage: {},
                restore: {},
                ...(isAxisChart(chartType) ? { dataZoom: {} } : {}),
            },
        };
        option.toolbox = config.toolbox === true ? baseToolbox : deepMerge(baseToolbox, config.toolbox);
    }

    const wantsConvenienceDataZoom = config.dataZoom === true || config.dataZoomInside === true || config.dataZoomSlider === true;
    if (config.dataZoom || wantsConvenienceDataZoom) {
        const defaultDataZoom = [{ type: 'inside' }, { type: 'slider', bottom: 8 }];
        if (config.dataZoom === true || wantsConvenienceDataZoom) {
            if (!isAxisChart(chartType)) {
                option.dataZoom = undefined;
            } else {
                const features: any[] = [];
                const insideEnabled = config.dataZoomInside !== false && (config.dataZoom === true || config.dataZoomInside === true);
                const sliderEnabled = config.dataZoomSlider !== false && (config.dataZoom === true || config.dataZoomSlider === true);
                if (insideEnabled) features.push(defaultDataZoom[0]);
                if (sliderEnabled) features.push(defaultDataZoom[1]);
                option.dataZoom = features.length ? features : undefined;
            }
        } else if (Array.isArray(config.dataZoom)) {
            option.dataZoom = config.dataZoom;
        } else if (isObject(config.dataZoom)) {
            option.dataZoom = [deepMerge(defaultDataZoom[0], config.dataZoom)];
        }
    }

    if (config.aria) {
        option.aria = config.aria === true ? { enabled: true } : deepMerge({ enabled: true }, config.aria);
    }
    if (config.grid) option.grid = mergeAxisOption(option.grid, config.grid);
    if (config.xAxis) option.xAxis = mergeAxisOption(option.xAxis, config.xAxis);
    if (config.yAxis) option.yAxis = mergeAxisOption(option.yAxis, config.yAxis);
    if (config.visualMap) option.visualMap = deepMerge(option.visualMap || {}, config.visualMap);
    if (config.radar) option.radar = deepMerge(option.radar || {}, config.radar);
    if (config.parallel) option.parallel = deepMerge(option.parallel || {}, config.parallel);
    if (config.singleAxis) option.singleAxis = deepMerge(option.singleAxis || {}, config.singleAxis);
    if (config.seriesOptions && Array.isArray(option.series)) {
        if (Array.isArray(config.seriesOptions)) {
            option.series = option.series.map((series: any, index: number) =>
                isObject(config.seriesOptions?.[index]) ? deepMerge(series, config.seriesOptions[index]) : series,
            );
        } else if (isObject(config.seriesOptions)) {
            option.series = option.series.map((series: any) => deepMerge(series, config.seriesOptions));
        }
    }
    return isObject(config.option) ? deepMerge(option, config.option) : option;
}

function isObject(value: unknown): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePaletteConfig(palette: ChartConfig['palette']): { light: string[]; dark: string[] } {
    if (Array.isArray(palette)) {
        return { light: palette.slice(), dark: palette.slice() };
    }
    if (isObject(palette)) {
        return {
            light: Array.isArray(palette.light) ? palette.light.slice() : [],
            dark: Array.isArray(palette.dark) ? palette.dark.slice() : [],
        };
    }
    return { light: [], dark: [] };
}
