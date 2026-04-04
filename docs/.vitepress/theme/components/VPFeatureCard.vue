<script setup lang="ts">
    import { computed } from "vue";
    import { Icon } from "@iconify/vue";
    import { useData, withBase } from "vitepress";
    import type { DefaultTheme } from "vitepress/theme";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";
    import {
        resolveThemeSourceByMode,
        getThemeRuntime,
    } from "@utils/vitepress/runtime/theme";

    interface Feature {
        icon?: DefaultTheme.FeatureIcon | string;
        image?:
            | string
            | { src?: string; light?: string; dark?: string; alt?: string };
        title: string;
        details: string;
        link?: string;
        linkText?: string;
        rel?: string;
        target?: string;
    }

    const props = defineProps<{
        feature: Feature;
        theme?: "brand" | "info" | "tip" | "warning" | "danger";
    }>();
    const { isDark } = useData();
    const { effectiveDark } = getThemeRuntime(isDark);

    const isExternal = computed(() =>
        Boolean(
            props.feature.link && /^(https?:)?\/\//.test(props.feature.link),
        ),
    );

    const href = computed(() => {
        if (!props.feature.link) return undefined;
        if (isExternal.value) return props.feature.link;
        return withBase(
            props.feature.link.replace(/\.md$/, "").replace(/\/index$/, "/"),
        );
    });

    const target = computed(() => {
        if (!props.feature.link) return undefined;
        if (props.feature.target) return props.feature.target;
        return isExternal.value ? "_blank" : undefined;
    });

    const rel = computed(() => {
        if (!props.feature.link) return undefined;
        if (props.feature.rel) return props.feature.rel;
        return isExternal.value ? "noopener noreferrer" : undefined;
    });

    interface IconImageLike {
        src?: string;
        light?: string;
        dark?: string;
        alt?: string;
    }

    function toIconImage(icon: Feature["icon"]): IconImageLike | null {
        if (!icon || typeof icon !== "object") return null;
        const candidate = icon as IconImageLike;
        if ("src" in candidate || "light" in candidate || "dark" in candidate) {
            return candidate;
        }
        return null;
    }

    const iconImage = computed(() => toIconImage(props.feature.icon));

    function isIconifyIcon(icon: Feature["icon"]) {
        return typeof icon === "string" && icon.includes(":");
    }

    const imageSrc = computed(() => {
        const image = props.feature.image;
        if (!image) return "";
        if (typeof image === "string") return resolveAssetWithBase(image);
        return resolveAssetWithBase(
            resolveThemeSourceByMode(image, effectiveDark.value) || "",
        );
    });

    const imageAlt = computed(() => {
        const image = props.feature.image;
        if (!image || typeof image === "string") return props.feature.title;
        return image.alt || props.feature.title;
    });

    const rootTag = computed(() => (props.feature.link ? "a" : "div"));

    function resolveIconAsset(src: string) {
        return resolveAssetWithBase(src);
    }
</script>

<template>
    <component
        :is="rootTag"
        class="vp-feature-card"
        :class="[
            `vp-feature-card--${theme || 'brand'}`,
            { 'vp-feature-card--link': Boolean(feature.link) },
        ]"
        :href="href"
        :target="target"
        :rel="rel"
    >
        <div
            v-if="feature.image"
            class="vp-feature-card__media vp-feature-card__media--image"
        >
            <img :src="imageSrc" :alt="imageAlt" loading="lazy" />
        </div>

        <div
            v-else-if="feature.icon"
            class="vp-feature-card__media vp-feature-card__media--icon"
        >
            <Icon
                v-if="isIconifyIcon(feature.icon)"
                :icon="feature.icon as string"
                class="vp-feature-card__icon"
            />
            <img
                v-else-if="iconImage"
                :src="
                    resolveIconAsset(
                        resolveThemeSourceByMode(
                            iconImage,
                            effectiveDark,
                        ) || '',
                    )
                "
                :alt="iconImage.alt || feature.title"
                class="vp-feature-card__icon-image"
            />
            <span
                v-else
                class="vp-feature-card__icon vp-feature-card__icon--text"
                >{{ feature.icon }}</span
            >
        </div>

        <h2 class="vp-feature-card__title">{{ feature.title }}</h2>
        <p class="vp-feature-card__details">{{ feature.details }}</p>

        <span v-if="feature.link" class="vp-feature-card__link">
            {{ feature.linkText || "Learn more" }}
            <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
            >
                <path d="M4 10h12" />
                <path d="M10 4l6 6-6 6" />
            </svg>
        </span>
    </component>
