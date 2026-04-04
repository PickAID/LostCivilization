<script setup lang="ts">
import { computed } from 'vue';
import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";
import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";
import { resolveThemeSourceByMode } from "@utils/vitepress/runtime/theme";

interface ThemeableSource {
  src?: string;
  light?: string;
  dark?: string;
}

interface ImageConfig extends ThemeableSource {
  size?: string;
  position?: string;
  repeat?: string;
  blur?: number;
  scale?: number;
  opacity?: number;
}

const props = defineProps<{
  config?: ImageConfig;
}>();

const { isDarkRef } = useHeroTheme();

const resolvedSrc = computed(() => {
  const source = props.config;
  if (!source) return '';

  return resolveAssetWithBase(
    resolveThemeSourceByMode(source, isDarkRef.value) || '',
  );
});

const imageStyle = computed(() => {
  const cfg = props.config || {};
  return {
    backgroundImage: resolvedSrc.value ? `url(${resolvedSrc.value})` : 'none',
    backgroundSize: cfg.size || 'cover',
    backgroundPosition: cfg.position || 'center',
    backgroundRepeat: cfg.repeat || 'no-repeat',
    filter: typeof cfg.blur === 'number' && cfg.blur > 0 ? `blur(${cfg.blur}px)` : undefined,
    transform: typeof cfg.scale === 'number' && cfg.scale !== 1 ? `scale(${cfg.scale})` : undefined,
    opacity: typeof cfg.opacity === 'number' ? String(cfg.opacity) : undefined,
  } as Record<string, string | undefined>;
});
</script>

<template>
  <div class="image-background" :style="imageStyle" />
</template>

<style scoped>
.image-background {
  position: absolute;
  inset: 0;
}
</style>
