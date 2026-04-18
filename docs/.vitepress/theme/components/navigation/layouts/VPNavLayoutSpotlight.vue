<script lang="ts" setup>
    import { computed, onBeforeUnmount, ref } from "vue";
    import { onClickOutside } from "@vueuse/core";
    import VPLink from "vitepress/dist/client/theme-default/components/VPLink.vue";
    import type { NavItem, NavLink } from "@utils/config/navTypes";
    import { resolveAccessibleNavHref } from "@utils/vitepress/api/navigation/NavLinkAccessService";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";
    import NavHoverPreviewSheet from "./NavHoverPreviewSheet.vue";
    import {
        activeNavHoverMenuId,
        createNavHoverPreviewState,
        activateNavHoverMenu,
        cancelNavHoverMenuClose,
        deactivateNavHoverMenu,
        scheduleNavHoverMenuClose,
    } from "@utils/vitepress/runtime/navigation/navHoverPreviewState";

    const props = defineProps<{
        item: NavItem;
    }>();

    function toStableMenuSlug(text: string) {
        const normalized = text.trim().normalize("NFKD");
        if (!normalized) return "menu";

        const parts = Array.from(normalized)
            .map((char) => {
                if (/^[a-z0-9_-]$/i.test(char)) {
                    return char.toLowerCase();
                }

                const codePoint = char.codePointAt(0);
                return codePoint ? codePoint.toString(36) : "";
            })
            .filter(Boolean);

        return parts.join("-").replace(/-{2,}/g, "-");
    }

    const rootRef = ref<HTMLElement | null>(null);

    const columns = computed(() => props.item.dropdown?.panels || []);
    const spotlight = computed(() => columns.value[0]?.featured || null);
    const hasSpotlight = computed(() => Boolean(spotlight.value?.title));
    const spotlightCard = computed(() => ({
        title: spotlight.value?.title || "",
        desc: spotlight.value?.desc || "",
        link: spotlight.value?.link,
        href: spotlight.value?.href,
        media: spotlight.value?.media,
        badge: spotlight.value?.badge,
    }));
    const alignment = computed(() => props.item.dropdown?.align || "center");
    const dropdownPreview = computed(() => props.item.dropdown?.preview || null);
    const previewLinks = computed<NavLink[]>(() => {
        const links: NavLink[] = [];
        for (const panel of columns.value) {
            for (const group of panel.groups || []) {
                for (const link of group.items || []) {
                    if (link.preview) links.push(link);
                }
            }
        }
        return links;
    });
    const hasPreviewColumn = computed(
        () => previewLinks.value.length > 0 || Boolean(dropdownPreview.value),
    );

    const menuId = computed(() => {
        const slug = toStableMenuSlug(props.item.text);
        return `nav-spotlight-${slug || "menu"}`;
    });
    const isOpen = computed(() => activeNavHoverMenuId.value === menuId.value);

    const resolveHref = (link: NavLink) =>
        resolveAccessibleNavHref(link.link, link.href);
    const hasHref = (link: NavLink) => Boolean(resolveHref(link));
    const isExternalLink = (link: NavLink) => Boolean(link.href && !link.link);
    const iconClass = (icon?: string) =>
        icon && icon.startsWith("vpi-") ? icon : "";
    const {
        activePreviewLink,
        onItemEnter,
        onItemLeave,
        onSheetEnter,
        onSheetLeave,
        resetPreview,
    } = createNavHoverPreviewState(menuId.value);

    const spotlightHref = computed(() =>
        resolveAccessibleNavHref(spotlightCard.value.link, spotlightCard.value.href),
    );
    const spotlightIsExternal = computed(() =>
        Boolean(spotlightCard.value.href && !spotlightCard.value.link),
    );
    const spotlightMediaVariant = computed(
        () => spotlightCard.value.media?.variant || "plain",
    );

    function openMenu() {
        cancelNavHoverMenuClose();
        activateNavHoverMenu(menuId.value);
    }

    const onRootEnter = () => {
        openMenu();
    };

    const onRootLeave = () => {
        scheduleNavHoverMenuClose(menuId.value);
    };

    const closeMenu = () => {
        resetPreview();
        deactivateNavHoverMenu(menuId.value);
    };

    onClickOutside(rootRef, closeMenu);
    onBeforeUnmount(() => {
        cancelNavHoverMenuClose(menuId.value);
        if (activeNavHoverMenuId.value === menuId.value) {
            deactivateNavHoverMenu(menuId.value);
        }
    });
