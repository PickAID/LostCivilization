<script setup lang="ts">
    import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
    import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";

    interface WaveLayerConfig {
        color?: string;
        opacity?: number;
        speed?: number;
        direction?: number;
        amplitude?: number;
        frequency?: number;
    }

    interface WavesConfig {
        enabled?: boolean;
        height?: number;
        opacity?: number;
        animated?: boolean;
        reversed?: boolean;
        color?: string;
        layers?: WaveLayerConfig[];
        speed?: number;
        zIndex?: number;
        outline?: boolean;
    }

    const props = defineProps<{
        config?: WavesConfig;
    }>();

    const { isDarkRef, effectiveDark } = useHeroTheme();

    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const isClient = ref(false);
    let animationId: number | null = null;
    let time = 0;

    const enabled = computed(() => props.config?.enabled ?? true);
    const waveHeight = computed(() =>
        Math.max(24, Number(props.config?.height ?? 60)),
    );
    const reversed = computed(() => props.config?.reversed ?? false);
    const animated = computed(() => props.config?.animated ?? true);
    const showOutline = computed(() => props.config?.outline ?? true);
    const baseOpacity = computed(() => {
        const v = Number(props.config?.opacity ?? 1);
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
    });

    const globalSpeed = computed(() => {
        const v = Number(props.config?.speed ?? 1);
        return Number.isFinite(v) && v > 0 ? Math.max(0.1, Math.min(3, v)) : 1;
    });

    const layerConfigs = computed<WaveLayerConfig[]>(() => {
        const layers = props.config?.layers;
        if (Array.isArray(layers) && layers.length > 0) return layers.slice(0, 5);
        return Array.from({ length: 3 }, () => ({}));
    });

    const BASE_CONFIGS = [
        { opacity: 0.25, amplitude: 12, frequency: 0.01, speed: 0.6 },
        { opacity: 0.5, amplitude: 16, frequency: 0.007, speed: 0.8 },
        { opacity: 1.0, amplitude: 20, frequency: 0.005, speed: 1.0 },
    ];

    function resolveCssColor(colorVar: string): string {
        if (!colorVar.startsWith("var(")) return colorVar;

        const varName = colorVar.match(/var\((--[^)]+)\)/)?.[1];
        if (!varName || typeof window === "undefined") return colorVar;

        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue(varName)
            .trim();
        return cssValue || colorVar;
    }

    // Create a lighter version of a color for back layers
    function getLighterColor(baseColor: string, factor: number, dark: boolean): string {
        // Resolve CSS variable first
        const resolved = baseColor.startsWith("var(")
            ? resolveCssColor(baseColor)
            : baseColor;

        // Parse hex color
        const hex = resolved.match(
            /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
        );
        if (!hex) return resolved;

        let r = parseInt(hex[1], 16);
        let g = parseInt(hex[2], 16);
        let b = parseInt(hex[3], 16);

        if (dark) {
            // For dark theme, make back layers slightly darker
            r = Math.round(r * factor);
            g = Math.round(g * factor);
            b = Math.round(b * factor);
        } else {
            // For light theme, make back layers lighter
            r = Math.round(r + (255 - r) * (1 - factor));
            g = Math.round(g + (255 - g) * (1 - factor));
            b = Math.round(b + (255 - b) * (1 - factor));
        }

        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }

    function drawWave(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        layer: { color: string; opacity: number; amplitude: number; frequency: number; direction: number; speed: number; phaseOffset: number },
        t: number,
        layerIndex: number,
        totalLayers: number,
        dark: boolean,
    ) {
        const { color, opacity, amplitude, frequency, direction, speed, phaseOffset } = layer;

        // Resolve CSS variable to actual color
        const resolvedColor = resolveCssColor(color);

        ctx.beginPath();
        ctx.moveTo(0, height);

        // Draw the wave curve
        for (let x = 0; x <= width; x += 2) {
            const phase = t * speed * direction + phaseOffset;
            const y =
                height / 2 +
                Math.sin(x * frequency + phase) * amplitude +
                Math.sin(x * frequency * 0.5 + phase * 1.3) * amplitude * 0.3;
            ctx.lineTo(x, y);
        }

        // Close the path to fill
        ctx.lineTo(width, height);
        ctx.closePath();

        ctx.fillStyle = resolvedColor;
        ctx.globalAlpha = opacity;
        ctx.fill();

        // Draw outline for each layer
        if (showOutline.value) {
            ctx.beginPath();

            for (let x = 0; x <= width; x += 2) {
                const phase = t * speed * direction + phaseOffset;
                const y =
                    height / 2 +
                    Math.sin(x * frequency + phase) * amplitude +
                    Math.sin(x * frequency * 0.5 + phase * 1.3) * amplitude * 0.3;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            // Back layers have lighter outlines, front layer has strongest outline
            const positionFactor = (layerIndex + 1) / totalLayers;
            const baseOutlineOpacity = dark ? 0.03 : 0.02;
            const frontOutlineOpacity = dark ? 0.14 : 0.1;
            const outlineOpacity =
                baseOutlineOpacity +
                (frontOutlineOpacity - baseOutlineOpacity) * positionFactor;

            ctx.strokeStyle = dark
                ? `rgba(255, 255, 255, ${outlineOpacity.toFixed(3)})`
                : `rgba(0, 0, 0, ${outlineOpacity.toFixed(3)})`;
            ctx.lineWidth = 0.8 + positionFactor * 1.2;
            ctx.globalAlpha = 1;
            ctx.stroke();
        }
    }

    function render() {
        const canvas = canvasRef.value;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, rect.width, rect.height);

        const dark = isDarkRef.value;
        const defaultColor = props.config?.color || "var(--vp-c-bg)";
        const totalLayers = layerConfigs.value.length;

        // Draw layers from back to front
        const widthRatio = Math.max(0.4, rect.width / 1200);
        const frequencyBoost = Math.min(3.2, Math.max(1, 1 / widthRatio));
        const amplitudeScale = Math.max(0.72, Math.min(1, widthRatio * 1.1));

        layerConfigs.value.forEach((layer, index) => {
            const base = BASE_CONFIGS[index] || BASE_CONFIGS[2];
            const layerOpacity =
                typeof layer.opacity === "number"
                    ? layer.opacity
                    : base.opacity;
            const layerSpeed = Number(layer.speed ?? base.speed);
            const effectiveSpeed =
                globalSpeed.value *
                (Number.isFinite(layerSpeed) && layerSpeed > 0
                    ? layerSpeed
                    : 1);
            const direction = (layer.direction ?? 1) < 0 ? -1 : 1;
            const amplitude =
                typeof layer.amplitude === "number"
                    ? layer.amplitude
                    : base.amplitude;
            const frequency =
                typeof layer.frequency === "number"
                    ? layer.frequency
                    : base.frequency;
            const adjustedAmplitude = amplitude * amplitudeScale;
            const adjustedFrequency = frequency * frequencyBoost;

            // Front layer uses solid bg color, back layers use progressively lighter colors
            const isFrontLayer = index === totalLayers - 1;
            const layerColor = layer.color || defaultColor;

            // For back layers, create a lighter version of the bg color
            const lightnessFactor = isFrontLayer
                ? 1.0
                : 0.6 + (index / totalLayers) * 0.3;
            const finalColor = isFrontLayer
                ? layerColor
                : getLighterColor(layerColor, lightnessFactor, dark);

            drawWave(
                ctx,
                rect.width,
                rect.height,
                {
                    color: finalColor,
                    opacity: Math.max(0, Math.min(1, layerOpacity * baseOpacity.value)),
                    amplitude: adjustedAmplitude,
                    frequency: adjustedFrequency,
                    direction,
                    speed: effectiveSpeed,
                    phaseOffset: index * 0.8,
                },
                time,
                index,
                totalLayers,
                dark,
            );
        });
    }

    function animate() {
        if (!animated.value) {
            render();
            return;
        }

        time += 0.02;
        render();
        animationId = requestAnimationFrame(animate);
    }

    function handleResize() {
        render();
    }

    onMounted(() => {
        isClient.value = true;

        if (canvasRef.value) {
            window.addEventListener("resize", handleResize);

            // Check for reduced motion preference
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            if (prefersReducedMotion || !animated.value) {
                render();
            } else {
                animate();
            }
        }
    });

    onBeforeUnmount(() => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        window.removeEventListener("resize", handleResize);
    });

    // Re-render when theme changes - use effectiveDark from hero context
    watch(() => effectiveDark?.value, () => {
        if (isClient.value) {
            render();
        }
    });

    watch(
        [() => props.config, animated],
        () => {
            if (isClient.value) {
                if (animated.value && !animationId) {
                    animate();
                } else if (!animated.value && animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                    render();
                }
            }
        },
        { deep: true },
    );
</script>

<template>
    <div
        v-if="enabled"
        class="vp-wave"
        :class="{ 'vp-wave--reversed': reversed }"
        :style="{
            height: `${waveHeight}px`,
            zIndex: String(config?.zIndex ?? 1),
        }"
        aria-hidden="true"
    >
        <canvas ref="canvasRef" class="vp-wave__canvas" />
    </div>
</template>

<style scoped>
    .vp-wave {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .vp-wave--reversed {
        transform: rotate(180deg);
    }

    .vp-wave__canvas {
        display: block;
        width: 100%;
        height: 100%;
        transform: translateZ(0);
    }

    @media (max-width: 768px) {
        .vp-wave {
            min-height: max(44px, 22vw);
        }
    }
</style>
