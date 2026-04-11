<template>
    <v-alert
        v-bind="forwardedAttrs"
        :type="type"
        :variant="variant"
        :density="density"
        :border="border"
        :color="color"
        :icon="icon"
        :title="title"
        :text="text"
        class="custom-alert-wrapper"
        :class="alertClasses"
        :style="alertStyles"
    >
        <div v-if="$slots.default" class="custom-alert-content">
            <slot />
        </div>
    </v-alert>
</template>

<script setup lang="ts">
    import type { PropType } from "vue";
    import { computed, useAttrs } from "vue";

    defineOptions({
        inheritAttrs: false,
    });

    type AlertVariant =
        | "elevated"
        | "flat"
        | "tonal"
        | "outlined"
        | "text"
        | "plain";

    type AlertDensity = "default" | "comfortable" | "compact";

    type AlertBorder = "start" | "end" | "top" | "bottom" | boolean;

    const props = defineProps({
        type: {
            type: String as PropType<"success" | "info" | "warning" | "error">,
            default: undefined,
        },
        variant: {
            type: String as PropType<AlertVariant>,
            default: "flat",
        },
        density: {
            type: String as PropType<AlertDensity>,
            default: "default",
        },
        border: {
            type: [String, Boolean] as PropType<AlertBorder>,
            default: undefined,
        },
        color: {
            type: String,
            default: undefined,
        },
        lightColor: {
            type: String,
            default: undefined,
        },
        darkColor: {
            type: String,
            default: undefined,
        },
        icon: {
            type: [String, Boolean] as PropType<string | false>,
            default: undefined,
        },
        iconColor: {
            type: String,
            default: undefined,
        },
        title: {
            type: String,
            default: undefined,
        },
        text: {
            type: String,
            default: undefined,
        },
        textColor: {
            type: String,
            default: undefined,
        },
    });

    const forwardedAttrs = useAttrs();

    const alertClasses = computed(() => ({
        "custom-alert-has-surface-color": Boolean(
            props.color || props.lightColor || props.darkColor,
        ),
        "custom-alert-has-icon-color": Boolean(props.iconColor),
        "custom-alert-has-text-color": Boolean(props.textColor),
    }));

    const alertStyles = computed(() => {
        const styles: Record<string, string> = {};

        if (props.color) {
            styles["--custom-alert-color"] = props.color;
        }

        if (props.lightColor) {
            styles["--custom-alert-light-color"] = props.lightColor;
        }

        if (props.darkColor) {
            styles["--custom-alert-dark-color"] = props.darkColor;
        }

        if (props.iconColor) {
            styles["--custom-alert-icon-color"] = props.iconColor;
        }

        if (props.textColor) {
            styles["--custom-alert-text-color"] = props.textColor;
        }

        return styles;
    });
</script>

<style scoped>
    .custom-alert-wrapper {
        margin: 1rem 0;
    }

    .custom-alert-wrapper.custom-alert-has-surface-color {
        --v-theme-surface-variant: var(
            --custom-alert-light-color,
            var(--custom-alert-color)
        );
        background-color: var(
            --custom-alert-light-color,
            var(--custom-alert-color)
        ) !important;
    }

    .dark .custom-alert-wrapper.custom-alert-has-surface-color {
        --v-theme-surface-variant: var(
            --custom-alert-dark-color,
            var(--custom-alert-light-color, var(--custom-alert-color))
        );
        background-color: var(
            --custom-alert-dark-color,
            var(--custom-alert-light-color, var(--custom-alert-color))
        ) !important;
    }

    .custom-alert-wrapper.custom-alert-has-icon-color :deep(.v-alert__prepend .v-icon) {
        color: var(--custom-alert-icon-color) !important;
        opacity: 1 !important;
    }

    .custom-alert-wrapper.custom-alert-has-text-color {
        color: var(--custom-alert-text-color) !important;
    }

    .custom-alert-wrapper.custom-alert-has-text-color :deep(.v-alert-title),
    .custom-alert-wrapper.custom-alert-has-text-color :deep(.v-alert__content),
    .custom-alert-wrapper.custom-alert-has-text-color :deep(.v-alert__content > *),
    .custom-alert-wrapper.custom-alert-has-text-color .custom-alert-content {
        color: var(--custom-alert-text-color) !important;
    }

    .custom-alert-content {
        font-size: var(--vp-custom-block-font-size);
        line-height: var(--vp-custom-block-line-height);
        padding-top: 8px;
    }
</style>
