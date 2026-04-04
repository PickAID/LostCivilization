<template>
    <v-alert
        :type="type"
        :variant="variant"
        :density="density"
        :border="border"
        :color="color"
        :icon="icon"
        :title="title"
        :text="text"
        class="custom-alert-wrapper"
        :style="colorStyles"
    >
        <div v-if="$slots.default" class="custom-alert-content">
            <slot />
        </div>
    </v-alert>
</template>

<script setup lang="ts">
    import type { PropType } from "vue";
    import { computed } from "vue";

    /**
     * Visual style variant for the alert.
     */
    type AlertVariant =
        | "elevated"
        | "flat"
        | "tonal"
        | "outlined"
        | "text"
        | "plain";

    /**
     * Spacing density for the alert.
     */
    type AlertDensity = "default" | "comfortable" | "compact";

    /**
     * Border position for the alert.
     */
    type AlertBorder = "start" | "end" | "top" | "bottom" | boolean;

    const props = defineProps({
        /**
         * Alert type/color variant.
         */
        type: {
            type: String as PropType<"success" | "info" | "warning" | "error">,
            default: undefined,
        },
        /**
         * Visual style variant.
         */
        variant: {
            type: String as PropType<AlertVariant>,
            default: "flat",
        },
        /**
         * Spacing density.
         */
        density: {
            type: String as PropType<AlertDensity>,
            default: "default",
        },
        /**
         * Border position or boolean for visibility.
         */
        border: {
            type: [String, Boolean] as PropType<AlertBorder>,
            default: undefined,
        },
        /**
         * Custom color for the alert.
         */
        color: {
            type: String,
            default: undefined,
        },
        /**
         * Custom color for light theme.
         */
        lightColor: {
            type: String,
            default: undefined,
        },
        /**
         * Custom color for dark theme.
         */
        darkColor: {
            type: String,
            default: undefined,
        },
        /**
         * Custom icon to display.
         */
        icon: {
            type: String,
            default: undefined,
        },
        /**
         * Alert title text.
         */
        title: {
            type: String,
            default: undefined,
        },
        /**
         * Alert body text.
         */
        text: {
            type: String,
            default: undefined,
        },
    });

    /**
     * Computed styles for theme-aware custom colors.
     */
    const colorStyles = computed(() => {
        const styles: Record<string, string> = {};

        if (props.lightColor) {
            styles['--custom-alert-light-color'] = props.lightColor;
        }

        if (props.darkColor) {
            styles['--custom-alert-dark-color'] = props.darkColor;
        }

        return styles;
    });
</script>

<style scoped>
    .custom-alert-wrapper {
        margin: 1rem 0;
    }
    
    .custom-alert-wrapper:where([style*="--custom-alert-light-color"]) {
        --v-theme-surface-variant: var(--custom-alert-light-color);
        background-color: var(--custom-alert-light-color) !important;
    }
    
    .dark .custom-alert-wrapper:where([style*="--custom-alert-dark-color"]) {
        --v-theme-surface-variant: var(--custom-alert-dark-color);
        background-color: var(--custom-alert-dark-color) !important;
    }
    
    .custom-alert-content {
        font-size: var(--vp-custom-block-font-size);
        line-height: var(--vp-custom-block-line-height);
        padding-top: 8px;
    }
</style>
