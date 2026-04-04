<script lang="ts" setup>
    import { computed, inject, onUnmounted, ref, watch } from "vue";
    import { useScrollLock } from "@vueuse/core";
    import { useData } from "vitepress";
    import {
        navConfig,
        type NavItem,
        type NavLink,
    } from "@utils/config/navConfig";
    import { projectConfig } from "@config/project-config";
    import {
        getLangCodeFromVitepressLang,
        getDefaultLanguage,
    } from "@config/project-api";
    import { prefixNavLinks } from "@utils/vitepress/api/navigation/NavLinkAccessService";
    import VPNavScreenMenuGroup from "vitepress/dist/client/theme-default/components/VPNavScreenMenuGroup.vue";
    import VPNavScreenMenuLink from "vitepress/dist/client/theme-default/components/VPNavScreenMenuLink.vue";
    import VPNavScreenAppearance from "vitepress/dist/client/theme-default/components/VPNavScreenAppearance.vue";
    import VPNavScreenSocialLinks from "vitepress/dist/client/theme-default/components/VPNavScreenSocialLinks.vue";
    import VPNavScreenTranslations from "vitepress/dist/client/theme-default/components/VPNavScreenTranslations.vue";

    const props = defineProps<{
        open: boolean;
    }>();

    const closeScreen = inject("close-screen") as () => void;
    const dialogRef = ref<HTMLDialogElement | null>(null);
    const isLocked = useScrollLock(
        typeof window !== "undefined" ? document.body : null,
    );

    const { lang } = useData();

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

    /**
     * Normalize a NavLink for the mobile menu.
     * Items without a link/href are still valid — they show as text labels.
     */
    function normalizeMenuLink(link: NavLink) {
        const href = link.link || link.href;
        const isExternal = Boolean(link.href && !link.link);
        return {
            text: link.text,
            link: href || "#",
            target: isExternal ? "_blank" : undefined,
            rel: isExternal ? "noreferrer" : undefined,
        };
    }

    /**
     * Flatten dropdown panels into VPNavScreenMenuGroup-compatible items.
     * Groups with labels become section headers; items become links.
     */
    const flattenDropdownItems = (item: NavItem) => {
        if (!item.dropdown?.panels) return [];
        return item.dropdown.panels.flatMap((panel) =>
            panel.groups
                .map((group) => {
                    const items = group.items.map((link) =>
                        normalizeMenuLink(link),
                    );
                    if (group.label) {
                        return {
                            text: group.label,
                            items: items,
                        };
                    }
                    return items;
                })
                .flat(),
        );
    };

    const hasDropdownItems = (item: NavItem) =>
        flattenDropdownItems(item).length > 0;

    const isTopLevelClickable = (item: NavItem) =>
        Boolean(item.link || item.href);

    const onDialogClick = (event: MouseEvent) => {
        if (event.target === dialogRef.value) {
            closeScreen();
        }
    };

    // --- Touch Drag-to-Close Logic ---
    const sheetContainerRef = ref<HTMLElement | null>(null);
    const startY = ref(0);
    const currentY = ref(0);
    const isDragging = ref(false);

    const onTouchStart = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        // Only allow drag from the top handle area or if scrolled to top
        const contentArea =
            sheetContainerRef.value?.querySelector(".sheet-content");
        if (
            contentArea &&
            contentArea.contains(target) &&
            contentArea.scrollTop > 0
        ) {
            return;
        }
        startY.value = e.touches[0].clientY;
        isDragging.value = true;
    };

    const onTouchMove = (e: TouchEvent) => {
        if (!isDragging.value) return;
        const deltaY = e.touches[0].clientY - startY.value;
        if (deltaY > 0) {
            // Only allow dragging downwards
            currentY.value = deltaY;
            if (sheetContainerRef.value) {
                // Apply a friction curve so it doesn't just stick to the finger linearly immediately
                sheetContainerRef.value.style.transform = `translateY(${deltaY}px)`;
                sheetContainerRef.value.style.transition = "none";
            }
        }
    };

    const onTouchEnd = () => {
        if (!isDragging.value) return;
        isDragging.value = false;

        if (sheetContainerRef.value) {
            sheetContainerRef.value.style.transition = "";
            sheetContainerRef.value.style.transform = "";
        }

        // If dragged more than 100px down, close the sheet
        if (currentY.value > 100) {
            closeScreen();
        }
        currentY.value = 0;
    };

    watch(
        () => props.open,
        (isOpen) => {
            if (!dialogRef.value) return;

            if (isOpen) {
                if (!dialogRef.value.open) {
                    dialogRef.value.showModal();
                }
                isLocked.value = true;
                // Reset drag state
                currentY.value = 0;
                if (sheetContainerRef.value) {
                    sheetContainerRef.value.style.transform = "";
                }
                return;
            }

            if (dialogRef.value.open) {
                dialogRef.value.close();
            }
            isLocked.value = false;
        },
    );

    onUnmounted(() => {
        isLocked.value = false;
    });
