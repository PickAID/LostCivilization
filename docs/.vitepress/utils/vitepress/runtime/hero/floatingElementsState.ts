import { computed } from "vue";
import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";
import { floatingElementRegistry } from "@utils/vitepress/api/frontmatter/hero";
import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";
import {
    FloatingBuiltinElementType,
    FloatingConfig,
    FloatingItem,
    NormalizedFloatingItem,
    ThemeValue,
} from "./floatingTypes";

const POSITION_PRESETS = [
    { x: "6%", y: "18%" },
    { x: "16%", y: "72%" },
    { x: "28%", y: "26%" },
    { x: "38%", y: "78%" },
    { x: "62%", y: "18%" },
    { x: "74%", y: "68%" },
    { x: "84%", y: "32%" },
    { x: "92%", y: "78%" },
    { x: "12%", y: "42%" },
    { x: "90%", y: "54%" },
] as const;

const DEFAULT_TEXT_GRADIENTS = [
    "linear-gradient(120deg, #0f4c9a 0%, #2f6fc0 48%, #6aa3e8 100%)",
    "linear-gradient(120deg, #0a7a6a 0%, #13907c 50%, #47b89f 100%)",
    "linear-gradient(120deg, #8a5a12 0%, #b07b1c 55%, #d9a23a 100%)",
    "linear-gradient(120deg, #36506b 0%, #527297 50%, #7e96b5 100%)",
    "linear-gradient(120deg, #4a4e9a 0%, #5f6bc2 52%, #8492da 100%)",
] as const;

interface FloatingElementsProps {
    config?: FloatingConfig;
    snippetWords?: string[];
    isDarkRef?: { value: boolean | { value?: boolean } };
}

interface FloatingTypeResolution {
    rawType: string;
    renderAs: FloatingBuiltinElementType;
    component?: string;
    className?: string;
}

class NumberResolver {
    static clamp(value: unknown, fallback: number, min: number, max: number) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(max, Math.max(min, parsed));
    }
}

class ThemeResolver {
    constructor(private readonly resolveIsDark: () => boolean) {}

    resolve<T>(value: ThemeValue<T> | undefined): T | undefined {
        if (value === undefined || value === null) return undefined;
        if (typeof value !== "object") return value as T;
        const themed = value as { light?: T; dark?: T; value?: T };
        return this.resolveIsDark()
            ? (themed.dark ?? themed.value)
            : (themed.light ?? themed.value);
    }

    resolveString(value: ThemeValue<string> | undefined) {
        const resolved = this.resolve(value);
        return typeof resolved === "string" ? resolved.trim() : "";
    }
}

class FloatingElementStateController {
    density;
    globalOpacity;
    motionEnabled;
    motionDurationMin;
    motionDurationMax;
    motionDrift;
    overlayBlur;

    constructor(
        private readonly props: FloatingElementsProps,
        private readonly themeResolver: ThemeResolver,
    ) {
        this.density = computed(() => NumberResolver.clamp(this.props.config?.density, 10, 1, 30));
        this.globalOpacity = computed(() => NumberResolver.clamp(this.props.config?.opacity, 0.82, 0.12, 1));
        this.motionEnabled = computed(() => this.props.config?.motion?.enabled !== false);
        this.motionDurationMin = computed(() => NumberResolver.clamp(this.props.config?.motion?.durationMin, 15, 8, 50));
        this.motionDurationMax = computed(() => {
            const max = NumberResolver.clamp(this.props.config?.motion?.durationMax, 28, 10, 90);
            return Math.max(max, this.motionDurationMin.value + 1);
        });
        this.motionDrift = computed(() => NumberResolver.clamp(this.props.config?.motion?.drift, 34, 8, 90));
        this.overlayBlur = computed(() => NumberResolver.clamp(this.props.config?.blur, 0, 0, 20));
    }

    snippetItems = computed<FloatingItem[]>(() => {
        const words = (this.props.snippetWords || []).filter((word) => typeof word === "string" && word.trim().length > 0);
        if (words.length === 0) return [];
        const targetCount = Math.max(words.length, this.density.value);
        return Array.from({ length: targetCount }, (_, index) => ({ type: "text", text: words[index % words.length] }));
    });

    sourceItems = computed<FloatingItem[]>(() => {
        const items = this.props.config?.items;
        if (Array.isArray(items) && items.length > 0) return items;
        return this.snippetItems.value;
    });

    normalizedItems = computed<NormalizedFloatingItem[]>(() =>
        this.sourceItems.value.map((item, index) => this.normalizeItem(item, index)),
    );

