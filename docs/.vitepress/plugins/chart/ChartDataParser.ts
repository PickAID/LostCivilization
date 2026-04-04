import { parseBoxplotData, parseCandlestickData, parseParallelData, parseThemeRiverData } from './parsers/advanced';
import { parseFunnelData, parseGaugeData, parseLineBarData, parsePieData, parseRadarData, parseScatterData } from './parsers/basic';
import { parseGraphData, parseHeatmapData, parsePictorialBarData, parseSankeyData, parseTreeData } from './parsers/relationship';

export class ChartDataParser {
    parse(content: string, chartType: string): any {
        const lines = content.trim().split('\n').filter((line) => line.trim());
        switch (chartType) {
            case 'line':
            case 'bar':
            case 'area':
                return parseLineBarData(lines);
            case 'pie':
            case 'doughnut':
                return parsePieData(lines);
            case 'scatter':
                return parseScatterData(lines);
            case 'radar':
                return parseRadarData(lines);
            case 'gauge':
                return parseGaugeData(lines);
            case 'funnel':
                return parseFunnelData(lines);
            case 'heatmap':
                return parseHeatmapData(lines);
            case 'sankey':
                return parseSankeyData(lines);
            case 'graph':
                return parseGraphData(lines);
            case 'tree':
            case 'treemap':
            case 'sunburst':
                return parseTreeData(lines);
            case 'candlestick':
            case 'k':
                return parseCandlestickData(lines);
            case 'boxplot':
                return parseBoxplotData(lines);
            case 'parallel':
                return parseParallelData(lines);
            case 'themeRiver':
                return parseThemeRiverData(lines);
            case 'pictorialBar':
                return parsePictorialBarData(lines);
            default:
                return { data: [] };
        }
    }
}
