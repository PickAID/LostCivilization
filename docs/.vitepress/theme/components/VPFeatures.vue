<script setup lang="ts">
    import type { DefaultTheme } from "vitepress/theme";
    import { computed, onMounted, onUnmounted, ref } from "vue";
    import { useData } from "vitepress";
    import {
        resolveHomeLink,
        type HomeLinkKey,
    } from "@utils/vitepress/services/homeLinkService";
    import VPFeatureCard from "./VPFeatureCard.vue";

    export interface Feature {
        icon?: DefaultTheme.FeatureIcon | string;
        image?:
            | string
            | { src?: string; light?: string; dark?: string; alt?: string };
        title: string;
        details: string;
        link?: string;
        linkKey?: HomeLinkKey;
        linkText?: string;
        rel?: string;
        target?: string;
        theme?: "brand" | "info" | "tip" | "warning" | "danger";
    }

    interface FeatureScrollSettings {
        speed: number;
        dragMultiplier: number;
        pauseOnHover: boolean;
        minItems: number;
        edgeFade: boolean;
        gap: number;
        gapTablet: number;
        gapDesktop: number;
        cardWidth: number;
        cardWidthTablet: number;
        cardWidthDesktop: number;
    }

    const props = defineProps<{
        features: Feature[];
    }>();

    const { frontmatter, lang } = useData();
    const scrollContainerRef = ref<HTMLElement>();
    const isPaused = ref(false);
    const isDragging = ref(false);
    const hasMoved = ref(false);
    const startX = ref(0);
    const scrollLeft = ref(0);
    const touchStartX = ref(0);
    const touchStartY = ref(0);

    function isRecord(value: unknown): value is Record<string, any> {
        return Boolean(
            value && typeof value === "object" && !Array.isArray(value),
        );
    }

    function clampNumber(
        value: unknown,
        fallback: number,
        min: number,
        max: number,
    ) {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) return fallback;
        return Math.min(max, Math.max(min, numberValue));
    }

    const featuresConfig = computed<Record<string, any>>(() => {
        const source = frontmatter.value as Record<string, any>;
        return isRecord(source.featuresConfig) ? source.featuresConfig : {};
    });

    const scrollSettings = computed<FeatureScrollSettings>(() => {
        const config = featuresConfig.value;
        const scroll = isRecord(config.scroll) ? config.scroll : {};
        const cards = isRecord(config.cards) ? config.cards : {};

        return {
            speed: clampNumber(scroll.speed, 0.6, 0.1, 3),
            dragMultiplier: clampNumber(scroll.dragMultiplier, 2, 0.6, 4),
            pauseOnHover: scroll.pauseOnHover !== false,
            minItems: clampNumber(
                scroll.minItems ?? config.minItems,
                12,
                4,
                36,
            ),
            edgeFade: scroll.edgeFade !== false,
            gap: clampNumber(scroll.gap ?? config.gap, 24, 8, 60),
            gapTablet: clampNumber(
                scroll.gapTablet ?? config.gapTablet,
                32,
                8,
                72,
            ),
            gapDesktop: clampNumber(
                scroll.gapDesktop ?? config.gapDesktop,
                40,
                8,
                84,
            ),
            cardWidth: clampNumber(
                cards.width ?? scroll.cardWidth ?? config.cardWidth,
                340,
                220,
                520,
            ),
            cardWidthTablet: clampNumber(
                cards.widthTablet ??
                    scroll.cardWidthTablet ??
                    config.cardWidthTablet,
                380,
                240,
                560,
            ),
            cardWidthDesktop: clampNumber(
                cards.widthDesktop ??
                    scroll.cardWidthDesktop ??
                    config.cardWidthDesktop,
                420,
                260,
                620,
            ),
        };
    });

    const resolvedFeatures = computed<Feature[]>(() => {
        const source = Array.isArray(props.features) ? props.features : [];
        return source.map((feature) => ({
            ...feature,
            link: resolveHomeLink(feature.link, feature.linkKey, lang.value),
        }));
    });

    const baseFeaturesForLoop = computed(() => {
        const features = resolvedFeatures.value;
        if (features.length === 0) return [];
        const targetCount = Math.max(
            features.length,
            scrollSettings.value.minItems,
        );
        const repeats = Math.max(1, Math.ceil(targetCount / features.length));
        const loopFeatures = Array.from(
            { length: repeats },
            () => features,
        ).flat();
        return loopFeatures.slice(0, targetCount);
    });

    const extendedFeatures = computed(() => {
        const base = baseFeaturesForLoop.value;
        if (base.length === 0) return [];
        return [...base, ...base];
    });

    const featureStyleVars = computed(() => ({
        "--feature-gap": `${scrollSettings.value.gap}px`,
        "--feature-gap-tablet": `${scrollSettings.value.gapTablet}px`,
        "--feature-gap-desktop": `${scrollSettings.value.gapDesktop}px`,
        "--feature-card-width": `${scrollSettings.value.cardWidth}px`,
        "--feature-card-width-tablet": `${scrollSettings.value.cardWidthTablet}px`,
        "--feature-card-width-desktop": `${scrollSettings.value.cardWidthDesktop}px`,
        "--feature-mask": scrollSettings.value.edgeFade
            ? "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)"
            : "none",
    }));

    class FeatureScrollManager {
        private el: HTMLElement | null = null;
        private rafId: number | null = null;
        private paused = false;
        private readonly speedGetter: () => number;

        constructor(speedGetter: () => number) {
            this.speedGetter = speedGetter;
        }

        initialize(el: HTMLElement) {
            this.el = el;
            this.tick();
        }

        private tick() {
            this.rafId = requestAnimationFrame(() => {
                if (
                    this.el &&
                    !this.paused &&
                    document.visibilityState !== "hidden"
                ) {
                    this.el.scrollLeft += this.speedGetter();
                    const halfWidth = this.el.scrollWidth / 2;
                    if (this.el.scrollLeft >= halfWidth) {
                        this.el.scrollLeft -= halfWidth;
                    }
                }
                this.tick();
            });
        }

        pause() {
            this.paused = true;
        }

        resume() {
            this.paused = false;
        }

        destroy() {
            if (this.rafId !== null) cancelAnimationFrame(this.rafId);
            this.rafId = null;
            this.el = null;
        }
    }

    let scrollManager: FeatureScrollManager | null = null;

    function wrapScrollPosition(newScrollLeft: number) {
        if (!scrollContainerRef.value) return;
        const halfWidth = scrollContainerRef.value.scrollWidth / 2;
        if (newScrollLeft < 0) {
            scrollContainerRef.value.scrollLeft = newScrollLeft + halfWidth;
        } else if (newScrollLeft > halfWidth) {
            scrollContainerRef.value.scrollLeft = newScrollLeft - halfWidth;
        } else {
            scrollContainerRef.value.scrollLeft = newScrollLeft;
        }
    }

    function handleMouseDown(event: MouseEvent) {
        if (!scrollContainerRef.value) return;
        startX.value = event.pageX - scrollContainerRef.value.offsetLeft;
        scrollLeft.value = scrollContainerRef.value.scrollLeft || 0;
        hasMoved.value = false;
        scrollManager?.pause();
    }

    function handleMouseMove(event: MouseEvent) {
        if (!scrollContainerRef.value || startX.value === 0) return;
        const x = event.pageX - scrollContainerRef.value.offsetLeft;
        const walk = (x - startX.value) * scrollSettings.value.dragMultiplier;

        if (Math.abs(walk) > 10) {
            isDragging.value = true;
            hasMoved.value = true;
            event.preventDefault();
        }

        if (!hasMoved.value) return;
        wrapScrollPosition(scrollLeft.value - walk);
    }

    function handleMouseUp() {
        isDragging.value = false;
        hasMoved.value = false;
        startX.value = 0;
        if (scrollManager && !isPaused.value) scrollManager.resume();
    }

    function handleTouchStart(event: TouchEvent) {
        if (!scrollContainerRef.value) return;
        touchStartX.value = event.touches[0].pageX;
        touchStartY.value = event.touches[0].pageY;
        startX.value =
            event.touches[0].pageX - scrollContainerRef.value.offsetLeft;
        scrollLeft.value = scrollContainerRef.value.scrollLeft || 0;
        hasMoved.value = false;
        scrollManager?.pause();
    }

    function handleTouchMove(event: TouchEvent) {
        if (!scrollContainerRef.value || startX.value === 0) return;

        const deltaX = Math.abs(event.touches[0].pageX - touchStartX.value);
        const deltaY = Math.abs(event.touches[0].pageY - touchStartY.value);
        if (deltaX > 15 || deltaY > 15) {
            isDragging.value = true;
            hasMoved.value = true;
            if (event.cancelable) event.preventDefault();
        }

        if (!hasMoved.value) return;
        const x = event.touches[0].pageX - scrollContainerRef.value.offsetLeft;
        const walk = (x - startX.value) * scrollSettings.value.dragMultiplier;
        wrapScrollPosition(scrollLeft.value - walk);
    }

    function handleTouchEnd() {
        isDragging.value = false;
        hasMoved.value = false;
        startX.value = 0;
        if (scrollManager && !isPaused.value) scrollManager.resume();
    }

    function handleMouseEnter() {
        if (!scrollSettings.value.pauseOnHover) return;
        isPaused.value = true;
        scrollManager?.pause();
    }

    function handleMouseLeave() {
        if (!scrollSettings.value.pauseOnHover) return;
        isPaused.value = false;
        if (scrollManager && !isDragging.value) scrollManager.resume();
    }

    function resolveTheme(feature: Feature, index: number) {
        if (feature.theme) return feature.theme;
        const fallback = ["brand", "info", "tip", "warning", "danger"] as const;
        return fallback[index % fallback.length];
    }

    onMounted(() => {
        if (scrollContainerRef.value) {
            scrollManager = new FeatureScrollManager(
                () => scrollSettings.value.speed,
            );
            scrollManager.initialize(scrollContainerRef.value);
        }
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd);
    });

    onUnmounted(() => {
        scrollManager?.destroy();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
    });
