/**
 * Shared hero theme context via provide/inject.
 *
 * VPHero provides `effectiveDark` from the shared theme runtime. Every hero
 * child component should call `useHeroTheme()` instead of reading
 * `useData().isDark` directly so first paint, reload, and runtime toggles all
 * stay aligned with the stabilized theme state.
 *
 * @module runtime/theme/heroThemeContext
 */

import {
    ComputedRef,
    InjectionKey,
    Ref,
    computed,
    inject,
} from "vue";
import { useData } from "vitepress";
import { resolveThemeColorByMode, resolveThemeValueByMode } from "./themeValueResolver";
import { getThemeRuntime } from "./themeRuntime";

/**
 * Injection key for the first-paint-safe dark mode ref.
 * Provided by `VPHero.vue`, consumed by all hero child components.
 */
export const heroEffectiveDarkKey: InjectionKey<
    Ref<boolean> | ComputedRef<boolean>
> = Symbol("hero-effective-dark");

/**
 * Returns the hero-scoped dark mode ref and a `resolveThemeValue` helper.
 *
 * Must be called inside a component that is a descendant of `VPHero`.
 * When no hero provider exists, it falls back to the shared theme runtime so
 * non-hero usage still stays first-paint-safe.
 */
export function useHeroTheme() {
    const scopedEffectiveDark = inject(heroEffectiveDarkKey, undefined);
    const { isDark } = useData();
    const themeRuntime = getThemeRuntime(isDark);

    /**
     * Reactive boolean ref: `true` when the current theme is dark.
     *
     * - When inside VPHero's tree → reads the provided hero-scoped ref.
     * - Fallback (outside hero) → reads the shared stabilized theme runtime.
     */
    const isDarkRef: ComputedRef<boolean> = computed(() => {
        return scopedEffectiveDark?.value ?? themeRuntime.effectiveDark.value;
    });

    function resolveThemeValue<T>(
        value: T | { light?: T; dark?: T; value?: T } | undefined,
    ): T | undefined {
        return resolveThemeValueByMode(value, isDarkRef.value);
    }

    function resolveThemeColor(
        value:
            | string
            | { light?: string; dark?: string; value?: string }
            | undefined,
        fallback: string,
    ): string {
        return resolveThemeColorByMode(value, isDarkRef.value, fallback);
    }

    function toCssValue(value: unknown): string | undefined {
        if (value === undefined || value === null) return undefined;
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        if (typeof value === "boolean") return value ? "1" : "0";
        if (Array.isArray(value)) return value.map(String).join(" ");
        return String(value);
    }

    return {
        effectiveDark: isDarkRef,
        isDarkRef,
        themeVersion: themeRuntime.version,
        resolveThemeValue,
        resolveThemeColor,
        toCssValue,
    };
}
