<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
    import { withBase } from "vitepress";

    interface LottieAnimation {
        destroy: () => void;
        setSpeed?: (speed: number) => void;
    }

    interface LottieLibrary {
        loadAnimation: (options: Record<string, unknown>) => LottieAnimation;
    }

    const props = withDefaults(
        defineProps<{
            src?: string;
            alt?: string;
            loop?: boolean;
            autoplay?: boolean;
            speed?: number;
            renderer?: "svg" | "canvas";
            fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
            position?: string;
            background?: string;
        }>(),
        {
            loop: true,
            autoplay: true,
            speed: 1,
            renderer: "svg",
            fit: "contain",
            position: "center center",
        },
    );

    const hostRef = ref<HTMLElement | null>(null);
    let animationInstance: LottieAnimation | null = null;
    let activeToken = 0;

    const resolvedSrc = computed(() => {
        if (!props.src) return "";
        if (/^(https?:)?\/\//.test(props.src) || props.src.startsWith("data:")) {
            return props.src;
        }
        return withBase(props.src);
    });

    const wrapperStyle = computed(() => ({
        background: props.background || "transparent",
        backgroundPosition: props.position,
    }));

    const bodymovinScriptUrl =
        "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js";

    function getLottieFromWindow(): LottieLibrary | undefined {
        if (typeof window === "undefined") return undefined;
        return (window as Window & { lottie?: LottieLibrary }).lottie;
    }

    function ensureLottieLibrary(): Promise<LottieLibrary | undefined> {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return Promise.resolve(undefined);
        }

        const existing = getLottieFromWindow();
        if (existing) return Promise.resolve(existing);

        return new Promise((resolve) => {
            const scriptId = "hero-lottie-bodymovin";
            const currentScript = document.getElementById(
                scriptId,
            ) as HTMLScriptElement | null;

            if (currentScript) {
                currentScript.addEventListener("load", () => {
                    resolve(getLottieFromWindow());
                });
                currentScript.addEventListener("error", () => resolve(undefined));
                return;
            }

            const script = document.createElement("script");
            script.id = scriptId;
            script.src = bodymovinScriptUrl;
            script.async = true;
            script.onload = () => resolve(getLottieFromWindow());
            script.onerror = () => resolve(undefined);
            document.head.appendChild(script);
        });
    }

    function destroyAnimation() {
        if (animationInstance) {
            animationInstance.destroy();
            animationInstance = null;
        }
        if (hostRef.value) {
            hostRef.value.innerHTML = "";
        }
    }

    async function mountAnimation() {
        const src = resolvedSrc.value;
        const host = hostRef.value;
        if (!src || !host) return;

        const token = ++activeToken;
        const lottie = await ensureLottieLibrary();
        if (!lottie || token !== activeToken || !hostRef.value) return;

        destroyAnimation();

        animationInstance = lottie.loadAnimation({
            container: hostRef.value,
            renderer: props.renderer,
            loop: props.loop,
            autoplay: props.autoplay,
            path: src,
            rendererSettings: {
                preserveAspectRatio:
                    props.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet",
            },
        });

        if (animationInstance?.setSpeed && Number.isFinite(props.speed)) {
            animationInstance.setSpeed(props.speed);
        }
    }

    onMounted(() => {
        void mountAnimation();
    });

    watch(
        () => [
            resolvedSrc.value,
            props.loop,
            props.autoplay,
            props.speed,
            props.renderer,
            props.fit,
        ],
        () => {
            void mountAnimation();
        },
    );

    onBeforeUnmount(() => {
        destroyAnimation();
        activeToken += 1;
    });
</script>

<template>
    <div class="hero-lottie" :style="wrapperStyle" :aria-label="alt || 'lottie'">
        <div ref="hostRef" class="hero-lottie__host" />
    </div>
</template>

<style scoped>
    .hero-lottie {
        position: relative;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
    }

    .hero-lottie__host {
        width: 100%;
        height: 100%;
    }

    .hero-lottie__host :deep(svg),
    .hero-lottie__host :deep(canvas) {
        width: 100% !important;
        height: 100% !important;
        display: block;
    }
</style>
