<script setup lang="ts">
    import { computed } from "vue";
    import ShaderBackground from "./background/ShaderBackground.vue";

    const props = defineProps<{
        vertexShader?: string;
        fragmentShader?: string;
        preset?: string;
        speed?: number;
        paused?: boolean;
    }>();

    const config = computed(() => ({
        type: props.preset,
        speed: props.speed,
        custom: {
            vertex: props.vertexShader,
            fragment: props.fragmentShader,
        },
    }));
</script>

<template>
    <ShaderBackground :config="config" />
</template>
