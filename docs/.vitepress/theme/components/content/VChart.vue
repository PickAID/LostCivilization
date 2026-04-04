<template>
    <div class="echarts-container" :style="{ width, height: computedHeight }">
        <ClientOnly>
            <VueEChart
                :option="enhancedOptions"
                :theme="computedTheme"
                :autoresize="resolvedAutoresize"
                :init-options="initOptions"
                :update-options="updateOptions"
                :group="group || undefined"
                :loading="loading"
                :loading-options="loadingOptions"
                :manual-update="manualUpdate"
                class="vue-echarts"
            />
        </ClientOnly>
    </div>
</template>

<script setup>
    import { computed, ref, watchEffect } from 'vue';
    import { useData } from 'vitepress';
    import { ChartOptionEnhancer } from './chart/chartOptions';
    import { VueEChart } from './chart/chartLoader';
    import { ChartThemeRuntime } from './chart/chartTheme';
    import {
        decodeEscapedTextDeep,
        resolveDynamicValueDeep,
    } from '@utils/vitepress/runtime/text/dynamicText';

    const props = defineProps({
        options: { type: Object, required: true },
        width: { type: String, default: '100%' },
        height: { type: String, default: '400px' },
        theme: { type: [String, Object], default: 'auto' },
        autoresize: { type: [Boolean, Object], default: true },
        initOptions: { type: Object, default: undefined },
        updateOptions: { type: Object, default: undefined },
        group: { type: String, default: '' },
        loading: { type: Boolean, default: false },
        loadingOptions: { type: Object, default: undefined },
        manualUpdate: { type: Boolean, default: false },
    });

    const { isDark } = useData();
    const paletteMode = computed(() => ChartThemeRuntime.resolvePaletteMode(props.theme, isDark.value));
    const computedTheme = computed(() => ChartThemeRuntime.resolveComputedTheme(props.theme, isDark.value));
    const resolvedAutoresize = computed(() => (props.autoresize == null ? true : props.autoresize));
    const resolvedOptions = ref(decodeEscapedTextDeep(props.options));

    watchEffect((onCleanup) => {
        let cancelled = false;
        const snapshot = decodeEscapedTextDeep(props.options);
        resolvedOptions.value = snapshot;
        resolveDynamicValueDeep(snapshot).then((next) => {
            if (!cancelled) {
                resolvedOptions.value = next;
            }
        });
        onCleanup(() => {
            cancelled = true;
        });
    });

    const computedHeight = computed(() => ChartOptionEnhancer.resolveComputedHeight(resolvedOptions.value, props.height));
    const enhancedOptions = computed(() => ChartOptionEnhancer.enhance(resolvedOptions.value, paletteMode.value));
</script>

<style scoped>
    .echarts-container {
        border-radius: 8px;
        margin: 20px auto;
        overflow: hidden;
        box-sizing: border-box;
        position: relative;
        max-width: 100%;
    }

    .vue-echarts {
        width: 100% !important;
        height: 100% !important;
        min-height: 300px;
    }

    @media (max-width: 768px) {
        .echarts-container {
            margin: 16px auto;
        }

        .vue-echarts {
            min-height: 250px;
        }
    }
</style>