    rootStyle = computed(() => ({
        zIndex: String(this.props.config?.zIndex ?? 1),
        "--floating-overlay-blur": `${this.overlayBlur.value}px`,
    }));

    isEnabled = computed(() => {
        if (this.props.config?.enabled === false) return false;
        return this.normalizedItems.value.length > 0;
    });

    itemStyle(item: NormalizedFloatingItem) {
        const style: Record<string, string | undefined> = {
            left: item.x,
            top: item.y,
            width: item.width,
            opacity: String(item.opacity * this.globalOpacity.value),
            color: item.color,
            "--floating-rotate": `${item.rotate}deg`,
            "--floating-delay": `${item.delay}s`,
            "--floating-duration": `${item.duration}s`,
            "--floating-drift-x": `${item.driftX}px`,
            "--floating-drift-y": `${item.driftY}px`,
            "--floating-animation-name": "hero-floating-drift",
            "--floating-text-color": item.textColor || item.color,
            "--floating-text-gradient": item.gradientValue,
            "--floating-text-shadow": item.textShadow,
            "--floating-text-bg": item.textBackground,
            "--floating-text-border": item.textBorderColor,
            "--floating-text-radius": item.textRadius,
            "--floating-text-box-shadow": item.textBoxShadow,
            "--floating-text-size": item.textSize,
            "--floating-text-weight": String(item.textWeight || ""),
            "--floating-text-letter-spacing": item.textLetterSpacing,
            "--floating-item-width": String(item.width || ""),
            "--floating-card-bg": item.cardBackground || item.background,
            "--floating-card-border": item.cardBorderColor || item.borderColor,
            "--floating-card-radius": item.cardRadius,
            "--floating-card-shadow": item.cardShadow,
            "--floating-card-title-color": item.cardTitleColor,
            "--floating-card-description-color": item.cardDescriptionColor,
            "--floating-image-border": item.imageBorderColor,
            "--floating-image-radius": item.imageRadius,
            "--floating-image-shadow": item.imageShadow,
            "--floating-image-bg": item.imageBackground,
            "--floating-image-fit": item.imageFit,
            "--floating-badge-bg": item.badgeBackground,
            "--floating-badge-border": item.badgeBorderColor,
            "--floating-badge-radius": item.badgeRadius,
            "--floating-badge-shadow": item.badgeShadow,
            "--floating-badge-color": item.badgeColor,
            "--floating-badge-icon-color": item.badgeIconColor,
            "--floating-icon-bg": item.iconBackground,
            "--floating-icon-border": item.iconBorderColor,
            "--floating-icon-radius": item.iconRadius,
            "--floating-icon-shadow": item.iconShadow,
            "--floating-icon-color": item.iconColor,
            "--floating-icon-size": item.iconSize,
            "--floating-stat-bg": item.statBackground,
            "--floating-stat-border": item.statBorderColor,
            "--floating-stat-radius": item.statRadius,
            "--floating-stat-shadow": item.statShadow,
            "--floating-stat-label-color": item.statLabelColor,
            "--floating-stat-value-color": item.statValueColor,
            "--floating-code-bg": item.codeBackground,
            "--floating-code-border": item.codeBorderColor,
            "--floating-code-radius": item.codeRadius,
            "--floating-code-shadow": item.codeShadow,
            "--floating-code-color": item.codeColor,
            "--floating-code-size": item.codeSize,
            "--floating-shape-bg": item.shapeBackground,
            "--floating-shape-border": item.shapeBorderColor,
            "--floating-shape-radius": item.shapeRadius,
            "--floating-shape-shadow": item.shapeShadow,
            "--floating-shape-size": item.shapeSize,
        };
        Object.entries(style).forEach(([key, value]) => {
            if (value === undefined || value === "") delete style[key];
        });
        return style;
    }

