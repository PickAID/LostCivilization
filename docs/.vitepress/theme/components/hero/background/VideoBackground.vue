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

interface VideoConfig extends ThemeableSource {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;
  playbackRate?: number;
}

const props = defineProps<{
  config?: VideoConfig;
}>();

const { isDarkRef } = useHeroTheme();

const resolvedSrc = computed(() => {
  const source = props.config;
  if (!source) return '';

  return resolveAssetWithBase(
    resolveThemeSourceByMode(source, isDarkRef.value) || '',
  );
});

const options = computed(() => ({
  autoplay: props.config?.autoplay ?? true,
  loop: props.config?.loop ?? true,
  muted: props.config?.muted ?? true,
  controls: props.config?.controls ?? false,
  poster: resolveAssetWithBase(props.config?.poster),
  playbackRate: props.config?.playbackRate ?? 1,
}));
</script>

<template>
  <video
    v-if="resolvedSrc"
    class="video-background"
    :src="resolvedSrc"
    :poster="options.poster"
    :autoplay="options.autoplay"
    :loop="options.loop"
    :muted="options.muted"
    :controls="options.controls"
    playsinline
  />
</template>

<style scoped>
.video-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
