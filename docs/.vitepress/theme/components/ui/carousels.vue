<template>
    <div
        class="carousel"
        :class="{ 'has-hover-arrows': showArrows === 'hover' }"
        ref="carouselContainer"
        @wheel.prevent="handleWheel"
    >
        <div class="carousel-frame" :style="{ height: carouselHeight }">
            <v-window
                v-if="isReady"
                v-model="currentIndex"
                class="carousel-window"
                :touch="false"
                :mandatory="slideCount > 0"
            >
                <v-window-item
                    v-for="(name, index) in slotNames"
                    :key="name"
                    :value="index"
                >
                    <div class="carousel-slide-panel">
                        <div class="carousel-slide-content">
                            <slot :name="name" />
                        </div>
                    </div>
                </v-window-item>
            </v-window>

            <button
                v-if="shouldShowArrows"
                type="button"
                class="carousel-arrow carousel-arrow--prev"
                aria-label="Previous slide"
                @click="goPrev"
            >
                ‹
            </button>
            <button
                v-if="shouldShowArrows"
                type="button"
                class="carousel-arrow carousel-arrow--next"
                aria-label="Next slide"
                @click="goNext"
            >
                ›
            </button>
        </div>

        <div
            v-if="showDelimiters"
            class="carousel-delimiters"
            aria-label="Slide selection"
        >
            <button
                v-for="(_, index) in slotNames"
                :key="index"
                type="button"
                class="carousel-delimiter"
                :class="{ 'is-active': index === currentIndex }"
                :aria-label="`Go to slide ${index + 1}`"
                @click="currentIndex = index"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import {
        computed,
        nextTick,
        onBeforeUnmount,
        onMounted,
        onUpdated,
        ref,
        useSlots,
        watch,
    } from "vue";
    import { bindFancybox } from "@utils/vitepress/runtime/media/imageViewerRuntime";
    import { createElementResizeState } from "@utils/vitepress/runtime/viewport";

    const props = defineProps({
        showArrows: {
            type: [Boolean, String],
            default: true,
        },
        cycle: {
            type: Boolean,
            default: false,
        },
        interval: {
            type: Number,
            default: 6000,
        },
        hideDelimiters: {
            type: Boolean,
            default: false,
        },
        continuous: {
            type: Boolean,
            default: true,
        },
        height: {
            type: [Number, String],
            default: undefined,
        },
    });

    const carouselContainer = ref<HTMLElement | null>(null);
    const carouselHeight = ref("auto");
    const isReady = ref(false);
    const currentIndex = ref(0);
    const slots = useSlots();
    let measureFrame = 0;
    let mutationObserver: MutationObserver | null = null;
    let cycleTimer: number | null = null;

    const slotNames = computed(() =>
        Object.keys(slots)
            .filter((name) => name.startsWith("slide-"))
            .sort(
                (left, right) =>
                    Number(left.replace("slide-", "")) -
                    Number(right.replace("slide-", "")),
            ),
    );

    const slideCount = computed(() => slotNames.value.length);
    const shouldShowArrows = computed(
        () => props.showArrows !== false && slideCount.value > 1,
    );
    const showDelimiters = computed(
        () => !props.hideDelimiters && slideCount.value > 1,
    );

    const resolveHeight = (value: number | string | undefined) => {
        if (typeof value === "number") return `${value}px`;
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
        return null;
    };

    const getSlideElements = () => {
        if (!carouselContainer.value) return [];
        return Array.from(
            carouselContainer.value.querySelectorAll<HTMLElement>(
                ".carousel-slide-panel",
            ),
        );
    };

    const bindMediaListeners = () => {
        if (!carouselContainer.value) return;

        carouselContainer.value
            .querySelectorAll<HTMLImageElement | HTMLIFrameElement | HTMLVideoElement>(
                "img, iframe, video",
            )
            .forEach((media) => {
                if (media.dataset.carouselObserved === "true") return;
                media.dataset.carouselObserved = "true";

                if (media instanceof HTMLImageElement && media.complete) return;

                const onLoad = () => scheduleHeightUpdate();
                media.addEventListener("load", onLoad, { once: true });
                media.addEventListener("error", onLoad, { once: true });

                if (media instanceof HTMLVideoElement) {
                    media.addEventListener("loadedmetadata", onLoad, {
                        once: true,
                    });
                }
            });
    };

    // ===== Height measurement =====
    const updateCarouselHeight = () => {
        const explicitHeight = resolveHeight(props.height);
        if (explicitHeight) {
            carouselHeight.value = explicitHeight;
            isReady.value = true;
            return;
        }

        const items = getSlideElements();
        if (items.length === 0) {
            isReady.value = true;
            return;
        }

        let maxHeight = 0;
        items.forEach((item) => {
            const previousDisplay = item.style.display;
            const previousVisibility = item.style.visibility;
            const previousPosition = item.style.position;
            const previousPointerEvents = item.style.pointerEvents;
            const computedStyle = window.getComputedStyle(item);

            if (computedStyle.display === "none") {
                item.style.display = "block";
            }
            item.style.visibility = "hidden";
            item.style.position = "relative";
            item.style.pointerEvents = "none";

            const h = item.scrollHeight;
            if (h > maxHeight) maxHeight = h;

            item.style.display = previousDisplay;
            item.style.visibility = previousVisibility;
            item.style.position = previousPosition;
            item.style.pointerEvents = previousPointerEvents;
        });

        carouselHeight.value = maxHeight > 0 ? `${maxHeight}px` : "auto";
        isReady.value = true;
    };

    const scheduleHeightUpdate = () => {
        if (typeof window === "undefined") return;
        if (measureFrame) cancelAnimationFrame(measureFrame);
        measureFrame = requestAnimationFrame(() => {
            measureFrame = 0;
            nextTick(() => {
                bindMediaListeners();
                updateCarouselHeight();
            });
        });
    };

    const refreshImageViewer = () => {
        if (!carouselContainer.value) return;
        bindFancybox(carouselContainer.value);
    };

    const { reobserve } = createElementResizeState(carouselContainer, () => {
        scheduleHeightUpdate();
    });

    // ===== Resize observation via shared viewport API =====
    // ===== Mouse wheel navigation =====
    const handleWheel = (e: WheelEvent) => {
        if (slideCount.value <= 1) return;
        if (e.deltaY > 0) goNext();
        else goPrev();
    };

    const clearCycleTimer = () => {
        if (typeof window === "undefined") return;
        if (cycleTimer !== null) {
            window.clearInterval(cycleTimer);
            cycleTimer = null;
        }
    };

    const goNext = () => {
        if (slideCount.value <= 1) return;
        if (currentIndex.value >= slideCount.value - 1) {
            currentIndex.value = props.continuous ? 0 : slideCount.value - 1;
            return;
        }
        currentIndex.value += 1;
    };

    const goPrev = () => {
        if (slideCount.value <= 1) return;
        if (currentIndex.value <= 0) {
            currentIndex.value = props.continuous ? slideCount.value - 1 : 0;
            return;
        }
        currentIndex.value -= 1;
    };

    const restartCycle = () => {
        if (typeof window === "undefined") return;
        clearCycleTimer();
        if (!props.cycle || slideCount.value <= 1) return;
        cycleTimer = window.setInterval(() => {
            goNext();
        }, props.interval);
    };

    onMounted(() => {
        if (carouselContainer.value) {
            reobserve(carouselContainer.value);
        }

        if (typeof MutationObserver !== "undefined" && carouselContainer.value) {
            mutationObserver = new MutationObserver(() => {
                scheduleHeightUpdate();
            });
            mutationObserver.observe(carouselContainer.value, {
                childList: true,
                subtree: true,
            });
        }

        scheduleHeightUpdate();
        refreshImageViewer();
        restartCycle();
    });

    onUpdated(() => {
        scheduleHeightUpdate();
        refreshImageViewer();
    });

    watch(
        () => [props.cycle, props.interval, props.continuous, slideCount.value],
        () => {
            restartCycle();
        },
        { immediate: true },
    );

    watch(currentIndex, () => {
        refreshImageViewer();
    });

    onBeforeUnmount(() => {
        mutationObserver?.disconnect();
        mutationObserver = null;
        if (measureFrame) cancelAnimationFrame(measureFrame);
        clearCycleTimer();
    });