</script>

<template>
    <dialog
        ref="dialogRef"
        class="VPMobileNavSheet"
        @click="onDialogClick"
        @cancel.prevent="closeScreen"
    >
        <div
            ref="sheetContainerRef"
            class="sheet-container"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
        >
            <div class="sheet-handle-wrap" aria-hidden="true">
                <span class="sheet-handle" />
            </div>
            <div class="sheet-content">
                <slot name="nav-screen-content-before" />

                <nav class="menu">
                    <template v-for="item in currentNav" :key="item.text">
                        <VPNavScreenMenuGroup
                            v-if="item.dropdown && hasDropdownItems(item)"
                            :text="item.text"
                            :items="flattenDropdownItems(item) as any[]"
                        />
                        <VPNavScreenMenuLink
                            v-else-if="isTopLevelClickable(item)"
                            :item="item as any"
                        />
                        <div v-else class="menu-label">{{ item.text }}</div>
                    </template>
                </nav>

                <div class="controls-row">
                    <div class="control-card translations-card">
                        <VPNavScreenTranslations />
                    </div>
                    <div class="control-card appearance-card">
                        <VPNavScreenAppearance />
                    </div>
                </div>

                <div class="social-links">
                    <VPNavScreenSocialLinks />
                </div>

                <slot name="nav-screen-content-after" />
            </div>
        </div>
    </dialog>
</template>

