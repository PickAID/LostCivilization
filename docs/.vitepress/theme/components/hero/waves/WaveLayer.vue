<script setup lang="ts">
    const props = withDefaults(
        defineProps<{
            path: string;
            fill?: string;
            opacity?: number;
            className?: string;
        }>(),
        {
            fill: "var(--vp-c-bg)",
            opacity: 1,
            className: "",
        },
    );
</script>

<template>
    <path
        :d="path"
        class="vp-wave__path"
        :class="className"
        :fill="fill"
        :opacity="opacity"
    />
</template>
