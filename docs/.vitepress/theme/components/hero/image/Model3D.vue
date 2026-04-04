<script setup lang="ts">
    import {
        computed,
        markRaw,
        onBeforeUnmount,
        onMounted,
        ref,
        shallowRef,
        watch,
    } from "vue";
    import { TresCanvas } from "@tresjs/core";
    import { Box3, type Object3D, Sphere, Vector3 } from "three";
    import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
    import { withBase, useData } from "vitepress";
    import { useSafeI18n } from "@utils/i18n/locale";

    type Vec3Tuple = [number, number, number];

    interface ThemeValue<T> {
        light?: T;
        dark?: T;
        value?: T;
    }

    interface ModelAnimation {
        enabled?: boolean;
        type?: "rotate" | "bounce" | "float";
        speed?: number;
        axis?: number[];
        amplitude?: number;
        frequency?: number;
    }

    interface Model3DConfig {
        src?: string;
        scale?: number[];
        position?: number[];
        rotation?: number[];
        fitPadding?: number;
        animation?: ModelAnimation;
        camera?: {
            fov?: number;
            near?: number;
            far?: number;
            position?: number[];
        };
        interaction?: {
            enabled?: boolean;
            rotate?: boolean;
            autoRotate?: boolean;
            autoRotateSpeed?: number;
        };
        lighting?: {
            ambient?: {
                intensity?: number | ThemeValue<number>;
                color?: string | ThemeValue<string>;
            };
            directional?: {
                intensity?: number | ThemeValue<number>;
                color?: string | ThemeValue<string>;
                position?: number[];
            };
            point?: {
                enabled?: boolean;
                intensity?: number | ThemeValue<number>;
                color?: string | ThemeValue<string>;
                position?: number[];
            };
        };
    }

    const props = defineProps<{
        config?: Model3DConfig;
    }>();

    const { isDark } = useData();
    const { t } = useSafeI18n("hero-model3d", {
        loading: "Loading 3D model...",
        loadFailed: "Failed to load 3D model",
        loadHint: "Please check the model URL and format (.glb/.gltf).",
    });

    const isClient = ref(false);
    const loading = ref(false);
    const modelObject = shallowRef<Object3D | null>(null);
    const modelError = ref("");
    const elapsedAtStart = ref<number | null>(null);
    const isDragging = ref(false);
    const pointerPosition = ref({ x: 0, y: 0 });
    const manualRotation = ref({ x: 0, y: 0 });
    const containerRef = ref<HTMLElement | null>(null);
    const viewportAspect = ref(1);
    const autoScale = ref(1);
    const autoCameraPosition = ref<Vec3Tuple>([0, 0, 4.2]);
    const autoCameraFar = ref(100);
    const modelRadius = ref(1);
    let resizeObserver: ResizeObserver | null = null;

    const modelPath = computed(() => props.config?.src || "");
    const resolvedModelCandidates = computed(() => {
        const src = modelPath.value;
        if (!src) return [] as string[];
        if (/^(https?:)?\/\//.test(src) || src.startsWith("data:"))
            return [src];

        const absolute = src.startsWith("/") ? src : `/${src}`;
        const withSiteBase = withBase(absolute);
        return Array.from(new Set([withSiteBase, absolute]));
    });

    const hasCustomCameraPosition = computed(() => {
        const value = props.config?.camera?.position;
        return Array.isArray(value) && value.length === 3;
    });

    function toFiniteNumber(value: unknown, fallback: number): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function toVec3Tuple(value: unknown, fallback: Vec3Tuple): Vec3Tuple {
        if (!Array.isArray(value)) return [...fallback] as Vec3Tuple;

        return [
            toFiniteNumber(value[0], fallback[0]),
            toFiniteNumber(value[1], fallback[1]),
            toFiniteNumber(value[2], fallback[2]),
        ];
    }

    const cameraPosition = computed<Vec3Tuple>(() => {
        if (hasCustomCameraPosition.value) {
            return toVec3Tuple(
                props.config?.camera?.position,
                autoCameraPosition.value,
            );
        }
        return autoCameraPosition.value;
    });
    const cameraFov = computed(() => Number(props.config?.camera?.fov ?? 42));
    const cameraNear = computed(() =>
        Number(props.config?.camera?.near ?? 0.05),
    );
    const cameraFar = computed(() => {
        const configuredFar = Number(props.config?.camera?.far ?? NaN);
        if (Number.isFinite(configuredFar) && configuredFar > 0)
            return configuredFar;
        return Math.max(80, autoCameraFar.value);
    });

    const userScale = computed<Vec3Tuple>(() => {
        return toVec3Tuple(props.config?.scale, [1, 1, 1]);
    });

    const finalScale = computed<Vec3Tuple>(() => {
        return [
            userScale.value[0] * autoScale.value,
            userScale.value[1] * autoScale.value,
            userScale.value[2] * autoScale.value,
        ];
    });

    const modelPosition = computed<Vec3Tuple>(() => {
        return toVec3Tuple(props.config?.position, [0, 0, 0]);
    });

    const modelRotation = computed<Vec3Tuple>(() => {
        return toVec3Tuple(props.config?.rotation, [0, 0, 0]);
    });

    const interaction = computed(() => {
        const options = props.config?.interaction;
        return {
            enabled: options?.enabled ?? true,
            rotate: options?.rotate ?? true,
            autoRotate: options?.autoRotate ?? false,
            autoRotateSpeed: options?.autoRotateSpeed ?? 1,
        };
    });

    function resolveThemeValue<T>(
        value: T | ThemeValue<T> | undefined,
    ): T | undefined {
        if (value === undefined || value === null) return undefined;
        if (typeof value !== "object") return value as T;

        const objectValue = value as ThemeValue<T>;
        const dark = isDark.value;
        if (dark)
            return objectValue.dark ?? objectValue.light ?? objectValue.value;
        return objectValue.light ?? objectValue.dark ?? objectValue.value;
    }

    const ambientLight = computed(() => {
        const config = props.config?.lighting?.ambient;
        return {
            intensity: Number(resolveThemeValue(config?.intensity) ?? 1.25),
            color: String(resolveThemeValue(config?.color) || "#ffffff"),
        };
    });

    const directionalLight = computed(() => {
        const config = props.config?.lighting?.directional;
        return {
            intensity: Number(resolveThemeValue(config?.intensity) ?? 1.9),
            color: String(resolveThemeValue(config?.color) || "#f4f7ff"),
            position: toVec3Tuple(config?.position, [3.2, 2.2, 2.8]),
        };
    });

    const pointLight = computed(() => {
        const config = props.config?.lighting?.point;
        return {
            enabled: config?.enabled ?? false,
            intensity: Number(resolveThemeValue(config?.intensity) ?? 0.6),
            color: String(resolveThemeValue(config?.color) || "#6d86ff"),
            position: toVec3Tuple(config?.position, [-2.4, 1.4, 1.5]),
        };
    });

    const modelAnimation = computed<ModelAnimation>(() => {
        return {
            enabled: props.config?.animation?.enabled ?? true,
            type: props.config?.animation?.type || "float",
            speed: Number(props.config?.animation?.speed ?? 1),
            axis: props.config?.animation?.axis || [0, 1, 0],
            amplitude: Number(props.config?.animation?.amplitude ?? 0.14),
            frequency: Number(props.config?.animation?.frequency ?? 1.2),
        };
    });

    function syncViewport() {
        if (!containerRef.value) return;
        const rect = containerRef.value.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        viewportAspect.value = Math.max(0.45, rect.width / rect.height);
        updateAutoCameraDistance();
    }

    function getFitPadding() {
        const fitPadding = Number(props.config?.fitPadding ?? 1.28);
        if (!Number.isFinite(fitPadding) || fitPadding <= 0) return 1.28;
        return Math.max(1.05, Math.min(1.8, fitPadding));
    }

    function updateAutoCameraDistance() {
        if (hasCustomCameraPosition.value) return;
        const fitPadding = getFitPadding();
        const scaledRadius = modelRadius.value * autoScale.value;
        const animationAllowance = modelAnimation.value.enabled
            ? modelAnimation.value.amplitude! * autoScale.value * 1.8
            : 0;
        const positionAllowance =
            Math.max(
                Math.abs(modelPosition.value[0]),
                Math.abs(modelPosition.value[1]),
                Math.abs(modelPosition.value[2]),
            ) * 0.55;
        const framedRadius =
            scaledRadius + animationAllowance + positionAllowance;
        const fovRad = (cameraFov.value * Math.PI) / 180;
        const hFov = 2 * Math.atan(Math.tan(fovRad / 2) * viewportAspect.value);
        const distV = framedRadius / Math.sin(Math.max(0.001, fovRad / 2));
        const distH = framedRadius / Math.sin(Math.max(0.001, hFov / 2));
        const distance = Math.max(distV, distH) * fitPadding;

        autoCameraPosition.value = [
            0,
            0,
            Number.isFinite(distance) ? distance : 4.2,
        ];
        autoCameraFar.value = Math.max(
            80,
            (Number.isFinite(distance) ? distance : 4.2) * 8,
        );
    }

    function applyBaseTransform() {
        if (!modelObject.value) return;

        modelObject.value.scale.set(
            finalScale.value[0],
            finalScale.value[1],
            finalScale.value[2],
        );
        modelObject.value.position.set(
            modelPosition.value[0],
            modelPosition.value[1],
            modelPosition.value[2],
        );
        modelObject.value.rotation.set(
            modelRotation.value[0],
            modelRotation.value[1],
            modelRotation.value[2],
        );
    }

    async function loadModel() {
        if (resolvedModelCandidates.value.length === 0) {
            modelObject.value = null;
            modelError.value = "";
            loading.value = false;
            return;
        }

        loading.value = true;
        modelError.value = "";
        elapsedAtStart.value = null;
        manualRotation.value = { x: 0, y: 0 };

        try {
            const loader = new GLTFLoader();
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath(
                "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
            );
            loader.setDRACOLoader(dracoLoader);

            let loadedScene: Object3D | null = null;
            let lastError: unknown = null;

            for (const candidatePath of resolvedModelCandidates.value) {
                try {
                    const gltf = await loader.loadAsync(candidatePath);
                    loadedScene = (gltf.scene ?? null) as unknown as Object3D | null;
                    if (loadedScene) break;
                } catch (error) {
                    lastError = error;
                }
            }

            if (!loadedScene) {
                throw lastError instanceof Error
                    ? lastError
                    : new Error("Unable to load model from configured source.");
            }

            const scene = loadedScene;

            if (scene) {
                const boundingBox = new Box3().setFromObject(scene);
                if (!boundingBox.isEmpty()) {
                    const center = boundingBox.getCenter(new Vector3());
                    scene.position.sub(center);
                    const size = boundingBox.getSize(new Vector3());
                    const maxDimension = Math.max(
                        size.x,
                        size.y,
                        size.z,
                        0.001,
                    );
                    const sphere = boundingBox.getBoundingSphere(new Sphere());
                    modelRadius.value = Math.max(0.0001, sphere.radius);

                    const hasScaleOverride =
                        Array.isArray(props.config?.scale) &&
                        props.config.scale.length >= 3;
                    if (hasScaleOverride) {
                        autoScale.value = 1;
                    } else {
                        const targetDiameter =
                            viewportAspect.value < 0.92 ? 1.55 : 1.75;
                        autoScale.value = Math.max(
                            0.08,
                            Math.min(5, targetDiameter / maxDimension),
                        );
                    }

                    updateAutoCameraDistance();
                }
            }

            modelObject.value = scene ? markRaw(scene) : null;
            applyBaseTransform();
            loading.value = false;
        } catch (error) {
            modelObject.value = null;
            modelError.value =
                error instanceof Error ? error.message : String(error);
            loading.value = false;
        }
    }

    watch(
        resolvedModelCandidates,
        () => {
            if (!isClient.value) return;
            loadModel();
        },
        { immediate: false },
    );

    watch(
        () => [modelPosition.value, modelRotation.value, finalScale.value],
        () => {
            applyBaseTransform();
            updateAutoCameraDistance();
        },
        { deep: true },
    );

    watch(
        () => [
            cameraFov.value,
            hasCustomCameraPosition.value,
            props.config?.fitPadding,
        ],
        () => {
            updateAutoCameraDistance();
        },
        { deep: true },
    );

    function onLoop({ elapsed }: { elapsed: number }) {
        if (!modelObject.value || !modelAnimation.value.enabled) return;
        if (document.visibilityState === "hidden") return;

        if (elapsedAtStart.value === null) {
            elapsedAtStart.value = elapsed;
        }

        const tValue =
            (elapsed - elapsedAtStart.value) * modelAnimation.value.speed!;
        const animationType = modelAnimation.value.type;

        if (
            interaction.value.enabled &&
            interaction.value.autoRotate &&
            !isDragging.value
        ) {
            manualRotation.value.y += 0.005 * interaction.value.autoRotateSpeed;
        }

        const baseX = modelRotation.value[0] + manualRotation.value.x;
        const baseY = modelRotation.value[1] + manualRotation.value.y;
        const baseZ = modelRotation.value[2];

        if (animationType === "rotate") {
            modelObject.value.rotation.x =
                baseX + tValue * 0.18 * (modelAnimation.value.axis?.[0] || 0);
            modelObject.value.rotation.y =
                baseY + tValue * 0.22 * (modelAnimation.value.axis?.[1] || 1);
            modelObject.value.rotation.z =
                baseZ + tValue * 0.18 * (modelAnimation.value.axis?.[2] || 0);
        }

        if (animationType === "bounce") {
            modelObject.value.position.y =
                modelPosition.value[1] +
                Math.abs(Math.sin(tValue * modelAnimation.value.frequency!)) *
                    modelAnimation.value.amplitude!;
            modelObject.value.rotation.x = baseX;
            modelObject.value.rotation.y = baseY;
            modelObject.value.rotation.z = baseZ;
        }

        if (animationType === "float") {
            modelObject.value.position.y =
                modelPosition.value[1] +
                Math.sin(tValue * modelAnimation.value.frequency!) *
                    modelAnimation.value.amplitude!;
            modelObject.value.rotation.x = baseX;
            modelObject.value.rotation.y =
                baseY + Math.sin(tValue * 0.65) * 0.15;
            modelObject.value.rotation.z = baseZ;
        }
    }

    function handlePointerDown(event: PointerEvent) {
        if (!interaction.value.enabled || !interaction.value.rotate) return;
        isDragging.value = true;
        pointerPosition.value = { x: event.clientX, y: event.clientY };
    }

    function handlePointerMove(event: PointerEvent) {
        if (
            !isDragging.value ||
            !interaction.value.enabled ||
            !interaction.value.rotate
        )
            return;

        const dx = event.clientX - pointerPosition.value.x;
        const dy = event.clientY - pointerPosition.value.y;
        pointerPosition.value = { x: event.clientX, y: event.clientY };

        manualRotation.value.y += dx * 0.005;
        manualRotation.value.x = Math.max(
            -0.9,
            Math.min(0.9, manualRotation.value.x + dy * 0.0035),
        );
    }

    function handlePointerUp() {
        isDragging.value = false;
    }

    onMounted(async () => {
        isClient.value = true;
        syncViewport();

        if (typeof ResizeObserver !== "undefined" && containerRef.value) {
            resizeObserver = new ResizeObserver(() => {
                syncViewport();
            });
            resizeObserver.observe(containerRef.value);
        }

        await loadModel();
    });

    onBeforeUnmount(() => {
        resizeObserver?.disconnect();
        resizeObserver = null;
    });
</script>

<template>
    <div
        ref="containerRef"
        class="model-3d-container"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerUp"
    >
        <div v-if="loading" class="model-status">
            <div class="loading-spinner" />
            <p>{{ t.loading }}</p>
        </div>

        <div v-else-if="modelError" class="model-status model-status--error">
            <p>{{ t.loadFailed }}</p>
            <p class="model-hint">{{ t.loadHint }}</p>
            <p class="model-hint">{{ modelError }}</p>
        </div>

        <ClientOnly v-else>
            <TresCanvas
                v-if="isClient && modelObject"
                class="model-canvas"
                clear-color="#00000000"
                :shadows="true"
                @loop="onLoop"
            >
                <TresPerspectiveCamera
                    :position="cameraPosition"
                    :fov="cameraFov"
                    :near="cameraNear"
                    :far="cameraFar"
                    :make-default="true"
                />

                <TresAmbientLight
                    :intensity="ambientLight.intensity"
                    :color="ambientLight.color"
                />
                <TresHemisphereLight
                    :intensity="0.75"
                    :color="'#ffffff'"
                    :ground-color="'#c7d7ef'"
                />
                <TresDirectionalLight
                    :position="directionalLight.position"
                    :intensity="directionalLight.intensity"
                    :color="directionalLight.color"
                    cast-shadow
                />
                <TresPointLight
                    v-if="pointLight.enabled"
                    :position="pointLight.position"
                    :intensity="pointLight.intensity"
                    :color="pointLight.color"
                />

                <primitive :object="modelObject" />
            </TresCanvas>
        </ClientOnly>
    </div>
</template>

<style scoped>
    .model-3d-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 260px;
        touch-action: none;
    }

    .model-canvas {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: inherit;
    }

    .model-status {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 16px;
        color: var(--vp-c-text-2);
        text-align: center;
    }

    .model-status--error {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 12px;
    }

    .model-hint {
        margin: 0;
        font-size: 12px;
    }

    .loading-spinner {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 2px solid rgba(var(--vp-c-brand-rgb), 0.2);
        border-top-color: var(--vp-c-brand-1);
        animation: hero-model-spin 1s linear infinite;
    }

    @keyframes hero-model-spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
