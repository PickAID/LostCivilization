import { computed, inject, ref } from "vue";
import { Ref } from "vue";
import { DefaultTheme } from "vitepress/theme";
import { useData } from "vitepress";
import {
    HeroActionConfig,
    HeroBackgroundConfig,
    HeroFrontmatterConfig,
    HeroImageConfig,
    HeroImageThemeableSource,
    normalizeBackgroundConfig,
    normalizeHeroImageConfig,
    normalizeHeroWavesConfig,
    normalizeThemeableSource,
    resolveViewportEnabled,
} from "@utils/vitepress/api/frontmatter/hero";
import { createHeroTypographyState } from "@utils/vitepress/runtime/hero/typographyState";
import { createHeroFloatingWaveState } from "@utils/vitepress/runtime/hero/floatingWaveState";
import { getThemeRuntime } from "@utils/vitepress/runtime/theme";
import { decodeEscapedText, decodeEscapedTextDeep } from "@utils/vitepress/runtime/text/dynamicText";

export interface VPHeroProps {
    name?: string;
    text?: string;
    tagline?: string;
    image?: DefaultTheme.ThemeableImage;
    actions?: HeroActionConfig[];
}

export function createHeroRuntimeState(props: VPHeroProps) {
    const heroImageSlotExists = inject("hero-image-slot-exists", ref(false)) as Ref<boolean>;
    const { frontmatter, page, isDark } = useData();
    const heroRoot = ref<HTMLElement | null>(null);
    const { effectiveDark, themeReady } = getThemeRuntime(isDark);

    const heroConfig = computed<HeroFrontmatterConfig>(() => {
        const frontmatterHero = frontmatter.value?.hero;
        if (frontmatterHero && typeof frontmatterHero === "object") return frontmatterHero as HeroFrontmatterConfig;
        const pageHero = page.value?.frontmatter?.hero;
        if (pageHero && typeof pageHero === "object") return pageHero as HeroFrontmatterConfig;
        return {};
    });

    const resolvedName = computed(() => decodeEscapedText(props.name ?? heroConfig.value.name));
    const resolvedText = computed(() => decodeEscapedText(props.text ?? heroConfig.value.text));
    const resolvedTagline = computed(() => decodeEscapedText(props.tagline ?? heroConfig.value.tagline));
    const resolvedActions = computed<HeroActionConfig[] | undefined>(() =>
        decodeEscapedTextDeep(props.actions ?? heroConfig.value.actions),
    );

    const backgroundConfig = computed<HeroBackgroundConfig | undefined>(() =>
        normalizeBackgroundConfig(heroConfig.value.background),
    );

    const resolvedWavesConfig = computed(() => ({
        ...normalizeHeroWavesConfig(heroConfig.value.waves),
        enabled: true,
    }));

    const frontmatterImageConfig = computed<HeroImageConfig | undefined>(() => heroConfig.value.image);
    const normalizedDefaultImage = computed<HeroImageThemeableSource | undefined>(() =>
        normalizeThemeableSource(props.image),
    );
    const resolvedHeroImageConfig = computed<HeroImageConfig | undefined>(() =>
        normalizeHeroImageConfig(frontmatterImageConfig.value, normalizedDefaultImage.value),
    );

    const hasImage = computed(() => Boolean(heroImageSlotExists.value || resolvedHeroImageConfig.value));
    const imageBackgroundEnabled = computed(() => {
        const image = resolvedHeroImageConfig.value;
        if (!image || typeof image !== "object") return false;
        const background = (image as Record<string, unknown>).background;
        if (typeof background === "boolean") return background;
        if (background && typeof background === "object" && "enabled" in (background as Record<string, unknown>)) {
            return (background as Record<string, unknown>).enabled !== false;
        }
        return false;
    });

    const viewportEnabled = computed(() => resolveViewportEnabled(heroConfig.value));
    const hasWaves = computed(() => true);
    const floatingConfig = computed<Record<string, any> | undefined>(() => {
        const value = heroConfig.value.floating;
        return value && typeof value === "object"
            ? decodeEscapedTextDeep(value as Record<string, any>)
            : undefined;
    });

    const { heroTypographyType, hasColorOverrides, hasMediaBackground, heroCssVarsStyle } =
        createHeroTypographyState({
            heroConfig,
            backgroundConfig,
            heroRoot,
            isDark: effectiveDark,
        });

    const {
        floatingSnippetWords,
        hasFloatingItems,
        hideTaglineForWavePriority,
        hideActionsForWavePriority,
        maxVisibleActionsForWavePriority,
        showScrollArrow,
        scrollPastHero,
    } = createHeroFloatingWaveState({
        heroConfig,
        floatingConfig,
        resolvedActions,
        resolvedTagline,
        resolvedWavesConfig,
        viewportEnabled,
        hasWaves,
        hasImage,
        heroRoot,
    });

    return {
        heroRoot,
        backgroundConfig,
        floatingConfig,
        floatingSnippetWords,
        resolvedWavesConfig,
        resolvedName,
        resolvedText,
        resolvedTagline,
        resolvedActions,
        heroTypographyType,
        hasImage,
        imageBackgroundEnabled,
        resolvedHeroImageConfig,
        hasFloatingItems,
        hasMediaBackground,
        hasColorOverrides,
        viewportEnabled,
        hasWaves,
        hideTaglineForWavePriority,
        hideActionsForWavePriority,
        maxVisibleActionsForWavePriority,
        showScrollArrow,
        scrollPastHero,
        heroCssVarsStyle,
        effectiveDark,
        themeReady,
    };
}
