<script setup lang="ts">
    import { computed } from "vue";
    import BackgroundLayer from "./background/BackgroundLayer.vue";
    import {
        type HeroBackgroundConfig,
        resolveNormalizedBackgroundLayers,
    } from "@utils/vitepress/api/frontmatter/hero";
    import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";

    const props = defineProps<{
        config?: HeroBackgroundConfig;
    }>();
    const { isDarkRef, resolveThemeValue: resolveTV, toCssValue } =
        useHeroTheme();

    const config = computed(() => props.config);

    function warn(message: string) {
        if (import.meta.env.DEV) {
            console.warn(`[hero][background] ${message}`);
        }
    }

    const normalizedLayers = computed(() =>
        resolveNormalizedBackgroundLayers(config.value, warn),
    );

    const filterStyle = computed(() => {
        const heroBackground = config.value;
        const opacity =
            typeof heroBackground?.opacity === "number"
                ? heroBackground.opacity
                : 1;
        const brightness =
            typeof heroBackground?.brightness === "number"
                ? heroBackground.brightness
                : 1;
        const contrast =
            typeof heroBackground?.contrast === "number"
                ? heroBackground.contrast
                : 1;
        const saturation =
            typeof heroBackground?.saturation === "number"
                ? heroBackground.saturation
                : 1;
        const extraFilter =
            typeof heroBackground?.filter === "string"
                ? heroBackground.filter.trim()
                : "";

        const filterParts = [
            `brightness(${Math.max(0, brightness)})`,
            `contrast(${Math.max(0, contrast)})`,
            `saturate(${Math.max(0, saturation)})`,
        ];

        if (extraFilter) filterParts.push(extraFilter);

        return {
            opacity: String(Math.max(0, Math.min(1, opacity))),
            filter: filterParts.join(" "),
        };
    });

    const cssVariableStyle = computed(() => {
        const _dark = isDarkRef.value;

        const style: Record<string, string> = {};
        const mergedVars =
            config.value?.cssVars && typeof config.value.cssVars === "object"
                ? (config.value.cssVars as Record<string, unknown>)
                : {};
        if (Object.keys(mergedVars).length === 0) return style;

        for (const [rawKey, rawValue] of Object.entries(mergedVars)) {
            const key = rawKey.startsWith("--") ? rawKey : `--${rawKey}`;
            const resolved = resolveTV(rawValue as any);
            const cssValue = toCssValue(resolved);
            if (cssValue !== undefined) style[key] = cssValue;
        }

        return style;
    });

    const rootStyle = computed(() => {
        const style: Record<string, string> = { ...cssVariableStyle.value };
        const configStyle = config.value?.style as
            | Record<string, unknown>
            | undefined;
        if (!configStyle) return style;

        for (const [key, value] of Object.entries(configStyle)) {
            const resolved = resolveTV(value as any);
            const cssValue = toCssValue(resolved);
            if (cssValue !== undefined) style[key] = cssValue;
        }

        return style;
    });
</script>

<template>
    <div
        v-if="normalizedLayers.length > 0"
        class="hero-background"
        :style="rootStyle"
    >
        <div class="hero-background__layers" :style="filterStyle">
            <BackgroundLayer
                v-for="(layer, index) in normalizedLayers"
                :key="`${layer.type}-${index}`"
                :layer="layer"
            />
        </div>
    </div>
</template>

<style scoped>
    .hero-background {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .hero-background__layers {
        position: absolute;
        inset: 0;
    }
</style>
