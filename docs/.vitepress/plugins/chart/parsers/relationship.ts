import { detectIndentUnit, normalizeIndentedLine, parseValueAndTooltipSegment, splitOnce } from './parserShared';

export function parseHeatmapData(lines: string[]): any {
    const data: any[] = [];
    for (const line of lines) {
        const right = parseValueAndTooltipSegment(line);
        const values = right.valueText.split(',').map((part) => parseFloat(part.trim()) || 0);
        if (values.length >= 3) {
            const tuple = values.slice(0, 3);
            data.push(right.tooltipText ? { value: tuple, __m1TooltipText: right.tooltipText } : tuple);
        }
    }
    return { data };
}

export function parseSankeyData(lines: string[]): any {
    const nodeSet = new Set<string>();
    const links: any[] = [];
    for (const line of lines) {
        const match = line.match(/^(.*?)\s*->\s*(.*?)(?:\s*:\s*(.*))?$/);
        if (!match) continue;
        const source = match[1].trim();
        const target = match[2].trim();
        const right = parseValueAndTooltipSegment((match[3] || '1').trim());
        const value = parseFloat(right.valueText) || 1;
        nodeSet.add(source);
        nodeSet.add(target);
        links.push({
            source,
            target,
            value,
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
        });
    }
    return { data: Array.from(nodeSet).map((name) => ({ name })), links };
}

export function parseGraphData(lines: string[]): any {
    const nodeMap = new Map<string, any>();
    const links: any[] = [];
    for (const line of lines) {
        const match = line.match(/^(.*?)\s*->\s*(.*?)\s*:\s*(.*)$/);
        if (!match) continue;
        const source = match[1].trim();
        const target = match[2].trim();
        const right = parseValueAndTooltipSegment((match[3] || '1').trim());
        const value = parseFloat(right.valueText) || 1;
        if (!nodeMap.has(source)) nodeMap.set(source, { name: source, value: 1 });
        if (!nodeMap.has(target)) nodeMap.set(target, { name: target, value: 1 });
        links.push({
            source,
            target,
            value,
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
        });
    }
    return { data: Array.from(nodeMap.values()), links };
}

export function parseTreeData(lines: string[]): any {
    const root: any = { name: 'root', value: 0, children: [] };
    const stack: Array<{ level: number; node: any }> = [{ level: -1, node: root }];
    const indentUnit = detectIndentUnit(lines);

    for (const rawLine of lines) {
        if (!rawLine.trim()) continue;
        const line = normalizeIndentedLine(rawLine);
        const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
        const level = Math.max(0, Math.floor(leadingSpaces / indentUnit));
        const content = line.trim();
        const splitIndex = content.indexOf(':');
        const name = splitIndex >= 0 ? content.slice(0, splitIndex).trim() : content;
        const right = splitIndex >= 0 ? parseValueAndTooltipSegment(content.slice(splitIndex + 1)) : { valueText: '1', tooltipText: '' };
        const node = {
            name,
            value: parseFloat(right.valueText) || 1,
            collapsed: false,
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
            children: [],
        };

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }
        stack[stack.length - 1].node.children.push(node);
        stack.push({ level, node });
    }

    return root;
}

export function parsePictorialBarData(lines: string[]): any {
    const data: any[] = [];
    const categories: string[] = [];
    for (const line of lines) {
        if (!line.includes(':')) continue;
        const splitIndex = line.indexOf(':');
        const name = line.slice(0, splitIndex).trim();
        const right = parseValueAndTooltipSegment(line.slice(splitIndex + 1));
        categories.push(name);
        data.push({
            name,
            value: parseFloat(right.valueText) || 0,
            ...(right.tooltipText ? { __m1TooltipText: right.tooltipText } : {}),
        });
    }
    return { categories, data };
}
