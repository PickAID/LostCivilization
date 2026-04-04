import { inBrowser, withBase } from "vitepress";
import { nextTick, onMounted, onUnmounted, watch, type Ref } from "vue";
import { resolveThemeValueByMode } from "./themeValueResolver";

type RouteLike = {
    path: string;
};

type FrontmatterRef = Ref<Record<string, unknown>>;
type EffectiveDarkRef = Ref<boolean>;

export function applyThemePageStyles(
    route: RouteLike,
    frontmatter: FrontmatterRef,
    effectiveDark: EffectiveDarkRef,
) {
    const appliedFrontmatterCssVars = new Set<string>();
    let cssVarScopeElement: HTMLElement | null = null;
    let cssVarsApplyFrame: number | null = null;

    const resolveThemeValue = (value: unknown) => {
        return resolveThemeValueByMode(
            value as {
                light?: unknown;
                dark?: unknown;
                value?: unknown;
            },
            effectiveDark.value,
        );
    };

    const toCssValue = (value: unknown) => {
        if (value === undefined || value === null) return undefined;
        if (typeof value === "string") return value;
        if (typeof value === "number") return String(value);
        if (typeof value === "boolean") return value ? "1" : "0";
        if (Array.isArray(value)) return value.map(String).join(" ");
        return String(value);
    };

    const clearFrontmatterCssVars = () => {
        if (!inBrowser || !cssVarScopeElement) return;

        for (const key of appliedFrontmatterCssVars) {
            cssVarScopeElement.style.removeProperty(key);
        }
        appliedFrontmatterCssVars.clear();
    };

    const resolvePageCssScope = () => {
        if (!inBrowser) return null;

        return (
            (document.querySelector(".VPContent") as HTMLElement | null) ||
            (document.querySelector(".Layout") as HTMLElement | null) ||
            (document.querySelector(".VPDoc") as HTMLElement | null)
        );
    };

    const applyThemeAssetCssVars = () => {
        if (!inBrowser) return;

        document.documentElement.style.setProperty(
            "--vp-github-bg-image-light",
            `url("${withBase("/icon/github.png")}")`,
        );
        document.documentElement.style.setProperty(
            "--vp-github-bg-image-dark",
            `url("${withBase("/icon/github_dark.png")}")`,
        );
    };

    const applyFrontmatterCssVars = () => {
        if (!inBrowser) return;

        const nextScope = resolvePageCssScope();
        if (!nextScope) {
            scheduleFrontmatterCssVarsApply();
            return;
        }

        if (cssVarScopeElement && cssVarScopeElement !== nextScope) {
            clearFrontmatterCssVars();
        }
        cssVarScopeElement = nextScope;

        clearFrontmatterCssVars();

        const cssVars = frontmatter.value?.cssVars;
        const mergedVars =
            cssVars && typeof cssVars === "object" && !Array.isArray(cssVars)
                ? cssVars
                : {};

        for (const [rawKey, rawValue] of Object.entries(mergedVars)) {
            const key = rawKey.startsWith("--") ? rawKey : `--${rawKey}`;
            const cssValue = toCssValue(resolveThemeValue(rawValue));
            if (cssValue === undefined || !cssVarScopeElement) continue;

            cssVarScopeElement.style.setProperty(key, cssValue);
            appliedFrontmatterCssVars.add(key);
        }
    };

    const scheduleFrontmatterCssVarsApply = () => {
        if (!inBrowser) return;

        if (cssVarsApplyFrame !== null) {
            window.cancelAnimationFrame(cssVarsApplyFrame);
        }

        cssVarsApplyFrame = window.requestAnimationFrame(() => {
            cssVarsApplyFrame = null;
            applyFrontmatterCssVars();
        });
    };

    watch(
        () => [route.path, effectiveDark.value, frontmatter.value?.cssVars],
        applyFrontmatterCssVars,
        { immediate: true, deep: true, flush: "post" },
    );

    watch(() => route.path, applyThemeAssetCssVars, { immediate: true });

    onMounted(() => {
        applyThemeAssetCssVars();
        nextTick(() => {
            applyFrontmatterCssVars();
            scheduleFrontmatterCssVarsApply();
        });
    });

    onUnmounted(() => {
        clearFrontmatterCssVars();
        if (cssVarsApplyFrame !== null) {
            window.cancelAnimationFrame(cssVarsApplyFrame);
            cssVarsApplyFrame = null;
        }
    });
}
