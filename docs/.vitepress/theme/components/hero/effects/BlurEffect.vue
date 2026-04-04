<script setup lang="ts">
    import { ref, onMounted, onUnmounted, computed } from "vue";

    const props = withDefaults(
        defineProps<{
            amount?: number;
            animated?: boolean;
            animationType?: "pulse" | "wave" | "breath" | "none";
            duration?: number;
            minAmount?: number;
            maxAmount?: number;
        }>(),
        {
            amount: 0,
            animated: false,
            animationType: "none",
            duration: 2000,
            minAmount: 0,
            maxAmount: 10,
        },
    );

    const elementRef = ref<HTMLElement | null>(null);
    const currentBlur = ref(props.amount);
    let animationFrame: number | null = null;

    const animate = () => {
        if (!props.animated || props.animationType === "none") {
            currentBlur.value = props.amount;
            return;
        }

        const time = Date.now();
        const progress = (time % props.duration) / props.duration;

        let blurValue: number;

        if (props.animationType === "pulse") {
            blurValue =
                props.minAmount +
                (props.maxAmount - props.minAmount) *
                    Math.sin(progress * Math.PI * 2);
        } else if (props.animationType === "wave") {
            blurValue =
                props.minAmount +
                (props.maxAmount - props.minAmount) *
                    (Math.sin(progress * Math.PI * 4) * 0.5 + 0.5);
        } else if (props.animationType === "breath") {
            blurValue =
                props.minAmount +
                (props.maxAmount - props.minAmount) *
                    (Math.sin(progress * Math.PI) * 0.5 + 0.5);
        } else {
            blurValue = props.amount;
        }

        currentBlur.value = blurValue;

        if (elementRef.value) {
            elementRef.value.style.filter = `blur(${blurValue}px)`;
        }

        animationFrame = requestAnimationFrame(animate);
    };

    const staticStyle = computed(() => {
        if (props.animated || props.animationType !== "none") {
            return {};
        }
        return {
            filter: `blur(${props.amount}px)`,
        };
    });

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
    <div ref="elementRef" class="blur-effect" :style="staticStyle">
        <slot />
    </div>
</template>

<style scoped>
    .blur-effect {
        will-change: filter;
        transition: filter 0.3s ease;
    }
</style>
