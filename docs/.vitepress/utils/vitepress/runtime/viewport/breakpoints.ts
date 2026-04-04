/**
 * Centralised breakpoint constants used across the entire project.
 *
 * Every component that checks viewport width should import from here
 * instead of hardcoding pixel values.
 *
 * @module runtime/viewport/breakpoints
 */

export const Breakpoints = {
    /** Extra-small mobile (≤ 360px). */
    xs: 360,
    /** Small mobile (≤ 480px). */
    sm: 480,
    /** Tablet / large mobile (≤ 768px). */
    md: 768,
    /** Small desktop / landscape tablet (≤ 960px). */
    lg: 960,
    /** Desktop (≤ 1024px). */
    xl: 1024,
    /** Large desktop (≤ 1200px). */
    xxl: 1200,
} as const;

export type BreakpointKey = keyof typeof Breakpoints;

/**
 * Returns the current breakpoint key for a given width.
 * Useful for switch-style responsive logic.
 */
export function resolveBreakpoint(width: number): BreakpointKey {
    if (width <= Breakpoints.xs) return "xs";
    if (width <= Breakpoints.sm) return "sm";
    if (width <= Breakpoints.md) return "md";
    if (width <= Breakpoints.lg) return "lg";
    if (width <= Breakpoints.xl) return "xl";
    return "xxl";
}