</script>

<template>
    <div
        v-if="resolvedFeatures.length > 0"
        class="VPFeatures features-enhanced"
        :style="featureStyleVars"
    >
        <div class="container">
            <div
                ref="scrollContainerRef"
                class="scroll-container"
                :class="{ 'is-dragging': isDragging }"
                @mouseenter="handleMouseEnter"
                @mouseleave="handleMouseLeave"
                @mousedown="handleMouseDown"
                @touchstart="handleTouchStart"
            >
                <div class="scroll-content">
                    <div
                        v-for="(feature, index) in extendedFeatures"
                        :key="`${feature.title}-${index}`"
                        class="item feature-card"
                    >
                        <VPFeatureCard
                            :feature="feature"
                            :theme="
                                resolveTheme(
                                    feature,
                                    index % (baseFeaturesForLoop.length || 1),
                                )
                            "
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .VPFeatures.features-enhanced {
        position: relative;
        background: var(--vp-c-bg);
        padding: 0;
        margin: 0;
        width: 100vw;
        margin-left: 50%;
        transform: translateX(-50%);
        overflow: hidden;
    }

    .container {
        margin: 0 auto;
        max-width: none;
        position: relative;
        z-index: 10;
        padding: 58px 0 78px;
    }

    @media (min-width: 640px) {
        .container {
            padding: 80px 0 100px;
        }
    }

    @media (min-width: 960px) {
        .container {
            padding: 100px 0 120px;
        }
    }

    .scroll-container {
        position: relative;
        width: 100%;
        overflow-x: auto;
        overflow-y: visible;
        mask: var(--feature-mask);
        -webkit-mask: var(--feature-mask);
        padding: 16px 0;
        margin: -16px 0;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .scroll-container::-webkit-scrollbar {
        display: none;
    }

    .scroll-content {
        display: flex;
        gap: var(--feature-gap);
        padding: 0 40px;
        width: max-content;
        cursor: grab;
        user-select: none;
    }

    .is-dragging .scroll-content {
        cursor: grabbing;
    }

    .is-dragging .item.feature-card {
        pointer-events: none;
        user-select: none;
    }

    .item.feature-card {
        flex: none;
        width: var(--feature-card-width);
        min-width: var(--feature-card-width);
        position: relative;
        z-index: 1;
        pointer-events: auto;
    }

    @media (min-width: 640px) {
        .scroll-content {
            gap: var(--feature-gap-tablet);
            padding: 0 60px;
        }

        .item.feature-card {
            width: var(--feature-card-width-tablet);
            min-width: var(--feature-card-width-tablet);
        }
    }

    @media (min-width: 960px) {
        .scroll-content {
            gap: var(--feature-gap-desktop);
            padding: 0 80px;
        }

        .item.feature-card {
            width: var(--feature-card-width-desktop);
            min-width: var(--feature-card-width-desktop);
        }
    }

    @media (hover: none) and (pointer: coarse) {
        .scroll-content {
            cursor: auto;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .scroll-content {
            animation: none !important;
        }
    }
</style>
