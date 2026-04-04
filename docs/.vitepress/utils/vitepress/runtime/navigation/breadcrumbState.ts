import { computed } from "vue";
import { useData, useRoute } from "vitepress";
import { navConfig } from "@utils/config/navConfig";
import {
    getLangCodeFromVitepressLang,
    getLanguageByCode,
} from "@utils/config/project-api";
import { resolveDirectoryLandingAwarePath } from "@utils/sidebar/shared/directoryLandingRouteResolver";
import { buildBreadcrumbItems, type BreadcrumbItem } from "./linkResolution";
import { buildKnownPagePathSetFromSidebar } from "./pageRouteIndex";

export function createBreadcrumbState() {
    const route = useRoute();
    const { lang, site, page, theme } = useData();

    const knownPagePaths = computed(() =>
        buildKnownPagePathSetFromSidebar(theme.value.sidebar),
    );

    const breadcrumbs = computed<BreadcrumbItem[]>(() => {
        const normalizedLang = getLangCodeFromVitepressLang(lang.value);
        const homeLink =
            getLanguageByCode(normalizedLang)?.link || `/${normalizedLang}/`;
        const navTree =
            navConfig.locales[normalizedLang] ||
            navConfig.locales[lang.value] ||
            Object.values(navConfig.locales)[0] ||
            [];

        return buildBreadcrumbItems({
            routePath: route.path,
            siteBase: site.value.base,
            homeLink,
            pageTitle: page.value.title,
            knownPagePaths: knownPagePaths.value,
            navTree,
            localeCodes: Object.keys(navConfig.locales),
            resolveLinkPath: resolveDirectoryLandingAwarePath,
        });
    });

    return { breadcrumbs };
}
