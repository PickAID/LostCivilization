import type MarkdownIt from 'markdown-it';
import { ChartDataParser } from './ChartDataParser';
import { ChartOptionFactory } from './ChartOptionFactory';
import { buildAutoResize, buildInitOptions, buildLoadingOptions, buildUpdateOptions, encodeAttrValue, encodeJsonAttr } from './helpers';
import type { ChartConfig } from './types';

export class VueChartsMarkdownPlugin {
    private readonly parser = new ChartDataParser();
    private readonly optionFactory = new ChartOptionFactory();
    private readonly marker = ':::';

    register(md: MarkdownIt): void {
        const markerLen = this.marker.length;
        md.block.ruler.before('fence', 'chart', (state, startLine, endLine, silent) => {
            let pos = state.bMarks[startLine] + state.tShift[startLine];
            const max = state.eMarks[startLine];
            if (pos + markerLen > max) return false;
            if (state.src.slice(pos, pos + markerLen) !== this.marker) return false;
            pos += markerLen;

            const match = state.src.slice(pos, max).match(/^\s*chart\s+(\w+)(?:\s+(.*))?$/);
            if (!match) return false;

            const chartType = match[1];
            const configStr = match[2] || '{}';
            const config = this.parseConfig(configStr);
            if (silent) return true;

            let nextLine = startLine;
            let content = '';
            while (nextLine < endLine) {
                nextLine += 1;
                if (nextLine >= endLine) break;
                pos = state.bMarks[nextLine];
                const lineMax = state.eMarks[nextLine];
                if (state.src.slice(pos, pos + markerLen) === this.marker) break;
                content += state.src.slice(pos, lineMax) + '\n';
            }

            const parsedData = this.parser.parse(content, chartType);
            const chartOption = this.optionFactory.build(chartType, parsedData, config);
            const token = state.push('chart', 'div', 0);
            token.markup = this.marker;
            token.block = true;
            token.info = chartType;
            token.map = [startLine, nextLine + 1];
            token.meta = { chartType, config, option: chartOption };
            state.line = nextLine + 1;
            return true;
        });

        md.renderer.rules.chart = (tokens, idx) => this.render(tokens[idx].meta.config, tokens[idx].meta.option);
    }

    private parseConfig(configStr: string): ChartConfig {
        try {
            return JSON.parse(configStr);
        } catch {
            return {};
        }
    }

    private render(config: ChartConfig, option: any): string {
        const attrs = [
            `:options='${encodeJsonAttr(option)}'`,
            `width="${encodeAttrValue(String(config.width || '100%'))}"`,
            `height="${encodeAttrValue(String(config.height || '400px'))}"`,
            typeof (config.theme ?? 'auto') === 'string'
                ? `theme="${encodeAttrValue(String(config.theme ?? 'auto'))}"`
                : `:theme='${encodeJsonAttr(config.theme)}'`,
            `:autoresize='${encodeJsonAttr(buildAutoResize(config))}'`,
        ];

        const initOptions = buildInitOptions(config);
        const updateOptions = buildUpdateOptions(config);
        const loadingOptions = buildLoadingOptions(config);
        if (initOptions) attrs.push(`:init-options='${encodeJsonAttr(initOptions)}'`);
        if (updateOptions) attrs.push(`:update-options='${encodeJsonAttr(updateOptions)}'`);
        if (config.group) attrs.push(`group="${encodeAttrValue(String(config.group))}"`);
        if (config.loading) attrs.push(`:loading='true'`);
        if (loadingOptions) attrs.push(`:loading-options='${encodeJsonAttr(loadingOptions)}'`);
        if (config.manualUpdate) attrs.push(`:manual-update='true'`);

        return `<VChart ${attrs.join(' ')} class="markdown-chart" />`;
    }
}
