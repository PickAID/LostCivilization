import mermaid from "mermaid";
import mdVar from "vitepress-md-var";
import { nextTick, onMounted, onUnmounted, watch } from "vue";
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

async function waitForClientDom() {
    if (import.meta.env.SSR) return;

    await nextTick();
    await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
    });
}

async function refreshSiteStats(
    initSiteStats?: () => Promise<boolean> | void,
) {
    if (import.meta.env.SSR) return;

    await waitForClientDom();
    const initialized = await initSiteStats?.();
    await waitForClientDom();

    if (initialized === false && !window.busuanzi?.fetch) {
        return;
    }

    window.busuanzi?.fetch?.();
}

export function installThemeSiteBootstraps(options: {
    route: RouteLike;
    projectInfo: ProjectInfoLike;
    mermaidEnabled: boolean;
    initSiteStats?: () => Promise<boolean> | void;
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
            void refreshSiteStats(initSiteStats);
        }

        bindFancybox();
    });

    watch(
        () => route.path,
        () => {
            if (import.meta.env.SSR) return;

            setupLanguageControl();
            bindFancybox();

            if (shouldUseBusuanzi(projectInfo)) {
                void refreshSiteStats(initSiteStats);
            }
        },
    );

    onUnmounted(() => {
        if (import.meta.env.SSR) return;
        destroyFancybox();
    });
}
