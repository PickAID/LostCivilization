import { parseValueAndTooltipSegment } from './parserShared';

export function parseLineBarData(lines: string[]): any {
    const result: any = { categories: [], series: [] };

    for (const line of lines) {
        if (line.includes('|')) {
            const separatorIndex = line.indexOf('|');
            const seriesName = line.slice(0, separatorIndex).trim();
            const dataStr = line.slice(separatorIndex + 1).trim();
            const dataPoints = new Map<string, any>();
            for (const pair of dataStr.split(',').map((part) => part.trim())) {
                const splitIndex = pair.indexOf(':');
                if (splitIndex === -1) continue;
                const cat = pair.slice(0, splitIndex).trim();
                const right = parseValueAndTooltipSegment(pair.slice(splitIndex + 1));
                dataPoints.set(
                    cat,
                    right.tooltipText
                        ? { value: parseFloat(right.valueText) || 0, __m1TooltipText: right.tooltipText }
                        : parseFloat(right.valueText) || 0,
                );
                if (!result.categories.includes(cat)) result.categories.push(cat);
            }
            result.series.push({ name: seriesName, data: [], dataPoints });
            continue;
        }
        if (line.includes(':')) {
            const splitIndex = line.indexOf(':');
            const cat = line.slice(0, splitIndex).trim();
            const right = parseValueAndTooltipSegment(line.slice(splitIndex + 1));
            result.categories.push(cat);
            if (result.series.length === 0) result.series.push({ name: 'Series 1', data: [] });
            result.series[0].data.push(
                right.tooltipText
                    ? { value: parseFloat(right.valueText) || 0, __m1TooltipText: right.tooltipText }
                    : parseFloat(right.valueText) || 0,
            );
        }
    }

    for (const series of result.series) {
        if (series.dataPoints) {
            series.data = result.categories.map((cat: string) => series.dataPoints.get(cat) ?? 0);
            delete series.dataPoints;
        }
    }
    return result;
}

export function parsePieData(lines: string[]): any {
    const data: any[] = [];
    for (const line of lines) {
        if (!line.includes(':')) continue;
        const splitIndex = line.indexOf(':');
        const name = line.slice(0, splitIndex).trim();
        const right = parseValueAndTooltipSegment(line.slice(splitIndex + 1));
        data.push({
            name,
            value: parseFloat(right.valueText) || 0,
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
        });
    }
    return { data };
}

export function parseScatterData(lines: string[]): any {
    const data: any[] = [];
    for (const line of lines) {
        const right = parseValueAndTooltipSegment(line);
        const values = right.valueText.split(',').map((part) => parseFloat(part.trim()) || 0);
        if (values.length >= 2) {
            data.push(right.tooltipText ? { value: values, __m1TooltipText: right.tooltipText } : values);
        }
    }
    return { data };
}

export function parseRadarData(lines: string[]): any {
    const result: any = { indicators: [], series: [] };
    const allIndicators = new Set<string>();
    const seriesData = new Map<string, Map<string, number>>();

    for (const line of lines) {
        if (!line.includes('|')) continue;
        const [seriesName, dataStr] = line.split('|').map((part) => part.trim());
        const dataPoints = new Map<string, number>();
        for (const pair of dataStr.split(',').map((part) => part.trim())) {
            const [indicator, val] = pair.split(':').map((part) => part.trim());
            allIndicators.add(indicator);
            dataPoints.set(indicator, parseFloat(val) || 0);
        }
        seriesData.set(seriesName, dataPoints);
    }

    result.indicators = Array.from(allIndicators);
    for (const [seriesName, dataMap] of seriesData) {
        result.series.push({
            name: seriesName,
            value: result.indicators.map((indicator: string) => dataMap.get(indicator) || 0),
        });
    }
    return result;
}

export function parseGaugeData(lines: string[]): any {
    const right = parseValueAndTooltipSegment(lines[0] || '0');
    const value = parseFloat(right.valueText) || 0;
    return {
        data: [{
            value,
            name: 'Score',
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
        }],
    };
}

export function parseFunnelData(lines: string[]): any {
    const data: any[] = [];
    for (const line of lines) {
        if (!line.includes(':')) continue;
        const splitIndex = line.indexOf(':');
        const name = line.slice(0, splitIndex).trim();
        const right = parseValueAndTooltipSegment(line.slice(splitIndex + 1));
        data.push({
            name,
            value: parseFloat(right.valueText) || 0,
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
        });
    }
    return { data };
}
