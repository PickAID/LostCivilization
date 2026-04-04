<script setup lang="ts">
    import {
        computed,
        markRaw,
        onBeforeUnmount,
        onMounted,
        shallowRef,
        watch,
    } from "vue";
    import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";
    import { TresCanvas } from "@tresjs/core";
    import {
        AdditiveBlending,
        BufferGeometry,
        CanvasTexture,
        Color,
        Float32BufferAttribute,
        NormalBlending,
        Points,
        PointsMaterial,
        Texture,
        TextureLoader,
    } from "three";

    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";

    type ParticleType =
        | "stars"
        | "snow"
        | "rain"
        | "bubbles"
        | "sparks"
        | "custom";

    type ParticleAreaType = "box" | "sphere" | "plane";
    type ParticleShape = "circle" | "square" | "star" | "custom";
    type ParticleAppearanceType = ParticleShape | "dot";
    type ParticleColorMode = "solid" | "random" | "palette" | "area";
    type ParticleAreaColorAxis = "x" | "y" | "z" | "radius";
    type ParticleTextureColorMode = "mask" | "image";

    type NumericTuple3 = [number, number, number];
    type ColorValue = string | number | NumericTuple3;
    type ThemeColorValue = ColorValue | ThemeValue<ColorValue>;

    interface ThemeValue<T> {
        light?: T;
        dark?: T;
        value?: T;
    }

    interface ParticleConfig {
        enabled?: boolean;
        type?: ParticleType;
        count?: number;
        size?: number;
        speed?: number | { min?: number; max?: number };
        spread?: number;
        color?: ThemeColorValue;
        opacity?: number | ThemeValue<number>;
        appearance?: {
            size?: number;
            color?: ThemeColorValue;
            opacity?: number | ThemeValue<number>;
            type?: ParticleAppearanceType;
            shape?: ParticleAppearanceType;
            texture?: string | ThemeValue<string>;
            textureColorMode?: ParticleTextureColorMode;
            colorMode?: ParticleColorMode;
            randomColorChance?: number;
            palette?: ThemeColorValue[];
            areaColor?: {
                axis?: ParticleAreaColorAxis;
                colors?: ThemeColorValue[];
            };
        };
        movement?: {
            speed?: number | { min?: number; max?: number };
            direction?: NumericTuple3;
            gravity?: number;
            turbulence?: number;
            tiltVariance?: number;
        };
        lifecycle?: {
            respawn?: boolean;
        };
        area?: {
            type?: ParticleAreaType;
            size?: number | NumericTuple3;
            position?: NumericTuple3;
        };
    }

    interface NormalizedParticleConfig {
        enabled: boolean;
        type: ParticleType;
        count: number;
        baseColor: Color;
        opacity: number;
        size: number;
        speedMin: number;
        speedMax: number;
        direction: NumericTuple3;
        gravity: number;
        turbulence: number;
        respawn: boolean;
        areaType: ParticleAreaType;
        areaSize: NumericTuple3;
        areaPosition: NumericTuple3;
        shape: ParticleShape;
        textureSrc: string;
        colorMode: ParticleColorMode;
        randomColorChance: number;
        paletteColors: Color[];
        areaColorAxis: ParticleAreaColorAxis;
        areaColorPalette: Color[];
        usesVertexColors: boolean;
        textureColorMode: ParticleTextureColorMode;
        tiltVariance: number;
    }

    const props = defineProps<{
        config?: ParticleConfig;
    }>();

    const {
        isDarkRef,
        effectiveDark,
        resolveThemeValue: resolveThemeValueFromContext,
    } = useHeroTheme();

    const isClient = shallowRef(false);
    const isMobile = shallowRef(false);
    const prefersReducedMotion = shallowRef(false);

    const pointsObject = shallowRef<Points | null>(null);
    const velocities = shallowRef<Float32Array | null>(null);
    const phaseOffsets = shallowRef<Float32Array | null>(null);

    const loadedTexture = shallowRef<Texture | null>(null);
    const shapeTexture = shallowRef<Texture | null>(null);
    const textureLoader = shallowRef<TextureLoader | null>(null);
    const textureLoadToken = shallowRef(0);

    const targetFPS = computed(() => (isMobile.value ? 48 : 60));
    const fixedStep = computed(() => 1 / targetFPS.value);
    const maxSubSteps = computed(() => (isMobile.value ? 4 : 6));
    const frameAccumulator = shallowRef(0);
    const simulationTime = shallowRef(0);

    let mobileMediaQuery: MediaQueryList | null = null;
    let motionMediaQuery: MediaQueryList | null = null;
    let mobileMediaHandler: ((event: MediaQueryListEvent) => void) | null =
        null;
    let motionMediaHandler: ((event: MediaQueryListEvent) => void) | null =
        null;
    const spawnColorScratch = new Color();

    function clamp(value: number, min: number, max: number): number {
        if (!Number.isFinite(value)) return min;
        return Math.max(min, Math.min(max, value));
    }

    function toTuple3(value: unknown, fallback: NumericTuple3): NumericTuple3 {
        if (Array.isArray(value) && value.length >= 3) {
            const x = Number(value[0]);
            const y = Number(value[1]);
            const z = Number(value[2]);
            if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
                return [x, y, z];
            }
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return [value, value, value];
        }

        return fallback;
    }

    function resolveThemeValue<T>(value: T | ThemeValue<T> | undefined): T | undefined {
        return resolveThemeValueFromContext(value as ThemeValue<T> | undefined);
    }

    function normalizeColorValue(value: unknown): ColorValue | undefined {
        if (typeof value === "string" || typeof value === "number") return value;
        if (Array.isArray(value) && value.length >= 3) {
            const r = Number(value[0]);
            const g = Number(value[1]);
            const b = Number(value[2]);
            if ([r, g, b].every((channel) => Number.isFinite(channel))) {
                return [r, g, b];
            }
        }
        return undefined;
    }

    function normalizeColor(
        value: ColorValue | undefined,
        fallback: ColorValue,
    ): ColorValue {
        return normalizeColorValue(value) ?? fallback;
    }

    function normalizeColorList(values: unknown): ColorValue[] {
        if (!Array.isArray(values)) return [];
        return values
            .map((value) =>
                normalizeColorValue(
                    resolveThemeValue(value as ThemeColorValue | undefined),
                ),
            )
            .filter((value): value is ColorValue => Boolean(value));
    }

    function normalizeAppearanceType(
        value: unknown,
        fallback: ParticleShape,
    ): ParticleShape {
        if (value === "dot") return "circle";
        if (value === "square" || value === "star" || value === "custom") {
            return value;
        }
        if (value === "circle") return "circle";
        return fallback;
    }

    function normalizeColorMode(
        value: unknown,
        hasPalette: boolean,
        hasAreaPalette: boolean,
    ): ParticleColorMode {
        const requested =
            value === "random" ||
            value === "palette" ||
            value === "area" ||
            value === "solid"
                ? value
                : undefined;

        if (requested === "palette") {
            return hasPalette ? "palette" : "random";
        }

        if (requested === "area") {
            if (hasAreaPalette) return "area";
            if (hasPalette) return "palette";
            return "random";
        }

        if (requested === "random" || requested === "solid") {
            return requested;
        }

        if (hasAreaPalette) return "area";
        if (hasPalette) return "palette";
        return "solid";
    }

    function normalizeAreaColorAxis(value: unknown): ParticleAreaColorAxis {
        if (
            value === "x" ||
            value === "y" ||
            value === "z" ||
            value === "radius"
        ) {
            return value;
        }
        return "x";
    }

    function normalizeTextureColorMode(value: unknown): ParticleTextureColorMode {
        return value === "image" ? "image" : "mask";
    }

    function toThreeColor(
        value: string | number | NumericTuple3,
        fallback = "rgba(93, 126, 230, 1)",
    ): Color {
        if (Array.isArray(value) && value.length >= 3) {
            const r = Number(value[0]);
            const g = Number(value[1]);
            const b = Number(value[2]);
            if ([r, g, b].every((channel) => Number.isFinite(channel))) {
                const max = Math.max(Math.abs(r), Math.abs(g), Math.abs(b));
                if (max > 1) {
                    return new Color(r / 255, g / 255, b / 255);
                }
                return new Color(r, g, b);
            }
        }

        try {
            return new Color(value as string | number);
        } catch {
            return new Color(fallback);
        }
    }

    function normalizedSize(raw: number | undefined): number {
        if (!Number.isFinite(raw)) return 0.06;
        const value = Number(raw);
        if (value <= 0) return 0.06;

        // Keep compatibility for legacy integer-style sizing (for example 3, 4),
        // while preventing oversized sprites at high values.
        if (value >= 3) {
            return clamp(value * 0.073, 0.22, 0.28);
        }

        // Boost modern normalized inputs (for example 0.02, 0.1), which were
        // previously too small to be practical across showcases.
        return clamp(0.04 + value * 0.32, 0.04, 0.22);
    }

    function resolveSpeedRange(
        value: number | { min?: number; max?: number } | undefined,
        fallback: { min: number; max: number },
    ): { min: number; max: number } {
        if (typeof value === "number") {
            const n = clamp(value, 0.01, 4);
            return { min: n * 0.75, max: n * 1.25 };
        }

        if (value && typeof value === "object") {
            const min = clamp(Number(value.min ?? fallback.min), 0.01, 4);
            const max = clamp(Number(value.max ?? fallback.max), min, 5);
            return { min, max };
        }

        return fallback;
    }

    function getDeviceCountLimit() {
        const mobileLimit = 750;
        const desktopLimit = 2200;

        if (typeof navigator === "undefined") {
            return isMobile.value ? mobileLimit : desktopLimit;
        }

        const hardware = Number((navigator as any).hardwareConcurrency ?? 8);
        const memory = Number((navigator as any).deviceMemory ?? 8);

        const lowEnd = hardware > 0 && hardware <= 4;
        const lowMemory = memory > 0 && memory <= 4;

        if (isMobile.value || lowEnd || lowMemory) {
            return Math.min(mobileLimit, lowEnd || lowMemory ? 600 : mobileLimit);
        }

        return desktopLimit;
    }

    function resolveDefaultsByType(type: ParticleType) {
        if (type === "rain") {
            return {
                color: "rgba(123, 156, 255, 1)",
                opacity: 0.45,
                speed: { min: 1.25, max: 2.3 },
                direction: [0.12, -2.4, 0] as NumericTuple3,
                gravity: -0.05,
                turbulence: 0.03,
            };
        }

        if (type === "snow") {
            return {
                color: "rgba(242, 246, 255, 1)",
                opacity: 0.78,
                speed: { min: 0.08, max: 0.26 },
                direction: [0, -0.7, 0] as NumericTuple3,
                gravity: -0.006,
                turbulence: 0.45,
            };
        }

        if (type === "bubbles") {
            return {
                color: "rgba(168, 211, 255, 1)",
                opacity: 0.4,
                speed: { min: 0.22, max: 0.56 },
                direction: [0, 1.25, 0] as NumericTuple3,
                gravity: 0.014,
                turbulence: 0.25,
            };
        }

        if (type === "sparks") {
            return {
                color: "rgba(255, 198, 130, 1)",
                opacity: 0.72,
                speed: { min: 0.8, max: 1.6 },
                direction: [0.22, 1.5, 0.08] as NumericTuple3,
                gravity: -0.22,
                turbulence: 0.52,
            };
        }

        if (type === "custom") {
            return {
                color: "rgba(133, 165, 255, 1)",
                opacity: 0.58,
                speed: { min: 0.12, max: 0.56 },
                direction: [0, -0.2, 0] as NumericTuple3,
                gravity: 0,
                turbulence: 0.18,
            };
        }

        return {
            color: "rgba(53, 86, 186, 1)",
            opacity: 0.68,
            speed: { min: 0.02, max: 0.08 },
            direction: [0.03, 0, 0.03] as NumericTuple3,
            gravity: 0,
            turbulence: 0.08,
        };
    }

    function defaultShapeByType(type: ParticleType): ParticleShape {
        if (type === "rain") return "square";
        if (type === "sparks" || type === "stars") return "star";
        return "circle";
    }

    function defaultAreaByType(
        type: ParticleType,
        spread: number,
    ): { type: ParticleAreaType; size: NumericTuple3; position: NumericTuple3 } {
        if (type === "rain" || type === "snow") {
            return {
                type: "plane",
                size: [spread * 2.2, Math.max(1, spread * 0.45), spread * 2.2],
                position: [0, spread * 0.5, 0],
            };
        }

        if (type === "bubbles") {
            return {
                type: "box",
                size: [spread * 2, spread * 1.25, spread * 2],
                position: [0, -spread * 0.12, 0],
            };
        }

        if (type === "sparks") {
            return {
                type: "box",
                size: [spread * 1.4, spread * 1.4, spread * 1.4],
                position: [0, -spread * 0.2, 0],
            };
        }

        if (type === "stars") {
            return {
                type: "sphere",
                size: [spread * 2.2, spread * 2.2, spread * 2.2],
                position: [0, 0, 0],
            };
        }

        return {
            type: "box",
            size: [spread * 2, spread * 1.1, spread * 2],
            position: [0, 0, 0],
        };
    }

    function defaultSizeByType(type: ParticleType): number {
        if (type === "rain") return 0.01;
        if (type === "snow") return 0.024;
        if (type === "bubbles") return 0.02;
        if (type === "sparks") return 0.018;
        if (type === "stars") return 0.014;
        return 0.02;
    }

    function resolveAreaColorRatio(
        config: NormalizedParticleConfig,
        x: number,
        y: number,
        z: number,
    ) {
        const [sx, sy, sz] = config.areaSize;
        const [px, py, pz] = config.areaPosition;

        if (config.areaColorAxis === "x") {
            return clamp((x - (px - sx * 0.5)) / Math.max(0.0001, sx), 0, 1);
        }

        if (config.areaColorAxis === "y") {
            return clamp((y - (py - sy * 0.5)) / Math.max(0.0001, sy), 0, 1);
        }

        if (config.areaColorAxis === "z") {
            return clamp((z - (pz - sz * 0.5)) / Math.max(0.0001, sz), 0, 1);
        }

        const dx = x - px;
        const dy = y - py;
        const dz = z - pz;
        const radius = Math.hypot(dx, dy, dz);
        const maxRadius =
            config.areaType === "sphere"
                ? Math.max(sx, sy, sz) * 0.5
                : Math.hypot(sx, sy, sz) * 0.5;
        return clamp(radius / Math.max(0.0001, maxRadius), 0, 1);
    }

    function samplePalette(
        palette: Color[],
        ratio: number,
        target: Color,
    ): Color {
        if (palette.length === 0) return target;
        if (palette.length === 1) return target.copy(palette[0]);

        const clampedRatio = clamp(ratio, 0, 1);
        const scaled = clampedRatio * (palette.length - 1);
        const left = Math.floor(scaled);
        const right = Math.min(left + 1, palette.length - 1);
        const mix = scaled - left;

        return target.copy(palette[left]).lerp(palette[right], mix);
    }

    function randomizeColor(baseColor: Color, target: Color): Color {
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        const hueShift = (Math.random() - 0.5) * 0.28;
        const saturationShift = (Math.random() - 0.5) * 0.24;
        const lightnessShift = (Math.random() - 0.5) * 0.2;
        return target.setHSL(
            (hsl.h + hueShift + 1) % 1,
            clamp(hsl.s + saturationShift, 0.08, 1),
            clamp(hsl.l + lightnessShift, 0.08, 0.92),
        );
    }

    function resolveSpawnColor(
        config: NormalizedParticleConfig,
        x: number,
        y: number,
        z: number,
        target: Color,
    ): Color {
        target.copy(config.baseColor);

        if (config.colorMode === "solid") return target;

        if (config.colorMode === "area") {
            const ratio = resolveAreaColorRatio(config, x, y, z);
            const palette =
                config.areaColorPalette.length > 0
                    ? config.areaColorPalette
                    : config.paletteColors.length > 0
                      ? config.paletteColors
                      : [config.baseColor];
            return samplePalette(palette, ratio, target);
        }

        if (Math.random() > config.randomColorChance) {
            return target;
        }

        if (config.colorMode === "palette" && config.paletteColors.length > 0) {
            const index = Math.floor(Math.random() * config.paletteColors.length);
            return target.copy(config.paletteColors[index]);
        }

        return randomizeColor(config.baseColor, target);
    }

    const normalizedConfig = computed<NormalizedParticleConfig>(() => {
        const cfg = props.config ?? {};

        const type: ParticleType =
            cfg.type === "snow" ||
            cfg.type === "rain" ||
            cfg.type === "bubbles" ||
            cfg.type === "sparks" ||
            cfg.type === "custom"
                ? cfg.type
                : "stars";

        const typeDefaults = resolveDefaultsByType(type);

        const requestedCount = Number(cfg.count ?? 420);
        const count = Math.round(
            clamp(requestedCount, 40, getDeviceCountLimit()),
        );

        const appearance = cfg.appearance ?? {};
        const movement = cfg.movement ?? {};

        const spread = clamp(Number(cfg.spread ?? 3), 1, 12);
        const areaDefaults = defaultAreaByType(type, spread);
        const hasExplicitAreaType =
            cfg.area?.type === "box" ||
            cfg.area?.type === "sphere" ||
            cfg.area?.type === "plane";

        const areaType: ParticleAreaType = hasExplicitAreaType
            ? (cfg.area!.type as ParticleAreaType)
            : areaDefaults.type;

        const areaSize = toTuple3(cfg.area?.size, areaDefaults.size);
        const areaPosition = toTuple3(cfg.area?.position, areaDefaults.position);

        const speedRange = resolveSpeedRange(
            movement.speed ?? cfg.speed,
            typeDefaults.speed,
        );

        const direction = toTuple3(movement.direction, typeDefaults.direction);

        const colorValue = resolveThemeValue(
            appearance.color ?? cfg.color,
        ) as ColorValue | undefined;

        const opacityValue = resolveThemeValue(
            appearance.opacity ?? cfg.opacity,
        ) as number | undefined;

        const textureValue = resolveThemeValue(appearance.texture);
        const paletteValues = normalizeColorList(appearance.palette);
        const areaColorPaletteValues = normalizeColorList(
            appearance.areaColor?.colors,
        );
        const colorMode = normalizeColorMode(
            appearance.colorMode,
            paletteValues.length > 0,
            areaColorPaletteValues.length > 0,
        );
        const randomColorChance = clamp(
            Number(appearance.randomColorChance ?? 1),
            0,
            1,
        );
        const fallbackBaseColor = typeDefaults.color as ColorValue;
        const baseColorValue = normalizeColor(colorValue, fallbackBaseColor);
        const baseColor = toThreeColor(baseColorValue, typeDefaults.color);
        const normalizedParticleSize = normalizedSize(
            Number(appearance.size ?? cfg.size ?? defaultSizeByType(type)),
        );
        const paletteColors = paletteValues.map((value) =>
            toThreeColor(value, typeDefaults.color),
        );
        const areaColorPalette = areaColorPaletteValues.map((value) =>
            toThreeColor(value, typeDefaults.color),
        );
        const usesVertexColors =
            colorMode !== "solid" &&
            (colorMode === "area" || randomColorChance > 0);

        const shape = normalizeAppearanceType(
            appearance.type ?? appearance.shape,
            defaultShapeByType(type),
        );
        const inferredTiltVariance = clamp(
            (0.11 - normalizedParticleSize) / 0.11,
            0,
            1,
        ) * 0.14;

        return {
            enabled: cfg.enabled !== false,
            type,
            count,
            baseColor,
            opacity: clamp(
                Number(opacityValue ?? typeDefaults.opacity),
                0.04,
                1,
            ),
            size: normalizedParticleSize,
            speedMin: speedRange.min,
            speedMax: speedRange.max,
            direction,
            gravity: clamp(Number(movement.gravity ?? typeDefaults.gravity), -1, 1),
            turbulence: clamp(
                Number(movement.turbulence ?? typeDefaults.turbulence),
                0,
                2,
            ),
            respawn: cfg.lifecycle?.respawn !== false,
            areaType,
            areaSize,
            areaPosition,
            shape,
            textureSrc: typeof textureValue === "string" ? textureValue : "",
            colorMode,
            randomColorChance,
            paletteColors,
            areaColorAxis: normalizeAreaColorAxis(appearance.areaColor?.axis),
            areaColorPalette,
            usesVertexColors,
            textureColorMode: normalizeTextureColorMode(
                appearance.textureColorMode,
            ),
            tiltVariance: clamp(
                Number(movement.tiltVariance ?? inferredTiltVariance),
                0,
                0.4,
            ),
        };
    });

    function getPointInArea(config: NormalizedParticleConfig): NumericTuple3 {
        const [sx, sy, sz] = config.areaSize;
        const [px, py, pz] = config.areaPosition;

        if (config.areaType === "sphere") {
            const radius = clamp(Math.max(sx, sy, sz) * 0.5, 0.1, 25);
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = Math.cbrt(Math.random()) * radius;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            return [x + px, y + py, z + pz];
        }

        if (config.areaType === "plane") {
            return [
                px + (Math.random() - 0.5) * sx,
                py + (Math.random() - 0.5) * Math.max(0.06, sy * 0.3),
                pz + (Math.random() - 0.5) * sz,
            ];
        }

        return [
            px + (Math.random() - 0.5) * sx,
            py + (Math.random() - 0.5) * sy,
            pz + (Math.random() - 0.5) * sz,
        ];
    }

    function setParticleAtIndex(
        index: number,
        positions: Float32Array,
        velocityData: Float32Array,
        config: NormalizedParticleConfig,
        colorData?: Float32Array,
    ) {
        const i3 = index * 3;
        const [baseX, baseY, baseZ] = getPointInArea(config);
        const halfY = config.areaSize[1] * 0.5;
        const areaTop = config.areaPosition[1] + halfY;
        const areaBottom = config.areaPosition[1] - halfY;

        positions[i3] = baseX;
        positions[i3 + 2] = baseZ;

        if (config.type === "rain" || config.type === "snow") {
            positions[i3 + 1] =
                areaTop - Math.random() * Math.max(0.2, config.areaSize[1] * 0.35);
        } else if (config.type === "bubbles") {
            positions[i3 + 1] =
                areaBottom + Math.random() * Math.max(0.2, config.areaSize[1] * 0.25);
        } else if (config.type === "sparks") {
            positions[i3 + 1] =
                areaBottom + Math.random() * Math.max(0.1, config.areaSize[1] * 0.14);
        } else {
            positions[i3 + 1] = baseY;
        }

        if (colorData && config.usesVertexColors) {
            const color = resolveSpawnColor(
                config,
                positions[i3],
                positions[i3 + 1],
                positions[i3 + 2],
                spawnColorScratch,
            );
            colorData[i3] = color.r;
            colorData[i3 + 1] = color.g;
            colorData[i3 + 2] = color.b;
        }

        const baseSpeed =
            config.speedMin + Math.random() * (config.speedMax - config.speedMin);

        const [dx, dy, dz] = config.direction;
        const dirLength = Math.hypot(dx, dy, dz);

        if (dirLength <= 0.0001) {
            velocityData[i3] = (Math.random() - 0.5) * config.turbulence * 0.8;
            velocityData[i3 + 1] = (Math.random() - 0.5) * config.turbulence * 0.6;
            velocityData[i3 + 2] = (Math.random() - 0.5) * config.turbulence * 0.8;
            return;
        }

        const nx = dx / dirLength;
        const ny = dy / dirLength;
        const nz = dz / dirLength;

        velocityData[i3] =
            nx * baseSpeed + (Math.random() - 0.5) * config.turbulence * 0.35;
        velocityData[i3 + 1] =
            ny * baseSpeed + (Math.random() - 0.5) * config.turbulence * 0.35;
        velocityData[i3 + 2] =
            nz * baseSpeed + (Math.random() - 0.5) * config.turbulence * 0.35;

        if (config.type === "rain") {
            velocityData[i3] *= 0.38;
            velocityData[i3 + 1] = -Math.abs(velocityData[i3 + 1]);
            velocityData[i3 + 2] *= 0.2;
        } else if (config.type === "snow") {
            velocityData[i3] *= 0.55;
            velocityData[i3 + 1] = -Math.abs(velocityData[i3 + 1]) * 0.75;
            velocityData[i3 + 2] *= 0.55;
        } else if (config.type === "bubbles") {
            velocityData[i3] *= 0.45;
            velocityData[i3 + 1] = Math.abs(velocityData[i3 + 1]);
            velocityData[i3 + 2] *= 0.45;
        } else if (config.type === "sparks") {
            velocityData[i3] *= 0.9;
            velocityData[i3 + 1] = Math.abs(velocityData[i3 + 1]);
            velocityData[i3 + 2] *= 0.8;
        }

        if (config.tiltVariance > 0) {
            velocityData[i3] += (Math.random() * 2 - 1) * config.tiltVariance;
            velocityData[i3 + 2] +=
                (Math.random() * 2 - 1) * config.tiltVariance * 0.9;
        }
    }

    function isOutsideArea(
        x: number,
        y: number,
        z: number,
        config: NormalizedParticleConfig,
    ) {
        const [sx, sy, sz] = config.areaSize;
        const [px, py, pz] = config.areaPosition;

        if (config.areaType === "sphere") {
            const radius = Math.max(sx, sy, sz) * 0.5;
            const dx = x - px;
            const dy = y - py;
            const dz = z - pz;
            return dx * dx + dy * dy + dz * dz > radius * radius;
        }

        const halfX = sx * 0.5;
        const halfY = sy * 0.5;
        const halfZ = sz * 0.5;

        return (
            x < px - halfX ||
            x > px + halfX ||
            y < py - halfY ||
            y > py + halfY ||
            z < pz - halfZ ||
            z > pz + halfZ
        );
    }

    function disposeTextures() {
        if (loadedTexture.value) {
            loadedTexture.value.dispose();
            loadedTexture.value = null;
        }

        if (shapeTexture.value) {
            shapeTexture.value.dispose();
            shapeTexture.value = null;
        }
    }

    function disposeParticles() {
        const points = pointsObject.value;
        if (!points) return;

        points.geometry.dispose();

        if (Array.isArray(points.material)) {
            for (const material of points.material) material.dispose();
        } else {
            points.material.dispose();
        }

        pointsObject.value = null;
        velocities.value = null;
        phaseOffsets.value = null;
    }

    function createShapeTexture(shape: ParticleShape): Texture | null {
        if (!isClient.value || typeof document === "undefined") return null;
        if (shape === "square") return null;

        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";

        if (shape === "star") {
            const cx = 64;
            const cy = 64;
            const spikes = 5;
            const outerRadius = 50;
            const innerRadius = 22;
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i += 1) {
                ctx.lineTo(
                    cx + Math.cos(rot) * outerRadius,
                    cy + Math.sin(rot) * outerRadius,
                );
                rot += step;

                ctx.lineTo(
                    cx + Math.cos(rot) * innerRadius,
                    cy + Math.sin(rot) * innerRadius,
                );
                rot += step;
            }
            ctx.closePath();
            ctx.fill();
        } else {
            const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
            gradient.addColorStop(0, "rgba(255,255,255,1)");
            gradient.addColorStop(0.45, "rgba(255,255,255,0.95)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    async function loadTextureFromSource(src: string): Promise<Texture | null> {
        const trimmed = src.trim();
        if (!trimmed) return null;

        if (!textureLoader.value) {
            textureLoader.value = new TextureLoader();
        }

        const token = textureLoadToken.value + 1;
        textureLoadToken.value = token;

        return await new Promise((resolve) => {
            textureLoader.value!.load(
                resolveAssetWithBase(trimmed),
                (texture) => {
                    if (token !== textureLoadToken.value) {
                        texture.dispose();
                        resolve(null);
                        return;
                    }
                    texture.needsUpdate = true;
                    resolve(texture);
                },
                undefined,
                () => resolve(null),
            );
        });
    }

    function getBlending(config: NormalizedParticleConfig) {
        if (
            (config.type === "stars" || config.type === "sparks") &&
            isDarkRef.value
        ) {
            return AdditiveBlending;
        }
        return NormalBlending;
    }

    function createMaterial(config: NormalizedParticleConfig) {
        return new PointsMaterial({
            color: config.usesVertexColors ? "#ffffff" : config.baseColor,
            size: config.size,
            transparent: true,
            opacity: config.opacity,
            depthWrite: false,
            sizeAttenuation: true,
            blending: getBlending(config),
            vertexColors: config.usesVertexColors,
        });
    }

    async function applyMaterialAppearance(options?: { reloadTexture?: boolean }) {
        const points = pointsObject.value;
        if (!points || Array.isArray(points.material)) return;
        if (!(points.material instanceof PointsMaterial)) return;

        const material = points.material;
        const config = normalizedConfig.value;

        if (config.usesVertexColors) {
            material.color.set("#ffffff");
        } else {
            material.color.copy(config.baseColor);
        }
        material.opacity = config.opacity;
        material.size = config.size;
        material.blending = getBlending(config);
        material.vertexColors = config.usesVertexColors;
        material.needsUpdate = true;

        if (options?.reloadTexture) {
            const loaded = await loadTextureFromSource(config.textureSrc);
            if (loadedTexture.value && loadedTexture.value !== loaded) {
                loadedTexture.value.dispose();
            }
            loadedTexture.value = loaded;

            if (shapeTexture.value) {
                shapeTexture.value.dispose();
                shapeTexture.value = null;
            }

            if (!loadedTexture.value && config.shape !== "custom") {
                shapeTexture.value = createShapeTexture(config.shape);
            }

            if (loadedTexture.value) {
                // `mask` mode keeps color fully driven by rgba settings by using
                // texture alpha only; `image` mode preserves original texture colors.
                material.map =
                    config.textureColorMode === "image"
                        ? loadedTexture.value
                        : null;
                material.alphaMap = loadedTexture.value;
            } else {
                const generatedMap = shapeTexture.value ?? null;
                material.map = generatedMap;
                material.alphaMap = generatedMap;
            }
            material.alphaTest = loadedTexture.value ? 0.02 : 0;
            material.needsUpdate = true;
        }
    }

    function initializeParticles() {
        const config = normalizedConfig.value;

        if (!config.enabled) {
            disposeParticles();
            return;
        }

        const positions = new Float32Array(config.count * 3);
        const velocityData = new Float32Array(config.count * 3);
        const phaseData = new Float32Array(config.count);
        const colorData = config.usesVertexColors
            ? new Float32Array(config.count * 3)
            : undefined;

        for (let i = 0; i < config.count; i += 1) {
            setParticleAtIndex(i, positions, velocityData, config, colorData);
            phaseData[i] = Math.random() * Math.PI * 2;
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            "position",
            new Float32BufferAttribute(positions, 3),
        );
        if (colorData) {
            geometry.setAttribute("color", new Float32BufferAttribute(colorData, 3));
        }
        geometry.computeBoundingSphere();

        const points = new Points(geometry, createMaterial(config));
        points.frustumCulled = false;

        disposeParticles();
        pointsObject.value = markRaw(points);
        velocities.value = velocityData;
        phaseOffsets.value = phaseData;
        simulationTime.value = 0;
        frameAccumulator.value = 0;

        void applyMaterialAppearance({ reloadTexture: true });
    }

    function simulateStep(stepDelta: number) {
        const points = pointsObject.value;
        const velocityData = velocities.value;
        const phases = phaseOffsets.value;
        if (!points || !velocityData || !phases) return;

        const config = normalizedConfig.value;
        const geometry = points.geometry as BufferGeometry;
        const positions = geometry.getAttribute(
            "position",
        ) as Float32BufferAttribute;
        const colorAttribute = geometry.getAttribute(
            "color",
        ) as Float32BufferAttribute | undefined;
        const colorData = colorAttribute
            ? (colorAttribute.array as Float32Array)
            : undefined;
        let colorsDirty = false;
        const stepSeconds = clamp(stepDelta, 0.001, 0.05);
        simulationTime.value += stepSeconds;
        const simElapsed = simulationTime.value;
        const [areaX, areaY, areaZ] = config.areaSize;
        const [centerX, centerY, centerZ] = config.areaPosition;
        const top = centerY + areaY * 0.5;
        const bottom = centerY - areaY * 0.5;

        for (let i = 0; i < positions.count; i += 1) {
            const i3 = i * 3;
            const phase = phases[i];

            velocityData[i3 + 1] += config.gravity * stepSeconds;

            if (config.turbulence > 0) {
                const turbulence = config.turbulence * 0.0024;
                velocityData[i3] +=
                    Math.sin(simElapsed * 1.2 + phase) * turbulence;
                velocityData[i3 + 2] +=
                    Math.cos(simElapsed * 1.1 + phase * 1.37) * turbulence;
            }

            if (config.type === "snow") {
                velocityData[i3] +=
                    Math.sin(simElapsed * 0.7 + phase) * 0.0016;
                velocityData[i3 + 2] +=
                    Math.cos(simElapsed * 0.6 + phase) * 0.0013;
            } else if (config.type === "rain") {
                const targetX = Math.sin(simElapsed * 1.6 + phase) * 0.09;
                const targetZ = Math.cos(simElapsed * 1.4 + phase) * 0.03;
                velocityData[i3] += (targetX - velocityData[i3]) * 0.22;
                velocityData[i3 + 2] += (targetZ - velocityData[i3 + 2]) * 0.22;
                velocityData[i3 + 1] = Math.min(
                    velocityData[i3 + 1],
                    -config.speedMin * 0.75,
                );
            } else if (config.type === "bubbles") {
                velocityData[i3] +=
                    Math.sin(simElapsed * 0.85 + phase) * 0.0015;
                velocityData[i3 + 2] +=
                    Math.cos(simElapsed * 0.9 + phase) * 0.0015;
                velocityData[i3 + 1] = Math.max(
                    velocityData[i3 + 1],
                    config.speedMin * 0.45,
                );
            } else if (config.type === "sparks") {
                velocityData[i3] +=
                    Math.sin(simElapsed * 2.1 + phase) * 0.0027;
                velocityData[i3 + 2] +=
                    Math.cos(simElapsed * 2.4 + phase) * 0.0022;
            } else if (config.type === "stars") {
                velocityData[i3] +=
                    Math.sin(simElapsed * 0.42 + phase) * 0.0008;
                velocityData[i3 + 1] +=
                    Math.cos(simElapsed * 0.36 + phase) * 0.00042;
                velocityData[i3 + 2] +=
                    Math.cos(simElapsed * 0.42 + phase) * 0.0008;
            }

            const damping =
                config.type === "rain"
                    ? 0.996
                    : config.type === "sparks"
                      ? 0.991
                      : 0.993;
            velocityData[i3] *= damping;
            velocityData[i3 + 1] *= damping;
            velocityData[i3 + 2] *= damping;

            positions.array[i3] += velocityData[i3] * stepSeconds;
            positions.array[i3 + 1] += velocityData[i3 + 1] * stepSeconds;
            positions.array[i3 + 2] += velocityData[i3 + 2] * stepSeconds;

            const outByType =
                (config.type === "rain" || config.type === "snow") &&
                positions.array[i3 + 1] < bottom
                    ? true
                    : config.type === "bubbles" && positions.array[i3 + 1] > top
                      ? true
                      : config.type === "sparks" &&
                          (positions.array[i3 + 1] > top ||
                              positions.array[i3 + 1] < bottom)
                        ? true
                        : false;

            const outByBounds = isOutsideArea(
                positions.array[i3],
                positions.array[i3 + 1],
                positions.array[i3 + 2],
                config,
            );

            if (outByType || outByBounds) {
                if (config.respawn) {
                    setParticleAtIndex(
                        i,
                        positions.array as Float32Array,
                        velocityData,
                        config,
                        colorData,
                    );
                    if (colorData) colorsDirty = true;
                } else {
                    velocityData[i3] *= -1;
                    velocityData[i3 + 1] *= -1;
                    velocityData[i3 + 2] *= -1;
                }
            }

            if (config.type === "stars") {
                const dx = positions.array[i3] - centerX;
                const dz = positions.array[i3 + 2] - centerZ;
                const maxRadius = Math.max(areaX, areaZ) * 0.5;
                const radius = Math.hypot(dx, dz);
                if (radius > maxRadius && radius > 0.0001) {
                    positions.array[i3] =
                        centerX + (dx / radius) * maxRadius * 0.96;
                    positions.array[i3 + 2] =
                        centerZ + (dz / radius) * maxRadius * 0.96;
                }
            }
        }

        positions.needsUpdate = true;
        if (colorAttribute && colorsDirty) {
            colorAttribute.needsUpdate = true;
        }
    }

    function onLoop({ delta }: { delta: number; elapsed: number }) {
        const points = pointsObject.value;
        const velocityData = velocities.value;
        const phases = phaseOffsets.value;
        if (!points || !velocityData || !phases) return;
        if (prefersReducedMotion.value) return;

        if (
            typeof document !== "undefined" &&
            document.visibilityState === "hidden"
        ) {
            return;
        }

        frameAccumulator.value = Math.min(frameAccumulator.value + delta, 0.2);

        let steps = 0;
        while (
            frameAccumulator.value >= fixedStep.value &&
            steps < maxSubSteps.value
        ) {
            simulateStep(fixedStep.value);
            frameAccumulator.value -= fixedStep.value;
            steps += 1;
        }

        if (steps === 0) {
            simulateStep(frameAccumulator.value);
            frameAccumulator.value = 0;
        }
    }

    watch(
        () => normalizedConfig.value,
        () => {
            if (!isClient.value) return;
            initializeParticles();
        },
        { deep: true },
    );

    watch(
        () => effectiveDark?.value,
        () => {
            if (!isClient.value) return;
            initializeParticles();
        },
    );

    onMounted(() => {
        isClient.value = true;

        mobileMediaQuery = window.matchMedia("(max-width: 960px)");
        motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        isMobile.value = mobileMediaQuery.matches;
        prefersReducedMotion.value = motionMediaQuery.matches;

        mobileMediaHandler = (event: MediaQueryListEvent) => {
            isMobile.value = event.matches;
        };

        motionMediaHandler = (event: MediaQueryListEvent) => {
            prefersReducedMotion.value = event.matches;
        };

        mobileMediaQuery.addEventListener("change", mobileMediaHandler);
        motionMediaQuery.addEventListener("change", motionMediaHandler);

        initializeParticles();
    });

    onBeforeUnmount(() => {
        if (mobileMediaQuery && mobileMediaHandler) {
            mobileMediaQuery.removeEventListener("change", mobileMediaHandler);
        }

        if (motionMediaQuery && motionMediaHandler) {
            motionMediaQuery.removeEventListener("change", motionMediaHandler);
        }

        textureLoadToken.value += 1;

        disposeParticles();
        disposeTextures();
    });
</script>

<template>
    <div v-if="normalizedConfig.enabled" class="particle-system">
        <ClientOnly>
            <TresCanvas
                v-if="isClient"
                class="particle-canvas"
                clear-color="#00000000"
                :shadows="false"
                @loop="onLoop"
            >
                <TresPerspectiveCamera
                    :position="[0, 0, 5.4]"
                    :fov="52"
                    :near="0.1"
                    :far="60"
                    :make-default="true"
                />
                <primitive v-if="pointsObject" :object="pointsObject" />
            </TresCanvas>
        </ClientOnly>
    </div>
</template>

<style scoped>
    .particle-system {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .particle-canvas {
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
