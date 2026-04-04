<script setup lang="ts">
    import { computed } from "vue";
    import type { HomeLinkKey } from "@utils/vitepress/services/homeLinkService";
    import { heroTypographyRegistry, HeroTypographyStyleType } from "@utils/vitepress/api/frontmatter/hero";
    import { useResolvedText } from "@utils/vitepress/runtime/text/dynamicText";
    import HeroTitle from "./HeroTitle.vue";
    import HeroTagline from "./HeroTagline.vue";
    import HeroActions from "./HeroActions.vue";

    interface HeroAction {
        theme?: "brand" | "alt" | "sponsor" | "outline" | "ghost" | "danger";
        text: string;
        link?: string;
        linkKey?: HomeLinkKey;
        target?: string;
        rel?: string;
        style?: Record<string, unknown>;
    }

    const props = defineProps<{
        name?: string;
        text?: string;
        tagline?: string;
        actions?: HeroAction[];
        animate?: boolean;
        hasMediaBackground?: boolean;
        styleType?: HeroTypographyStyleType;
        forceHideTagline?: boolean;
        forceHideActions?: boolean;
        maxVisibleActions?: number | null;
    }>();

    const hasHeading = computed(() => Boolean(props.name || props.text));
    const motionEnabled = computed(() => props.animate !== false);
    const resolvedStyleType = computed<HeroTypographyStyleType>(() =>
        heroTypographyRegistry.resolveStyleType(props.styleType),
    );
    const usesGroupedFloatStyle = computed(
        () => resolvedStyleType.value === "grouped-float",
    );
    const usesSlantedWrapStyle = computed(
        () => resolvedStyleType.value === "slanted-wrap",
    );
    const usesMotionStyle = computed(() => resolvedStyleType.value !== "none");
    const titleTransitionName = computed(() =>
        usesMotionStyle.value ? "hero-title-fantasy" : "hero-title-clean",
    );
    const textTransitionName = computed(() =>
        usesMotionStyle.value ? "hero-text-fantasy" : "hero-text-clean",
    );
    const taglineTransitionName = computed(() =>
        usesMotionStyle.value ? "hero-tagline-fantasy" : "hero-tagline-clean",
    );
    const hasVisibleActions = computed(() => {
        if (props.forceHideActions) return false;
        const count = props.actions?.length ?? 0;
        if (count <= 0) return false;
        if (typeof props.maxVisibleActions === "number") {
            return props.maxVisibleActions > 0;
        }
        return true;
    });
    const resolvedText = useResolvedText(() => props.text);
</script>

