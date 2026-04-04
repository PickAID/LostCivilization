<script setup lang="ts">
    import { computed } from "vue";
    import type { NormalizedFloatingItem } from "@utils/vitepress/runtime/hero/floatingTypes";
    import LottieDisplay from "../../image/LottieDisplay.vue";

    const props = defineProps<{
        item: NormalizedFloatingItem;
        motionEnabled: boolean;
        itemStyle: Record<string, string | undefined>;
    }>();

    const rawTypeClass = computed(() => {
        const rawType = String(props.item.rawType || props.item.type || "text");
        return `hero-floating-elements__item--raw-${rawType
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "-")}`;
    });

    const itemClasses = computed(() => [
        `hero-floating-elements__item--${props.item.type}`,
        rawTypeClass.value,
        props.item.customClass || "",
        {
            "hero-floating-elements__text-gradient":
                props.item.type === "text" &&
                props.item.colorType !== "solid" &&
                Boolean(props.item.gradientValue),
        },
        {
            "hero-floating-elements__item--static": !props.motionEnabled,
        },
    ]);
</script>

<template>
    <div
        class="hero-floating-elements__item"
        :class="itemClasses"
        :style="itemStyle"
    >
        <component
            v-if="item.component"
            :is="item.component"
            class="hero-floating-elements__custom-component"
            :item="item"
            v-bind="item.componentProps"
        />

        <img
            v-else-if="item.type === 'image' && item.src"
            :src="item.src"
            :alt="item.alt"
            class="hero-floating-elements__image"
            loading="lazy"
        />

        <LottieDisplay
            v-else-if="item.type === 'lottie' && item.src"
            class="hero-floating-elements__lottie"
            :src="item.src"
            :alt="item.alt"
            :loop="item.lottieLoop"
            :autoplay="item.lottieAutoplay"
            :speed="item.lottieSpeed"
            :fit="item.imageFit || 'contain'"
        />

        <div
            v-else-if="item.type === 'card'"
            class="hero-floating-elements__card"
        >
            <p class="hero-floating-elements__card-title">{{ item.title }}</p>
            <p
                v-if="item.description"
                class="hero-floating-elements__card-text"
            >
                {{ item.description }}
            </p>
        </div>

        <div
            v-else-if="item.type === 'badge'"
            class="hero-floating-elements__badge"
        >
            <span v-if="item.icon" class="hero-floating-elements__badge-icon">
                {{ item.icon }}
            </span>
            <span class="hero-floating-elements__badge-text">
                {{ item.text || item.title }}
            </span>
        </div>

        <div
            v-else-if="item.type === 'icon'"
            class="hero-floating-elements__icon"
        >
            {{ item.icon || item.text || "✦" }}
        </div>

        <div
            v-else-if="item.type === 'stat'"
            class="hero-floating-elements__stat"
        >
            <p class="hero-floating-elements__stat-value">
                {{ item.value }}
            </p>
            <p class="hero-floating-elements__stat-label">
                {{ item.text }}
            </p>
        </div>

        <pre
            v-else-if="item.type === 'code'"
            class="hero-floating-elements__code"
            >{{ item.code || item.text }}</pre
        >

        <div
            v-else-if="item.type === 'shape'"
            class="hero-floating-elements__shape"
            :class="`hero-floating-elements__shape--${item.shape || 'circle'}`"
        />

        <span v-else class="hero-floating-elements__text">
            {{ item.text }}
        </span>
    </div>
</template>
