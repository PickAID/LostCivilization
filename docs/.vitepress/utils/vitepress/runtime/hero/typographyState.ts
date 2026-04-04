import { computed } from "vue";
import { ComputedRef, Ref } from "vue";
import {
    HeroBackgroundConfig,
    HeroFrontmatterConfig,
    HeroTypographyStyleType,
    heroTypographyRegistry,
    resolveHeroTypographyStyleType,
} from "@utils/vitepress/api/frontmatter/hero";
import {
    createHeroNavAdaptiveState,
    HeroColorsConfig,
} from "@utils/vitepress/runtime/hero/navAdaptiveState";
import { createHeroColorToolkit } from "@utils/vitepress/runtime/hero/colorToolkit";

interface ResolvedTypographyMotionNode {
    x: number;
    y: number;
    scale: number;
}

interface ResolvedTypographyMotionStyle {
    intensity: number;
    title: ResolvedTypographyMotionNode;
    text: ResolvedTypographyMotionNode;
    tagline: ResolvedTypographyMotionNode;
    image: ResolvedTypographyMotionNode;
    transitionDuration: number;
    transitionDelayStep: number;
    transitionEasing: string;
}

export interface HeroTypographyStateOptions {
    heroConfig: ComputedRef<HeroFrontmatterConfig>;
    backgroundConfig: ComputedRef<HeroBackgroundConfig | undefined>;
    heroRoot: Ref<HTMLElement | null>;
    isDark: Ref<boolean>;
}

class NumberRangeResolver {
    static resolve(value: unknown, fallback: number, min: number, max: number) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(max, Math.max(min, numeric));
    }

    static clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }
}

class TypographyMotionResolver {
    constructor(
        private readonly heroConfig: ComputedRef<HeroFrontmatterConfig>,
        private readonly heroTypographyType: ComputedRef<HeroTypographyStyleType>,
    ) {}

    resolved = computed<ResolvedTypographyMotionStyle>(() => {
        const rawMotion = this.resolveRawMotion();
        const defaults = this.resolveDefaultMotionProfile();
        return {
            intensity: NumberRangeResolver.resolve(
                rawMotion.intensity,
                defaults.intensity,
                0,
                2,
            ),
            title: this.resolveNode(rawMotion.title, defaults.title),
            text: this.resolveNode(rawMotion.text, defaults.text),
            tagline: this.resolveNode(rawMotion.tagline, defaults.tagline),
            image: this.resolveNode(rawMotion.image, defaults.image),
            transitionDuration: NumberRangeResolver.resolve(
                rawMotion.transitionDuration,
                defaults.transitionDuration,
                120,
                2000,
            ),
            transitionDelayStep: NumberRangeResolver.resolve(
                rawMotion.transitionDelayStep,
                defaults.transitionDelayStep,
                0,
                300,
            ),
            transitionEasing:
                typeof rawMotion.transitionEasing === "string" &&
                rawMotion.transitionEasing.trim()
                    ? rawMotion.transitionEasing.trim()
                    : defaults.transitionEasing ||
                      "cubic-bezier(0.2, 0.9, 0.2, 1)",
        };
    });

    private resolveRawMotion() {
        const typography = this.heroConfig.value.typography;
        if (!typography || typeof typography !== "object")
            return {} as Record<string, unknown>;
        if (typography.motion && typeof typography.motion === "object")
            return typography.motion as Record<string, unknown>;
        if (
            typography.floatingTilt &&
            typeof typography.floatingTilt === "object"
        ) {
            return typography.floatingTilt as Record<string, unknown>;
        }
        return {} as Record<string, unknown>;
    }

    private resolveDefaultMotionProfile() {
        return heroTypographyRegistry.resolveMotionDefaults(
            this.heroTypographyType.value,
        );
    }

