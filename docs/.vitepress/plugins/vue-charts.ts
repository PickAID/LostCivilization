import type MarkdownIt from 'markdown-it';
import { VueChartsMarkdownPlugin } from './chart/plugin';

const plugin = new VueChartsMarkdownPlugin();

export const vueCharts = (md: MarkdownIt) => {
    plugin.register(md);
};