<template>
    <div
        class="hero-content"
        :class="[
            {
                'hero-content--media': hasMediaBackground,
                'hero-content--style-floating-tilt':
                    resolvedStyleType === 'floating-tilt',
                'hero-content--style-grouped-float': usesGroupedFloatStyle,
                'hero-content--style-slanted-wrap': usesSlantedWrapStyle,
                'hero-content--style-none': !usesMotionStyle,
            },
            `hero-content--style-${resolvedStyleType}`,
        ]"
    >
        <h1
            v-if="hasHeading"
            class="heading"
            :class="[
                {
                    'heading--floating-tilt':
                        resolvedStyleType === 'floating-tilt',
                    'heading--grouped-float': usesGroupedFloatStyle,
                    'heading--none': !usesMotionStyle,
                },
                `heading--style-${resolvedStyleType}`,
            ]"
        >
            <Transition :name="titleTransitionName" appear :css="motionEnabled">
                <HeroTitle
                    v-if="name"
                    :text="name"
                    :animate="animate"
                    :style-type="resolvedStyleType"
                />
            </Transition>
            <Transition :name="textTransitionName" appear :css="motionEnabled">
                <span
                    v-if="resolvedText"
                    class="text"
                    :class="[
                        {
                            'text--floating-tilt':
                                resolvedStyleType === 'floating-tilt',
                            'text--grouped-float': usesGroupedFloatStyle,
                            'text--slanted-wrap': usesSlantedWrapStyle,
                            'text--none': !usesMotionStyle,
                        },
                        `text--style-${resolvedStyleType}`,
                    ]"
                    v-html="resolvedText"
                />
            </Transition>
        </h1>

        <Transition :name="taglineTransitionName" appear :css="motionEnabled">
            <div v-if="tagline && !forceHideTagline" class="hero-tagline-shell">
                <HeroTagline
                    :text="tagline"
                    :animate="animate"
                    :style-type="resolvedStyleType"
                />
            </div>
        </Transition>

        <Transition name="hero-actions-basic" appear :css="motionEnabled">
            <div v-if="hasVisibleActions" class="hero-actions-shell">
                <HeroActions
                    :actions="actions"
                    :max-visible="maxVisibleActions"
                />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
    .hero-content {
        display: block;
        text-align: var(--hero-content-align, inherit);
    }

    .hero-content--style-none {
        --hero-typo-intensity: 0;
    }

    .hero-tagline-shell,
    .hero-actions-shell {
        position: relative;
        isolation: isolate;
    }

    .hero-tagline-shell {
        width: fit-content;
        max-width: 100%;
    }

    .hero-actions-shell {
        width: 100%;
    }

    .heading {
        display: flex;
        flex-direction: column;
        gap: var(--hero-heading-gap, 0.08em);
        position: relative;
        transform-style: preserve-3d;
    }

    /* Shape: left-border accent on heading — enable via --hero-heading-shape: bar */
    .heading::before {
        content: "";
        display: var(--hero-heading-shape-display, none);
        width: var(--hero-heading-bar-width, 4px);
        border-radius: 2px;
        align-self: stretch;
        background: var(--hero-heading-bar-color, var(--vp-c-brand-1));
        margin-right: 0.5em;
        flex-shrink: 0;
    }

    /* Enable horizontal flex for bar layout */
    .heading:where([data-shape="bar"]) {
        flex-direction: row;
        align-items: flex-start;
    }

    .text {
        width: fit-content;
        max-width: var(--hero-text-max-width, 820px);
        letter-spacing: var(--hero-text-letter-spacing, -0.02em);
        line-height: var(--hero-text-line-height, 0.98);
        font-size: var(--hero-text-font-size, clamp(2.8rem, 6vw, 5.2rem));
        font-weight: var(--hero-text-weight, 800);
        font-family: var(
            --hero-text-font,
            "Playfair Display",
            "EB Garamond",
            ui-serif,
            Georgia,
            serif
        );
        text-align: var(--hero-text-align, inherit);
        white-space: pre-wrap;
        color: var(--hero-text-color, var(--vp-c-text-1));
        text-wrap: balance;
        text-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        position: relative;
        will-change: transform;
    }

    .text--floating-tilt {
        transform-origin: left 52%;
        transform: translate3d(
                calc(
                    var(--hero-typo-text-x, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                calc(
                    var(--hero-typo-text-y, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                0
            )
            scale(
                calc(
                    1 + (var(--hero-typo-text-scale, 1) - 1) *
                        var(--hero-typo-node-factor, 1)
                )
            );
    }

    .text--slanted-wrap {
        transform: translate3d(
                calc(
                    var(--hero-typo-text-x, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                calc(
                    var(--hero-typo-text-y, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                0
            )
            rotate(
                calc(
                    var(--hero-typo-text-rotate, 0deg) *
                        var(--hero-typo-node-factor, 1)
                )
            )
            scale(
                calc(
                    1 + (var(--hero-typo-text-scale, 1) - 1) *
                        var(--hero-typo-node-factor, 1)
                )
            );
        transform-origin: left 48%;
    }

    .text--grouped-float {
        transform-origin: left 52%;
        --hero-grouped-text-base-x: calc(
            var(--hero-typo-text-x, 0px) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-text-base-y: calc(
            var(--hero-typo-text-y, 0px) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-text-base-rotate: calc(
            var(--hero-typo-text-rotate, 0deg) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-text-base-scale: calc(
            1 + (var(--hero-typo-text-scale, 1) - 1) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-text-drift-x: calc(
            var(--hero-typo-text-drift-x, 14px) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-text-drift-y: calc(
            var(--hero-typo-text-drift-y, 12px) *
                var(--hero-typo-node-factor, 1)
        );
        transform: translate3d(
                var(--hero-grouped-text-base-x),
                var(--hero-grouped-text-base-y),
                0
            )
            rotate(var(--hero-grouped-text-base-rotate))
            scale(var(--hero-grouped-text-base-scale));
        animation: hero-grouped-text-float 14.4s
            cubic-bezier(0.42, 0.04, 0.24, 0.98) infinite;
        animation-delay: -3.2s;
    }

    @keyframes hero-grouped-text-float {
        0%,
        100% {
            transform: translate3d(
                    var(--hero-grouped-text-base-x),
                    var(--hero-grouped-text-base-y),
                    0
                )
                rotate(var(--hero-grouped-text-base-rotate))
                scale(var(--hero-grouped-text-base-scale));
        }
        19% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-text-base-x) -
                            var(--hero-grouped-text-drift-x) * 0.4
                    ),
                    calc(
                        var(--hero-grouped-text-base-y) -
                            var(--hero-grouped-text-drift-y) * 0.62
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-text-base-rotate) - 0.62deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-text-base-scale) + 0.016 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        43% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-text-base-x) +
                            var(--hero-grouped-text-drift-x) * 0.72
                    ),
                    calc(
                        var(--hero-grouped-text-base-y) +
                            var(--hero-grouped-text-drift-y) * 0.2
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-text-base-rotate) + 0.92deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-text-base-scale) + 0.024 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        67% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-text-base-x) -
                            var(--hero-grouped-text-drift-x) * 0.2
                    ),
                    calc(
                        var(--hero-grouped-text-base-y) +
                            var(--hero-grouped-text-drift-y) * 0.78
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-text-base-rotate) - 0.42deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-text-base-scale) - 0.011 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        83% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-text-base-x) +
                            var(--hero-grouped-text-drift-x) * 0.54
                    ),
                    calc(
                        var(--hero-grouped-text-base-y) -
                            var(--hero-grouped-text-drift-y) * 0.16
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-text-base-rotate) + 0.35deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-text-base-scale) + 0.009 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
    }

    .text--none {
        transform: none;
    }

    .hero-content--style-slanted-wrap .hero-actions-shell {
        clear: both;
    }

    @media (min-width: 640px) {
        .text {
            max-width: var(--hero-text-max-width, 720px);
        }
    }

    @media (min-width: 960px) {
        .text {
            max-width: var(--hero-text-max-width, 760px);
        }
    }

    .hero-title-fantasy-enter-active,
    .hero-title-fantasy-leave-active,
    .hero-title-clean-enter-active,
    .hero-title-clean-leave-active {
        transition:
            opacity var(--hero-typo-transition-duration, 560ms)
                var(
                    --hero-typo-transition-easing,
                    cubic-bezier(0.2, 0.9, 0.2, 1)
                ),
            transform var(--hero-typo-transition-duration, 560ms)
                var(
                    --hero-typo-transition-easing,
                    cubic-bezier(0.2, 0.9, 0.2, 1)
                );
    }

    .hero-title-fantasy-enter-from,
    .hero-title-fantasy-leave-to,
    .hero-title-clean-enter-from,
    .hero-title-clean-leave-to {
        opacity: 0;
        transform: translateY(18px) scale(0.98);
    }

    .hero-title-fantasy-leave-to,
    .hero-title-clean-leave-to {
        transform: translateY(-8px) scale(0.99);
    }

    .hero-text-fantasy-enter-active,
    .hero-text-fantasy-leave-active,
    .hero-text-clean-enter-active,
    .hero-text-clean-leave-active {
        transition:
            opacity var(--hero-typo-transition-duration, 560ms)
                var(
                    --hero-typo-transition-easing,
                    cubic-bezier(0.2, 0.9, 0.2, 1)
                ),
            transform var(--hero-typo-transition-duration, 560ms)
                var(
                    --hero-typo-transition-easing,
                    cubic-bezier(0.2, 0.9, 0.2, 1)
                );
        transition-delay: var(--hero-typo-delay-step, 40ms);
    }

    .hero-text-fantasy-enter-from,
    .hero-text-fantasy-leave-to,
    .hero-text-clean-enter-from,
    .hero-text-clean-leave-to {
        opacity: 0;
        transform: translateY(14px) scale(0.985);
    }

    .hero-text-fantasy-leave-to,
    .hero-text-clean-leave-to {
        transform: translateY(-7px) scale(0.992);
    }

    .hero-tagline-fantasy-enter-active,
    .hero-tagline-fantasy-leave-active,
    .hero-tagline-clean-enter-active,
    .hero-tagline-clean-leave-active {
        transition:
            opacity var(--hero-typo-transition-duration, 560ms)
                var(
                    --hero-typo-transition-easing,
                    cubic-bezier(0.2, 0.9, 0.2, 1)
                ),
            transform var(--hero-typo-transition-duration, 560ms)
                var(
                    --hero-typo-transition-easing,
                    cubic-bezier(0.2, 0.9, 0.2, 1)
                );
        transition-delay: calc(var(--hero-typo-delay-step, 40ms) * 2);
    }

    .hero-tagline-fantasy-enter-from,
    .hero-tagline-fantasy-leave-to,
    .hero-tagline-clean-enter-from,
    .hero-tagline-clean-leave-to {
        opacity: 0;
        transform: translateY(10px) scale(0.992);
    }

    .hero-tagline-fantasy-leave-to,
    .hero-tagline-clean-leave-to {
        transform: translateY(-5px) scale(0.995);
    }

    .hero-actions-basic-enter-active,
    .hero-actions-basic-leave-active {
        transition:
            opacity 0.26s ease,
            transform 0.3s ease;
    }

    .hero-actions-basic-enter-from,
    .hero-actions-basic-leave-to {
        opacity: 0;
        transform: translateY(8px);
    }

    @media (prefers-reduced-motion: reduce) {
        .text--grouped-float {
            animation: none !important;
        }

        .hero-title-fantasy-enter-active,
        .hero-title-fantasy-leave-active,
        .hero-title-clean-enter-active,
        .hero-title-clean-leave-active,
        .hero-text-fantasy-enter-active,
        .hero-text-fantasy-leave-active,
        .hero-text-clean-enter-active,
        .hero-text-clean-leave-active,
        .hero-tagline-fantasy-enter-active,
        .hero-tagline-fantasy-leave-active,
        .hero-tagline-clean-enter-active,
        .hero-tagline-clean-leave-active,
        .hero-actions-basic-enter-active,
        .hero-actions-basic-leave-active {
            transition: none !important;
        }
    }
</style>
