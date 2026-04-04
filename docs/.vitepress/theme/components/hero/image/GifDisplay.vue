<script setup lang="ts">
    import { computed } from "vue";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";

    const props = withDefaults(
        defineProps<{
            src?: string;
            loop?: boolean;
            autoplay?: boolean;
            fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
            position?: string;
        }>(),
        {
            loop: true,
            autoplay: true,
            fit: "contain",
            position: "center center",
        },
    );

    const resolvedSrc = computed(() => resolveAssetWithBase(props.src));
</script>

<template>
    <div class="gif-display">
        <img
            v-if="resolvedSrc"
            :src="resolvedSrc"
            :alt="'Animated GIF'"
            class="hero-gif-src"
            :style="{ objectFit: fit, objectPosition: position }"
            loading="eager"
        />
    </div>
</template>

<style scoped>
    .gif-display {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hero-gif-src {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        border-radius: inherit;
    }
</style>
