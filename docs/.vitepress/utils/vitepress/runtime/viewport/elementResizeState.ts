/**
 * Reactive element resize observer.
 */

import { onMounted, onUnmounted, type Ref } from "vue";
import { debounce } from "./debounce";

export interface ElementResizeOptions {
    debounceMs?: number;
}

function handleResize(
    entries: ResizeObserverEntry[],
    onResize: (rect: DOMRectReadOnly) => void,
) {
    const entry = entries[entries.length - 1];
    if (entry) onResize(entry.contentRect);
}

export function createElementResizeState(
    targetRef: Ref<HTMLElement | null | undefined>,
    onResize: (rect: DOMRectReadOnly) => void,
    options: ElementResizeOptions = {},
) {
    const { debounceMs = 100 } = options;
    let observer: ResizeObserver | null = null;

    const handler = debounceMs > 0
        ? debounce((entries: ResizeObserverEntry[]) => handleResize(entries, onResize), debounceMs)
        : (entries: ResizeObserverEntry[]) => handleResize(entries, onResize);

    onMounted(() => {
        if (typeof ResizeObserver === "undefined" || typeof window === "undefined") return;
        observer = new ResizeObserver(handler);
        if (targetRef.value) observer.observe(targetRef.value);
    });

    onUnmounted(() => {
        observer?.disconnect();
        observer = null;
        if ("cancel" in handler) (handler as { cancel(): void }).cancel();
    });

    return {
        reobserve(el: HTMLElement) {
            observer?.disconnect();
            observer?.observe(el);
        },
    };
}
