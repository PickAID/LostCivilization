import mermaid from "mermaid";
import mdVar from "vitepress-md-var";
import { onMounted, onUnmounted, watch } from "vue";
import { setupMultipleChoice } from "markdown-it-multiple-choice";
import { setupLanguageControl } from "@utils/i18n/languageControl";
import { initMermaidConfig } from "@utils/charts/mermaid";
import {
    bindFancybox,
    destroyFancybox,
} from "@utils/vitepress/runtime/media/imageViewerRuntime";

type RouteLike = {
    path: string;
};

type ProjectInfoLike = {
    mdVar: {
        prefix: string;
        noVarPrefix: string;
        styling?: unknown;
        persistence?: boolean;
    };
    footerOptions: {
        showSiteStats?: boolean;
        siteStatsProvider?: string;
    };
};

function createMdVarConfig(projectInfo: ProjectInfoLike) {
    const mdVarConfig: any = {
        prefix: projectInfo.mdVar.prefix,
        noVarPrefix: projectInfo.mdVar.noVarPrefix,
        styling: projectInfo.mdVar.styling,
    };

    if (!projectInfo.mdVar.persistence) {
        return mdVarConfig;
    }

    mdVarConfig.loadVar = (varName: string) =>
        localStorage.getItem(`MD_${varName}`);
    mdVarConfig.storeVar = (varName: string, varVal: string) =>
        localStorage.setItem(`MD_${varName}`, varVal);

    return mdVarConfig;
}

export function installThemeSiteBootstraps(options: {
    route: RouteLike;
    projectInfo: ProjectInfoLike;
    mermaidEnabled: boolean;
}) {
    const { route, projectInfo, mermaidEnabled } = options;

    onMounted(() => {
        setupMultipleChoice();
        setupLanguageControl();
        initMermaidConfig();

        if (mermaidEnabled) {
            mermaid.init(undefined, ".mermaid");
        }

        mdVar(route, createMdVarConfig(projectInfo));

        bindFancybox();
    });

    watch(
        () => route.path,
        () => {
            if (import.meta.env.SSR) return;

            setupLanguageControl();
            bindFancybox();
        },
    );

    onUnmounted(() => {
        if (import.meta.env.SSR) return;
        destroyFancybox();
    });
}
