import { parseValueAndTooltipSegment } from './parserShared';

export function parseCandlestickData(lines: string[]): any {
    const data: any[] = [];
    const categories: string[] = [];
    for (const line of lines) {
        if (!line.includes(':')) continue;
        const splitIndex = line.indexOf(':');
        const date = line.slice(0, splitIndex).trim();
        const right = parseValueAndTooltipSegment(line.slice(splitIndex + 1));
        const values = right.valueText.split(',').map((part) => parseFloat(part.trim()) || 0);
        if (values.length >= 4) {
            categories.push(date);
            const tuple = values.slice(0, 4);
            data.push(right.tooltipText ? { name: date, value: tuple, __m1TooltipText: right.tooltipText } : tuple);
        }
    }
    return { categories, data };
}

export function parseBoxplotData(lines: string[]): any {
    const data: any[] = [];
    for (const line of lines) {
        const right = parseValueAndTooltipSegment(line);
        const values = right.valueText.split(',').map((part) => parseFloat(part.trim()) || 0);
        if (values.length >= 5) {
            const tuple = values.slice(0, 5);
            data.push(right.tooltipText ? { value: tuple, __m1TooltipText: right.tooltipText } : tuple);
        }
    }
    return { data };
}

export function parseParallelData(lines: string[]): any {
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

export function parseThemeRiverData(lines: string[]): any {
    const data: any[] = [];
    for (const line of lines) {
        const match = line.match(/^(.*?),\s*(.*?)\s*:\s*(.*)$/);
        if (!match) continue;
        const right = parseValueAndTooltipSegment(match[3].trim());
        const value = [match[1].trim(), parseFloat(right.valueText) || 0, match[2].trim()];
        data.push(right.tooltipText ? { value, __m1TooltipText: right.tooltipText } : value);
    }
    return { data };
}
