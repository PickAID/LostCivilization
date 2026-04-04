<template>
    <span
        :class="['tag-badge', { 'tag-badge--clickable': clickable }]"
        :data-tag="tag.toLowerCase()"
        :style="{
            '--tag-color': tagColor,
            '--tag-bg-color': tagBgColor,
        }"
        @click="handleClick"
    >
        <span class="tag-badge__text">{{ tag }}</span>
        <span v-if="count !== undefined" class="tag-badge__count">{{
            count
        }}</span>
    </span>
</template>

<script setup lang="ts">
    import { computed } from "vue";

    /**
     * Component props for TagBadge.
     */
    interface Props {
        /** Tag text to display */
        tag: string;
        /** Optional count to display next to tag */
        count?: number;
        /** Whether the tag is clickable */
        clickable?: boolean;
        /** Custom color for the tag */
        color?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        clickable: false,
    });

    const emit = defineEmits<{
        /** Emitted when clickable tag is clicked */
        click: [tag: string];
    }>();

    /**
     * Computed tag color - uses custom color or generates from tag name.
     */
    const tagColor = computed(() => {
        if (props.color) return props.color;

        const fallbackColors = [
            "var(--tag-color-fallback-0)",
            "var(--tag-color-fallback-1)",
            "var(--tag-color-fallback-2)",
            "var(--tag-color-fallback-3)",
            "var(--tag-color-fallback-4)",
            "var(--tag-color-fallback-5)",
            "var(--tag-color-fallback-6)",
            "var(--tag-color-fallback-7)",
            "var(--tag-color-fallback-8)",
            "var(--tag-color-fallback-9)",
        ];

        let hash = 0;
        for (let i = 0; i < props.tag.length; i++) {
            hash = props.tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        return fallbackColors[Math.abs(hash) % fallbackColors.length];
    });

    /**
     * Computed background color - use color-mix so CSS variables and hex colors
     * both work without parsing.
     */
    const tagBgColor = computed(() => {
        const color = tagColor.value;
        return `color-mix(in srgb, ${color} 12%, transparent)`;
    });

    /**
     * Handles click event on tag.
     */
    function handleClick() {
        if (props.clickable) {
            emit("click", props.tag);
        }
    }
</script>

<style scoped></style>
