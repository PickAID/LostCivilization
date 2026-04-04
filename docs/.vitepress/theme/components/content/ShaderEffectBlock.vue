<template>
    <div ref="containerRef" class="shader-effect-block">
        <div v-if="error" class="shader-effect-error">
            <strong>Shader Error:</strong> {{ error }}
        </div>
        <canvas
            v-show="!error"
            ref="canvasRef"
            class="shader-effect-canvas"
        ></canvas>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, onMounted, onBeforeUnmount } from "vue";
    import { inBrowser, useData } from "vitepress";

    interface Props {
        vertexShader?: string;
        fragmentShader?: string;
        preset?: string;
        speed?: number;
        paused?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        vertexShader: "",
        fragmentShader: "",
        preset: "wave",
        speed: 1,
        paused: false,
    });

    const { isDark } = useData();
    const containerRef = ref<HTMLElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const error = ref("");

    let THREE: typeof import("three") | null = null;
    let renderer: InstanceType<typeof import("three").WebGLRenderer> | null =
        null;
    let scene: InstanceType<typeof import("three").Scene> | null = null;
    let camera: InstanceType<typeof import("three").OrthographicCamera> | null =
        null;
    let mesh: InstanceType<typeof import("three").Mesh> | null = null;
    let material: InstanceType<typeof import("three").ShaderMaterial> | null =
        null;
    let animationId: number | null = null;
    let startTime = 0;
    let resizeObserver: ResizeObserver | null = null;

    const PRESETS: Record<
        string,
        [
            [number, number, number],
            [number, number, number],
            [number, number, number],
        ]
    > = {
        wave: [
            [0.08, 0.15, 0.45],
            [0.45, 0.12, 0.55],
            [0.08, 0.45, 0.35],
        ],
        sunset: [
            [0.65, 0.25, 0.1],
            [0.85, 0.45, 0.2],
            [0.25, 0.1, 0.35],
        ],
        ocean: [
            [0.05, 0.2, 0.4],
            [0.12, 0.45, 0.6],
            [0.05, 0.35, 0.55],
        ],
        mono: [
            [0.2, 0.2, 0.2],
            [0.5, 0.5, 0.5],
            [0.8, 0.8, 0.8],
        ],
    };

    const DEFAULT_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

    const DEFAULT_FRAGMENT = `
uniform float uTime;
uniform vec3 uBgColor;
uniform float uThemeIsDark;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float wave1 = sin(uTime * 0.4 + uv.x * 5.0) * 0.5 + 0.5;
  float wave2 = sin(uTime * 0.6 + uv.y * 4.0) * 0.5 + 0.5;
  vec3 colorMix = mix(uColor1, uColor2, wave1);
  colorMix = mix(colorMix, uColor3, wave2 * 0.5);
  float dist = distance(uv, vec2(0.5));
  float fade = smoothstep(0.8, 0.2, dist);
  vec3 finalColor = mix(uBgColor, colorMix, fade);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

    function getPageBgColor(): [number, number, number] {
        if (!inBrowser) return isDark.value ? [0.1, 0.1, 0.1] : [1, 1, 1];
        try {
            const style = getComputedStyle(document.documentElement);
            const bgVar = style.getPropertyValue("--vp-c-bg").trim();
            if (bgVar) {
                const c = new THREE!.Color(bgVar);
                return [c.r, c.g, c.b];
            }
        } catch {}
        return isDark.value ? [0.1, 0.1, 0.1] : [1, 1, 1];
    }

    function applyPreset() {
        if (!material) return;
        const palette = PRESETS[props.preset] || PRESETS.wave;
        material.uniforms.uColor1.value.set(...palette[0]);
        material.uniforms.uColor2.value.set(...palette[1]);
        material.uniforms.uColor3.value.set(...palette[2]);
    }

    function syncTheme() {
        if (!material || !renderer || !THREE) return;
        const bg = getPageBgColor();
        const bgColor = new THREE.Color(bg[0], bg[1], bg[2]);
        renderer.setClearColor(bgColor, 1);
        material.uniforms.uBgColor.value.set(bg[0], bg[1], bg[2]);
        material.uniforms.uThemeIsDark.value = isDark.value ? 1.0 : 0.0;
    }

    function handleResize() {
        if (!containerRef.value || !renderer || !camera || !canvasRef.value)
            return;

        const rect = containerRef.value.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor((rect.width * 9) / 16); // 16:9 aspect

        if (w <= 0 || h <= 0) return;

        const dpr = Math.min(window.devicePixelRatio, 2);
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(dpr);

        canvasRef.value.style.width = w + "px";
        canvasRef.value.style.height = h + "px";

        camera.left = -1;
        camera.right = 1;
        camera.top = 1;
        camera.bottom = -1;
        camera.updateProjectionMatrix();
    }

    /** The render loop. */
    function renderFrame(timestamp: number) {
        if (!renderer || !scene || !camera || !material) return;
        if (startTime === 0) startTime = timestamp;
        if (!props.paused) {
            material.uniforms.uTime.value =
                (timestamp - startTime) * 0.001 * props.speed;
        }
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(renderFrame);
    }

    /** Initializes the Three.js scene. */
    async function initScene() {
        if (!canvasRef.value || !containerRef.value) return;

        try {
            // Lazy-load three.js
            THREE = await import("three");

            const vs = props.vertexShader || DEFAULT_VERTEX;
            const fs = props.fragmentShader || DEFAULT_FRAGMENT;

            const bg = getPageBgColor();
            const bgColor = new THREE.Color(bg[0], bg[1], bg[2]);

            renderer = new THREE.WebGLRenderer({
                canvas: canvasRef.value,
                alpha: false,
                antialias: false,
            });
            renderer.setClearColor(bgColor, 1);

            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
            camera.position.z = 1;

            const palette = PRESETS[props.preset] || PRESETS.wave;

            material = new THREE.ShaderMaterial({
                vertexShader: vs,
                fragmentShader: fs,
                uniforms: {
                    uTime: { value: 0.0 },
                    uBgColor: { value: new THREE.Vector3(bg[0], bg[1], bg[2]) },
                    uThemeIsDark: { value: isDark.value ? 1.0 : 0.0 },
                    uColor1: { value: new THREE.Vector3(...palette[0]) },
                    uColor2: { value: new THREE.Vector3(...palette[1]) },
                    uColor3: { value: new THREE.Vector3(...palette[2]) },
                },
            });

            const geometry = new THREE.PlaneGeometry(2, 2);
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            handleResize();

            startTime = 0;
            animationId = requestAnimationFrame(renderFrame);

            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(containerRef.value);

            error.value = "";
        } catch (e: any) {
            error.value = e.message || "Failed to initialize shader.";
            console.error("[ShaderEffectBlock] Init error:", e);
        }
    }

    function cleanup() {
        if (animationId != null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (mesh) {
            mesh.geometry.dispose();
            if (mesh.material instanceof THREE!.ShaderMaterial) {
                mesh.material.dispose();
            }
        }
        renderer?.dispose();
        renderer = null;
        scene = null;
        camera = null;
        mesh = null;
        material = null;
    }

    watch(
        () => props.preset,
        () => applyPreset(),
    );

    let mutationObserver: MutationObserver | null = null;

    onMounted(() => {
        if (!inBrowser) return;
        mutationObserver = new MutationObserver(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    syncTheme();
                });
            });
        });
        mutationObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        // Use an IntersectionObserver for lazy mounting
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    io.disconnect();
                    initScene();
                }
            },
            { rootMargin: "200px" },
        );
        if (containerRef.value) {
            io.observe(containerRef.value);
        }
        onBeforeUnmount(() => {
            io.disconnect();
            mutationObserver?.disconnect();
            mutationObserver = null;
            cleanup();
        });
    });
</script>

<style scoped>
    .shader-effect-block {
        position: relative;
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--vp-c-divider);
        background: var(--vp-c-bg);
    }

    .shader-effect-canvas {
        display: block;
        width: 100%;
        border-radius: 12px;
    }

    .shader-effect-error {
        padding: 16px;
        border-radius: 8px;
        background: var(--vp-custom-block-danger-bg);
        color: var(--vp-custom-block-danger-text);
        border-left: 4px solid var(--vp-custom-block-danger-border);
    }
</style>
