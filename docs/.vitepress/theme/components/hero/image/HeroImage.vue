<script setup lang="ts">
    import { computed } from "vue";
    import type {
        HeroImageConfig,
        HeroImageThemeableSource,
    } from "@utils/vitepress/api/frontmatter/hero";

    import ImageDisplay from "./ImageDisplay.vue";
    import VideoDisplay from "./VideoDisplay.vue";
    import GifDisplay from "./GifDisplay.vue";
    import Model3D from "./Model3D.vue";
    import LottieDisplay from "./LottieDisplay.vue";
    import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";
    import { resolveThemeSourceByMode } from "@utils/vitepress/runtime/theme";

    interface GifConfig {
        src?: string;
        loop?: boolean;
        autoplay?: boolean;
        fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
        position?: string;
    }

    interface Model3DConfig {
        src?: string;
        fitPadding?: number;
        [key: string]: unknown;
    }

    interface LottieConfig {
        src?: string;
        light?: string;
        dark?: string;
        loop?: boolean;
        autoplay?: boolean;
        speed?: number;
        renderer?: "svg" | "canvas";
        fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
        position?: string;
        background?: string;
        [key: string]: unknown;
    }

    const props = defineProps<{
        config?: HeroImageConfig;
        defaultImage?: HeroImageThemeableSource;
    }>();

    const { isDarkRef } = useHeroTheme();

    const imageType = computed(() => {
        return props.config?.type || "image";
    });

    const perTypeConfig = computed<Record<string, any>>(() => {
        if (imageType.value === "video")
            return (props.config?.video as Record<string, any>) || {};
        if (imageType.value === "gif")
            return (props.config?.gif as Record<string, any>) || {};
        if (imageType.value === "model3d")
            return (props.config?.model3d as Record<string, any>) || {};
        if (imageType.value === "lottie")
            return (props.config?.lottie as Record<string, any>) || {};
        return (props.config?.image as Record<string, any>) || {};
    });

    function toCssLength(value: unknown): string | undefined {
        if (typeof value === "number") return `${value}px`;
        if (typeof value === "string" && value.trim().length > 0) return value;
        return undefined;
    }

    const resolvedSource = computed(() => {
        const fromImage = props.config?.image as HeroImageThemeableSource | undefined;
        const fromRoot = props.config;
        const fallback = props.defaultImage;

        const source = fromImage || fromRoot || fallback;
        if (!source) return "";

        return resolveThemeSourceByMode(source, isDarkRef.value) || "";
    });

    const hasRenderableImage = computed(() => {
        if (imageType.value === "video") {
            return Boolean(
                props.config?.video?.src ||
                props.config?.video?.light ||
                props.config?.video?.dark,
            );
        }

        if (imageType.value === "gif") {
            return Boolean(props.config?.gif?.src || resolvedSource.value);
        }

        if (imageType.value === "model3d") {
            return Boolean(props.config?.model3d?.src || props.config?.src);
        }

        if (imageType.value === "lottie") {
            return Boolean(
                (props.config?.lottie as Record<string, unknown> | undefined)
                    ?.src ||
                    (props.config?.lottie as
                        | Record<string, unknown>
                        | undefined)?.light ||
                    (props.config?.lottie as
                        | Record<string, unknown>
                        | undefined)?.dark ||
                    resolvedSource.value,
            );
        }

        return Boolean(resolvedSource.value);
    });

    const altText = computed(() => {
        return (
            props.config?.alt ||
            (props.config?.image as any)?.alt ||
            "Hero image"
        );
    });

    const resolvedFit = computed(() => {
        return perTypeConfig.value?.fit || props.config?.fit || "contain";
    });

    const resolvedPosition = computed(() => {
        return (
            perTypeConfig.value?.position ||
            props.config?.position ||
            "center center"
        );
    });

    const defaultModelFitPadding = computed(() => {
        if (frameShape.value === "circle" || frameShape.value === "diamond")
            return 1.42;
        if (frameShape.value === "squircle") return 1.34;
        return 1.28;
    });

    const resolvedModelConfig = computed(() => {
        const model3dConfig = props.config?.model3d as
            | Record<string, unknown>
            | undefined;
        if (model3dConfig) {
            const fitPaddingRaw = model3dConfig.fitPadding;
            const fitPadding =
                typeof fitPaddingRaw === "number"
                    ? fitPaddingRaw
                    : defaultModelFitPadding.value;
            return {
                ...model3dConfig,
                fitPadding,
            } as Model3DConfig;
        }
        if (props.config?.src) {
            return {
                src: props.config.src,
                fitPadding: defaultModelFitPadding.value,
            } as Model3DConfig;
        }
        return undefined as Model3DConfig | undefined;
    });

    const frameConfig = computed<Record<string, any>>(() => {
        const rootFrame = (props.config?.frame as Record<string, any>) || {};
        const typeFrame =
            (perTypeConfig.value?.frame as Record<string, any>) || {};
        return { ...rootFrame, ...typeFrame };
    });

    const frameShape = computed(() => frameConfig.value.shape || "rounded");

    const frameClass = computed(() => {
        return `hero-image__frame--${frameShape.value}`;
    });

    const frameStyle = computed(() => {
        const frame = frameConfig.value;
        const width = toCssLength(frame.width ?? props.config?.width);
        const height = toCssLength(frame.height ?? props.config?.height);
        const maxWidth = toCssLength(frame.maxWidth);
        const maxHeight = toCssLength(frame.maxHeight);
        const padding = toCssLength(frame.padding);
        const radius = toCssLength(frame.radius);
        const borderWidth = toCssLength(frame.borderWidth);
        const aspectRatio =
            typeof frame.aspectRatio === "number"
                ? String(frame.aspectRatio)
                : typeof frame.aspectRatio === "string"
                  ? frame.aspectRatio
                  : undefined;

        let border = frame.border;
        if (!border && borderWidth) {
            border = `${borderWidth} solid ${frame.borderColor || "rgba(var(--vp-c-divider-rgb), 0.72)"}`;
        }

        const style: Record<string, string> = {
            width: width || "100%",
            height: height || "100%",
            maxWidth: maxWidth || "100%",
            maxHeight: maxHeight || "100%",
            borderRadius: radius || "",
            padding: padding || "",
            background: frame.background || "",
            boxShadow: frame.shadow || "",
            border: border || "",
            clipPath: frameShape.value === "custom" ? frame.clipPath || "" : "",
            overflow: frame.overflow || "hidden",
            aspectRatio: aspectRatio || "",
        };

        if (frameShape.value === "circle" && !aspectRatio) {
            style.aspectRatio = "1 / 1";
        }

        if (frameShape.value === "diamond" && !style.clipPath) {
            style.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
        }

        return style;
    });

    const videoConfig = computed(() => {
        return {
            ...(props.config?.video || {}),
            fit: resolvedFit.value,
            position: resolvedPosition.value,
        };
    });

    const gifConfig = computed<GifConfig>(() => {
        const source = (props.config?.gif as Record<string, unknown> | undefined) || {};
        return {
            src: typeof source.src === "string" ? source.src : undefined,
            loop: typeof source.loop === "boolean" ? source.loop : true,
            autoplay:
                typeof source.autoplay === "boolean" ? source.autoplay : true,
            fit: resolvedFit.value,
            position: resolvedPosition.value,
        };
    });

    const lottieConfig = computed<LottieConfig>(() => {
        const source = (props.config?.lottie as LottieConfig | undefined) || {};
        const themedSrc = resolveThemeSourceByMode(source, isDarkRef.value);

        return {
            src: themedSrc || resolvedSource.value,
            loop: typeof source.loop === "boolean" ? source.loop : true,
            autoplay:
                typeof source.autoplay === "boolean" ? source.autoplay : true,
            speed:
                typeof source.speed === "number" && Number.isFinite(source.speed)
                    ? source.speed
                    : 1,
            renderer:
                source.renderer === "canvas" ? "canvas" : "svg",
            fit: (source.fit as LottieConfig["fit"]) || resolvedFit.value,
            position: source.position || resolvedPosition.value,
            background:
                typeof source.background === "string"
                    ? source.background
                    : undefined,
        };
    });
