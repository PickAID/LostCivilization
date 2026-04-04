/**
 * General-purpose debounce utility.
 *
 * @module runtime/viewport/debounce
 */

/**
 * Returns a debounced wrapper around `fn` that delays invocation
 * until `waitMs` milliseconds after the last call.
 *
 * The returned function exposes a `.cancel()` method for cleanup.
 */
export function debounce<T extends (...args: readonly unknown[]) => void>(
    fn: T,
    waitMs: number,
): T & { cancel(): void } {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<T>) => {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...args);
        }, waitMs);
    };

    debounced.cancel = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    return debounced as T & { cancel(): void };
}
