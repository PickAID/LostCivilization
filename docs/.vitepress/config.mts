import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import withDrawio from "@dhlx/vitepress-plugin-drawio";

import { commonConfig } from "./config/common-config"
import {
    generateLocalesConfigAuto,
    getProjectInfo,
    isFeatureEnabled,
    resolveThemeSearchConfig,
} from "./utils/config/project-config"

const { locales, searchLocales } = await generateLocalesConfigAuto(true);
const resolvedSearchConfig = resolveThemeSearchConfig(searchLocales);
const projectInfo = getProjectInfo();

const finalConfig = {
    ...(commonConfig as any),
    locales,
    themeConfig: {
        ...commonConfig.themeConfig,
        search: resolvedSearchConfig,
    }
};

let config = defineConfig(finalConfig);

if (isFeatureEnabled('mermaid')) {
    config = withMermaid(config);
}

if (isFeatureEnabled('drawio')) {
    config = withDrawio(config, projectInfo.drawio);
}

export default config;
