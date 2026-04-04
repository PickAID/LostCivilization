import { h, watch } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import {
    useData,
    useRoute,
    useRouter,
    inBrowser,
} from "vitepress";
import "./styles/index.css";
import "virtual:group-icons.css";
import "markdown-it-multiple-choice/style.css";
import vuetify from "./vuetify";
import {
    NolebaseEnhancedReadabilitiesMenu,
    NolebaseEnhancedReadabilitiesScreenMenu,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import "@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css";

import { Animation, Preview, NotFound, Buttons } from "@utils/vitepress/componentRegistry/uiRegistry";
import { comment, PageTags, ResponsibleEditor, TagsPage } from "@utils/vitepress/componentRegistry/contentRegistry";
import Footer from "./components/navigation/Footer.vue";
import VPBreadcrumb from "./components/navigation/Breadcrumb/VPBreadcrumb.vue";

import { getProjectInfo, isFeatureEnabled } from "@config/project-config";
import { useDirectoryLandingRouteSync } from "@utils/sidebar/runtime";
import {
    applyThemePageStyles,
    installThemeSiteBootstraps,
    getThemeRuntime,
} from "@utils/vitepress/runtime/theme";
import utils from "../utils";
import { enhanceThemeApp } from "./enhanceThemeApp";

type VuetifyThemeController = typeof vuetify.theme & {
    change?: (themeName: string) => void;
    global?: {
        name: {
            value: string;
        };
    };
};

function syncVuetifyTheme(isDark: boolean) {
    const themeName = isDark ? "dark" : "light";
    const themeController = vuetify.theme as VuetifyThemeController;

    if (typeof themeController.change === "function") {
        themeController.change(themeName);
        return;
    }

    if (themeController.global) {
        themeController.global.name.value = themeName;
    }
}

export default {
    extends: DefaultTheme,
	Layout: () => {
		const props: Record<string, unknown> = {};
		const { frontmatter } = useData();

		if (frontmatter.value?.layoutClass) {
			props.class = frontmatter.value.layoutClass;
		}

		return h(Animation, null, {
			slot: () =>
				h(DefaultTheme.Layout, props, {
					"aside-outline-after": () => null,
					"doc-after": () => [h(Buttons), h(comment)],
					"doc-footer-before": () => h(ResponsibleEditor),
					"layout-bottom": () => h(Footer),
					"not-found": () => [h(NotFound)],
					"nav-bar-content-after": () => h(NolebaseEnhancedReadabilitiesMenu),
					"nav-screen-content-after": () =>
						h(NolebaseEnhancedReadabilitiesScreenMenu),
					"doc-before": () => [h(VPBreadcrumb), h(Preview), h(PageTags)],
				}),
		});
    },

    enhanceApp(ctx) {
        enhanceThemeApp(ctx);
    },

    setup() {
		const route = useRoute();
		const router = useRouter();
		const { isDark, frontmatter } = useData();
		const { effectiveDark } = getThemeRuntime(isDark);
		const projectInfo = getProjectInfo();

        watch(
            effectiveDark,
            (dark) => {
                if (inBrowser) {
                    syncVuetifyTheme(dark);
                }
            },
            { immediate: true },
        );

        applyThemePageStyles(route, frontmatter as any, effectiveDark);
        useDirectoryLandingRouteSync(route, router);
        installThemeSiteBootstraps({
            route,
            projectInfo,
            mermaidEnabled: isFeatureEnabled("mermaid"),
            initSiteStats: () => {
                utils.vitepress.initBusuanzi();
            },
        });
    },
} satisfies Theme;
