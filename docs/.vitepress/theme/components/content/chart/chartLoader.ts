import { defineAsyncComponent } from 'vue';

export class ChartLoader {
    static readonly vueEChart = defineAsyncComponent(async () => {
        const { default: VChart } = await import('vue-echarts');
        const { use } = await import('echarts/core');
        const charts = await import('echarts/charts');
        const components = await import('echarts/components');
        const renderers = await import('echarts/renderers');

        use([
            charts.LineChart,
            charts.BarChart,
            charts.PieChart,
            charts.ScatterChart,
            charts.RadarChart,
            charts.GaugeChart,
            charts.FunnelChart,
            charts.HeatmapChart,
            charts.SankeyChart,
            charts.GraphChart,
            charts.TreeChart,
            charts.TreemapChart,
            charts.SunburstChart,
            charts.CandlestickChart,
            charts.BoxplotChart,
            charts.ParallelChart,
            charts.ThemeRiverChart,
            charts.PictorialBarChart,
            components.TitleComponent,
            components.TooltipComponent,
            components.LegendComponent,
            components.GridComponent,
            components.DatasetComponent,
            components.TransformComponent,
            components.ToolboxComponent,
            components.DataZoomComponent,
            components.VisualMapComponent,
            components.TimelineComponent,
            components.CalendarComponent,
            components.GraphicComponent,
            components.MarkPointComponent,
            components.MarkLineComponent,
            components.MarkAreaComponent,
            components.AriaComponent,
            components.ParallelComponent,
            components.SingleAxisComponent,
            components.RadarComponent,
            renderers.CanvasRenderer,
            renderers.SVGRenderer,
        ]);

        return VChart;
    });
}

export const VueEChart = ChartLoader.vueEChart;
