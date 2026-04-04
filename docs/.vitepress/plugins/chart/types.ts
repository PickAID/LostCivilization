import type MarkdownIt from 'markdown-it';

export interface ChartTooltipRule {
    name?: string;
    series?: string;
    min?: number;
    max?: number;
    template?: string;
}

export interface ChartTooltipOverride {
    name?: string;
    series?: string;
    source?: string;
    target?: string;
    index?: number;
    seriesIndex?: number;
    template?: string;
}

export interface ChartPaletteConfig {
    light?: string[];
    dark?: string[];
}

export interface ChartConfig {
    title?: string;
    subtitle?: string;
    width?: string;
    height?: string;
    theme?: string | Record<string, any>;
    backgroundColor?: string;
    smooth?: boolean;
    legend?: boolean | Record<string, any>;
    tooltip?: boolean | Record<string, any>;
    tooltipTrigger?: 'axis' | 'item';
    tooltipTemplate?: string;
    tooltipRules?: ChartTooltipRule[];
    tooltipOverrides?: ChartTooltipOverride[];
    animation?: boolean;
    animationDuration?: number;
    renderer?: 'canvas' | 'svg';
    autoresize?: boolean | Record<string, any>;
    group?: string;
    loading?: boolean;
    loadingOptions?: Record<string, any>;
    manualUpdate?: boolean;
    devicePixelRatio?: number;
    useDirtyRect?: boolean;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    initOptions?: Record<string, any>;
    updateOptions?: Record<string, any>;
    toolbox?: boolean | Record<string, any>;
    dataZoom?: boolean | Record<string, any> | any[];
    dataZoomInside?: boolean;
    dataZoomSlider?: boolean;
    aria?: boolean | Record<string, any>;
    palette?: string[] | ChartPaletteConfig;
    treeEdgeShape?: 'curve' | 'polyline';
    treeInitialDepth?: number;
    treeShowValueInLabel?: boolean;
    titleOptions?: Record<string, any>;
    grid?: Record<string, any>;
    xAxis?: Record<string, any> | Record<string, any>[];
    yAxis?: Record<string, any> | Record<string, any>[];
    radar?: Record<string, any>;
    visualMap?: Record<string, any>;
    parallel?: Record<string, any>;
    singleAxis?: Record<string, any>;
    seriesOptions?: Record<string, any> | Record<string, any>[];
    option?: Record<string, any>;
    [key: string]: any;
}

export interface ChartTokenMeta {
    chartType: string;
    config: ChartConfig;
    option: any;
}

export type MarkdownItInstance = MarkdownIt;
