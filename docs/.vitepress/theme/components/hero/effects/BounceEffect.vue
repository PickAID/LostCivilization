<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from "vue";

    const props = withDefaults(
        defineProps<{
            intensity?: number;
            duration?: number;
            direction?: "vertical" | "horizontal" | "both";
        }>(),
        {
            intensity: 0.1,
            duration: 3000,
            direction: "vertical",
        },
    );

    const elementRef = ref<HTMLElement | null>(null);
    let animationFrame: number | null = null;

    const animate = () => {
        if (!elementRef.value) return;

        const time = Date.now();
        const progress = (time % props.duration) / props.duration;

        const offset = Math.sin(progress * Math.PI * 2) * props.intensity * 50;

        let transform = "";

        if (props.direction === "horizontal") {
            transform = `translateX(${offset}px)`;
        } else if (props.direction === "vertical") {
            transform = `translateY(${offset}px)`;
        } else {
            transform = `translate(${offset}px, ${offset}px)`;
        }

        elementRef.value.style.transform = transform;

        animationFrame = requestAnimationFrame(animate);
    };

    onMounted(() => {
        animate();
    });

    onUnmounted(() => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });
</script>

<template>
    <div ref="elementRef" class="bounce-effect">
        <slot />
    </div>
</template>

<style scoped>
    .bounce-effect {
        will-change: transform;
    }
</style>
