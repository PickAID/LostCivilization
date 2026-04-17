import { computed } from "vue";
import { useData, useRoute } from "vitepress";
import { navConfig } from "@utils/config/navConfig";
import {
    getLangCodeFromVitepressLang,
    getLanguageByCode,
} from "@utils/config/project-api";
import {
    resolveDirectoryLandingAwarePath,
} from "@utils/sidebar/shared/directoryLandingRouteResolver";
import {
    resolveDirectoryLandingPathFromCache,
    resolveDirectoryTitleFromCache,
} from "@utils/vitepress/api/frontmatter/metadata/DirectoryRouteCacheState";
import {
    buildBreadcrumbItems,
    type BreadcrumbItem,
} from "./linkResolution";
import { buildKnownPagePathSet } from "./pageRouteIndex";

const markdownPages = import.meta.glob("../../../../src/**/*.md");

export function createBreadcrumbState() {
    const route = useRoute();
    const { lang, site, page } = useData();

    const knownPagePaths = computed(() => {
        return buildKnownPagePathSet(Object.keys(markdownPages));
    });

    const breadcrumbs = computed<BreadcrumbItem[]>(() => {
        const normalizedLang = getLangCodeFromVitepressLang(lang.value);
        const homeLink =
            getLanguageByCode(normalizedLang)?.link || `/${normalizedLang}/`;
        const navTree =
            navConfig.locales[normalizedLang] ||
            navConfig.locales[lang.value] ||
            Object.values(navConfig.locales)[0] ||
            [];
        const homeText =
            navTree.find(
                (item) =>
                    typeof item.text === "string" &&
                    (item.link === "/" || item.href === "/"),
            )?.text || "Home";

        return buildBreadcrumbItems({
            routePath: route.path,
            siteBase: site.value.base,
            homeLink,
            homeText,
            pageTitle: page.value.title,
            knownPagePaths: knownPagePaths.value,
            navTree,
            localeCodes: Object.keys(navConfig.locales),
            resolveLinkPath: resolveDirectoryLandingAwarePath,
            resolveItemLink: (path, fallbackLink, isLast) => {
                if (isLast) {
                    return undefined;
                }

                return fallbackLink ?? resolveDirectoryLandingPathFromCache(path) ?? undefined;
            },
            resolveItemText: (path, fallbackText, isLast) => {
                if (isLast) {
                    return fallbackText;
                }

                return resolveDirectoryTitleFromCache(path) ?? fallbackText;
            },
        });
    });

    return { breadcrumbs };
}
