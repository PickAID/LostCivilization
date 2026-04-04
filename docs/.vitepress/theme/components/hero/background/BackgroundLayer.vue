<script setup lang="ts">
import { computed } from 'vue';
import type { HeroBackgroundLayerConfig } from "@utils/vitepress/api/frontmatter/hero";
import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";

import ColorBackground from './ColorBackground.vue';
import ImageBackground from './ImageBackground.vue';
import VideoBackground from './VideoBackground.vue';
import ShaderBackground from './ShaderBackground.vue';
import ParticleSystem from './ParticleSystem.vue';

const props = defineProps<{
  layer: HeroBackgroundLayerConfig;
}>();
const { resolveThemeValue, toCssValue } = useHeroTheme();

const layerStyle = computed(() => {
  const style: Record<string, string> = {
    zIndex: String(props.layer.zIndex ?? 0),
    opacity: String(props.layer.opacity ?? 1),
    mixBlendMode: props.layer.blend || 'normal',
  };

  const mergedVars =
    (props.layer.cssVars && typeof props.layer.cssVars === 'object')
      ? (props.layer.cssVars as Record<string, unknown>)
      : {};

  for (const [rawKey, rawValue] of Object.entries(mergedVars)) {
    const key = rawKey.startsWith('--') ? rawKey : `--${rawKey}`;
    const resolved = resolveThemeValue(rawValue as any);
    const cssValue = toCssValue(resolved);
    if (cssValue !== undefined) style[key] = cssValue;
  }

  if (props.layer.style) {
    for (const [key, value] of Object.entries(props.layer.style)) {
      const resolved = resolveThemeValue(value as any);
      const cssValue = toCssValue(resolved);
      if (cssValue !== undefined) style[key] = cssValue;
    }
  }

  return style;
});

const componentName = computed(() => {
  if (props.layer.type === 'color') return ColorBackground;
  if (props.layer.type === 'image') return ImageBackground;
  if (props.layer.type === 'video') return VideoBackground;
  if (props.layer.type === 'shader') return ShaderBackground;
  if (props.layer.type === 'particles') return ParticleSystem;
  return null;
});

const componentConfig = computed(() => {
  if (props.layer.type === 'color') return props.layer.color;
  if (props.layer.type === 'image') return props.layer.image;
  if (props.layer.type === 'video') return props.layer.video;
  if (props.layer.type === 'shader') return props.layer.shader;
  if (props.layer.type === 'particles') return props.layer.particles;
  return undefined;
});
</script>

<template>
  <div class="background-layer" :style="layerStyle">
    <component :is="componentName" v-if="componentName" :config="componentConfig" />
  </div>
</template>

<style scoped>
.background-layer {
  position: absolute;
  inset: 0;
}
</style>
