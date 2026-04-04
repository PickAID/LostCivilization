<script setup lang="ts">
    import { ref, computed } from "vue";

    const props = withDefaults(
        defineProps<{
            intensity?: number;
            perspective?: string;
            stiffness?: number;
            damping?: number;
        }>(),
        {
            intensity: 15,
            perspective: "1000px",
            stiffness: 300,
            damping: 30,
        },
    );

    const cardRef = ref<HTMLElement | null>(null);
    const x = ref(0);
    const y = ref(0);

    const transform = computed(() => {
        return `perspective(${props.perspective}) rotateX(${x.value}deg) rotateY(${y.value}deg)`;
    });

    const handleMouseMove = (e: MouseEvent) => {
        if (!cardRef.value) return;

        const rect = cardRef.value.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const centerX = width / 2;
        const centerY = height / 2;

        const rotateX = ((mouseY - centerY) / centerY) * -props.intensity;
        const rotateY = ((mouseX - centerX) / centerX) * props.intensity;

        x.value = rotateX;
        y.value = rotateY;
    };

    const handleMouseLeave = () => {
        x.value = 0;
        y.value = 0;
    };
</script>

<template>
    <div
        ref="cardRef"
        class="hover-3d-effect"
        :style="{ transformStyle: 'preserve-3d', perspective }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
    >
        <div class="hover-3d-content" :style="{ transform }">
            <slot />
        </div>
    </div>
</template>

<style scoped>
    .hover-3d-effect {
        display: inline-block;
        transition: transform 0.1s ease-out;
    }

    .hover-3d-content {
        transition: transform 0.15s ease-out;
        transform-style: preserve-3d;
    }
</style>
