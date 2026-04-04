<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from "vue";

    const props = withDefaults(
        defineProps<{
            intensity?: number;
            direction?: "vertical" | "horizontal" | "both";
            smoothness?: number;
        }>(),
        {
            intensity: 0.5,
            direction: "vertical",
            smoothness: 0.1,
        },
    );

    const elementRef = ref<HTMLElement | null>(null);
    const offsetX = ref(0);
    const offsetY = ref(0);
    let targetX = 0;
    let targetY = 0;
    let animationFrame: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
        if (!elementRef.value) return;

        const rect = elementRef.value.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        targetX =
            ((e.clientX - rect.left - centerX) / centerX) *
            props.intensity *
            100;
        targetY =
            ((e.clientY - rect.top - centerY) / centerY) *
            props.intensity *
            100;
    };

    const animate = () => {
        offsetX.value += (targetX - offsetX.value) * props.smoothness;
        offsetY.value += (targetY - offsetY.value) * props.smoothness;

        if (elementRef.value) {
            let transform = "";

            if (props.direction === "horizontal") {
                transform = `translate3d(${offsetX.value}px, 0, 0)`;
            } else if (props.direction === "vertical") {
                transform = `translate3d(0, ${offsetY.value}px, 0)`;
            } else {
                transform = `translate3d(${offsetX.value}px, ${offsetY.value}px, 0)`;
            }

            elementRef.value.style.transform = transform;
        }

        animationFrame = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
        targetX = 0;
        targetY = 0;
    };

    onMounted(() => {
        animate();
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
    });

    onUnmounted(() => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseleave", handleMouseLeave);
    });
</script>

<template>
    <div ref="elementRef" class="parallax-effect">
        <slot />
    </div>
</template>

<style scoped>
    .parallax-effect {
        will-change: transform;
        transition: transform 0.1s ease-out;
    }
</style>
