import { computed, onBeforeUnmount, ref } from "vue";
import { NavLink } from "@utils/config/navTypes";

const globalActiveMenuId = ref<string | null>(null);
const globalHoveredLink = ref<NavLink | null>(null);
const globalSheetHovered = ref(false);
let globalHideTimer: ReturnType<typeof setTimeout> | null = null;

function hasPreview(link: NavLink | null): boolean {
    return Boolean(link?.preview);
}

function clearGlobalHideTimer() {
    if (globalHideTimer === null) return;
    clearTimeout(globalHideTimer);
    globalHideTimer = null;
}

function hideGlobalPreview() {
    clearGlobalHideTimer();
    if (!globalSheetHovered.value) {
        globalHoveredLink.value = null;
    }
}

export function activateNavHoverMenu(menuId: string): void {
    if (globalActiveMenuId.value === menuId) return;
    clearGlobalHideTimer();
    globalHoveredLink.value = null;
    globalSheetHovered.value = false;
    globalActiveMenuId.value = menuId;
}

export function deactivateNavHoverMenu(menuId: string): void {
    if (globalActiveMenuId.value !== menuId) return;
    clearGlobalHideTimer();
    globalHoveredLink.value = null;
    globalSheetHovered.value = false;
    globalActiveMenuId.value = null;
}

export function createNavHoverPreviewState(menuId: string) {
    const activePreviewLink = computed<NavLink | null>(() =>
        globalActiveMenuId.value === menuId && hasPreview(globalHoveredLink.value) ? globalHoveredLink.value : null,
    );

    function onItemEnter(link: NavLink) {
        if (globalActiveMenuId.value !== menuId) return;
        clearGlobalHideTimer();
        globalHoveredLink.value = hasPreview(link) ? link : null;
    }

    function onItemLeave() {
        if (globalActiveMenuId.value !== menuId) return;
        hideGlobalPreview();
    }

    function onSheetEnter() {
        if (globalActiveMenuId.value !== menuId) return;
        clearGlobalHideTimer();
        globalSheetHovered.value = true;
    }

    function onSheetLeave() {
        if (globalActiveMenuId.value !== menuId) return;
        globalSheetHovered.value = false;
        hideGlobalPreview();
    }

    function resetPreview() {
        if (globalActiveMenuId.value !== menuId) return;
        clearGlobalHideTimer();
        globalSheetHovered.value = false;
        globalHoveredLink.value = null;
    }

    onBeforeUnmount(() => {
        if (globalActiveMenuId.value === menuId) {
            deactivateNavHoverMenu(menuId);
        }
    });

    return {
        activePreviewLink,
        onItemEnter,
        onItemLeave,
        onSheetEnter,
        onSheetLeave,
        resetPreview,
    };
}
