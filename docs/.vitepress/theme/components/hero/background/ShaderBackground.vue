<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { TresCanvas, extend } from '@tresjs/core';
import { Color, ShaderMaterial, Vector2, Vector3 } from 'three';
import { getShaderTemplate, getShaderTemplateByType, type ShaderTemplate } from '../../../../config/shaders';
import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";
import { createElementResizeState } from "@utils/vitepress/runtime/viewport";

extend({ ShaderMaterial });

type ThemeValue<T> = T | { value?: T; light?: T; dark?: T };

interface ShaderUniformConfig {
  type?: 'float' | 'int' | 'vec2' | 'vec3' | 'color' | 'sampler2D';
  value?: ThemeValue<any>;
  light?: any;
  dark?: any;
}

interface ShaderConfig {
  type?: string;
  template?: string;
  speed?: number;
  uniforms?: Record<string, ShaderUniformConfig | number | string | number[] | Record<string, any>>;
  custom?: {
    vertex?: string;
    fragment?: string;
  };
}

const props = defineProps<{
  config?: ShaderConfig;
}>();

const { isDarkRef, resolveThemeValue: resolveTV, themeVersion } = useHeroTheme();
const containerRef = ref<HTMLElement | null>(null);
const isClient = ref(false);
const resolution = ref(new Vector2(1, 1));
const uniforms = ref<Record<string, { value: any }>>({});
const materialKey = ref('shader-0');

const { reobserve: reobserveContainer } = createElementResizeState(
  containerRef,
  () => {
    syncResolution();
  },
  { debounceMs: 0 },
);

function isLikelyShaderCode(shader: unknown): shader is string {
  return typeof shader === 'string' && /void\s+main\s*\(/.test(shader);
}

function resolveThemeValue<T>(value: ThemeValue<T> | undefined): T | undefined {
  return resolveTV(value as any) as T | undefined;
}

function colorToVec3(input: unknown): Vector3 {
  if (Array.isArray(input) && input.length >= 3) {
    return new Vector3(Number(input[0]) || 0, Number(input[1]) || 0, Number(input[2]) || 0);
  }

  if (typeof input === 'string') {
    const color = new Color(input);
    return new Vector3(color.r, color.g, color.b);
  }

  return new Vector3(1, 1, 1);
}

function resolveBackgroundColor(): Vector3 {
  if (typeof window === 'undefined') {
    return isDarkRef.value ? new Vector3(0.11, 0.11, 0.12) : new Vector3(1, 1, 1);
  }

  const cssColor = getComputedStyle(document.documentElement).getPropertyValue('--vp-c-bg').trim();
  if (!cssColor) {
    return isDarkRef.value ? new Vector3(0.11, 0.11, 0.12) : new Vector3(1, 1, 1);
  }

  const color = new Color(cssColor);
  return new Vector3(color.r, color.g, color.b);
}

function normalizeTemplateKey(template?: string): string | undefined {
  if (!template) return undefined;
  if (template.startsWith('template:')) {
    return template.slice('template:'.length);
  }
  return template;
}

const shaderDefinition = computed<ShaderTemplate>(() => {
  const config = props.config || {};
  const templateKey = normalizeTemplateKey(config.template);
  const fromTemplate = templateKey ? getShaderTemplate(templateKey) : undefined;
  const fromType = getShaderTemplateByType(config.type);
  const fallback = getShaderTemplate('water');
  const chosen = fromTemplate || fromType || fallback;

  const customVertex = config.custom?.vertex;
  const customFragment = config.custom?.fragment;
  const validCustomVertex = isLikelyShaderCode(customVertex);
  const validCustomFragment = isLikelyShaderCode(customFragment);

  if ((customVertex && !validCustomVertex) || (customFragment && !validCustomFragment)) {
    if (import.meta.env.DEV) {
      console.warn('[hero][shader] Invalid custom shader detected. Falling back to selected preset/template.');
    }
  }

  return {
    ...chosen,
    vertex: validCustomVertex ? customVertex : chosen.vertex,
    fragment: validCustomFragment ? customFragment : chosen.fragment,
  };
});

function normalizeUniformEntry(entry: any): any {
  if (entry === undefined || entry === null) return entry;

  if (typeof entry === 'number') return entry;
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) return entry;

  const asTheme = resolveThemeValue(entry as ThemeValue<any>);
  if (asTheme !== entry && asTheme !== undefined) {
    return normalizeUniformEntry(asTheme);
  }

  if (typeof entry === 'object' && 'type' in entry) {
    const typed = entry as ShaderUniformConfig;
    const raw = resolveThemeValue(typed.value ?? typed);

    if (typed.type === 'float' || typed.type === 'int') {
      return Number(raw) || 0;
    }

    if (typed.type === 'vec2') {
      const values = Array.isArray(raw) ? raw : [0, 0];
      return new Vector2(Number(values[0]) || 0, Number(values[1]) || 0);
    }

    if (typed.type === 'vec3' || typed.type === 'color') {
      return colorToVec3(raw);
    }

    return raw;
  }

  return entry;
}

