/**
 * Reactive viewport state singleton.
 *
 * Provides a single source of truth for window dimensions and breakpoint
 * queries. Components call `createViewportState()` in `setup()` to get a
 * shared reactive reference — only one set of event listeners is active
 * regardless of how many components consume the state.
 *
 * @module runtime/viewport/viewportState
 */

import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from "vue";
import { Breakpoints, resolveBreakpoint, type BreakpointKey } from "./breakpoints";

export interface ViewportState {
    /** Current window inner width (px). */
    readonly width: Ref<number>;
    /** Current window inner height (px). */
    readonly height: Ref<number>;
    /** Current device pixel ratio. */
    readonly dpr: Ref<number>;
    /** Current breakpoint key derived from width. */
    readonly breakpoint: ComputedRef<BreakpointKey>;

    /** `true` when width ≤ Breakpoints.md (768). */
    readonly isMobile: ComputedRef<boolean>;
    /** `true` when width ≤ Breakpoints.lg (960). */
    readonly isTablet: ComputedRef<boolean>;
    /** `true` when width > Breakpoints.lg (960). */
    readonly isDesktop: ComputedRef<boolean>;

    /** Check width against an arbitrary pixel threshold. */
    readonly isBelow: (px: number) => boolean;
}

// ── Shared singleton refs ────────────────────────────────────────────────

const sharedWidth = ref(0);
const sharedHeight = ref(0);
const sharedDpr = ref(1);
let listenerCount = 0;

function syncViewport() {
    sharedWidth.value = window.innerWidth;
    sharedHeight.value = window.innerHeight;
    sharedDpr.value = window.devicePixelRatio ?? 1;
}

function attach() {
    if (listenerCount === 0) {
        syncViewport();
        window.addEventListener("resize", syncViewport, { passive: true });
        window.addEventListener("orientationchange", syncViewport, { passive: true });
    }
    listenerCount++;
}

function detach() {
    listenerCount--;
    if (listenerCount <= 0) {
        listenerCount = 0;
        window.removeEventListener("resize", syncViewport);
        window.removeEventListener("orientationchange", syncViewport);
    }
}

// ── Public factory ───────────────────────────────────────────────────────

/**
 * Creates (or reuses) the shared reactive viewport state.
 *
 * Must be called inside a Vue `setup()` context so the listeners are
 * correctly bound/unbound with the component lifecycle.
 *
 * ```ts
 * const vp = createViewportState();
 * // vp.isMobile.value, vp.width.value, etc.
 * ```
 */
export function createViewportState(): ViewportState {
    onMounted(attach);
    onUnmounted(detach);

    const breakpoint = computed(() => resolveBreakpoint(sharedWidth.value));
    const isMobile = computed(() => sharedWidth.value <= Breakpoints.md);
    const isTablet = computed(() => sharedWidth.value <= Breakpoints.lg);
    const isDesktop = computed(() => sharedWidth.value > Breakpoints.lg);

    return {
        width: sharedWidth,
        height: sharedHeight,
        dpr: sharedDpr,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        isBelow: (px: number) => sharedWidth.value < px,
    };
}
