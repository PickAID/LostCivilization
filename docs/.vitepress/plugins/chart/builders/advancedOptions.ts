import type { ChartConfig } from '../types';
import { resolveTreeLabelTemplate, type ChartLayoutMetrics } from '../helpers';

export function buildAdvancedChartOptions(chartType: string, parsedData: any, config: ChartConfig, layout: ChartLayoutMetrics): any {
    const option: any = {};

    switch (chartType) {
        case 'sankey':
            option.series = [{ type: 'sankey', top: layout.contentTop, bottom: 20, data: parsedData.data, links: parsedData.links }];
            return option;
        case 'graph':
            option.series = [{
                type: 'graph',
                top: layout.contentTop,
                bottom: 20,
                layout: 'force',
                data: parsedData.data,
                links: parsedData.links,
                roam: true,
                label: { show: true, position: 'right', formatter: '{b}' },
                force: { repulsion: 100, gravity: 0.05, edgeLength: 30, layoutAnimation: true },
                draggable: true,
                focusNodeAdjacency: true,
                emphasis: { lineStyle: { width: 3 } },
            }];
            return option;
        case 'tree': {
            const treeRootNode = parsedData.children && parsedData.children.length === 1
                ? parsedData.children[0]
                : (parsedData.children && parsedData.children.length
                    ? { name: config.title || 'Tree', children: parsedData.children, value: parsedData.value || 0, collapsed: false }
                    : parsedData);
            const treeLabelFormatter = resolveTreeLabelTemplate(config);
            const treeEdgeShape = config.treeEdgeShape === 'curve' ? 'curve' : 'polyline';
            option.series = [{
                type: 'tree',
                data: [treeRootNode],
                top: layout.contentTop,
                left: '7%',
                bottom: 24,
                right: '42%',
                layout: 'orthogonal',
                orient: 'LR',
                symbol: 'emptyCircle',
                symbolSize: 7,
                initialTreeDepth: typeof config.treeInitialDepth === 'number' ? config.treeInitialDepth : 2,
                roam: 'zoom',
                edgeShape: treeEdgeShape,
                edgeForkPosition: treeEdgeShape === 'polyline' ? '63%' : undefined,
                lineStyle: { width: 1.2 },
                itemStyle: { borderWidth: 1.5 },
                label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: 13, formatter: treeLabelFormatter },
                leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left', fontSize: 13, formatter: treeLabelFormatter } },
                expandAndCollapse: true,
                emphasis: { focus: 'descendant' },
                animationDuration: 550,
                animationDurationUpdate: 750,
            }];
            return option;
        }
        case 'treemap':
            option.series = [{ type: 'treemap', top: layout.contentTop, bottom: 12, data: parsedData.children?.length ? parsedData.children : [parsedData], roam: false, breadcrumb: { show: true }, label: { show: true, formatter: '{b}' } }];
            return option;
        case 'sunburst':
            option.series = [{ type: 'sunburst', center: ['50%', layout.sunburstCenterY], data: parsedData.children?.length ? parsedData.children : [parsedData], radius: [layout.sunburstInnerRadius, layout.sunburstOuterRadius], sort: undefined, emphasis: { focus: 'ancestor' }, label: { rotate: 'radial' } }];
            return option;
        case 'candlestick':
        case 'k':
            option.xAxis = { type: 'category', data: parsedData.categories || [], axisLabel: { show: true }, axisTick: { show: true } };
            option.yAxis = { type: 'value', scale: true, axisLabel: { show: true }, axisTick: { show: true } };
            option.series = [{
                name: 'K线',
                type: 'candlestick',
                data: parsedData.data,
                itemStyle: {
                    color: Array.isArray(config.palette) && config.palette[0] ? config.palette[0] : '#ef232a',
                    color0: Array.isArray(config.palette) && config.palette[1] ? config.palette[1] : '#14b143',
                    borderColor: Array.isArray(config.palette) && config.palette[0] ? config.palette[0] : '#ef232a',
                    borderColor0: Array.isArray(config.palette) && config.palette[1] ? config.palette[1] : '#14b143',
                },
                emphasis: {
                    itemStyle: {
                        color: Array.isArray(config.palette) && config.palette[0] ? config.palette[0] : '#ef232a',
                        color0: Array.isArray(config.palette) && config.palette[1] ? config.palette[1] : '#14b143',
                        borderColor: Array.isArray(config.palette) && config.palette[0] ? config.palette[0] : '#ef232a',
                        borderColor0: Array.isArray(config.palette) && config.palette[1] ? config.palette[1] : '#14b143',
                    },
                },
            }];
            return option;
        case 'boxplot':
            option.xAxis = { type: 'category' };
            option.yAxis = { type: 'value' };
            option.series = [{ type: 'boxplot', data: parsedData.data }];
            return option;
        case 'parallel':
            option.parallel = { top: layout.contentTop, left: '6%', right: '10%', bottom: 24 };
            option.parallelAxis = extractTupleValue(parsedData.data?.[0])
                ? extractTupleValue(parsedData.data[0]).map((_: any, index: number) => ({ dim: index, name: `Axis ${index + 1}` }))
                : [];
            option.series = [{ type: 'parallel', data: parsedData.data }];
            return option;
        case 'themeRiver':
            option.singleAxis = { type: 'time', top: layout.contentTop, bottom: 24 };
            option.series = [{ type: 'themeRiver', data: parsedData.data }];
            return option;
        case 'pictorialBar':
            option.xAxis = { type: 'category', data: parsedData.categories || parsedData.data?.map((entry: any) => entry.name) || [], axisLabel: { show: true }, axisTick: { show: true } };
            option.yAxis = { type: 'value', axisLabel: { show: true }, axisTick: { show: true } };
            option.series = [{
                name: '人口',
                type: 'pictorialBar',
                data: parsedData.data || [],
                symbol: 'path://M10,30 A20,20 0,0,1 50,30 A20,20 0,0,1 90,30 Q90,60 50,90 Q10,60 10,30 z',
                symbolSize: [20, 30],
                symbolRepeat: true,
                symbolMargin: '10%',
                z: 10,
                label: { show: true, position: 'top', formatter: '{c}' },
            }];
            return option;
        default:
            return option;
    }
}

function extractTupleValue(row: any): any[] {
    if (Array.isArray(row)) {
        return row;
    }
    if (row && typeof row === 'object' && Array.isArray(row.value)) {
        return row.value;
    }
    return [];
}
