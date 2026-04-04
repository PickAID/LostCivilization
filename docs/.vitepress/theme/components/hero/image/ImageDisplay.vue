<script setup lang="ts">
    import { computed } from "vue";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";

    const props = withDefaults(
        defineProps<{
            src?: string;
            alt?: string;
            fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
            position?: string;
        }>(),
        {
            alt: "Hero image",
            fit: "contain",
            position: "center center",
        },
    );

    const imageStyle = computed(() => ({
        width: "100%",
        height: "100%",
        objectFit: props.fit,
        objectPosition: props.position,
    }));

    const resolvedSrc = computed(() => resolveAssetWithBase(props.src));
</script>

<template>
    <div class="image-display">
        <img
            v-if="resolvedSrc"
            :src="resolvedSrc"
            :alt="alt"
            :style="imageStyle"
            class="hero-image-src"
            loading="eager"
        />
    </div>
</template>

<style scoped>
    .image-display {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hero-image-src {
        max-width: 100%;
        max-height: 100%;
        border-radius: inherit;
    }
</style>