    private normalizeItem(item: FloatingItem, index: number): NormalizedFloatingItem {
        const preset = POSITION_PRESETS[index % POSITION_PRESETS.length];
        const inferredType = this.inferFloatingType(item);
        const typeResolution = this.resolveFloatingType(item, inferredType);
        const type = typeResolution.renderAs;
        const duration = NumberResolver.clamp(
            item.duration,
            this.motionDurationMin.value + (index % 4) * 3,
            this.motionDurationMin.value,
            this.motionDurationMax.value,
        );
        const delay = NumberResolver.clamp(item.delay, index * 0.5, 0, 60);
        const driftX = NumberResolver.clamp(
            item.driftX,
            ((index % 2 === 0 ? 1 : -1) * this.motionDrift.value) / (1.4 + (index % 3)),
            -100,
            100,
        );
        const driftY = NumberResolver.clamp(item.driftY, ((index % 3) - 1) * (this.motionDrift.value * 0.35), -100, 100);
        const opacity = NumberResolver.clamp(item.opacity, type === "text" ? 0.7 : type === "card" ? 0.92 : 0.84, 0.08, 1);

        const resolvedText = this.themeResolver.resolveString(item.text);
        const resolvedTitle = this.themeResolver.resolveString(item.title);
        const resolvedDescription = this.themeResolver.resolveString(item.description);
        const resolvedValue = this.themeResolver.resolveString(item.value);
        const resolvedCode = this.themeResolver.resolveString(item.code);
        const resolvedIcon = this.themeResolver.resolveString(item.icon);
        const resolvedSrc = this.themeResolver.resolveString(item.src);
        const resolvedAlt = this.themeResolver.resolveString(item.alt);

        const colorType = item.colorType || "solid";
        const explicitGradient = this.themeResolver.resolve(item.gradient);
        const palette = this.resolveGradientPalette(item);
        const gradientValue =
            colorType === "gradient"
                ? String(explicitGradient || "").trim() || palette[index % palette.length]
                : colorType === "random-gradient"
                  ? palette[index % palette.length]
                  : "";

        const textColor = String(this.themeResolver.resolve(item.color) || "").trim();
        const textShadow = String(this.themeResolver.resolve(item.textShadow) || "").trim();
        const textBackground = String(this.themeResolver.resolve(item.background) || "").trim();
        const textBorderColor = String(this.themeResolver.resolve(item.borderColor) || "").trim();
        const textRadius = item.borderRadius || "";
        const textBoxShadow = String(this.themeResolver.resolve(item.shadow) || "").trim();

        return {
            key: `floating-${index}`,
            rawType: typeResolution.rawType as any,
            type,
            component: typeResolution.component,
            componentProps:
                item.componentProps &&
                typeof item.componentProps === "object" &&
                !Array.isArray(item.componentProps)
                    ? item.componentProps
                    : undefined,
            customClass: typeResolution.className,
            code: resolvedCode || resolvedText,
            value: resolvedValue,
            icon: resolvedIcon,
            shape: item.shape || "circle",
            text: resolvedText || resolvedTitle,
            title: resolvedTitle || resolvedText,
            description: resolvedDescription,
            src: resolveAssetWithBase(resolvedSrc),
            alt: resolvedAlt || resolvedTitle || resolvedText || "floating-image",
            x: item.x || preset.x,
            y: item.y || preset.y,
            width: item.width,
            rotate: NumberResolver.clamp(item.rotate, (index % 2 === 0 ? 1 : -1) * (2 + (index % 4) * 1.5), -24, 24),
            opacity,
            duration,
            delay,
            driftX,
            driftY,
            motionStyle: item.motionStyle || "drift",
            color: this.themeResolver.resolve(item.color),
            background: this.themeResolver.resolve(item.background),
            borderColor: this.themeResolver.resolve(item.borderColor),
            colorType,
            gradientValue,
            textColor,
            textShadow,
            textBackground,
            textBorderColor,
            textRadius,
            textBoxShadow,
            cardBackground: textBackground,
            cardBorderColor: textBorderColor,
            cardRadius: textRadius,
            cardShadow: textBoxShadow,
            cardTitleColor: String(this.themeResolver.resolve(item.titleColor || item.color) || "").trim(),
            cardDescriptionColor: String(this.themeResolver.resolve(item.descriptionColor) || "").trim(),
            imageBorderColor: textBorderColor,
            imageRadius: textRadius,
            imageShadow: textBoxShadow,
            imageBackground: textBackground,
            imageFit: item.fit || "",
            lottieLoop: typeof item.loop === "boolean" ? item.loop : true,
            lottieAutoplay: typeof item.autoplay === "boolean" ? item.autoplay : true,
            lottieSpeed: typeof item.speed === "number" && Number.isFinite(item.speed) ? item.speed : 1,
            badgeBackground: textBackground,
            badgeBorderColor: textBorderColor,
            badgeRadius: textRadius,
            badgeShadow: textBoxShadow,
            badgeColor: textColor,
            badgeIconColor: String(this.themeResolver.resolve(item.titleColor) || "").trim(),
            iconBackground: textBackground,
            iconBorderColor: textBorderColor,
            iconRadius: textRadius,
            iconShadow: textBoxShadow,
            iconColor: textColor,
            iconSize: String(item.size || "").trim(),
            statBackground: textBackground,
            statBorderColor: textBorderColor,
            statRadius: textRadius,
            statShadow: textBoxShadow,
            statLabelColor: String(this.themeResolver.resolve(item.descriptionColor) || "").trim(),
            statValueColor: String(this.themeResolver.resolve(item.titleColor || item.color) || "").trim(),
            codeBackground: textBackground,
            codeBorderColor: textBorderColor,
            codeRadius: textRadius,
            codeShadow: textBoxShadow,
            codeColor: textColor,
            codeSize: String(item.size || "").trim(),
            shapeBackground: textBackground,
            shapeBorderColor: textBorderColor,
            shapeRadius: textRadius,
            shapeShadow: textBoxShadow,
            shapeSize: String(item.size || "").trim(),
            textSize: item.size || "",
            textWeight: item.weight ?? "",
            textLetterSpacing: item.letterSpacing || "",
        };
    }

