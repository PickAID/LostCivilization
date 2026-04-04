<template>
    <div class="pdf-viewer" ref="pdfContainer">
        <embed
            v-if="isReady"
            :src="resolvedPdfSource"
            :width="containerWidth + 'px'"
            :height="containerHeight + 'px'"
            type="application/pdf"
            class="pdf-embed"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, onMounted, nextTick } from "vue";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";
    import { createElementResizeState } from "@utils/vitepress/runtime/viewport";

    /**
     * Path to the PDF file (relative to public folder).
     */
    const props = defineProps({
        pdfSource: {
            type: String,
            required: true,
        },
    });

    /**
     * Resolved PDF source URL.
     */
    const resolvedPdfSource = computed(() =>
        resolveAssetWithBase(props.pdfSource)
    );

    const pdfContainer = ref<HTMLElement | null>(null);
    const containerWidth = ref("100%");
    const containerHeight = ref("auto");
    const isReady = ref(false);

    /**
     * Updates viewer dimensions based on container size.
     */
    const updateViewerDimensions = () => {
        if (pdfContainer.value) {
            const pdfWidth = pdfContainer.value.clientWidth;
            const pdfHeight = pdfWidth * 1.5;

            containerWidth.value = `${pdfWidth}px`;
            containerHeight.value = `${pdfHeight}px`;
            isReady.value = true;
        }
    };

    createElementResizeState(pdfContainer, () => {
        updateViewerDimensions();
    });

    onMounted(() => {
        nextTick(() => {
            updateViewerDimensions();
        });
    });
</script>

<style scoped>
    .pdf-viewer {
        width: 100%;
        max-width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        background-color: var(--pdf-bg-color);
        color: var(--pdf-text-color);
    }

    .pdf-embed {
        max-width: 100%;
        max-height: 100%;
        border-radius: var(--video-border-radius);
        border: 1px solid var(--pdf-border-color);
        box-shadow: var(--video-shadow);
        transition: background-color var(--transition-duration),
            color var(--transition-duration), border var(--transition-duration);
    }
</style>