function rebuildUniforms(forceRecreate: boolean = false) {
  const templateUniforms = shaderDefinition.value.defaultUniforms || {};
  const configuredUniforms = props.config?.uniforms || {};

  // Update existing uniforms in-place to avoid visual flash
  if (uniforms.value.uTime) {
    // Preserve time value
  } else {
    uniforms.value.uTime = { value: 0 };
  }

  // Update resolution
  if (uniforms.value.uResolution) {
    uniforms.value.uResolution.value = resolution.value.clone();
  } else {
    uniforms.value.uResolution = { value: resolution.value.clone() };
  }

  // Update theme state
  if (uniforms.value.uThemeIsDark) {
    uniforms.value.uThemeIsDark.value = isDarkRef.value ? 1 : 0;
  } else {
    uniforms.value.uThemeIsDark = { value: isDarkRef.value ? 1 : 0 };
  }

  // Update background color
  if (uniforms.value.uBgColor) {
    uniforms.value.uBgColor.value = resolveBackgroundColor();
  } else {
    uniforms.value.uBgColor = { value: resolveBackgroundColor() };
  }

  // Update template uniforms
  for (const [name, value] of Object.entries(templateUniforms)) {
    if (uniforms.value[name]) {
      uniforms.value[name].value = normalizeUniformEntry(value);
    } else {
      uniforms.value[name] = { value: normalizeUniformEntry(value) };
    }
  }

  // Update configured uniforms
  for (const [name, value] of Object.entries(configuredUniforms)) {
    if (uniforms.value[name]) {
      uniforms.value[name].value = normalizeUniformEntry(value);
    } else {
      uniforms.value[name] = { value: normalizeUniformEntry(value) };
    }
  }

  // Only recreate material when forced (e.g., shader definition changes)
  // NOT on theme changes to avoid visual flash
  if (forceRecreate) {
    materialKey.value = `shader-${Date.now()}`;
  }
}

function syncResolution() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  resolution.value = new Vector2(rect.width, rect.height);

  if (uniforms.value.uResolution) {
    uniforms.value.uResolution.value = resolution.value.clone();
  }
}

function onLoop({ elapsed }: { elapsed: number }) {
  if (!uniforms.value.uTime) return;
  const speed = Number(props.config?.speed ?? 1);
  uniforms.value.uTime.value = elapsed * speed;
}

watch(
  () => [props.config, shaderDefinition.value.key],
  () => {
    rebuildUniforms(true);
  },
  { deep: true, immediate: true },
);

watch(
  () => themeVersion.value,
  () => {
    if (!isClient.value) return;
    rebuildUniforms();
    syncResolution();
  },
);

onMounted(() => {
  isClient.value = true;
  syncResolution();

  if (containerRef.value) {
    reobserveContainer(containerRef.value);
  }
});
</script>

<template>
  <div ref="containerRef" class="shader-background">
    <ClientOnly>
      <TresCanvas
        v-if="isClient"
        class="shader-canvas"
        clear-color="#00000000"
        :shadows="false"
        @loop="onLoop"
      >
        <TresOrthographicCamera :left="-1" :right="1" :top="1" :bottom="-1" :near="0.1" :far="10" :position="[0, 0, 1]" :make-default="true" />

        <TresMesh>
          <TresPlaneGeometry :args="[2, 2, 1, 1]" />
          <TresShaderMaterial
            :key="materialKey"
            :vertex-shader="shaderDefinition.vertex"
            :fragment-shader="shaderDefinition.fragment"
            :uniforms="uniforms"
            :transparent="true"
          />
        </TresMesh>
      </TresCanvas>
    </ClientOnly>
  </div>
</template>

<style scoped>
.shader-background {
  position: absolute;
  inset: 0;
}

.shader-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
