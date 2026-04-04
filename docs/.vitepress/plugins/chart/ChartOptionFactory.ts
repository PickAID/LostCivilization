import { buildAdvancedChartOptions } from './builders/advancedOptions';
import { buildBasicChartOptions } from './builders/basicOptions';
import { applyRuntimeFeatures, applyTitleAndTooltip, createBaseOption } from './builders/sharedOptions';
import { computeChartLayout } from './helpers';
import type { ChartConfig } from './types';

export class ChartOptionFactory {
    build(chartType: string, parsedData: any, config: ChartConfig): any {
        const option = createBaseOption(config);
        const layout = computeChartLayout(config);

        applyTitleAndTooltip(option, chartType, config, layout);

        if (['line', 'bar', 'area', 'scatter', 'heatmap', 'candlestick', 'k', 'boxplot', 'pictorialBar'].includes(chartType)) {
            option.grid = { left: '3%', right: chartType === 'heatmap' ? '8%' : '4%', bottom: '3%', top: layout.contentTop, containLabel: true };
        }

        Object.assign(option, buildBasicChartOptions(chartType, parsedData, config, layout));
        Object.assign(option, buildAdvancedChartOptions(chartType, parsedData, config, layout));
        return applyRuntimeFeatures(option, chartType, config);
    }
}
