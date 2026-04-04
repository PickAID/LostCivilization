<script setup lang="ts">
    import { computed } from "vue";
    import { useData } from "vitepress";
    import VPButton from "../../VPButton.vue";
    import Hover3DEffect from "../effects/Hover3DEffect.vue";
    import {
        resolveHomeLink,
        type HomeLinkKey,
    } from "@utils/vitepress/services/homeLinkService";

    interface HeroAction {
        theme?: "brand" | "alt" | "sponsor" | "outline" | "ghost" | "danger";
        text: string;
        link?: string;
        linkKey?: HomeLinkKey;
        target?: string;
        rel?: string;
        style?: {
            variant?: "filled" | "outlined" | "text" | "ghost";
            outline?: boolean;
            outlineWidth?: string;
            outlineColor?: string;
            outlineStyle?: string;
            borderRadius?: string;
            padding?: string;
            boxShadow?: string;
            backgroundColor?: string;
            textColor?: string;
            fontWeight?: string | number;
            letterSpacing?: string;
            hover?: {
                enabled?: boolean;
                tilt3D?: {
                    enabled?: boolean;
                    intensity?: number;
                    perspective?: string;
                };
                backgroundColor?: string;
                textColor?: string;
                outlineColor?: string;
                boxShadow?: string;
            };
        };
    }

    const props = defineProps<{
        actions?: HeroAction[];
        maxVisible?: number | null;
    }>();

    const { lang } = useData();

    const normalizedActions = computed(() => {
        const actions = props.actions || [];
        const visibleActions =
            typeof props.maxVisible === "number"
                ? actions.slice(0, Math.max(0, props.maxVisible))
                : actions;

        return visibleActions.map((action, index) => {
            const resolvedLink = resolveHomeLink(
                action.link,
                action.linkKey,
                lang.value,
            );
            return {
                action,
                resolvedLink,
                index,
                isEmphasis:
                    index === 0 && (action.theme === "brand" || !action.theme),
            };
        });
    });

    const isExternalLink = (link?: string) =>
        Boolean(link && /^https?:\/\//.test(link));

    const normalizeLink = (link?: string) => {
        if (!link) return undefined;
        if (isExternalLink(link) || link.startsWith("/")) return link;
        return `/${link}`;
    };

    const getVariant = (action: HeroAction) => {
        return (
            action.style?.variant ||
            (action.theme === "alt" ? "outlined" : "filled")
        );
    };

    const getButtonClass = (action: HeroAction) => {
        return `hero-button hero-button--${getVariant(action)}`;
    };

    const getButtonTheme = (action: HeroAction) => {
        if (getVariant(action) === "outlined") return "outline";
        if (getVariant(action) === "ghost") return "ghost";
        if (action.theme === "alt" && getVariant(action) === "filled")
            return "alt";
        return action.theme || "brand";
    };

    const getButtonStyle = (action: HeroAction) => {
        const style = action.style || {};

        return {
            borderRadius: style.borderRadius || "12px",
            padding: style.padding || "12px 28px",
            borderWidth:
                style.outlineWidth || (style.outline ? "1px" : undefined),
            borderColor: style.outlineColor || undefined,
            borderStyle: style.outlineStyle || undefined,
            boxShadow: style.boxShadow || undefined,
        } as Record<string, string>;
    };

    const getButtonCustom = (action: HeroAction) => {
        const style = action.style || {};
        const hover = style.hover || {};
        const hasCustom =
            Boolean(
                style.backgroundColor ||
                style.textColor ||
                style.outlineColor ||
                style.outlineWidth ||
                style.outlineStyle ||
                style.boxShadow ||
                style.borderRadius ||
                style.padding ||
                style.fontWeight ||
                style.letterSpacing,
            ) ||
            Boolean(
                hover.backgroundColor ||
                hover.textColor ||
                hover.outlineColor ||
                hover.boxShadow,
            );
        if (!hasCustom) return undefined;

        return {
            background: style.backgroundColor,
            color: style.textColor,
            borderColor: style.outlineColor,
            borderWidth: style.outlineWidth,
            borderStyle: style.outlineStyle,
            shadow: style.boxShadow,
            radius: style.borderRadius,
            padding: style.padding,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            hoverBackground: hover.backgroundColor,
            hoverColor: hover.textColor,
            hoverBorderColor: hover.outlineColor,
            hoverShadow: hover.boxShadow,
        };
    };

    const shouldUseTilt3D = (action: HeroAction) => {
        return action.style?.hover?.tilt3D?.enabled ?? false;
    };

    const getTiltConfig = (action: HeroAction) => {
        return (
            action.style?.hover?.tilt3D || {
                intensity: 10,
                perspective: "1100px",
            }
        );
    };

    const hasActions = computed(() => normalizedActions.value.length > 0);
</script>

<template>
    <TransitionGroup
        v-if="hasActions"
        tag="div"
        name="hero-action-fantasy"
        class="hero-actions"
        :class="{
            'hero-actions--dense': normalizedActions.length >= 4,
        }"
    >
        <div
            v-for="{
                action,
                resolvedLink,
                index,
                isEmphasis,
            } in normalizedActions"
            :key="`action-${index}-${resolvedLink || action.text}`"
            class="hero-action-item"
            :class="{ 'hero-action-item--emphasis': isEmphasis }"
        >
            <Hover3DEffect
                v-if="shouldUseTilt3D(action)"
                v-bind="getTiltConfig(action)"
            >
                <VPButton
                    :class="getButtonClass(action)"
                    :style="getButtonStyle(action)"
                    :theme="getButtonTheme(action)"
                    :custom="getButtonCustom(action)"
                    :text="action.text"
                    :href="normalizeLink(resolvedLink)"
                    :target="
                        action.target ||
                        (isExternalLink(resolvedLink) ? '_blank' : undefined)
                    "
                    :rel="
                        action.rel ||
                        (isExternalLink(resolvedLink)
                            ? 'noopener noreferrer'
                            : undefined)
                    "
                    size="medium"
                />
            </Hover3DEffect>

            <VPButton
                v-else
                :class="getButtonClass(action)"
                :style="getButtonStyle(action)"
                :theme="getButtonTheme(action)"
                :custom="getButtonCustom(action)"
                :text="action.text"
                :href="normalizeLink(resolvedLink)"
                :target="
                    action.target ||
                    (isExternalLink(resolvedLink) ? '_blank' : undefined)
                "
                :rel="
                    action.rel ||
                    (isExternalLink(resolvedLink)
                        ? 'noopener noreferrer'
                        : undefined)
                "
                size="medium"
            />
        </div>
    </TransitionGroup>
