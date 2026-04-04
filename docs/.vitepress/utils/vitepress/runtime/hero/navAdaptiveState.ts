import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { Ref } from "vue";
import { HeroBackgroundConfig, hasMediaBackground as hasMediaBackgroundInConfig } from "@utils/vitepress/api/frontmatter/hero";
import { createHeroColorToolkit } from "@utils/vitepress/runtime/hero/colorToolkit";

type ThemeColorValue = string | { light?: string; dark?: string; value?: string };

export interface HeroColorsConfig {
    title?: ThemeColorValue;
    tagline?: ThemeColorValue;
    text?: ThemeColorValue;
    navText?: ThemeColorValue;
    navTextScrolled?: ThemeColorValue;
    navTextHover?: ThemeColorValue;
    navTextHoverScrolled?: ThemeColorValue;
    navBackground?: ThemeColorValue;
    navBackgroundScrolled?: ThemeColorValue;
    searchBackground?: ThemeColorValue;
    searchBackgroundScrolled?: ThemeColorValue;
    searchHoverBackground?: ThemeColorValue;
    searchHoverBackgroundScrolled?: ThemeColorValue;
    searchText?: ThemeColorValue;
    searchTextScrolled?: ThemeColorValue;
    searchTextMuted?: ThemeColorValue;
    searchTextMutedScrolled?: ThemeColorValue;
    searchBorder?: ThemeColorValue;
    searchBorderScrolled?: ThemeColorValue;
    searchKeyBackground?: ThemeColorValue;
    searchKeyBackgroundScrolled?: ThemeColorValue;
    searchKeyText?: ThemeColorValue;
    searchKeyTextScrolled?: ThemeColorValue;
}

export interface HeroNavAdaptiveStateOptions {
    heroRoot: Ref<HTMLElement | null>;
    backgroundConfig: Ref<HeroBackgroundConfig | undefined>;
    isDark: Ref<boolean>;
    heroColors: Ref<HeroColorsConfig | undefined>;
}

const NAV_ADAPTIVE_CLASS = "hero-nav-adaptive";
const NAV_SCROLLED_CLASS = "hero-nav-scrolled";
const NAV_STYLE_VARS = [
    "--hero-nav-text-color",
    "--hero-nav-text-hover-color",
    "--vp-nav-text-color",
    "--vp-nav-text-hover-color",
    "--vp-nav-custom-bg",
    "--vp-nav-search-bg",
    "--vp-nav-search-bg-hover",
    "--vp-nav-search-border",
    "--vp-nav-search-text",
    "--vp-nav-search-text-muted",
    "--vp-nav-search-key-bg",
    "--vp-nav-search-key-text",
] as const;

class HeroNavAdaptiveController {
    private readonly heroUnderlapsNav = ref(false);
    private readonly isAtTop = ref(true);
    private readonly colorToolkit: ReturnType<typeof createHeroColorToolkit>;

    constructor(private readonly options: HeroNavAdaptiveStateOptions) {
        this.colorToolkit = createHeroColorToolkit({ isDark: options.isDark });
    }

    hasMediaBackground = computed(() =>
        hasMediaBackgroundInConfig(this.options.backgroundConfig.value),
    );

    resolvedColors = computed<HeroColorsConfig>(() => this.options.heroColors.value || {});

    navAdaptiveEnabled = computed(() => {
        const colors = this.resolvedColors.value;
        return Boolean(
            colors.navText ||
                colors.navTextScrolled ||
                colors.navTextHover ||
                colors.navTextHoverScrolled ||
                colors.navBackground ||
                colors.navBackgroundScrolled ||
                colors.searchBackground ||
                colors.searchBackgroundScrolled ||
                colors.searchHoverBackground ||
                colors.searchHoverBackgroundScrolled ||
                colors.searchText ||
                colors.searchTextScrolled ||
                colors.searchTextMuted ||
                colors.searchTextMutedScrolled ||
                colors.searchBorder ||
                colors.searchBorderScrolled ||
                colors.searchKeyBackground ||
                colors.searchKeyBackgroundScrolled ||
                colors.searchKeyText ||
                colors.searchKeyTextScrolled
        );
    });

    mount() {
        this.updateScrollState();
        if (typeof window === "undefined") return;
        window.addEventListener("scroll", this.updateScrollState, { passive: true });
        window.addEventListener("resize", this.updateScrollState, { passive: true });
        window.addEventListener("orientationchange", this.updateScrollState, { passive: true });
    }

