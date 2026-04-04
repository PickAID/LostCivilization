<script setup lang="ts">
    import HeroBackground from "./hero/HeroBackground.vue";
    import WaveAnimation from "./hero/waves/WaveAnimation.vue";
    import HeroContent from "./hero/content/HeroContent.vue";
    import HeroImage from "./hero/image/HeroImage.vue";
    import HeroFloatingElements from "./hero/effects/HeroFloatingElements.vue";
    import { provide } from "vue";
    import {
        createHeroRuntimeState,
        VPHeroProps,
    } from "@utils/vitepress/runtime/hero/heroRuntimeState";
    import { heroEffectiveDarkKey } from "@utils/vitepress/runtime/theme/heroThemeContext";

    const props = defineProps<VPHeroProps>();

    const {
        heroRoot,
        backgroundConfig,
        floatingConfig,
        floatingSnippetWords,
        resolvedWavesConfig,
        resolvedName,
        resolvedText,
        resolvedTagline,
        resolvedActions,
        heroTypographyType,
        hasImage,
        imageBackgroundEnabled,
        resolvedHeroImageConfig,
        hasFloatingItems,
        hasMediaBackground,
        hasColorOverrides,
        viewportEnabled,
        hasWaves,
        hideTaglineForWavePriority,
        hideActionsForWavePriority,
        maxVisibleActionsForWavePriority,
        showScrollArrow,
        scrollPastHero,
        heroCssVarsStyle,
        effectiveDark,
        themeReady,
    } = createHeroRuntimeState(props);

    provide(heroEffectiveDarkKey, effectiveDark);
</script>

<template>
    <div
        ref="heroRoot"
        class="VPHero hero-premium"
        :class="[
            {
                'has-image': hasImage,
                'hero-premium--viewport': viewportEnabled,
                'hero-premium--content': !viewportEnabled,
                'hero-premium--media': hasMediaBackground,
                'hero-premium--readable': hasColorOverrides,
                'hero-premium--typography-grouped-float':
                    heroTypographyType === 'grouped-float',
                'hero-premium--typography-slanted-wrap':
                    heroTypographyType === 'slanted-wrap',
                'hero-premium--has-waves': hasWaves,
                'hero-premium--wave-priority':
                    hideTaglineForWavePriority || hideActionsForWavePriority,
            },
            `hero-premium--typography-${heroTypographyType}`,
        ]"
        :style="heroCssVarsStyle"
    >
        <HeroBackground
            v-if="themeReady && backgroundConfig"
            :config="backgroundConfig"
            :has-media-background="hasMediaBackground"
        />

        <HeroFloatingElements
            v-if="themeReady && hasFloatingItems"
            :key="effectiveDark ? 'floating-dark' : 'floating-light'"
            :config="floatingConfig"
            :snippet-words="floatingSnippetWords"
        />

        <WaveAnimation v-if="hasWaves" :config="resolvedWavesConfig" />

        <div class="container">
            <div class="main">
                <slot name="home-hero-info-before" />

                <slot name="home-hero-info">
                    <HeroContent
                        :name="resolvedName"
                        :text="resolvedText"
                        :tagline="resolvedTagline"
                        :actions="resolvedActions"
                        :style-type="heroTypographyType"
                        :has-media-background="hasMediaBackground"
                        :force-hide-tagline="hideTaglineForWavePriority"
                        :force-hide-actions="hideActionsForWavePriority"
                        :max-visible-actions="maxVisibleActionsForWavePriority"
                    />
                </slot>

                <slot name="home-hero-info-after" />
                <slot
                    v-if="!hideActionsForWavePriority"
                    name="home-hero-actions-after"
                />
            </div>

            <Transition name="hero-image-float" appear>
                <div v-if="themeReady && hasImage" class="image">
                    <div class="image-container">
                        <div v-if="imageBackgroundEnabled" class="image-bg" />
                        <slot name="home-hero-image">
                            <HeroImage
                                v-if="resolvedHeroImageConfig"
                                class="image-src"
                                :config="resolvedHeroImageConfig"
                            />
                        </slot>
                    </div>
                </div>
            </Transition>
        </div>

        <button
            v-if="showScrollArrow"
            class="hero-scroll-arrow"
            aria-label="Scroll down"
            @click="scrollPastHero"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </button>
    </div>
</template>

<style scoped src="./hero/styles/vp-hero-structure.css"></style>
<style scoped src="./hero/styles/vp-hero-typography.css"></style>
<style scoped src="./hero/styles/vp-hero-media.css"></style>
