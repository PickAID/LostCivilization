<script setup lang="ts">
    import { useData } from "vitepress";
    import DefaultTheme from "vitepress/theme";
    import { provide } from "vue";

    const { Layout } = DefaultTheme;
    const { isDark } = useData();

    provide(
        "toggle-appearance",
        () => {
            // Theme toggle animation disabled by request.
            isDark.value = !isDark.value;
        }
    );
</script>

<template>
    <slot name="slot" />
</template>

<style scoped>
    /* Keep explicit style block to stabilize HMR style descriptor indexing. */
</style>
