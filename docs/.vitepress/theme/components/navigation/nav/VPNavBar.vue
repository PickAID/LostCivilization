<script lang="ts" setup>
    import { useWindowScroll } from "@vueuse/core";
    import { ref, watchPostEffect } from "vue";
    import { useData } from "vitepress";
    // @ts-ignore
    import { useSidebar } from "vitepress/dist/client/theme-default/composables/sidebar";
    import VPNavBarAppearance from "vitepress/dist/client/theme-default/components/VPNavBarAppearance.vue";
    import VPNavBarExtra from "vitepress/dist/client/theme-default/components/VPNavBarExtra.vue";
    import VPNavBarHamburger from "vitepress/dist/client/theme-default/components/VPNavBarHamburger.vue";
    import VPNavBarMenu from "./VPNavBarMenu.vue";
    import VPNavBarSearch from "vitepress/dist/client/theme-default/components/VPNavBarSearch.vue";
    import VPNavBarSocialLinks from "vitepress/dist/client/theme-default/components/VPNavBarSocialLinks.vue";
    import VPNavBarTitle from "vitepress/dist/client/theme-default/components/VPNavBarTitle.vue";
    import VPNavBarTranslations from "vitepress/dist/client/theme-default/components/VPNavBarTranslations.vue";

    const props = defineProps<{
        isScreenOpen: boolean;
    }>();

    defineEmits<{
        (e: "toggle-screen"): void;
    }>();

    const { y } = useWindowScroll();
    const { hasSidebar } = useSidebar();
    const { frontmatter } = useData();

    const classes = ref<Record<string, boolean>>({});

    watchPostEffect(() => {
        classes.value = {
            "has-sidebar": hasSidebar.value,
            home: frontmatter.value.layout === "home",
            top: y.value === 0,
            "screen-open": props.isScreenOpen,
        };
    });
</script>

<template>
    <div class="VPNavBar" :class="classes">
        <div class="wrapper">
            <div class="container">
                <div class="title">
                    <VPNavBarTitle>
                        <template #nav-bar-title-before
                            ><slot name="nav-bar-title-before"
                        /></template>
                        <template #nav-bar-title-after
                            ><slot name="nav-bar-title-after"
                        /></template>
                    </VPNavBarTitle>
                </div>

                <div class="content">
                    <div class="content-body">
                        <slot name="nav-bar-content-before" />
                        <VPNavBarSearch class="search" />
                        <VPNavBarMenu class="menu" />
                        <VPNavBarTranslations class="translations" />
                        <VPNavBarAppearance class="appearance" />
                        <VPNavBarSocialLinks class="social-links" />
                        <VPNavBarExtra class="extra" />
                        <slot name="nav-bar-content-after" />
                        <VPNavBarHamburger
                            class="hamburger"
                            :active="isScreenOpen"
                            @click="$emit('toggle-screen')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="divider">
            <div class="divider-line" />
        </div>
    </div>
</template>