    private resolveNode(
        value: unknown,
        defaults: ResolvedTypographyMotionNode,
    ): ResolvedTypographyMotionNode {
        const node =
            value && typeof value === "object"
                ? (value as Record<string, unknown>)
                : {};
        return {
            x: NumberRangeResolver.resolve(node.x, defaults.x, -120, 120),
            y: NumberRangeResolver.resolve(node.y, defaults.y, -120, 120),
            scale: NumberRangeResolver.resolve(
                node.scale,
                defaults.scale,
                0.7,
                1.5,
            ),
        };
    }

}

class TypographyCssComposer {
    private readonly colorToolkit;

    constructor(
        private readonly options: HeroTypographyStateOptions,
        private readonly heroTypographyType: ComputedRef<HeroTypographyStyleType>,
        private readonly heroColors: ComputedRef<HeroColorsConfig | undefined>,
        private readonly motionStyle: ComputedRef<ResolvedTypographyMotionStyle>,
    ) {
        this.colorToolkit = createHeroColorToolkit({ isDark: options.isDark });
    }

    style = computed(() => {
        const style: Record<string, string> = {};
        this.mergeCustomVars(style);
        this.mergeColorVars(style);
        style["--hero-typography-style"] = this.heroTypographyType.value;
        this.mergeMotionVars(style);
        return style;
    });

    private mergeCustomVars(style: Record<string, string>) {
        const rawVars = this.options.heroConfig.value.cssVars;
        const mergedVars =
            rawVars && typeof rawVars === "object"
                ? (rawVars as Record<string, unknown>)
                : {};
        Object.entries(mergedVars).forEach(([rawKey, rawValue]) => {
            const key = rawKey.startsWith("--") ? rawKey : `--${rawKey}`;
            const resolved = this.colorToolkit.resolveThemeValue(rawValue);
            const cssValue = this.colorToolkit.toCssValue(resolved);
            if (cssValue !== undefined) style[key] = cssValue;
        });
    }

    private mergeColorVars(style: Record<string, string>) {
        const colors = this.heroColors.value;
        if (!colors) return;
        const map: Array<[string, unknown]> = [
            ["--hero-media-title-color", colors.title],
            ["--hero-media-muted-color", colors.tagline || colors.text],
            ["--hero-media-text-color", colors.text],
        ];
        map.forEach(([varName, value]) => {
            if (!value) return;
            const resolved = this.colorToolkit.resolveThemeValue(value as any);
            const cssValue = this.colorToolkit.toCssValue(resolved);
            if (cssValue !== undefined) style[varName] = cssValue;
        });
    }

