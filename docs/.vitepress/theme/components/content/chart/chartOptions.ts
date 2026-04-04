import { ChartThemeRuntime } from './chartTheme';
import { ChartTooltipRuntime } from './chartTooltip';
import { resolveDynamicTextFromCache } from '@utils/vitepress/runtime/text/dynamicText';

export class ChartOptionEnhancer {
    static enhance(options: any, paletteMode: 'light' | 'dark' | null): any {
        if (!options || !paletteMode) return options || {};
        const theme = paletteMode === 'dark' ? ChartThemeRuntime.presets.dark : ChartThemeRuntime.presets.light;
        const baseOptions = this.normalizeTextValues(options);
        const palette = this.resolvePalette(baseOptions, paletteMode, theme.colors);

        if (!baseOptions.backgroundColor) baseOptions.backgroundColor = theme.backgroundColor;
        if (!baseOptions.textStyle) baseOptions.textStyle = { color: theme.textColor };
        if (palette.length) baseOptions.color = palette;
        else if (!baseOptions.color) baseOptions.color = theme.colors;
        if (baseOptions.visualMap && palette.length) {
            baseOptions.visualMap = {
                ...baseOptions.visualMap,
                inRange: {
                    ...(this.isPlainObject(baseOptions.visualMap.inRange) ? baseOptions.visualMap.inRange : {}),
                    color: palette,
                },
            };
        }
        this.applyIndexedItemColors(baseOptions);

        if (baseOptions.series) {
            baseOptions.series = baseOptions.series.map((series: any) => ({
                ...series,
                textStyle: series?.textStyle ? { color: theme.textColor, ...series.textStyle } : undefined,
            }));
        }
        if (baseOptions.title) {
            baseOptions.title = {
                ...baseOptions.title,
                textStyle: { color: theme.textColor, ...baseOptions.title.textStyle },
                subtextStyle: { color: theme.axisColor, ...baseOptions.title.subtextStyle },
            };
        }
        if (baseOptions.legend) {
            baseOptions.legend = {
                ...baseOptions.legend,
                textStyle: { color: theme.textColor, ...baseOptions.legend.textStyle },
            };
        }
        if (baseOptions.tooltip) {
            const formatter = ChartTooltipRuntime.createCustomTooltipFormatter(
                baseOptions.tooltip,
                ChartTooltipRuntime.hasCustomDataTooltip(baseOptions),
            );
            baseOptions.tooltip = {
                backgroundColor: paletteMode === 'dark' ? '#424242' : '#ffffff',
                borderColor: theme.axisColor,
                textStyle: { color: theme.textColor },
                ...baseOptions.tooltip,
            };
            if (formatter) baseOptions.tooltip.formatter = formatter;
            delete baseOptions.tooltip.__m1Template;
            delete baseOptions.tooltip.__m1Rules;
            delete baseOptions.tooltip.__m1Overrides;
        }
        if (baseOptions.radar?.axisName) {
            baseOptions.radar = {
                ...baseOptions.radar,
                axisName: { color: theme.textColor, ...baseOptions.radar.axisName },
            };
        }
        if (baseOptions.visualMap) {
            baseOptions.visualMap = {
                ...baseOptions.visualMap,
                textStyle: { color: theme.textColor, ...baseOptions.visualMap.textStyle },
            };
            delete baseOptions.visualMap.__m1PaletteAware;
        }
        if (baseOptions.xAxis) {
            const axes = Array.isArray(baseOptions.xAxis) ? baseOptions.xAxis : [baseOptions.xAxis];
            baseOptions.xAxis = axes.map((axis: any) => this.enhanceAxis(axis, theme));
        }
        if (baseOptions.yAxis) {
            const axes = Array.isArray(baseOptions.yAxis) ? baseOptions.yAxis : [baseOptions.yAxis];
            baseOptions.yAxis = axes.map((axis: any) => this.enhanceAxis(axis, theme));
        }
        if (baseOptions.parallelAxis) {
            baseOptions.parallelAxis = baseOptions.parallelAxis.map((axis: any) => ({
                ...axis,
                axisLabel: { color: theme.textColor, ...axis?.axisLabel },
                axisLine: { ...axis?.axisLine, lineStyle: { color: theme.axisColor, ...axis?.axisLine?.lineStyle } },
            }));
        }
        delete baseOptions.__m1Palettes;
        return baseOptions;
    }

    static resolveComputedHeight(options: any, height: string): string {
        const isRadarChart = options?.radar || (options?.series && options?.series[0]?.type === 'radar');
        return isRadarChart && height === '400px' ? '500px' : height;
    }

    private static applyIndexedItemColors(option: any): void {
        const palette = Array.isArray(option?.color) ? option.color : [];
        if (!palette.length || !Array.isArray(option?.series)) return;
        option.series = option.series.map((series: any) => {
            if (!this.isPlainObject(series) || !['pie', 'funnel', 'pictorialBar'].includes(series.type) || !Array.isArray(series.data)) {
                return series;
            }
            return {
                ...series,
                data: series.data.map((item: any, index: number) => {
                    if (!this.isPlainObject(item)) return item;
                    if (this.isPlainObject(item.itemStyle) && item.itemStyle.color) return item;
                    return {
                        ...item,
                        itemStyle: {
                            ...(this.isPlainObject(item.itemStyle) ? item.itemStyle : {}),
                            color: palette[index % palette.length],
                        },
                    };
                }),
            };
        });
    }

    private static resolvePalette(option: any, paletteMode: 'light' | 'dark', fallbackPalette: string[]): string[] {
        const configured = this.isPlainObject(option?.__m1Palettes) ? option.__m1Palettes : null;
        if (!configured) return Array.isArray(option?.color) ? option.color : fallbackPalette;
        const active = Array.isArray(configured[paletteMode]) ? configured[paletteMode] : [];
        if (active.length) return active;
        const otherMode = paletteMode === 'dark' ? 'light' : 'dark';
        const fallback = Array.isArray(configured[otherMode]) ? configured[otherMode] : [];
        if (fallback.length) return fallback;
        return Array.isArray(option?.color) ? option.color : fallbackPalette;
    }

    private static enhanceAxis(axis: any, theme: any): any {
        return {
            ...axis,
            axisLabel: { color: theme.textColor, ...axis?.axisLabel },
            axisLine: { ...axis?.axisLine, lineStyle: { color: theme.axisColor, ...axis?.axisLine?.lineStyle } },
            splitLine: { ...axis?.splitLine, lineStyle: { color: theme.gridColor, ...axis?.splitLine?.lineStyle } },
        };
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    private static normalizeTextValues(value: any): any {
        if (typeof value === 'string') {
            return resolveDynamicTextFromCache(value.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n'));
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.normalizeTextValues(item));
        }
        if (this.isPlainObject(value)) {
            return Object.fromEntries(
                Object.entries(value).map(([key, item]) => [key, this.normalizeTextValues(item)]),
            );
        }
        return value;
    }
}