<style scoped>
    .VPNavBar {
        position: relative;
        height: var(--vp-nav-height);
        pointer-events: none;
        white-space: nowrap;
        transition:
            background-color 0.4s cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .VPNavBar.screen-open {
        transition: none;
        background-color: var(--vp-nav-custom-bg, var(--vp-nav-bg-color));
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .VPNavBar:not(.home) {
        /* Base color is transparent, divider will show if not top */
        background-color: var(--vp-nav-custom-bg, var(--vp-nav-bg-color));
    }

    @media (min-width: 960px) {
        .VPNavBar:not(.home) {
            background-color: transparent;
        }

        .VPNavBar:not(.has-sidebar):not(.home.top) {
            background-color: color-mix(
                in srgb,
                var(--vp-nav-custom-bg, var(--vp-nav-bg-color)) 80%,
                transparent
            );
            backdrop-filter: blur(32px) saturate(200%);
            -webkit-backdrop-filter: blur(32px) saturate(200%);
        }
    }

    .wrapper {
        padding: 0 8px 0 24px;
    }

    @media (min-width: 768px) {
        .wrapper {
            padding: 0 32px;
        }
    }

    @media (min-width: 960px) {
        .VPNavBar.has-sidebar .wrapper {
            padding: 0;
        }
    }

    .container {
        display: flex;
        justify-content: space-between;
        margin: 0 auto;
        max-width: calc(var(--vp-layout-max-width) - 64px);
        height: var(--vp-nav-height);
        pointer-events: none;
    }

    .container > .title,
    .container > .content {
        pointer-events: none;
    }

    .container :deep(*) {
        pointer-events: auto;
    }

    @media (min-width: 960px) {
        .VPNavBar.has-sidebar .container {
            max-width: 100%;
        }
    }

    .title {
        flex-shrink: 0;
        height: calc(var(--vp-nav-height) - 1px);
        transition: background-color 0.5s;
    }

    @media (min-width: 960px) {
        .VPNavBar.has-sidebar .title {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 2;
            padding: 0 32px;
            width: var(--vp-sidebar-width);
            height: var(--vp-nav-height);
            background-color: transparent;
        }
    }

    @media (min-width: 1440px) {
        .VPNavBar.has-sidebar .title {
            padding-left: max(
                32px,
                calc((100% - (var(--vp-layout-max-width) - 64px)) / 2)
            );
            width: calc(
                (100% - (var(--vp-layout-max-width) - 64px)) / 2 +
                    var(--vp-sidebar-width) - 32px
            );
        }
    }

    .content {
        flex-grow: 1;
    }

    @media (min-width: 960px) {
        .VPNavBar.has-sidebar .content {
            position: relative;
            z-index: 1;
            padding-right: 32px;
            padding-left: var(--vp-sidebar-width);
        }
    }

    @media (min-width: 1440px) {
        .VPNavBar.has-sidebar .content {
            padding-right: calc(
                (100vw - var(--vp-layout-max-width)) / 2 + 32px
            );
            padding-left: calc(
                (100vw - var(--vp-layout-max-width)) / 2 +
                    var(--vp-sidebar-width)
            );
        }
    }

    .content-body {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        height: var(--vp-nav-height);
        transition: background-color 0.5s;
    }

    @media (min-width: 960px) {
        .VPNavBar:not(.home.top) .content-body {
            position: relative;
            background-color: var(--vp-nav-custom-bg, var(--vp-nav-bg-color));
        }

        .VPNavBar:not(.has-sidebar):not(.home.top) .content-body {
            background-color: transparent;
        }
    }

    .VPNavBar :deep(.VPNavBarTitle .title),
    .VPNavBar :deep(.VPNavBarTitle .title span),
    .VPNavBar :deep(.VPNavBarTranslations .title),
    .VPNavBar :deep(.VPFlyout .button) {
        color: var(--vp-nav-text-color, var(--vp-c-text-1));
        transition: color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .VPNavBar :deep(.VPNavBarTranslations .title:hover),
    .VPNavBar :deep(.VPFlyout .button:hover),
    .VPNavBar :deep(.VPFlyout .button:focus-visible) {
        color: var(--vp-nav-text-hover-color, var(--vp-c-brand-1));
    }

    /* ── Stunning Shopify-Style Nav Pills ────────────────── */
    .VPNavBar :deep(.VPNavBarMenuLink),
    .VPNavBar :deep(.VPNavBarMenuGroup .button),
    .VPNavBar :deep(.VPNavBarMenu .menu-label),
    .VPNavBar :deep(.VPNavLayoutSpotlight .menu-trigger),
    .VPNavBar :deep(.VPNavLayoutColumns .menu-trigger) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px !important;
        margin: 0 2px;
        border-radius: 99px;
        line-height: normal !important;
        font-size: 14px;
        font-weight: 600;
        color: var(--vp-nav-text-color, var(--vp-c-text-1));
        background-color: transparent;
        transition:
            color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            background-color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .VPNavBar :deep(.VPNavBarMenuLink:hover),
    .VPNavBar :deep(.VPNavBarMenuLink:focus-visible),
    .VPNavBar :deep(.VPNavBarMenuGroup .button:hover),
    .VPNavBar :deep(.VPNavBarMenuGroup .button:focus-visible),
    .VPNavBar :deep(.VPNavBarMenu .menu-label:hover),
    .VPNavBar :deep(.VPNavLayoutSpotlight:hover .menu-trigger),
    .VPNavBar :deep(.VPNavLayoutColumns:hover .menu-trigger),
    .VPNavBar :deep(.VPNavLayoutSpotlight.is-open .menu-trigger),
    .VPNavBar :deep(.VPNavLayoutColumns.is-open .menu-trigger) {
        color: var(--vp-nav-text-hover-color, var(--vp-c-text-1)) !important;
        background-color: color-mix(
            in srgb,
            var(--vp-nav-text-hover-color, var(--vp-c-text-1)) 5%,
            transparent
        );
    }

    .VPNavBar :deep(.VPNavBarMenuLink.active) {
        color: var(--vp-nav-text-hover-color, var(--vp-c-brand-1)) !important;
        background-color: color-mix(
            in srgb,
            var(--vp-nav-text-hover-color, var(--vp-c-brand-1)) 8%,
            transparent
        );
    }

    .VPNavBar :deep(.VPNavBarAppearance .button),
    .VPNavBar :deep(.VPSocialLink),
    .VPNavBar :deep(.VPNavBarHamburger .bar),
    .VPNavBar :deep(.VPNavBarExtra .VPSwitchAppearance .check) {
        color: var(--vp-nav-text-color, var(--vp-c-text-1));
        transition: color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .VPNavBar :deep(.VPNavBarSearch .DocSearch-Button) {
        background-color: var(--vp-nav-search-bg, var(--vp-c-bg-alt));
        border-color: var(--vp-nav-search-border, transparent);
        color: var(--vp-nav-search-text, var(--vp-c-text-1));
        transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            color 0.25s ease;
    }

    .VPNavBar :deep(.VPNavBarSearch .DocSearch) {
        --docsearch-muted-color: var(
            --vp-nav-search-text-muted,
            var(--vp-c-text-2)
        );
    }

    .VPNavBar :deep(.VPNavBarSearch .DocSearch-Button:hover) {
        background-color: var(
            --vp-nav-search-bg-hover,
            var(--vp-nav-search-bg, var(--vp-c-bg-alt))
        );
        border-color: var(
            --vp-nav-search-border,
            var(--vp-nav-text-hover-color, var(--vp-c-brand-1))
        );
    }

    .VPNavBar :deep(.VPNavBarSearch .DocSearch-Search-Icon) {
        color: var(--vp-nav-search-text-muted, var(--vp-c-text-2));
    }

    .VPNavBar :deep(.VPNavBarSearch .DocSearch-Button-Placeholder) {
        color: var(--vp-nav-search-text-muted, var(--vp-c-text-2));
    }

    .VPNavBar
        :deep(.VPNavBarSearch .DocSearch-Button:hover .DocSearch-Search-Icon),
    .VPNavBar
        :deep(
            .VPNavBarSearch
                .DocSearch-Button:hover
                .DocSearch-Button-Placeholder
        ) {
        color: var(--vp-nav-search-text, var(--vp-c-text-1));
    }

    .VPNavBar :deep(.VPNavBarSearch .DocSearch-Button-Key) {
        color: var(--vp-nav-search-key-text, var(--vp-c-text-2));
        background-color: var(--vp-nav-search-key-bg, transparent);
        border-color: var(--vp-nav-search-border, var(--vp-c-divider));
    }

    @media (max-width: 767px) {
        .content-body {
            column-gap: 0.5rem;
        }
    }

    /* Keep mobile sheet navigation available until desktop mega-menu breakpoint. */
    .hamburger {
        display: flex !important;
    }

    @media (min-width: 960px) {
        .hamburger {
            display: none !important;
        }
    }

    .menu + .translations::before,
    .menu + .appearance::before,
    .menu + .social-links::before,
    .translations + .appearance::before,
    .appearance + .social-links::before {
        margin-right: 8px;
        margin-left: 8px;
        width: 1px;
        height: 24px;
        background-color: var(--vp-c-divider);
        content: "";
    }

    .menu + .appearance::before,
    .translations + .appearance::before {
        margin-right: 16px;
    }

    .appearance + .social-links::before {
        margin-left: 16px;
    }

    .social-links {
        margin-right: -8px;
    }

    .divider {
        width: 100%;
        height: 1px;
    }

    @media (min-width: 960px) {
        .VPNavBar.has-sidebar .divider {
            padding-left: var(--vp-sidebar-width);
        }
    }

    @media (min-width: 1440px) {
        .VPNavBar.has-sidebar .divider {
            padding-left: calc(
                (100vw - var(--vp-layout-max-width)) / 2 +
                    var(--vp-sidebar-width)
            );
        }
    }

    .divider-line {
        width: 100%;
        height: 1px;
        transition: background-color 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .VPNavBar:not(.home) .divider-line {
        background-color: color-mix(
            in srgb,
            var(--vp-c-divider) 50%,
            transparent
        );
    }

    @media (min-width: 960px) {
        .VPNavBar:not(.home.top) .divider-line {
            background-color: var(--vp-c-gutter);
        }

        .VPNavBar:not(.has-sidebar):not(.home.top) .divider {
            background-color: var(--vp-c-gutter);
        }
    }
</style>
