/**
 * requestAnimationFrame-based layout queue.
 *
 * Coalesces rapid calls into a single rAF callback, which is the
 * natural ~16 ms throttle that matches display refresh rates.
 *
 * @module runtime/viewport/rafQueue
 */

/**
 * Creates a rAF-queued wrapper around `fn`.
 *
 * Multiple calls between frames are collapsed to a single invocation
 * at the next animation frame. Returns an object with `request()` and
 * `cancel()`.
 *
 * ```ts
 * const layout = createRafQueue(() => recalcLayout());
 * window.addEventListener("resize", layout.request);
 * // cleanup:
 * layout.cancel();
 * ```
 */
export function createRafQueue(fn: () => void) {
    let frameId: number | null = null;

    return {
        request() {
            if (frameId !== null) return;
            frameId = window.requestAnimationFrame(() => {
                frameId = null;
                fn();
            });
        },
        cancel() {
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
                frameId = null;
            }
        },
    };
}