    private mergeMotionVars(style: Record<string, string>) {
        const motion = this.motionStyle.value;
        const intensity = motion.intensity;
        const titleX = motion.title.x * intensity;
        const titleY = motion.title.y * intensity;
        const textX = motion.text.x * intensity;
        const textY = motion.text.y * intensity;
        const taglineX = motion.tagline.x * intensity;
        const taglineY = motion.tagline.y * intensity;
        const imageX = motion.image.x * intensity;
        const imageY = motion.image.y * intensity;

        const titleScale = 1 + (motion.title.scale - 1) * intensity;
        const textScale = 1 + (motion.text.scale - 1) * intensity;
        const taglineScale = 1 + (motion.tagline.scale - 1) * intensity;
        const imageScale = 1 + (motion.image.scale - 1) * intensity;

        const groupedFactor =
            this.heroTypographyType.value === "grouped-float" ? 1 : 0;
        const groupX =
            ((titleX + textX + taglineX + imageX) / 4) * groupedFactor;
        const groupY =
            ((titleY + textY + taglineY + imageY) / 4) * groupedFactor;
        const avgScale =
            (titleScale + textScale + taglineScale + imageScale) / 4;
        const groupScale = 1 + (avgScale - 1) * groupedFactor;

        const drift = (
            value: number,
            c: number,
            b: number,
            min: number,
            max: number,
        ) => NumberRangeResolver.clamp(value * c + b, min, max);

        style["--hero-typo-intensity"] = String(intensity);
        this.assignNodeVars(style, "title", titleX, titleY, titleScale, 0.08);
        this.assignNodeVars(style, "text", textX, textY, textScale, 0.08);
        this.assignNodeVars(
            style,
            "tagline",
            taglineX,
            taglineY,
            taglineScale,
            0.055,
        );
        this.assignNodeVars(style, "image", imageX, imageY, imageScale, 0.04);

        style["--hero-typo-group-x"] = `${groupX}px`;
        style["--hero-typo-group-y"] = `${groupY}px`;
        style["--hero-typo-group-scale"] = String(groupScale);
        style["--hero-typo-group-rotate"] = `${(groupX - groupY) * 0.045}deg`;
        style["--hero-typo-image-group-x"] = `${groupX * 0.92}px`;
        style["--hero-typo-image-group-y"] = `${groupY * 0.92}px`;
        style["--hero-typo-image-group-scale"] = String(
            1 + (groupScale - 1) * 0.86,
        );
        style["--hero-typo-title-drift-x"] =
            `${drift(Math.abs(titleX), 0.48, 8, 8, 22)}px`;
        style["--hero-typo-title-drift-y"] =
            `${drift(Math.abs(titleY), 0.52, 7, 7, 20)}px`;
        style["--hero-typo-text-drift-x"] =
            `${drift(Math.abs(textX), 0.58, 10, 10, 28)}px`;
        style["--hero-typo-text-drift-y"] =
            `${drift(Math.abs(textY), 0.56, 8, 8, 24)}px`;
        style["--hero-typo-tagline-drift-x"] =
            `${drift(Math.abs(taglineX), 0.54, 8, 8, 24)}px`;
        style["--hero-typo-tagline-drift-y"] =
            `${drift(Math.abs(taglineY), 0.6, 7, 7, 22)}px`;
        style["--hero-typo-image-drift-x"] =
            `${drift(Math.abs(imageX), 0.64, 12, 12, 34)}px`;
        style["--hero-typo-image-drift-y"] =
            `${drift(Math.abs(imageY), 0.62, 10, 10, 30)}px`;
        style["--hero-typo-transition-duration"] =
            `${motion.transitionDuration}ms`;
        style["--hero-typo-delay-step"] = `${motion.transitionDelayStep}ms`;
        style["--hero-typo-transition-easing"] = motion.transitionEasing;
    }

    private assignNodeVars(
        style: Record<string, string>,
        key: "title" | "text" | "tagline" | "image",
        x: number,
        y: number,
        scale: number,
        rotateScale: number,
    ) {
        style[`--hero-typo-${key}-x`] = `${x}px`;
        style[`--hero-typo-${key}-y`] = `${y}px`;
        style[`--hero-typo-${key}-scale`] = String(scale);
        style[`--hero-typo-${key}-rotate`] = `${(x - y) * rotateScale}deg`;
    }
}

export function createHeroTypographyState(options: HeroTypographyStateOptions) {
    const heroTypographyType = computed<HeroTypographyStyleType>(() =>
        resolveHeroTypographyStyleType(options.heroConfig.value),
    );

    const motionResolver = new TypographyMotionResolver(
        options.heroConfig,
        heroTypographyType,
    );

    const heroColors = computed<HeroColorsConfig | undefined>(() => {
        const colors = options.heroConfig.value.colors;
        return colors && typeof colors === "object"
            ? (colors as HeroColorsConfig)
            : undefined;
    });

    const hasColorOverrides = computed(() => {
        const colors = heroColors.value;
        return !!(colors?.title || colors?.tagline || colors?.text);
    });

    const { hasMediaBackground } = createHeroNavAdaptiveState({
        heroRoot: options.heroRoot,
        backgroundConfig: options.backgroundConfig,
        isDark: options.isDark,
        heroColors,
    });

    const cssComposer = new TypographyCssComposer(
        options,
        heroTypographyType,
        heroColors,
        motionResolver.resolved,
    );

    return {
        heroTypographyType,
        heroColors,
        hasColorOverrides,
        hasMediaBackground,
        heroCssVarsStyle: cssComposer.style,
    };
}