</script>

<style scoped>
    .carousel {
        width: 100%;
        max-width: 100%;
    }

    .carousel-frame {
        position: relative;
    }

    .carousel-window {
        width: 100%;
        height: 100%;
    }

    .carousel-slide-panel {
        min-height: 200px;
        padding: 1.25rem 4rem;
        width: 100%;
        box-sizing: border-box;
    }

    .carousel-slide-content {
        width: 100%;
    }

    :deep(.carousel-slide-content > *),
    :deep(.carousel-slide-content .vp-doc),
    :deep(.carousel-slide-content .vp-doc > *) {
        width: 100%;
    }

    :deep(.carousel-slide-content img) {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        margin: 0 auto;
    }

    .carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 2.75rem;
        height: 2.75rem;
        border: 0;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.58);
        color: #ffffff;
        font-size: 1.8rem;
        line-height: 1;
        cursor: pointer;
        transition:
            opacity 0.2s ease,
            background-color 0.2s ease;
        z-index: 2;
    }

    .carousel-arrow:hover {
        background: rgba(15, 23, 42, 0.72);
    }

    .carousel-arrow--prev {
        left: 1rem;
    }

    .carousel-arrow--next {
        right: 1rem;
    }

    .has-hover-arrows .carousel-arrow {
        opacity: 0;
        pointer-events: none;
    }

    .has-hover-arrows:hover .carousel-arrow,
    .has-hover-arrows:focus-within .carousel-arrow {
        opacity: 1;
        pointer-events: auto;
    }

    .carousel-delimiters {
        display: flex;
        justify-content: center;
        gap: 0.6rem;
        padding-top: 0.85rem;
    }

    .carousel-delimiter {
        width: 0.85rem;
        height: 0.85rem;
        border: 0;
        border-radius: 999px;
        background: color-mix(in srgb, var(--vp-c-text-3) 35%, transparent);
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .carousel-delimiter.is-active {
        background: var(--vp-c-brand-1);
    }

    @media (max-width: 768px) {
        .carousel-slide-panel {
            min-height: 160px;
            padding: 1rem 3rem;
        }

        .carousel-arrow {
            width: 2.4rem;
            height: 2.4rem;
            font-size: 1.5rem;
        }

        .carousel-arrow--prev {
            left: 0.75rem;
        }

        .carousel-arrow--next {
            right: 0.75rem;
        }
    }
</style>
