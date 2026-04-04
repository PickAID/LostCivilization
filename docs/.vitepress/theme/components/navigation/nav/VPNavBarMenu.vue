<script lang="ts" setup>
    import { computed } from "vue";
    import { useData } from "vitepress";
    import { navConfig, type NavItem } from "@utils/config/navConfig";
    import { projectConfig } from "@config/project-config";
    import {
        getLangCodeFromVitepressLang,
        getDefaultLanguage,
    } from "@config/project-api";
    import {
        resolveAccessibleNavHref,
        prefixNavLinks,
    } from "@utils/vitepress/api/navigation/NavLinkAccessService";
    import { navDropdownLayoutRegistry } from "@utils/vitepress/api/navigation/NavDropdownLayoutRegistryApi";
    import VPNavLayoutSpotlight from "../layouts/VPNavLayoutSpotlight.vue";
    import VPNavLayoutColumns from "../layouts/VPNavLayoutColumns.vue";
    import VPNavBarMenuGroup from "vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue";
    import VPNavBarMenuLink from "vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue";

    navDropdownLayoutRegistry.registerLayouts([
        { layout: "spotlight", component: VPNavLayoutSpotlight },
        { layout: "columns", component: VPNavLayoutColumns },
    ]);

    const { lang } = useData();

    // Load the appropriate navigation array for the current locale and prefix internal URLs
    const currentNav = computed<NavItem[]>(() => {
        const normalizedLang = getLangCodeFromVitepressLang(lang.value);
        const defaultCode = getDefaultLanguage().code;
        const rawNav =
            navConfig.locales[lang.value] ||
            navConfig.locales[normalizedLang] ||
            navConfig.locales[defaultCode] ||
            [];

        const langInfo = projectConfig.languages.find(
            (l) => l.code === lang.value || l.code === normalizedLang,
        );
        const basePath = langInfo ? langInfo.link : "/";

        return prefixNavLinks(rawNav, basePath);
    });

    const hasTopLevelHref = (item: NavItem) =>
        Boolean(resolveAccessibleNavHref(item.link, item.href));

    const resolveDropdownLayoutComponent = (item: NavItem) =>
        navDropdownLayoutRegistry.resolveLayoutComponent(
            item.dropdown?.layout,
            item.dropdown?.layoutComponent,
        );
</script>

<template>
    <nav
        v-if="currentNav.length > 0"
        aria-labelledby="main-nav-aria-label"
        class="VPNavBarMenu"
    >
        <span id="main-nav-aria-label" class="visually-hidden"
            >Main Navigation</span
        >
        <template v-for="item in currentNav" :key="item.text">
            <template v-if="item.dropdown">
                <component
                    :is="resolveDropdownLayoutComponent(item)"
                    v-if="resolveDropdownLayoutComponent(item)"
                    :item="item"
                />
                <!-- Fallback to default VitePress Dropdown for standard links -->
                <VPNavBarMenuGroup v-else :item="item as any" />
            </template>
            <template v-else>
                <!-- Standard Top-Level Link -->
                <VPNavBarMenuLink
                    v-if="hasTopLevelHref(item)"
                    :item="item as any"
                />
                <span v-else class="menu-label">{{ item.text }}</span>
            </template>
        </template>
    </nav>
</template>

<style scoped>
    .VPNavBarMenu {
        display: none;
    }

    .menu-label {
        display: inline-flex;
        align-items: center;
        padding: 0 12px;
        line-height: var(--vp-nav-height);
        font-size: 14px;
        font-weight: 500;
        color: var(--vp-nav-text-color, var(--vp-c-text-1));
        transition: color 0.25s ease;
    }

    .menu-label:hover {
        color: var(--vp-nav-text-hover-color, var(--vp-c-brand-1));
    }

    @media (min-width: 960px) {
        .VPNavBarMenu {
            display: flex;
            align-items: center;
        }

        .VPNavBarMenu > * {
            margin-right: 1.5rem;
        }
        .VPNavBarMenu > *:last-child {
            margin-right: 0;
        }
    }
</style>
