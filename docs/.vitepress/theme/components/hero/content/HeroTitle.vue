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
            ? "name--none"
            : resolvedStyleType.value === "slanted-wrap"
              ? "name--slanted-wrap"
              : resolvedStyleType.value === "grouped-float"
                ? "name--grouped-float"
                : "name--floating-tilt",
        `name--style-${resolvedStyleType.value}`,
    ]);
    const resolvedText = useResolvedText(() => props.text);
</script>

<template>
    <span v-if="resolvedText" class="name clip" :class="styleClass" v-html="resolvedText" />
</template>

<style scoped>
    .name {
        width: fit-content;
        max-width: var(--hero-name-max-width, 820px);
        letter-spacing: var(--hero-name-letter-spacing, -0.02em);
        line-height: var(--hero-name-line-height, 0.95);
        font-size: var(--hero-name-font-size, clamp(3.2rem, 7.5vw, 6.4rem));
        font-weight: var(--hero-name-weight, 800);
        font-family: var(
            --hero-name-font,
            "Playfair Display",
            "EB Garamond",
            ui-serif,
            Georgia,
            serif
        );
        text-align: var(--hero-name-align, inherit);
        white-space: pre-wrap;
        color: var(--hero-name-color, var(--vp-home-hero-name-color));
        text-wrap: balance;
        position: relative;
        text-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        will-change: transform;
    }

    .name--floating-tilt {
        transform-origin: left 56%;
        transform: translate3d(
                calc(
                    var(--hero-typo-title-x, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                calc(
                    var(--hero-typo-title-y, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                0
            )
            scale(
                calc(
                    1 + (var(--hero-typo-title-scale, 1) - 1) *
                        var(--hero-typo-node-factor, 1)
                )
            );
    }

    .name--slanted-wrap {
        transform-origin: left 54%;
        transform: translate3d(
                calc(
                    var(--hero-typo-title-x, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                calc(
                    var(--hero-typo-title-y, 0px) *
                        var(--hero-typo-node-factor, 1)
                ),
                0
            )
            rotate(
                calc(
                    var(--hero-typo-title-rotate, 0deg) *
                        var(--hero-typo-node-factor, 1)
                )
            )
            scale(
                calc(
                    1 + (var(--hero-typo-title-scale, 1) - 1) *
                        var(--hero-typo-node-factor, 1)
                )
            );
    }

    .name--grouped-float {
        transform-origin: left 56%;
        --hero-grouped-title-base-x: calc(
            var(--hero-typo-title-x, 0px) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-title-base-y: calc(
            var(--hero-typo-title-y, 0px) * var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-title-base-rotate: calc(
            var(--hero-typo-title-rotate, 0deg) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-title-base-scale: calc(
            1 + (var(--hero-typo-title-scale, 1) - 1) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-title-drift-x: calc(
            var(--hero-typo-title-drift-x, 10px) *
                var(--hero-typo-node-factor, 1)
        );
        --hero-grouped-title-drift-y: calc(
            var(--hero-typo-title-drift-y, 9px) *
                var(--hero-typo-node-factor, 1)
        );
        transform: translate3d(
                var(--hero-grouped-title-base-x),
                var(--hero-grouped-title-base-y),
                0
            )
            rotate(var(--hero-grouped-title-base-rotate))
            scale(var(--hero-grouped-title-base-scale));
        animation: hero-grouped-title-float 12.2s
            cubic-bezier(0.46, 0.03, 0.22, 0.98) infinite;
        animation-delay: -1.7s;
    }

    @keyframes hero-grouped-title-float {
        0%,
        100% {
            transform: translate3d(
                    var(--hero-grouped-title-base-x),
                    var(--hero-grouped-title-base-y),
                    0
                )
                rotate(var(--hero-grouped-title-base-rotate))
                scale(var(--hero-grouped-title-base-scale));
        }
        24% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-title-base-x) +
                            var(--hero-grouped-title-drift-x) * 0.64
                    ),
                    calc(
                        var(--hero-grouped-title-base-y) -
                            var(--hero-grouped-title-drift-y) * 0.42
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-title-base-rotate) + 0.82deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-title-base-scale) + 0.018 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        49% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-title-base-x) -
                            var(--hero-grouped-title-drift-x) * 0.28
                    ),
                    calc(
                        var(--hero-grouped-title-base-y) +
                            var(--hero-grouped-title-drift-y) * 0.58
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-title-base-rotate) - 0.54deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-title-base-scale) - 0.012 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
        72% {
            transform: translate3d(
                    calc(
                        var(--hero-grouped-title-base-x) +
                            var(--hero-grouped-title-drift-x) * 0.22
                    ),
                    calc(
                        var(--hero-grouped-title-base-y) -
                            var(--hero-grouped-title-drift-y) * 0.74
                    ),
                    0
                )
                rotate(
                    calc(
                        var(--hero-grouped-title-base-rotate) + 0.36deg *
                            var(--hero-typo-node-factor, 1)
                    )
                )
                scale(
                    calc(
                        var(--hero-grouped-title-base-scale) + 0.008 *
                            var(--hero-typo-node-factor, 1)
                    )
                );
        }
    }

    .name--none {
        transform: none;
    }

    /* Gradient underline accent — enable by setting --hero-name-accent-color */
    .name::after {
        content: "";
        display: block;
        height: var(--hero-name-accent-height, 4px);
        border-radius: 2px;
        margin-top: 0.12em;
        background: var(--hero-name-accent-color, transparent);
        transform-origin: left;
        transform: scaleX(var(--hero-name-accent-scale, 0));
        transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
    }

    /* Auto-reveal accent on mount if it is configured */
    .name:where([data-accent]) ::after {
        transform: scaleX(1);
    }

    .clip {
        background: var(--vp-home-hero-name-background);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: var(
            --hero-name-color,
            var(--vp-home-hero-name-color)
        );
    }

    @media (min-width: 640px) {
        .name {
            max-width: var(--hero-name-max-width, 720px);
        }
    }

    @media (min-width: 960px) {
        .name {
            max-width: var(--hero-name-max-width, 760px);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .name--grouped-float {
            animation: none !important;
        }
    }
</style>