    private resolveGradientPalette(item: FloatingItem): string[] {
        const fromItem = Array.isArray(item.gradients)
            ? item.gradients.map((gradient) => String(this.themeResolver.resolve(gradient) || "").trim()).filter(Boolean)
            : [];
        if (fromItem.length > 0) return fromItem;
        const fromRoot = Array.isArray(this.props.config?.gradients)
            ? this.props.config.gradients
                  .map((gradient) => String(this.themeResolver.resolve(gradient) || "").trim())
                  .filter(Boolean)
            : [];
        if (fromRoot.length > 0) return fromRoot;
        return [...DEFAULT_TEXT_GRADIENTS];
    }

    private resolveFloatingType(
        item: FloatingItem,
        fallbackType: FloatingBuiltinElementType,
    ): FloatingTypeResolution {
        const requestedType =
            typeof item.type === "string" ? item.type : fallbackType;
        const registryResolution = floatingElementRegistry.resolveType(
            requestedType,
            fallbackType,
        );
        const explicitRenderAs = item.renderAs
            ? floatingElementRegistry.resolveType(
                  item.renderAs,
                  registryResolution.renderAs,
              ).renderAs
            : undefined;
        return {
            rawType: registryResolution.rawType,
            renderAs: explicitRenderAs || registryResolution.renderAs,
            component:
                item.component?.trim() || registryResolution.component || undefined,
            className:
                item.className?.trim() || registryResolution.className || undefined,
        };
    }

    private inferFloatingType(item: FloatingItem): FloatingBuiltinElementType {
        const themedSrc = this.themeResolver.resolveString(item.src);
        const themedCode = this.themeResolver.resolveString(item.code);
        const themedValue = this.themeResolver.resolveString(item.value);
        const themedIcon = this.themeResolver.resolveString(item.icon);
        const themedText = this.themeResolver.resolveString(item.text);
        const themedTitle = this.themeResolver.resolveString(item.title);
        const themedDescription = this.themeResolver.resolveString(item.description);
        if (typeof item.type === "string") {
            return floatingElementRegistry.resolveType(item.type, "text").renderAs;
        }
        if (themedSrc && /\.(json|lottie)(\?.*)?$/i.test(themedSrc)) return "lottie";
        if (themedSrc) return "image";
        if (item.shape) return "shape";
        if (themedCode) return "code";
        if (themedValue) return "stat";
        if (themedIcon && themedText) return "badge";
        if (themedIcon) return "icon";
        if (themedTitle || themedDescription) return "card";
        return "text";
    }
}

export function createFloatingElementsState(props: FloatingElementsProps) {
    const { isDarkRef } = useHeroTheme();

    const resolveIsDark = () => {
        const override = props.isDarkRef;
        if (override && typeof override === "object" && "value" in override) {
            const value = override.value;
            if (value && typeof value === "object" && "value" in value) {
                return Boolean(value.value);
            }
            return Boolean(value);
        }
        return Boolean(isDarkRef.value);
    };

    const state = new FloatingElementStateController(
        props,
        new ThemeResolver(resolveIsDark),
    );
    return {
        isEnabled: state.isEnabled,
        normalizedItems: state.normalizedItems,
        motionEnabled: state.motionEnabled,
        rootStyle: state.rootStyle,
        itemStyle: (item: NormalizedFloatingItem) => state.itemStyle(item),
    };
}