</template>

<style scoped>
    .hero-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding-top: 28px;
        max-width: 760px;
    }

    .hero-action-item {
        flex: 0 0 auto;
        min-width: 0;
    }

    .hero-action-item--emphasis :deep(.vp-button) {
        min-width: 154px !important;
    }

    .hero-button {
        min-width: 146px !important;
        min-height: 48px !important;
        text-align: center !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        letter-spacing: -0.01em !important;
    }

    .hero-button--outlined {
        border-style: solid;
    }

    .hero-button--text {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    .hero-button--ghost {
        backdrop-filter: blur(8px);
    }

    .hero-actions--dense .hero-button {
        min-width: 124px !important;
    }

    .hero-actions--readable :deep(.vp-button--alt) {
        color: var(--hero-media-button-alt-text);
        background: var(--hero-media-button-alt-bg);
        border-color: var(--hero-media-button-alt-border);
    }

    .hero-actions--readable :deep(.vp-button--alt:hover) {
        color: var(--hero-media-button-alt-text);
        border-color: var(--hero-media-button-alt-border);
        background: var(--hero-media-button-alt-hover-bg);
    }

    .hero-actions--readable :deep(.vp-button--outline) {
        color: var(--hero-media-button-outline-text);
        border-color: var(--hero-media-button-outline-border);
        background: var(--hero-media-button-outline-bg);
    }

    .hero-actions--readable :deep(.vp-button--outline:hover) {
        color: var(--hero-media-button-outline-text);
        border-color: var(--hero-media-button-outline-border-hover);
        background: var(--hero-media-button-outline-hover-bg);
    }

    .hero-action-fantasy-enter-active,
    .hero-action-fantasy-leave-active {
        transition:
            opacity 0.34s ease,
            transform 0.44s cubic-bezier(0.2, 0.9, 0.2, 1),
            filter 0.44s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    .hero-action-fantasy-enter-from,
    .hero-action-fantasy-leave-to {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
        filter: blur(4px);
    }

    .hero-action-fantasy-leave-to {
        transform: translateY(-8px) scale(0.985);
    }

    .hero-action-fantasy-move {
        transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    @media (max-width: 768px) {
        .hero-actions {
            gap: 12px;
            padding-top: 22px;
            max-width: none;
        }

        .hero-action-item {
            flex: 1 1 calc(50% - 6px);
        }

        .hero-action-item--emphasis {
            flex-basis: 100%;
        }

        .hero-action-item :deep(.vp-button) {
            width: 100%;
            min-width: 0 !important;
            border-radius: 14px !important;
            min-height: 48px !important;
            font-weight: 620 !important;
        }
    }

    @media (max-width: 640px) {
        .hero-actions {
            gap: 10px;
        }

        .hero-action-item {
            flex-basis: 100%;
        }

        .hero-action-item--emphasis :deep(.vp-button) {
            min-height: 52px !important;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .hero-action-fantasy-enter-active,
        .hero-action-fantasy-leave-active,
        .hero-action-fantasy-move {
            transition: none !important;
        }
    }
</style>