</script>

<template>
    <div
        v-if="hasRenderableImage"
        class="hero-image"
        :class="`hero-image--${imageType}`"
    >
        <div class="hero-image__frame" :class="frameClass" :style="frameStyle">
            <ImageDisplay
                v-if="imageType === 'image'"
                :src="resolvedSource"
                :alt="altText"
                :fit="resolvedFit"
                :position="resolvedPosition"
            />

            <VideoDisplay
                v-else-if="imageType === 'video'"
                :config="videoConfig"
            />

            <GifDisplay
                v-else-if="imageType === 'gif'"
                :src="gifConfig.src || resolvedSource"
                :loop="gifConfig.loop"
                :autoplay="gifConfig.autoplay"
                :fit="gifConfig.fit"
                :position="gifConfig.position"
            />

            <Model3D
                v-else-if="imageType === 'model3d'"
                :config="resolvedModelConfig"
            />

            <LottieDisplay
                v-else-if="imageType === 'lottie'"
                :src="lottieConfig.src"
                :alt="altText"
                :loop="lottieConfig.loop"
                :autoplay="lottieConfig.autoplay"
                :speed="lottieConfig.speed"
                :renderer="lottieConfig.renderer"
                :fit="lottieConfig.fit"
                :position="lottieConfig.position"
                :background="lottieConfig.background"
            />
        </div>
    </div>
</template>

<style scoped>
    .hero-image {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .hero-image__frame {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    .hero-image__frame--rounded {
        border-radius: 18px;
    }

    .hero-image__frame--circle {
        border-radius: 9999px;
    }

    .hero-image__frame--squircle {
        border-radius: 28%;
    }

    .hero-image__frame--none {
        border-radius: 0;
    }
</style>
