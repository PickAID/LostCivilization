import { computed, getCurrentInstance, onBeforeUnmount, ref } from "vue";
import { NavLink } from "@utils/config/navTypes";

const NAV_HOVER_MENU_CLOSE_DELAY_MS = 90;
const NAV_HOVER_PREVIEW_HIDE_DELAY_MS = 240;

export const activeNavHoverMenuId = ref<string | null>(null);
const globalHoveredLink = ref<NavLink | null>(null);
const globalSheetHovered = ref(false);
let globalHideTimer: ReturnType<typeof setTimeout> | null = null;
let globalMenuCloseTimer: ReturnType<typeof setTimeout> | null = null;

function hasPreview(link: NavLink | null): boolean {
    return Boolean(link?.preview);
}

function clearGlobalMenuCloseTimer() {
    if (globalMenuCloseTimer === null) return;
    clearTimeout(globalMenuCloseTimer);
    globalMenuCloseTimer = null;
}

function clearGlobalHideTimer() {
    if (globalHideTimer === null) return;
    clearTimeout(globalHideTimer);
    globalHideTimer = null;
}

function resetGlobalPreview() {
    clearGlobalHideTimer();
    globalSheetHovered.value = false;
    globalHoveredLink.value = null;
}

function scheduleGlobalPreviewHide(menuId: string) {
    clearGlobalHideTimer();
    globalHideTimer = setTimeout(() => {
        globalHideTimer = null;
        if (activeNavHoverMenuId.value !== menuId || globalSheetHovered.value) {
            return;
        }
        globalHoveredLink.value = null;
    }, NAV_HOVER_PREVIEW_HIDE_DELAY_MS);
}

export function activateNavHoverMenu(menuId: string): void {
    clearGlobalMenuCloseTimer();

    if (activeNavHoverMenuId.value === menuId) return;
    clearGlobalHideTimer();
    globalHoveredLink.value = null;
    globalSheetHovered.value = false;
    activeNavHoverMenuId.value = menuId;
}

export function deactivateNavHoverMenu(menuId: string): void {
    if (activeNavHoverMenuId.value !== menuId) return;
    clearGlobalMenuCloseTimer();
    resetGlobalPreview();
    activeNavHoverMenuId.value = null;
}

export function scheduleNavHoverMenuClose(
    menuId: string,
    delayMs = NAV_HOVER_MENU_CLOSE_DELAY_MS,
): void {
    if (activeNavHoverMenuId.value !== menuId) return;

    clearGlobalMenuCloseTimer();
    globalMenuCloseTimer = setTimeout(() => {
        globalMenuCloseTimer = null;
        if (activeNavHoverMenuId.value !== menuId) return;
        resetGlobalPreview();
        activeNavHoverMenuId.value = null;
    }, delayMs);
}

export function cancelNavHoverMenuClose(menuId?: string): void {
    if (menuId && activeNavHoverMenuId.value !== menuId) return;
    clearGlobalMenuCloseTimer();
}

export function resetNavHoverStateForTests(): void {
    clearGlobalMenuCloseTimer();
    clearGlobalHideTimer();
    activeNavHoverMenuId.value = null;
    globalHoveredLink.value = null;
    globalSheetHovered.value = false;
}

export function getActiveNavHoverPreviewLinkForTests(): NavLink | null {
    return globalHoveredLink.value;
}

export function isNavHoverPreviewSheetHoveredForTests(): boolean {
    return globalSheetHovered.value;
}

export function createNavHoverPreviewState(menuId: string) {
    const activePreviewLink = computed<NavLink | null>(() =>
        activeNavHoverMenuId.value === menuId && hasPreview(globalHoveredLink.value)
            ? globalHoveredLink.value
            : null,
    );

    function onItemEnter(link: NavLink) {
        if (activeNavHoverMenuId.value !== menuId) return;
        cancelNavHoverMenuClose(menuId);
        clearGlobalHideTimer();
        globalSheetHovered.value = false;
        globalHoveredLink.value = hasPreview(link) ? link : null;
    }

    function onItemLeave() {
        if (activeNavHoverMenuId.value !== menuId) return;
        scheduleGlobalPreviewHide(menuId);
    }

    function onSheetEnter() {
        if (activeNavHoverMenuId.value !== menuId) return;
        cancelNavHoverMenuClose(menuId);
        clearGlobalHideTimer();
        globalSheetHovered.value = true;
    }

    function onSheetLeave() {
        if (activeNavHoverMenuId.value !== menuId) return;
        globalSheetHovered.value = false;
        scheduleGlobalPreviewHide(menuId);
    }

    function resetPreview() {
        if (activeNavHoverMenuId.value !== menuId) return;
        resetGlobalPreview();
    }

    if (getCurrentInstance()) {
        onBeforeUnmount(() => {
            if (activeNavHoverMenuId.value === menuId) {
                deactivateNavHoverMenu(menuId);
            }
        });
    }

    return {
        activePreviewLink,
        onItemEnter,
        onItemLeave,
        onSheetEnter,
        onSheetLeave,
        resetPreview,
    };
}
