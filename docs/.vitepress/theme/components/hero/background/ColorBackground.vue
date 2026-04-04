<script setup lang="ts">
import { computed } from 'vue';
import { useHeroTheme } from "@utils/vitepress/runtime/theme/heroThemeContext";

type ThemeValue<T> = T | { value?: T; light?: T; dark?: T };

interface GradientStop {
  color: ThemeValue<string>;
  position?: string;
}

interface GradientConfig {
  enabled?: boolean;
  type?: 'linear' | 'radial' | 'conic';
  direction?: string | number;
  center?: string;
  shape?: string;
  size?: string;
  stops?: GradientStop[];
  animation?: {
    enabled?: boolean;
    type?: 'flow' | 'rotate' | 'pulse';
    duration?: number;
  };
}

interface ColorConfig {
  solid?: ThemeValue<string> | { color?: ThemeValue<string> };
  value?: ThemeValue<string>;
  gradient?: GradientConfig | ThemeValue<string>[];
  direction?: string | number;
}

const props = defineProps<{
  config?: ColorConfig;
}>();

const { resolveThemeValue } = useHeroTheme();

function normalizeAngle(
  value: string | number | undefined,
  fallback: string,
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}deg`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}deg`;
    }
    return trimmed;
  }

  return fallback;
}

const normalizedGradient = computed(() => {
  const gradientRaw = props.config?.gradient;
  if (!gradientRaw) return null;

  if (Array.isArray(gradientRaw)) {
    const legacyStops = gradientRaw
      .map((color) => {
        const resolved = resolveThemeValue(color);
        return resolved ? { color: resolved } : null;
      })
      .filter((item): item is { color: string } => Boolean(item));

    if (legacyStops.length === 0) return null;
    return {
      enabled: true,
      type: 'linear' as const,
      direction: normalizeAngle(props.config?.direction, '135deg'),
      stops: legacyStops,
    };
  }

  if (typeof gradientRaw !== 'object') return null;

  const gradient = gradientRaw as GradientConfig & {
    colors?: ThemeValue<string>[];
  };
  const hasStops = Array.isArray(gradient.stops) && gradient.stops.length > 0;
  const fromColors = Array.isArray(gradient.colors)
    ? gradient.colors
        .map((color) => {
          const resolved = resolveThemeValue(color);
          return resolved ? { color: resolved } : null;
        })
        .filter((item): item is { color: string } => Boolean(item))
    : [];
  const normalizedStops = hasStops ? gradient.stops! : fromColors;

  if (normalizedStops.length === 0) return null;
  if (gradient.enabled === false) return null;

  return {
    ...gradient,
    enabled: true,
    direction: normalizeAngle(
      gradient.direction ?? props.config?.direction,
      '135deg',
    ),
    stops: normalizedStops,
  };
});

const gradientBackground = computed(() => {
  const gradient = normalizedGradient.value;
  if (!gradient) return '';

  const stops = gradient.stops
    .map((stop) => {
      const color =
        typeof stop.color === 'string'
          ? stop.color
          : resolveThemeValue(stop.color) || 'transparent';
      return stop.position ? `${color} ${stop.position}` : color;
    })
    .join(', ');

  if (!stops) return '';

  if (gradient.type === 'radial') {
    return `radial-gradient(${gradient.shape || 'ellipse'} ${gradient.size || 'farthest-corner'} at ${gradient.center || '50% 50%'}, ${stops})`;
  }

  if (gradient.type === 'conic') {
    return `conic-gradient(from ${normalizeAngle(gradient.direction, '0deg')} at ${gradient.center || '50% 50%'}, ${stops})`;
  }

  return `linear-gradient(${normalizeAngle(gradient.direction, '135deg')}, ${stops})`;
});

const solidBackground = computed(() => {
  const solidValue = props.config?.solid;
  if (solidValue && typeof solidValue === 'object' && 'color' in solidValue) {
    return resolveThemeValue(solidValue.color) || 'transparent';
  }

  const resolvedSolid = resolveThemeValue(solidValue);
  if (resolvedSolid) return resolvedSolid;

  // Legacy fallback: hero.background.color.value
  return resolveThemeValue(props.config?.value) || 'transparent';
});

const animationClass = computed(() => {
  const animation = props.config?.gradient?.animation;
  if (!animation?.enabled) return '';

  if (animation.type === 'rotate') return 'gradient-rotate';
  if (animation.type === 'pulse') return 'gradient-pulse';
  return 'gradient-flow';
});

const animationDuration = computed(() => {
  const duration = props.config?.gradient?.animation?.duration;
  return typeof duration === 'number' && duration > 0 ? `${duration}s` : '12s';
});

const colorStyle = computed(() => {
  return {
    backgroundColor: gradientBackground.value ? undefined : solidBackground.value,
    backgroundImage: gradientBackground.value || undefined,
    '--hero-gradient-duration': animationDuration.value,
  } as Record<string, string | undefined>;
});
</script>

<template>
  <div class="color-background" :class="animationClass" :style="colorStyle" />
</template>

<style scoped>
.color-background {
  position: absolute;
  inset: 0;
}

.gradient-flow {
  background-size: 200% 200%;
  animation: hero-gradient-flow var(--hero-gradient-duration) ease-in-out infinite;
}

.gradient-rotate {
  animation: hero-gradient-rotate var(--hero-gradient-duration) linear infinite;
}

.gradient-pulse {
  animation: hero-gradient-pulse var(--hero-gradient-duration) ease-in-out infinite;
}

@keyframes hero-gradient-flow {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes hero-gradient-rotate {
  from {
    transform: scale(1.05) rotate(0deg);
  }
  to {
    transform: scale(1.05) rotate(360deg);
  }
}

@keyframes hero-gradient-pulse {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gradient-flow,
  .gradient-rotate,
  .gradient-pulse {
    animation: none !important;
  }
}
</style>
