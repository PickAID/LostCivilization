<script lang="ts" setup>
    import { useData } from "vitepress";
    import { computed } from "vue";

    const { frontmatter } = useData();

    /**
     * Page description from frontmatter.
     */
    const description = computed(() => frontmatter.value?.description ?? "");

    /**
     * Whether description should be displayed.
     */
    const isDescription = computed(() => {
        return frontmatter.value?.description ?? false;
    });
</script>
<template>
    <div v-if="isDescription">
        <v-card variant="plain">
            {{ description }}
        </v-card>
    </div>
</template>
