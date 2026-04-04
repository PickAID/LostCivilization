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

function shouldUseBusuanzi(projectInfo: ProjectInfoLike) {
    return (
        projectInfo.footerOptions.showSiteStats &&
        projectInfo.footerOptions.siteStatsProvider === "busuanzi"
    );
}

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
    initSiteStats?: () => void;
}) {
    const { route, projectInfo, mermaidEnabled, initSiteStats } = options;

    onMounted(() => {
        setupMultipleChoice();
        setupLanguageControl();
        initMermaidConfig();

        if (mermaidEnabled) {
            mermaid.init(undefined, ".mermaid");
        }

        mdVar(route, createMdVarConfig(projectInfo));

        if (shouldUseBusuanzi(projectInfo)) {
            initSiteStats?.();
        }

        bindFancybox();
    });

    watch(
        () => route.path,
        () => {
            if (import.meta.env.SSR) return;

            setupLanguageControl();
            bindFancybox();

            if (shouldUseBusuanzi(projectInfo) && window.busuanzi) {
                window.busuanzi.fetch();
            }
        },
    );

    onUnmounted(() => {
        if (import.meta.env.SSR) return;
        destroyFancybox();
    });
}
