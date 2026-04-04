import { type ChartLayoutMetrics } from '../helpers';
import type { ChartConfig } from '../types';

function tupleValue(entry: any): any[] {
    if (Array.isArray(entry)) return entry;
    if (entry && typeof entry === 'object' && Array.isArray(entry.value)) return entry.value;
    return [];
}

function orderedUnique(values: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const value of values) {
        const key = JSON.stringify(value);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(value);
    }
    return result;
}

function buildHeatmapModel(entries: any[]): { xValues: any[]; yValues: any[]; cells: any[]; maxValue: number } {
    const tuples = entries
        .map((entry) => ({ entry, tuple: tupleValue(entry) }))
        .filter(({ tuple }) => tuple.length >= 3);
    const xValues = orderedUnique(tuples.map(({ tuple }) => tuple[0]));
    const yValues = orderedUnique(tuples.map(({ tuple }) => tuple[1]));
    const xIndexMap = new Map(xValues.map((value, index) => [JSON.stringify(value), index]));
    const yIndexMap = new Map(yValues.map((value, index) => [JSON.stringify(value), index]));

    const cells = tuples.map(({ entry, tuple }) => {
        const xValue = tuple[0];
        const yValue = tuple[1];
        const cellValue = tuple[2];
        const dataEntry = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
        return {
            ...dataEntry,
            name: `${xValue}, ${yValue}`,
            value: [
                xIndexMap.get(JSON.stringify(xValue)) ?? 0,
                yIndexMap.get(JSON.stringify(yValue)) ?? 0,
                cellValue,
            ],
            __m1XAxis: xValue,
            __m1YAxis: yValue,
            __m1CellValue: cellValue,
        };
    });

    const maxValue = cells.length
        ? Math.max(...cells.map((entry) => Number(entry.__m1CellValue)).filter((value) => Number.isFinite(value)))
        : 100;

    return { xValues, yValues, cells, maxValue: Number.isFinite(maxValue) ? maxValue : 100 };
}

export function buildBasicChartOptions(chartType: string, parsedData: any, config: ChartConfig, layout: ChartLayoutMetrics): any {
    const option: any = {};

    switch (chartType) {
        case 'line':
        case 'bar':
            option.xAxis = { type: 'category', data: parsedData.categories || [], axisLabel: { show: true }, axisTick: { show: true } };
            option.yAxis = { type: 'value', axisLabel: { show: true }, axisTick: { show: true } };
            option.series = (parsedData.series || []).map((series: any) => ({
                name: series.name,
                data: series.data,
                type: chartType,
                smooth: config.smooth || false,
            }));
            return option;
        case 'area':
            option.xAxis = { type: 'category', data: parsedData.categories || [], axisLabel: { show: true }, axisTick: { show: true } };
            option.yAxis = { type: 'value', axisLabel: { show: true }, axisTick: { show: true } };
            option.series = (parsedData.series || []).map((series: any) => ({
                name: series.name,
                data: series.data,
                type: 'line',
                areaStyle: {},
                smooth: config.smooth || false,
            }));
            return option;
        case 'pie':
        case 'doughnut':
            option.series = [{
                name: config.title || '数据分布',
                type: 'pie',
                radius: chartType === 'doughnut'
                    ? [layout.doughnutInnerRadius, layout.doughnutOuterRadius]
                    : layout.pieRadius,
                center: ['50%', layout.pieCenterY],
                data: parsedData.data,
            }];
            return option;
        case 'scatter':
            option.xAxis = { type: 'value', axisLabel: { show: true }, axisTick: { show: true } };
            option.yAxis = { type: 'value', axisLabel: { show: true }, axisTick: { show: true } };
            option.series = [{ name: '散点', type: 'scatter', data: parsedData.data, symbolSize: 8 }];
            return option;
        case 'radar':
            if (parsedData.indicators && parsedData.series) {
                const allValues = parsedData.series.flatMap((series: any) => series.value);
                const maxValue = Math.max(...allValues) * 1.2;
                option.radar = {
                    center: ['50%', layout.radarCenterY],
                    radius: layout.radarRadius,
                    indicator: parsedData.indicators.map((name: string) => ({ name, max: maxValue })),
                };
                option.series = [{ type: 'radar', data: parsedData.series }];
            }
            return option;
        case 'gauge':
            option.series = [{
                type: 'gauge',
                center: ['50%', layout.gaugeCenterY],
                radius: layout.gaugeRadius,
                data: parsedData.data,
            }];
            return option;
        case 'funnel':
            option.series = [{
                type: 'funnel',
                top: layout.contentTop + 12,
                bottom: 20,
                left: '10%',
                width: '80%',
                data: parsedData.data ? parsedData.data.sort((a: any, b: any) => b.value - a.value) : [],
            }];
            return option;
        case 'heatmap':
            const heatmap = buildHeatmapModel(parsedData.data || []);
            option.grid = { left: '16%', right: '10%', bottom: '6%', top: layout.contentTop, containLabel: true };
            option.xAxis = {
                type: 'category',
                data: heatmap.xValues,
                axisLabel: { margin: 10 },
                splitArea: { show: true },
            };
            option.yAxis = {
                type: 'category',
                data: heatmap.yValues,
                axisLabel: { margin: 14 },
                splitArea: { show: true },
            };
            option.visualMap = {
                min: 0,
                max: heatmap.maxValue,
                calculable: true,
                orient: 'vertical',
                left: 24,
                top: 'center',
            };
            option.series = [{
                name: '热力图',
                type: 'heatmap',
                data: heatmap.cells,
                label: {
                    show: true,
                    formatter: (params: any) => {
                        const tuple = tupleValue(params?.data);
                        const cellValue = tuple.length > 2 ? tuple[2] : undefined;
                        return cellValue == null ? '' : String(cellValue);
                    },
                },
                emphasis: {
                    focus: 'self',
                    itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.35)' },
                },
            }];
            return option;
        default:
            return option;
    }
}
