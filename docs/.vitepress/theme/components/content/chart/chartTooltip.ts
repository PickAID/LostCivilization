import { resolveDynamicTextFromCache } from '@utils/vitepress/runtime/text/dynamicText';

export class ChartTooltipRuntime {
    static hasCustomDataTooltip(option: any): boolean {
        return Array.isArray(option?.series) && option.series.some((series: any) =>
            Array.isArray(series?.data) && series.data.some((item: any) => this.dataItemHasCustomTooltip(item)),
        );
    }

    static createCustomTooltipFormatter(tooltip: any, hasDataTooltip: boolean) {
        const template = this.normalizeTooltipTemplate(tooltip?.__m1Template);
        const rules = Array.isArray(tooltip?.__m1Rules)
            ? tooltip.__m1Rules.filter((rule: any) => this.isPlainObject(rule))
            : [];
        const overrides = Array.isArray(tooltip?.__m1Overrides)
            ? tooltip.__m1Overrides.filter((rule: any) => this.isPlainObject(rule))
            : [];
        if (!template && !rules.length && !overrides.length && !hasDataTooltip) return null;

        return (params: any) => {
            const items = Array.isArray(params) ? params : [params];
            return items
                .map((item) => {
                    const itemTooltip = this.normalizeTooltipTemplate(
                        item?.data?.__m1TooltipText || item?.data?.tooltipText,
                    );
                    if (itemTooltip) return this.renderTooltipTemplate(itemTooltip, item);

                    const override = overrides.find((rule: any) => this.matchesOverride(rule, item));
                    const overrideTemplate = this.normalizeTooltipTemplate(override?.template);
                    if (overrideTemplate) return this.renderTooltipTemplate(overrideTemplate, item);

                    const matchedRule = rules.find((rule: any) => this.matchesRule(rule, item));
                    const activeTemplate = this.normalizeTooltipTemplate(matchedRule?.template || template);
                    if (activeTemplate) return this.renderTooltipTemplate(activeTemplate, item);
                    return this.defaultTooltipLine(item);
                })
                .filter(Boolean)
                .join('<br/>');
        };
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    private static escapeTooltipHtml(value: unknown): string {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private static stringifyTooltipValue(value: any): string {
        if (Array.isArray(value)) return value.map((part) => this.stringifyTooltipValue(part)).join(', ');
        if (this.isPlainObject(value) && 'value' in value) return this.stringifyTooltipValue(value.value);
        if (value == null) return '';
        return String(value);
    }

    private static explodeTooltipValues(value: any): any[] {
        if (Array.isArray(value)) return value;
        if (this.isPlainObject(value) && 'value' in value) return this.explodeTooltipValues(value.value);
        return value == null ? [] : [value];
    }

    private static extractPrimaryTooltipValue(value: any): any {
        if (Array.isArray(value)) {
            const numeric = value.map((part) => Number(part)).filter((part) => Number.isFinite(part));
            return numeric.length ? numeric[numeric.length - 1] : (value.length ? value[value.length - 1] : undefined);
        }
        if (this.isPlainObject(value) && 'value' in value) return this.extractPrimaryTooltipValue(value.value);
        return value;
    }

    private static normalizeTooltipTemplate(template: unknown): string {
        return resolveDynamicTextFromCache(String(template || ''))
            .trim()
            .replace(/\n/g, '<br/>')
            .replace(/\{series\}/g, '{a}')
            .replace(/\{name\}/g, '{b}')
            .replace(/\{value\}/g, '{c}')
            .replace(/\{percent\}/g, '{d}')
            .replace(/\{axis\}/g, '{axis}');
    }

    private static renderTooltipTemplate(template: string, item: any): string {
        const axisValue = item?.axisValueLabel ?? item?.axisValue ?? '';
        const valueParts = this.explodeTooltipValues(item?.value);
        const rawValue = item?.data != null ? item.data : item?.value;
        const xLabel = item?.data?.__m1XAxis ?? '';
        const yLabel = item?.data?.__m1YAxis ?? '';
        const primaryValue = item?.data?.__m1CellValue ?? this.extractPrimaryTooltipValue(item?.value);
        return String(template || '')
            .replace(/\{marker\}/g, item?.marker || '')
            .replace(/\{raw\}/g, this.escapeTooltipHtml(JSON.stringify(rawValue ?? '')))
            .replace(/\{source\}/g, this.escapeTooltipHtml(item?.data?.source ?? item?.source ?? ''))
            .replace(/\{target\}/g, this.escapeTooltipHtml(item?.data?.target ?? item?.target ?? ''))
            .replace(/\{x\}/g, this.escapeTooltipHtml(xLabel))
            .replace(/\{y\}/g, this.escapeTooltipHtml(yLabel))
            .replace(/\{value(\d+)\}/g, (_, indexText) => {
                const index = Number(indexText);
                return this.escapeTooltipHtml(
                    index >= 0 && index < valueParts.length ? this.stringifyTooltipValue(valueParts[index]) : '',
                );
            })
            .replace(/\{axis\}/g, this.escapeTooltipHtml(axisValue))
            .replace(/\{a\}/g, this.escapeTooltipHtml(item?.seriesName || ''))
            .replace(/\{b\}/g, this.escapeTooltipHtml(item?.name || ''))
            .replace(/\{c\}/g, this.escapeTooltipHtml(this.stringifyTooltipValue(primaryValue)))
            .replace(/\{d\}/g, this.escapeTooltipHtml(item?.percent == null ? '' : item.percent));
    }

    private static matchesRule(rule: any, item: any): boolean {
        if (!this.isPlainObject(rule)) return false;
        if (rule.name && String(item?.name || '') !== String(rule.name)) return false;
        if (rule.series && String(item?.seriesName || '') !== String(rule.series)) return false;
        const numericValue = Number(this.extractPrimaryTooltipValue(item?.value));
        if (rule.min != null && (!Number.isFinite(numericValue) || numericValue < Number(rule.min))) return false;
        if (rule.max != null && (!Number.isFinite(numericValue) || numericValue > Number(rule.max))) return false;
        return true;
    }

    private static matchesOverride(rule: any, item: any): boolean {
        if (!this.isPlainObject(rule)) return false;
        if (rule.name && String(item?.name || '') !== String(rule.name)) return false;
        if (rule.series && String(item?.seriesName || '') !== String(rule.series)) return false;
        if (rule.source && String(item?.data?.source ?? item?.source ?? '') !== String(rule.source)) return false;
        if (rule.target && String(item?.data?.target ?? item?.target ?? '') !== String(rule.target)) return false;
        if (rule.index != null && Number(item?.dataIndex ?? -1) !== Number(rule.index)) return false;
        if (rule.seriesIndex != null && Number(item?.seriesIndex ?? -1) !== Number(rule.seriesIndex)) return false;
        return true;
    }

    private static defaultTooltipLine(item: any): string {
        const marker = item?.marker || '';
        const series = item?.seriesName ? `${this.escapeTooltipHtml(item.seriesName)}: ` : '';
        const xLabel = item?.data?.__m1XAxis;
        const yLabel = item?.data?.__m1YAxis;
        if (xLabel != null || yLabel != null) {
            const cellValue = this.escapeTooltipHtml(this.stringifyTooltipValue(item?.data?.__m1CellValue));
            const xText = this.escapeTooltipHtml(xLabel ?? '');
            const yText = this.escapeTooltipHtml(yLabel ?? '');
            const axes = [xText, yText].filter(Boolean).join(', ');
            return `${marker}${series}${axes}${axes && cellValue ? ': ' : ''}${cellValue}`;
        }
        const name = this.escapeTooltipHtml(item?.name || '');
        const value = this.escapeTooltipHtml(this.stringifyTooltipValue(item?.value));
        const percent = item?.percent == null ? '' : ` (${this.escapeTooltipHtml(item.percent)}%)`;
        return `${marker}${series}${name}${name && value ? ': ' : ''}${value}${percent}`;
    }

    private static dataItemHasCustomTooltip(item: any): boolean {
        if (!this.isPlainObject(item)) return false;
        if (item.__m1TooltipText || item.tooltipText) return true;
        if (Array.isArray(item.children)) return item.children.some((child) => this.dataItemHasCustomTooltip(child));
        return false;
    }
}