    unmount() {
        if (typeof window !== "undefined") {
            window.removeEventListener("scroll", this.updateScrollState);
            window.removeEventListener("resize", this.updateScrollState);
            window.removeEventListener("orientationchange", this.updateScrollState);
        }
        this.cleanupNavState();
    }

    updateScrollState = () => {
        if (typeof window === "undefined") return;
        const heroRoot = this.options.heroRoot.value;
        if (!heroRoot) {
            this.heroUnderlapsNav.value = false;
            this.isAtTop.value = true;
            this.applyNavState();
            return;
        }

        const navHeightValue = Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--vp-nav-height"),
        );
        const navHeight = Number.isFinite(navHeightValue) ? navHeightValue : 64;
        const heroRect = heroRoot.getBoundingClientRect();
        this.heroUnderlapsNav.value = heroRect.top <= navHeight && heroRect.bottom > navHeight + 12;
        this.isAtTop.value = window.scrollY <= 10;
        this.applyNavState();
    };

    applyNavState = () => {
        if (typeof document === "undefined") return;
        const nav = document.querySelector<HTMLElement>(".VPNav");
        if (!nav) return;

        if (!this.navAdaptiveEnabled.value) {
            this.cleanupNavElement(nav);
            return;
        }

        if (!this.heroUnderlapsNav.value) {
            this.cleanupNavElement(nav);
            return;
        }

        nav.classList.add(NAV_ADAPTIVE_CLASS);
        nav.classList.toggle(NAV_SCROLLED_CLASS, !this.isAtTop.value);

        const colors = this.resolvedColors.value;
        const navText = this.resolveStateColor(colors.navText, colors.navTextScrolled);
        const navTextHover =
            this.resolveStateColor(colors.navTextHover, colors.navTextHoverScrolled) || navText;

        const styleMap: Record<string, string | undefined> = {
            "--hero-nav-text-color": navText,
            "--hero-nav-text-hover-color": navTextHover,
            "--vp-nav-text-color": navText,
            "--vp-nav-text-hover-color": navTextHover,
            "--vp-nav-custom-bg": this.resolveStateColor(colors.navBackground, colors.navBackgroundScrolled),
            "--vp-nav-search-bg": this.resolveStateColor(colors.searchBackground, colors.searchBackgroundScrolled),
            "--vp-nav-search-bg-hover": this.resolveStateColor(
                colors.searchHoverBackground,
                colors.searchHoverBackgroundScrolled,
            ),
            "--vp-nav-search-text": this.resolveStateColor(colors.searchText, colors.searchTextScrolled),
            "--vp-nav-search-text-muted": this.resolveStateColor(
                colors.searchTextMuted,
                colors.searchTextMutedScrolled,
            ),
            "--vp-nav-search-border": this.resolveStateColor(colors.searchBorder, colors.searchBorderScrolled),
            "--vp-nav-search-key-bg": this.resolveStateColor(
                colors.searchKeyBackground,
                colors.searchKeyBackgroundScrolled,
            ),
            "--vp-nav-search-key-text": this.resolveStateColor(colors.searchKeyText, colors.searchKeyTextScrolled),
        };

        Object.entries(styleMap).forEach(([cssVar, value]) => {
            if (!value) {
                nav.style.removeProperty(cssVar);
                return;
            }
            nav.style.setProperty(cssVar, value);
        });
    };

    private resolveStateColor(topValue: ThemeColorValue | undefined, scrolledValue: ThemeColorValue | undefined) {
        const value = this.isAtTop.value ? topValue : (scrolledValue ?? topValue);
        return this.colorToolkit.resolveThemeValue(value);
    }

    private cleanupNavElement(nav: HTMLElement) {
        nav.classList.remove(NAV_ADAPTIVE_CLASS, NAV_SCROLLED_CLASS);
        NAV_STYLE_VARS.forEach((cssVar) => nav.style.removeProperty(cssVar));
    }

    private cleanupNavState() {
        if (typeof document === "undefined") return;
        const nav = document.querySelector<HTMLElement>(".VPNav");
        if (!nav) return;
        this.cleanupNavElement(nav);
    }
}

export function createHeroNavAdaptiveState(options: HeroNavAdaptiveStateOptions) {
    const controller = new HeroNavAdaptiveController(options);

    watch(
        () => [controller.navAdaptiveEnabled.value, controller.resolvedColors.value, options.isDark.value],
        () => controller.updateScrollState(),
        { immediate: true, deep: true },
    );

    onMounted(() => controller.mount());
    onUnmounted(() => controller.unmount());

    return {
        hasMediaBackground: controller.hasMediaBackground,
    };
}