<style scoped>
    /* ═══════════════════════════════════════════════════════
       §  DIALOG SHELL
       ═══════════════════════════════════════════════════════ */
    .VPMobileNavSheet {
        position: fixed;
        inset: 0;
        align-items: flex-end;
        justify-content: stretch;
        width: 100dvw;
        max-width: none;
        height: 100dvh;
        max-height: 100dvh;
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        box-sizing: border-box;
        overflow: hidden;
        padding-top: max(8px, env(safe-area-inset-top));
        padding-inline: clamp(8px, 2.4vw, 18px);
        pointer-events: auto;
        z-index: calc(var(--vp-z-index-nav) + 8);
    }

    .VPMobileNavSheet[open] {
        display: flex;
    }

    @supports not (height: 100dvh) {
        .VPMobileNavSheet {
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            padding-top: 8px;
        }
    }

    /* ── Backdrop ────────────────────────────────────────── */
    .VPMobileNavSheet::backdrop {
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
        -webkit-backdrop-filter: blur(0);
        transition:
            background 0.5s cubic-bezier(0.32, 0.72, 0, 1),
            backdrop-filter 0.5s cubic-bezier(0.32, 0.72, 0, 1),
            -webkit-backdrop-filter 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .VPMobileNavSheet[open]::backdrop {
        background: rgba(0, 0, 0, 0.18);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
    }

    /* ═══════════════════════════════════════════════════════
       §  SHEET CONTAINER  —  the "card" that slides up
       ═══════════════════════════════════════════════════════ */
    .sheet-container {
        width: min(100%, 820px);
        max-width: 100%;
        height: calc(100dvh - max(8px, env(safe-area-inset-top)));
        max-height: calc(100dvh - max(8px, env(safe-area-inset-top)));
        margin: 0 auto;
        border-radius: 20px 20px 0 0;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 50%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg) 82%, transparent);
        backdrop-filter: blur(48px) saturate(200%);
        -webkit-backdrop-filter: blur(48px) saturate(200%);
        box-shadow:
            0 -8px 32px rgba(0, 0, 0, 0.06),
            0 24px 80px -12px rgba(0, 0, 0, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        pointer-events: auto;

        /* Entrance animation — spring physics */
        transform: translateY(100%);
        opacity: 0;
        transition:
            transform 0.55s cubic-bezier(0.32, 0.72, 0, 1),
            opacity 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .VPMobileNavSheet[open] .sheet-container {
        transform: translateY(0%);
        opacity: 1;
    }

    @supports not (height: 100dvh) {
        .sheet-container {
            height: calc(100vh - 8px);
            max-height: calc(100vh - 8px);
        }
    }

    /* ── Handle ─────────────────────────────────────────── */
    .sheet-handle-wrap {
        display: flex;
        justify-content: center;
        padding: 12px 0 6px;
    }

    .sheet-handle {
        width: 40px;
        height: 5px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--vp-c-text-3) 40%, transparent);
    }

    /* ── Scrollable content ─────────────────────────────── */
    .sheet-content {
        flex: 1 1 auto;
        min-height: 0;
        padding: 12px 28px calc(32px + env(safe-area-inset-bottom));
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        pointer-events: auto;
    }

    /* ═══════════════════════════════════════════════════════
       §  MENU ITEMS — Premium typography & spacing
       ═══════════════════════════════════════════════════════ */
    .menu {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    /* ── Top-level links & group buttons ─────────────────  */
    .menu :deep(.VPNavScreenMenuLink),
    .menu :deep(.VPNavScreenMenuGroup .button) {
        font-size: 17px;
        font-weight: 600;
        line-height: 1.4;
        letter-spacing: -0.01em;
        padding: 14px 16px;
        border-bottom: none !important;
        border-radius: 12px;
        background: transparent;
        transition:
            background-color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
            color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .menu :deep(.VPNavScreenMenuLink:hover),
    .menu :deep(.VPNavScreenMenuLink:active),
    .menu :deep(.VPNavScreenMenuGroup .button:hover),
    .menu :deep(.VPNavScreenMenuGroup .button:active) {
        background: color-mix(in srgb, var(--vp-c-brand-1) 6%, transparent);
        color: var(--vp-c-brand-1);
    }

    /* ── Remove default borders/heights ─────────────────── */
    .menu :deep(.VPNavScreenMenuGroup) {
        border-bottom: none !important;
        min-height: auto;
        height: auto;
        overflow: hidden;
    }

    .menu :deep(.VPNavScreenMenuGroup .items) {
        display: none;
        overflow: visible;
        max-height: none;
    }

    .menu :deep(.VPNavScreenMenuGroup.open .items) {
        display: block;
    }

    .menu :deep(.VPNavScreenMenuGroup .button) {
        min-height: auto;
        padding-right: 8px;
        align-items: flex-start;
        gap: 12px;
        text-align: left;
    }

    .menu :deep(.VPNavScreenMenuGroup .button-icon) {
        flex: 0 0 auto;
        margin-top: 4px;
        font-size: 16px;
        transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .menu :deep(.VPNavScreenMenuGroup.open .button-icon) {
        transform: rotate(45deg);
    }

    /* ── Sub-links inside expanded groups ────────────────  */
    .menu :deep(.VPNavScreenMenuGroupLink) {
        margin-left: 0;
        padding: 10px 16px 10px 28px;
        line-height: 1.5;
        font-size: 15px;
        font-weight: 500;
        border-radius: 10px;
        color: var(--vp-c-text-2);
        transition:
            background-color 0.2s ease,
            color 0.2s ease;
    }

    .menu :deep(.VPNavScreenMenuGroupLink:hover) {
        color: var(--vp-c-text-1);
        background: color-mix(in srgb, var(--vp-c-text-1) 4%, transparent);
    }

    /* ── Section headings inside groups ──────────────────  */
    .menu :deep(.VPNavScreenMenuGroupSection .title) {
        margin: 12px 16px 6px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--vp-c-text-3);
    }

    /* ── Static label (no link, no dropdown) ─────────────  */
    .menu-label {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        border-radius: 12px;
        font-size: 17px;
        font-weight: 600;
        line-height: 1.4;
        letter-spacing: -0.01em;
        color: var(--vp-c-text-1);
    }

    .menu :deep(.button-text),
    .menu :deep(.VPNavScreenMenuGroupLink),
    .menu :deep(.VPNavScreenMenuGroupSection .title) {
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: normal;
    }

    .menu :deep(.button-text) {
        flex: 1 1 auto;
        min-width: 0;
        display: block;
    }

    .menu :deep(.VPNavScreenMenuLink),
    .menu :deep(.VPNavScreenMenuGroupLink) {
        white-space: normal;
    }

    /* ═══════════════════════════════════════════════════════
       §  CONTROLS ROW — Language · Theme toggle
       ═══════════════════════════════════════════════════════ */
    .controls-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 8px;
        padding-top: 20px;
        border-top: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 30%, transparent);
    }

    .control-card {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px 16px;
        background: color-mix(in srgb, var(--vp-c-bg-soft) 60%, transparent);
        border-radius: 14px;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 25%, transparent);
        transition: background-color 0.25s ease;
    }

    .control-card:active {
        background: color-mix(in srgb, var(--vp-c-text-1) 5%, transparent);
    }

    /* ── Override VPNavScreenAppearance internals ────────  */
    .appearance-card :deep(.VPNavScreenAppearance) {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        justify-content: center;
        width: 100%;
        border-radius: 0;
    }

    .appearance-card :deep(.VPNavScreenAppearance .text) {
        display: none !important;
    }

    /* ── Override VPNavScreenTranslations internals ──────  */
    .translations-card :deep(.VPNavScreenTranslations) {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .translations-card :deep(.VPNavScreenTranslations .title) {
        justify-content: center;
        width: 100%;
        padding: 0;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--vp-c-text-2);
    }

    .translations-card :deep(.VPNavScreenTranslations .icon) {
        font-size: 14px;
    }

    .translations-card :deep(.VPNavScreenTranslations .list) {
        padding: 0;
        text-align: center;
    }

    .translations-card :deep(.VPNavScreenTranslations .item) {
        border-top: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 30%, transparent);
        margin-top: 8px;
        padding-top: 4px;
    }

    .translations-card :deep(.VPNavScreenTranslations .link) {
        font-size: 13px;
        font-weight: 500;
        line-height: 28px;
    }

    /* ═══════════════════════════════════════════════════════
       §  SOCIAL LINKS
       ═══════════════════════════════════════════════════════ */
    .social-links {
        margin-top: 16px;
        display: flex;
        justify-content: center;
    }

    /* ═══════════════════════════════════════════════════════
       §  MOBILE BREAKPOINT (< 768px)
       ═══════════════════════════════════════════════════════ */
    @media (max-width: 767px) {
        .VPMobileNavSheet {
            padding-inline: 0;
            padding-top: 0;
        }

        .sheet-content {
            padding: 8px 20px calc(24px + env(safe-area-inset-bottom));
        }

        .sheet-container {
            width: 100%;
            border-radius: 20px 20px 0 0;
            border-left: 0;
            border-right: 0;
        }

        .menu :deep(.VPNavScreenMenuLink),
        .menu :deep(.VPNavScreenMenuGroup .button),
        .menu-label {
            font-size: 16px;
        }

        .controls-row {
            gap: 10px;
        }
    }
</style>
