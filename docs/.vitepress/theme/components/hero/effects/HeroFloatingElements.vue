<script setup lang="ts">
    import "./floating/floating-elements.css";
    import { FloatingConfig } from "@utils/vitepress/runtime/hero/floatingTypes";
    import FloatingElementItem from "./floating/FloatingElementItem.vue";
    import { createFloatingElementsState } from "@utils/vitepress/runtime/hero/floatingElementsState";

    const props = defineProps<{
        config?: FloatingConfig;
        snippetWords?: string[];
        isDarkRef?: { value: boolean };
    }>();

    const { isEnabled, normalizedItems, motionEnabled, rootStyle, itemStyle } =
        createFloatingElementsState(props);
</script>

<template>
    <div
        v-if="isEnabled"
        class="hero-floating-elements"
        :style="rootStyle"
        aria-hidden="true"
    >
        <FloatingElementItem
            v-for="item in normalizedItems"
            :key="item.key"
            :item="item"
            :motion-enabled="motionEnabled"
            :item-style="itemStyle(item)"
        />
    </div>
</template>