</script>

<template>
    <div
        ref="rootRef"
        class="VPNavLayoutSpotlight"
        :class="[`align-${alignment}`, { 'is-open': isOpen }]"
        @mouseenter="onRootEnter"
        @mouseleave="onRootLeave"
        @keydown.esc.stop.prevent="closeMenu"
    >
        <button
            type="button"
            class="menu-trigger"
            :aria-controls="menuId"
            aria-haspopup="menu"
            :aria-expanded="isOpen"
            @mouseenter="openMenu"
            @click="openMenu"
            @keydown.esc.prevent="closeMenu"
        >
            <span>{{ item.text }}</span>
            <span v-if="item.badge" class="badge" :class="item.badge.type">
                {{ item.badge.text }}
            </span>
            <span class="vpi-chevron-down icon" />
        </button>

        <div
            v-if="columns.length > 0"
            :id="menuId"
            class="mega-menu"
            :aria-hidden="!isOpen"
        >
            <div class="mega-menu-content">
                <section v-if="hasSpotlight" class="spotlight-section">
                    <VPLink
                        v-if="spotlightHref"
                        class="spotlight-card"
                        :href="spotlightHref"
                        :target="spotlightIsExternal ? '_blank' : undefined"
                        :rel="spotlightIsExternal ? 'noreferrer' : undefined"
                        @click="closeMenu"
                    >
                        <div
                            v-if="spotlightCard.media"
                            class="spotlight-media"
                            :class="{
                                'spotlight-media--screenshot':
                                    spotlightCard.media?.type === 'screenshot',
                                'spotlight-media--framed':
                                    spotlightMediaVariant === 'framed',
                                'spotlight-media--plain':
                                    spotlightMediaVariant === 'plain',
                            }"
                        >
                            <div
                                v-if="
                                    spotlightCard.media?.type === 'screenshot' &&
                                    spotlightMediaVariant === 'framed'
                                "
                                class="spotlight-browser-chrome"
                            >
                                <span class="spotlight-browser-dots">
                                    <i />
                                    <i />
                                    <i />
                                </span>
                                <span class="spotlight-browser-label">{{
                                    spotlightCard.media?.alt || spotlightCard.title
                                }}</span>
                            </div>
                            <img
                                v-if="
                                    (spotlightCard.media?.type === 'image' ||
                                        spotlightCard.media?.type === 'svg' ||
                                        spotlightCard.media?.type ===
                                            'screenshot') &&
                                    spotlightCard.media?.src
                                "
                                :src="
                                    resolveAssetWithBase(
                                        spotlightCard.media?.src,
                                    )
                                "
                                :alt="
                                    spotlightCard.media?.alt ||
                                    spotlightCard.title
                                "
                            />
                            <div
                                v-else-if="spotlightCard.media?.background"
                                class="spotlight-bg"
                                :style="{
                                    background: spotlightCard.media?.background,
                                }"
                            />
                        </div>
                        <div class="spotlight-content">
                            <span
                                v-if="spotlightCard.badge"
                                class="badge"
                                :class="spotlightCard.badge?.type"
                            >
                                {{ spotlightCard.badge?.text }}
                            </span>
                            <h3 class="spotlight-title">
                                {{ spotlightCard.title }}
                            </h3>
                            <p class="spotlight-desc">{{ spotlightCard.desc }}</p>
                        </div>
                    </VPLink>
                    <article
                        v-else
                        class="spotlight-card spotlight-card--static"
                    >
                        <div
                            v-if="spotlightCard.media"
                            class="spotlight-media"
                            :class="{
                                'spotlight-media--screenshot':
                                    spotlightCard.media?.type === 'screenshot',
                                'spotlight-media--framed':
                                    spotlightMediaVariant === 'framed',
                                'spotlight-media--plain':
                                    spotlightMediaVariant === 'plain',
                            }"
                        >
                            <div
                                v-if="
                                    spotlightCard.media?.type === 'screenshot' &&
                                    spotlightMediaVariant === 'framed'
                                "
                                class="spotlight-browser-chrome"
                            >
                                <span class="spotlight-browser-dots">
                                    <i />
                                    <i />
                                    <i />
                                </span>
                                <span class="spotlight-browser-label">{{
                                    spotlightCard.media?.alt || spotlightCard.title
                                }}</span>
                            </div>
                            <img
                                v-if="
                                    (spotlightCard.media?.type === 'image' ||
                                        spotlightCard.media?.type === 'svg' ||
                                        spotlightCard.media?.type ===
                                            'screenshot') &&
                                    spotlightCard.media?.src
                                "
                                :src="
                                    resolveAssetWithBase(
                                        spotlightCard.media?.src,
                                    )
                                "
                                :alt="
                                    spotlightCard.media?.alt ||
                                    spotlightCard.title
                                "
                            />
                            <div
                                v-else-if="spotlightCard.media?.background"
                                class="spotlight-bg"
                                :style="{
                                    background: spotlightCard.media?.background,
                                }"
                            />
                        </div>
                        <div class="spotlight-content">
                            <span
                                v-if="spotlightCard.badge"
                                class="badge"
                                :class="spotlightCard.badge?.type"
                            >
                                {{ spotlightCard.badge?.text }}
                            </span>
                            <h3 class="spotlight-title">
                                {{ spotlightCard.title }}
                            </h3>
                            <p class="spotlight-desc">{{ spotlightCard.desc }}</p>
                        </div>
                    </article>
                </section>

                <div
                    class="links-section"
                    :class="{ 'has-preview': hasPreviewColumn }"
                >
                    <div class="links-columns">
                        <div
                            v-for="(panel, panelIndex) in columns"
                            :key="`panel-${panelIndex}`"
                            class="menu-column"
                        >
                            <section
                                v-for="(group, groupIndex) in panel.groups"
                                :key="`group-${groupIndex}`"
                                class="menu-group"
                            >
                                <h4 v-if="group.label" class="group-title">
                                    <span
                                        v-if="group.icon"
                                        class="group-icon"
                                        >{{ group.icon }}</span
                                    >
                                    {{ group.label }}
                                </h4>

                                <ul class="link-list">
                                    <li
                                        v-for="(link, linkIndex) in group.items"
                                        :key="`link-${linkIndex}-${link.text}`"
                                        class="link-item"
                                        @mouseenter="onItemEnter(link)"
                                        @mouseleave="onItemLeave"
                                        @focusin="onItemEnter(link)"
                                        @focusout="onItemLeave"
                                    >
                                        <VPLink
                                            v-if="hasHref(link)"
                                            class="link-anchor"
                                            :href="resolveHref(link)"
                                            :target="
                                                isExternalLink(link)
                                                    ? '_blank'
                                                    : undefined
                                            "
                                            :rel="
                                                isExternalLink(link)
                                                    ? 'noreferrer'
                                                    : undefined
                                            "
                                            @click="closeMenu"
                                        >
                                            <span
                                                v-if="link.icon"
                                                class="link-icon"
                                            >
                                                <span
                                                    :class="
                                                        iconClass(link.icon)
                                                    "
                                                >
                                                    {{
                                                        iconClass(link.icon)
                                                            ? ""
                                                            : link.icon
                                                    }}
                                                </span>
                                            </span>
                                            <span class="link-text">
                                                <span class="title">{{
                                                    link.text
                                                }}</span>
                                                <span
                                                    v-if="link.desc"
                                                    class="desc"
                                                    >{{ link.desc }}</span
                                                >
                                            </span>
                                        </VPLink>
                                        <span
                                            v-else
                                            class="link-anchor link-anchor--static"
                                        >
                                            <span
                                                v-if="link.icon"
                                                class="link-icon"
                                            >
                                                <span
                                                    :class="
                                                        iconClass(link.icon)
                                                    "
                                                >
                                                    {{
                                                        iconClass(link.icon)
                                                            ? ""
                                                            : link.icon
                                                    }}
                                                </span>
                                            </span>
                                            <span class="link-text">
                                                <span class="title">{{
                                                    link.text
                                                }}</span>
                                                <span
                                                    v-if="link.desc"
                                                    class="desc"
                                                    >{{ link.desc }}</span
                                                >
                                            </span>
                                        </span>
                                    </li>
                                </ul>
                            </section>
                        </div>
                    </div>

                    <aside
                        v-if="hasPreviewColumn"
                        class="preview-sheet"
                        @mouseenter="onSheetEnter"
                        @mouseleave="onSheetLeave"
                    >
                        <NavHoverPreviewSheet
                            v-if="activePreviewLink || dropdownPreview"
                            :link="activePreviewLink"
                            :preview="dropdownPreview"
                        />
                        <div v-else class="preview-placeholder" />
                    </aside>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .VPNavLayoutSpotlight {
        position: relative;
        display: inline-flex;
    }

    .VPNavLayoutSpotlight::after {
        content: "";
        position: absolute;
        top: 100%;
        left: -48px;
        right: -48px;
        height: 18px;
        pointer-events: none;
    }

    .VPNavLayoutSpotlight.is-open::after {
        pointer-events: auto;
    }

    .menu-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0 12px;
        line-height: var(--vp-nav-height);
        font-size: 14px;
        font-weight: 500;
        color: var(--vp-c-text-1);
        background: transparent;
        border: 0;
        cursor: pointer;
        transition: color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .menu-trigger:hover,
    .menu-trigger:focus-visible,
    .VPNavLayoutSpotlight.is-open .menu-trigger {
        color: var(--vp-nav-text-hover-color, var(--vp-c-brand-1));
    }

    .menu-trigger:focus-visible {
        outline: 1px solid var(--vp-c-brand-1);
        outline-offset: 2px;
        border-radius: 6px;
    }

    .icon {
        font-size: 13px;
        color: var(--vp-nav-text-color, var(--vp-c-text-2));
        transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .VPNavLayoutSpotlight.is-open .icon {
        transform: rotate(180deg);
    }

    .mega-menu {
        position: absolute;
        top: calc(var(--vp-nav-height) + 4px);
        z-index: 60;
        min-width: 720px;
        max-width: min(1160px, calc(100vw - 32px));
        padding: 24px 32px;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 60%, transparent);
        border-radius: 20px;
        background: color-mix(in srgb, var(--vp-c-bg) 85%, transparent);
        backdrop-filter: blur(48px) saturate(200%);
        -webkit-backdrop-filter: blur(48px) saturate(200%);
        box-shadow:
            0 50px 100px -20px rgba(0, 0, 0, 0.12),
            0 30px 60px -30px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        --transform-x: 0;
        transform: translateX(var(--transform-x)) translateY(8px) scale(0.97);
        transform-origin: top center;
        transition:
            opacity 0.16s cubic-bezier(0.2, 0.9, 0.2, 1),
            transform 0.18s cubic-bezier(0.32, 0.72, 0, 1),
            visibility 0.16s;
        white-space: normal;
        overflow-wrap: anywhere;
    }

    .VPNavLayoutSpotlight.is-open .mega-menu {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateX(var(--transform-x)) translateY(0) scale(1);
    }

    .align-start .mega-menu {
        left: 0;
        --transform-x: 0;
    }

    .align-center .mega-menu {
        left: 50%;
        --transform-x: -50%;
    }

    .align-end .mega-menu {
        right: 0;
        --transform-x: 0;
    }

    .mega-menu-content {
        display: flex;
        gap: 32px;
        align-items: flex-start;
        min-width: 0;
    }

    .spotlight-section {
        width: clamp(260px, 28vw, 340px);
        flex-shrink: 0;
        padding-right: 32px;
        border-right: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 40%, transparent);
    }

    .spotlight-card {
        display: block;
        color: inherit;
        text-decoration: none;
    }

    .spotlight-card--static {
        cursor: default;
    }

    .spotlight-media {
        position: relative;
        margin-bottom: 16px;
        border-radius: 16px;
        overflow: hidden;
        aspect-ratio: 16 / 9;
        background: transparent;
        border: 0;
        box-shadow: none;
    }

    .spotlight-media--framed {
        display: flex;
        flex-direction: column;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 60%, transparent);
        background: color-mix(in srgb, var(--vp-c-default-soft) 92%, transparent);
        isolation: isolate;
        box-shadow:
            0 24px 48px -24px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }

    .spotlight-media--screenshot.spotlight-media--framed {
        background:
            linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.06) 0%,
                rgba(255, 255, 255, 0.02) 100%
            ),
            color-mix(in srgb, var(--vp-c-bg-soft) 96%, transparent);
    }

    .spotlight-browser-chrome {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 34px;
        padding: 0 12px;
        border-bottom: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 56%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg-elv) 82%, transparent);
    }

    .spotlight-browser-dots {
        display: inline-flex;
        gap: 6px;
        flex: 0 0 auto;
    }

    .spotlight-browser-dots i {
        display: block;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--vp-c-text-3) 52%, transparent);
    }

    .spotlight-browser-dots i:nth-child(1) {
        background: rgba(255, 95, 86, 0.78);
    }

    .spotlight-browser-dots i:nth-child(2) {
        background: rgba(255, 189, 46, 0.78);
    }

    .spotlight-browser-dots i:nth-child(3) {
        background: rgba(39, 201, 63, 0.78);
    }

    .spotlight-browser-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--vp-c-text-2);
        font-size: 11px;
        letter-spacing: 0.02em;
    }

    .spotlight-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .spotlight-media--screenshot.spotlight-media--framed img {
        height: calc(100% - 34px);
    }

    /* ONLY allowed to transform the spotlight graphic inside the card layout */
    .spotlight-media--framed img {
        transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    .spotlight-card:hover .spotlight-media--framed img {
        transform: scale(1.05);
    }

    .spotlight-card--static:hover .spotlight-media--framed img {
        transform: none;
    }

    .spotlight-bg {
        width: 100%;
        height: 100%;
    }

    .spotlight-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .spotlight-title {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        line-height: 1.3;
        color: var(--vp-c-text-1);
    }

    .spotlight-desc {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--vp-c-text-2);
    }

    .links-section {
        display: flex;
        gap: 24px;
        min-width: 0;
        flex: 1 1 auto;
    }

    .links-columns {
        display: flex;
        gap: 32px;
        min-width: 0;
        flex: 1 1 auto;
    }

    .links-section.has-preview .links-columns {
        gap: 24px;
    }

    .menu-column {
        min-width: 190px;
        max-width: 240px;
    }

    .menu-group + .menu-group {
        margin-top: 24px;
    }

    .group-title {
        margin: 0 0 12px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--vp-c-text-2);
        font-weight: 600;
    }

    .group-icon {
        margin-right: 6px;
    }

    .link-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .link-item + .link-item {
        margin-top: 4px;
    }

    .link-item {
        border-radius: 8px;
        transition: background-color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .link-item:hover {
        background: color-mix(in srgb, var(--vp-c-brand-1) 5%, transparent);
    }

    .link-anchor {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 0;
        padding: 8px 10px;
        border-radius: 8px;
        color: var(--vp-c-text-1);
        text-decoration: none;
        transition: color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .link-anchor:hover,
    .link-anchor:focus-visible {
        color: var(--vp-nav-text-hover-color, var(--vp-c-brand-1));
    }

    .link-anchor:focus-visible {
        outline: 1px solid var(--vp-c-brand-1);
        outline-offset: 2px;
        border-radius: 4px;
    }

    .link-anchor--static {
        cursor: default;
    }

    .preview-sheet {
        flex: 0 0 clamp(210px, 22vw, 292px);
        width: clamp(210px, 22vw, 292px);
        min-width: 0;
        position: relative;
    }

    .preview-sheet::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: -40px;
        width: 40px;
        pointer-events: auto;
    }

    .preview-placeholder {
        width: 100%;
        min-height: 200px;
        border-radius: 12px;
        border: 0;
        background: transparent;
        opacity: 0;
    }

    .link-icon {
        color: var(--vp-c-text-2);
        line-height: 1.2;
    }

    .link-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .spotlight-title,
    .group-title,
    .title {
        white-space: normal;
        overflow-wrap: normal;
        word-break: normal;
    }

    .title {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
    }

    .spotlight-desc,
    .desc {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.5;
        color: var(--vp-c-text-2);
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .badge {
        align-self: flex-start;
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 999px;
        text-transform: uppercase;
        background: var(--vp-c-brand-soft);
        color: var(--vp-c-brand-1);
        line-height: 1.4;
    }

    .badge.new {
        background: var(--vp-c-green-soft);
        color: var(--vp-c-green-1);
    }

    .badge.beta {
        background: var(--vp-c-yellow-soft);
        color: var(--vp-c-yellow-1);
    }
</style>