</template>

<style scoped>
    .vp-feature-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 26px 24px 22px;
        border-radius: 18px;
        border: 1px solid var(--vp-c-divider);
        background: var(--vp-c-bg-soft);
        text-decoration: none;
        transition:
            border-color 0.2s ease,
            background-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        box-shadow:
            0 1px 0 rgba(15, 23, 42, 0.02),
            0 8px 18px rgba(15, 23, 42, 0.035);
    }

    .vp-feature-card--link:hover {
        border-color: var(--vp-c-brand-1);
        background: var(--vp-c-bg-alt);
        box-shadow:
            0 1px 0 rgba(var(--vp-c-brand-rgb), 0.08),
            0 12px 24px rgba(15, 23, 42, 0.06);
        transform: translateY(-2px);
    }

    .vp-feature-card__media {
        margin-bottom: 18px;
    }

    .vp-feature-card__media--icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(var(--vp-c-brand-rgb), 0.07);
        color: var(--vp-c-brand-1);
    }

    .vp-feature-card__media--image {
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(var(--vp-c-divider-rgb), 0.7);
    }

    .vp-feature-card__media--image img {
        display: block;
        width: 100%;
        height: 140px;
        object-fit: cover;
    }

    .vp-feature-card__icon {
        width: 24px;
        height: 24px;
    }

    .vp-feature-card__icon--text {
        width: auto;
        height: auto;
        font-size: 22px;
        line-height: 1;
    }

    .vp-feature-card__icon-image {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }

    .vp-feature-card__title {
        margin: 0;
        font-size: clamp(1.3rem, 1.9vw, 1.56rem);
        line-height: 1.22;
        letter-spacing: -0.02em;
        color: var(--vp-c-text-1);
        text-wrap: balance;
    }

    .vp-feature-card__details {
        margin: 12px 0 0;
        font-size: 0.98rem;
        line-height: 1.58;
        color: var(--vp-c-text-2);
        flex: 1;
        text-wrap: pretty;
    }

    .vp-feature-card__link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 16px;
        font-size: 14px;
        font-weight: 600;
        color: var(--vp-c-brand-1);
    }

    .vp-feature-card__link svg {
        width: 16px;
        height: 16px;
        opacity: 0.78;
    }

    .vp-feature-card--brand .vp-feature-card__media--icon {
        background: rgba(var(--vp-c-brand-rgb), 0.1);
        color: var(--vp-c-brand-1);
    }

    .vp-feature-card--info .vp-feature-card__media--icon {
        background: rgba(43, 122, 221, 0.14);
        color: #2b7add;
    }

    .vp-feature-card--tip .vp-feature-card__media--icon {
        background: rgba(16, 167, 133, 0.14);
        color: #0aa373;
    }

    .vp-feature-card--warning .vp-feature-card__media--icon {
        background: rgba(228, 151, 18, 0.16);
        color: #cc8500;
    }

    .vp-feature-card--danger .vp-feature-card__media--icon {
        background: rgba(219, 66, 66, 0.16);
        color: #ce3f3f;
    }

    @media (max-width: 640px) {
        .vp-feature-card {
            padding: 20px 18px 18px;
            border-radius: 16px;
        }

        .vp-feature-card__title {
            font-size: 1.34rem;
        }

        .vp-feature-card__media--image img {
            height: 120px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .vp-feature-card {
            transition: none !important;
        }
    }
</style>
