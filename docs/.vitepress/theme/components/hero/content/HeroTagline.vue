<script setup lang="ts">
    import { computed } from "vue";
    import {
        heroTypographyRegistry,
        HeroTypographyStyleType,
    } from "@utils/vitepress/api/frontmatter/hero";
    import { useResolvedText } from "@utils/vitepress/runtime/text/dynamicText";

    const props = defineProps<{
        text?: string;
        animate?: boolean;
        styleType?: HeroTypographyStyleType;
    }>();

    const resolvedStyleType = computed<HeroTypographyStyleType>(() =>
        heroTypographyRegistry.resolveStyleType(props.styleType),
    );

    const styleClass = computed(() => [
        resolvedStyleType.value === "none"
            ? "tagline--none"
            : resolvedStyleType.value === "slanted-wrap"
              ? "tagline--slanted-wrap"
              : resolvedStyleType.value === "grouped-float"
                ? "tagline--grouped-float"
                : "tagline--floating-tilt",
        `tagline--style-${resolvedStyleType.value}`,
    ]);
    const resolvedText = useResolvedText(() => props.text);
</script>

<template>
    <p v-if="resolvedText" class="tagline" :class="styleClass" v-html="resolvedText" />
</template>

<style scoped>
    .tagline {
        padding-top: var(--hero-tagline-padding-top, 18px);
        max-width: var(--hero-tagline-max-width, 680px);
        line-height: var(--hero-tagline-line-height, 1.6);
        font-size: var(--hero-tagline-font-size, clamp(1.15rem, 2.2vw, 1.6rem));
        font-weight: var(--hero-tagline-weight, 500);
        font-family: var(--hero-tagline-font, inherit);
        letter-spacing: var(--hero-tagline-letter-spacing, -0.01em);
        text-align: var(--hero-tagline-align, inherit);
        white-space: pre-wrap;
        color: var(--hero-tagline-color, var(--vp-c-text-2));
        text-wrap: pretty;
        position: relative;
        will-change: transform;
    }

    .tagline--floating-tilt {
        transform-origin: left 52%;
        transform: translate3d(
                calc(
                    var(--hero-typo-tagline-x, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                calc(
                    var(--hero-typo-tagline-y, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                0
            )
            scale(
                calc(
                    1 + (var(--hero-typo-tagline-scale, 1) - 1) *
                        var(--hero-typo-node-factor, 1)
                )
            );
    }

    .tagline--slanted-wrap {
        transform-origin: left 46%;
        transform: translate3d(
                calc(
                    var(--hero-typo-tagline-x, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                calc(
                    var(--hero-typo-tagline-y, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                0
            )
            rotate(
                calc(
                    var(--hero-typo-tagline-rotate, 0deg) *
                        var(--hero-typo-node-factor, 1)
                )
            )
            scale(
                calc(
                    1 + (var(--hero-typo-tagline-scale, 1) - 1) *
                        var(--hero-typo-node-factor, 1)
                )
            );
    }

    .tagline--grouped-float {
        transform-origin: left 50%;
        --hero-grouped-tagline-base-x: calc(
            var(--hero-typo-tagline-x, 0px) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-tagline-base-y: calc(
            var(--hero-typo-tagline-y, 0px) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-tagline-base-rotate: calc(
            var(--hero-typo-tagline-rotate, 0deg) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-tagline-base-scale: calc(
            1 + (var(--hero-typo-tagline-scale, 1) - 1) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-tagline-drift-x: calc(
            var(--hero-typo-tagline-drift-x, 12px) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-tagline-drift-y: calc(
            var(--hero-typo-tagline-drift-y, 10px) *
                var(--hero-typo-node-factor, 1)
        );
        transform: translate3d(
                var(--hero-grouped-tagline-base-x),
                var(--hero-grouped-tagline-base-y),
                0
            )
            rotate(var(--hero-grouped-tagline-base-rotate))
            scale(var(--hero-grouped-tagline-base-scale));
        animation: hero-grouped-tagline-float 15.6s
            cubic-bezier(0.44, 0.04, 0.24, 0.98) infinite;
        animation-delay: -5.1s;
    }

    @keyframes hero-grouped-tagline-float {
        0%,
        100% {
            transform: translate3d(
                    var(--hero-grouped-tagline-base-x),
                    var(--hero-grouped-tagline-base-y),
                    0
                )
                rotate(var(--hero-grouped-tagline-base-rotate))
                scale(var(--hero-grouped-tagline-base-scale));
        }
        23% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-tagline-base-x) +
                            var(--hero-grouped-tagline-drift-x) * 0.34
                    ),
                    calc(
                        var(--hero-grouped-tagline-base-y) -
                            var(--hero-grouped-tagline-drift-y) * 0.68
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-tagline-base-rotate) + 0.48deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-tagline-base-scale) + 0.013 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        51% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-tagline-base-x) -
                            var(--hero-grouped-tagline-drift-x) * 0.7
                    ),
                    calc(
                        var(--hero-grouped-tagline-base-y) +
                            var(--hero-grouped-tagline-drift-y) * 0.3
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-tagline-base-rotate) - 0.55deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-tagline-base-scale) - 0.009 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        76% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-tagline-base-x) +
                            var(--hero-grouped-tagline-drift-x) * 0.24
                    ),
                    calc(
                        var(--hero-grouped-tagline-base-y) +
                            var(--hero-grouped-tagline-drift-y) * 0.58
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-tagline-base-rotate) + 0.28deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-tagline-base-scale) + 0.006 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
    }

    .tagline--none {
        transform: none;
    }

    @media (min-width: 640px) {
        .tagline {
            max-width: var(--hero-tagline-max-width, 720px);
        }
    }

    @media (min-width: 960px) {
        .tagline {
            max-width: var(--hero-tagline-max-width, 760px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .tagline--grouped-float {
            animation: none !important;
        }
    }
</style>
