export function normalizeIndentedLine(line: string): string {
    return String(line).replace(/\t/g, '    ');
}

export function detectIndentUnit(lines: string[]): number {
    const indents = lines
        .map((line) => {
            const normalized = normalizeIndentedLine(line);
            if (!normalized.trim()) return 0;
            return (normalized.match(/^\s*/) || [''])[0].length;
        })
        .filter((value) => value > 0);
    if (!indents.length) return 4;
    return Math.max(1, Math.min(...indents));
}

export function parseValueAndTooltipSegment(text: string): { valueText: string; tooltipText: string } {
    const raw = String(text || '');
    const pipeIndex = raw.indexOf('|');
    if (pipeIndex === -1) {
        return { valueText: raw.trim(), tooltipText: '' };
    }
    return {
        valueText: raw.slice(0, pipeIndex).trim(),
        tooltipText: raw.slice(pipeIndex + 1).trim(),
    };
}

export function splitOnce(text: string, marker: string): [string, string] | null {
    const index = text.indexOf(marker);
    if (index === -1) return null;
    return [text.slice(0, index), text.slice(index + marker.length)];
}
