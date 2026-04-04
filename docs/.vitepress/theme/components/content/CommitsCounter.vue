<template>
    <div class="commits-counter-container" :class="{ 'is-home': isHomePage }">
        <div class="commits-counter">
            <div class="chart-container" :style="chartContainerStyle">
                <div class="chart-loading" v-if="isLoading">
                    <div class="loading-bars">
                        <div class="bar" v-for="i in 20" :key="i"></div>
                    </div>
                </div>
                <div class="chart-empty" v-else-if="!hasChartData">
                    <p>{{ emptyStateMessage }}</p>
                </div>
                <ClientOnly v-else>
                    <v-chart
                        :option="chartOptions"
                        :autoresize="true"
                        class="main-chart"
                    />
                </ClientOnly>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    //@ts-nocheck
    import { computed, defineAsyncComponent, onMounted, ref } from "vue";
    import { useData } from "vitepress";
    import {
        commitProcessor,
        getRecentContributionDates,
        githubApi,
    } from "@utils/charts";
    import { useSafeI18n } from "@utils/i18n/locale";
    import { getProjectInfo } from "@config/project-config";

    // Async import for vue-echarts to avoid SSR issues
    const VChart = defineAsyncComponent(async () => {
        const { default: VChart } = await import("vue-echarts");
        const { use } = await import("echarts/core");
        const { LineChart } = await import("echarts/charts");
        const { TooltipComponent, GridComponent } = await import(
            "echarts/components"
        );
        const { CanvasRenderer } = await import("echarts/renderers");

        use([LineChart, TooltipComponent, GridComponent, CanvasRenderer]);

        return VChart;
    });

    const { t } = useSafeI18n("commits-counter", {
        commitsOnDate: "{count} commits on {date}",
        commitDataUnavailable: "Commit data unavailable",
    });

    const projectInfo = getProjectInfo();

    const getRepoInfo = () => {
        const repoUrl = projectInfo.repository.url;
        const match = repoUrl.match(
            /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/
        );
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
        return {
            owner: projectInfo.author,
            repo: projectInfo.name,
        };
    };

    interface Props {
        username?: string;
        repoName?: string;
        daysToFetch?: number;
        height?: number;
        lineWidth?: number;
        fill?: boolean;
        smooth?: boolean;
    }

    const { owner: defaultUsername, repo: defaultRepoName } = getRepoInfo();

    const props = withDefaults(defineProps<Props>(), {
        daysToFetch: 30,
        height: 120,
        lineWidth: 4,
        fill: true,
        smooth: true,
    });

    const username = computed(() => props.username ?? defaultUsername);
    const repoName = computed(() => props.repoName ?? defaultRepoName);

    const { isDark, lang, frontmatter } = useData();

    const isHomePage = computed(() => {
        return !!(frontmatter.value.isHome ?? frontmatter.value.layout === "home");
    });

    const contributions = ref<number[] | null>(null);
    const loadError = ref<string | null>(null);
    const isLoading = computed(() => contributions.value === null);
    const hasChartData = computed(
        () => Array.isArray(contributions.value) && contributions.value.length > 0,
    );
    const emptyStateMessage = computed(
        () => loadError.value ?? t.commitDataUnavailable,
    );
    const contributionDates = computed(() =>
        getRecentContributionDates(props.daysToFetch),
    );
    const chartContainerStyle = computed(() => ({
        "--commits-counter-chart-height": `${props.height}px`,
    }));

    /**
     * Generate enhanced chart options with beautiful styling
     */
    const chartOptions = computed(() => {
        if (!hasChartData.value || !contributions.value) return null;

        return {
            grid: {
                left: 40,
                right: 40,
                top: 30,
                bottom: 30,
                containLabel: true,
            },
            xAxis: {
                type: "category",
                boundaryGap: false,
                data: contributions.value.map((_, index) =>
                    contributionDates.value[index].toLocaleDateString(lang.value, {
                        month: "short",
                        day: "numeric",
                    })
                ),
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: isDark.value
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.1)",
                    },
                },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: isDark.value
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.6)",
                    fontSize: 12,
                    interval: Math.floor(contributions.value.length / 6),
                },
                splitLine: { show: false },
            },
            yAxis: {
                type: "value",
                minInterval: 1,
                splitNumber: 4,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    show: true,
                    color: isDark.value
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.6)",
                    fontSize: 12,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: isDark.value
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.05)",
                        type: "dashed",
                    },
                },
            },
            series: [
                {
                    type: "line",
                    data: contributions.value,
                    lineStyle: {
                        width: props.lineWidth,
                        color: isDark.value ? "#60a5fa" : "#3b82f6",
                        shadowColor: isDark.value
                            ? "rgba(96, 165, 250, 0.4)"
                            : "rgba(59, 130, 246, 0.4)",
                        shadowBlur: 12,
                        shadowOffsetY: 4,
                    },
                    areaStyle: props.fill
                        ? {
                              color: isDark.value
                                  ? "rgba(96, 165, 250, 0.25)"
                                  : "rgba(59, 130, 246, 0.2)",
                          }
                        : undefined,
                    symbol: "circle",
                    symbolSize: 6,
                    showSymbol: false,
                    emphasis: {
                        focus: "series",
                        showSymbol: true,
                        symbolSize: 8,
                        lineStyle: {
                            width: props.lineWidth + 2,
                        },
                    },
                    smooth: props.smooth,
                },
            ],
            tooltip: {
                trigger: "axis",
                backgroundColor: isDark.value
                    ? "rgba(20, 20, 20, 0.9)"
                    : "rgba(255, 255, 255, 0.9)",
                borderColor: isDark.value
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                textStyle: {
                    color: isDark.value ? "#E5E7EB" : "#1F2937",
                },
                formatter: (params: any) => {
                    const dataIndex = params[0].dataIndex;
                    const dateString = contributionDates.value[
                        dataIndex
                    ].toLocaleDateString(lang.value, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    const count = params[0].value;
                    return t.commitsOnDate
                        .replace('{count}', count)
                        .replace('{date}', dateString);
                },
            },
        };
    });

    /**
     * Fetch commit data using extracted GitHub utilities
     */
    const fetchContributions = async () => {
        loadError.value = null;
        try {
            const result = await githubApi.fetchAllCommits(
                username.value,
                repoName.value,
                { daysToFetch: props.daysToFetch },
            );

            if (!result.success) {
                console.warn("Failed to fetch commits:", result.error);
                contributions.value = [];
                loadError.value = result.error ?? t.commitDataUnavailable;
                return;
            }

            if (result.rateLimited) {
                console.warn("GitHub API rate limit was reached during fetch");
            }

            contributions.value =
                commitProcessor.processContributions(
                    result.commits,
                    props.daysToFetch
                );
        } catch (error) {
            console.error("Error fetching commit data:", error);
            contributions.value = [];
            loadError.value =
                error instanceof Error ? error.message : t.commitDataUnavailable;
        }
    };

    onMounted(() => {
        fetchContributions();
    });
</script>

<style scoped>
    .commits-counter-container {
        /* Default normal layout */
        width: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        position: relative;
        overflow: hidden;
    }

    /* Full-width styling only for home pages */
    .commits-counter-container.is-home {
        width: 100vw;
        margin-left: 50%;
        transform: translateX(-50%);
        background: #ffffff;
    }

    .dark .commits-counter-container.is-home {
        background: #1b1b1f;
    }

    .commits-counter {
        /* Default normal layout - fit container */
        max-width: 100%;
        margin: 0;
        padding: 20px 0;
        background: transparent;
        border: none;
        border-radius: 0;
        position: relative;
        width: 100%;
        box-sizing: border-box;
    }

    /* Wider layout for home pages */
    .commits-counter-container.is-home .commits-counter {
        max-width: 1800px;
        margin: 0 auto;
        padding: 60px 24px;
    }

    @media (min-width: 640px) {
        .commits-counter {
            padding: 30px 0;
        }
        
        .commits-counter-container.is-home .commits-counter {
            padding: 80px 48px;
        }
    }

    @media (min-width: 960px) {
        .commits-counter {
            padding: 40px 0;
        }
        
        .commits-counter-container.is-home .commits-counter {
            padding: 100px 64px;
        }
    }

    .chart-container {
        /* Transparent background for non-home pages */
        background: transparent;
        border: none;
        border-radius: 16px;
        padding: 20px 16px;
        position: relative;
        overflow: hidden;
        height: max(
            var(--commits-counter-chart-height),
            clamp(220px, 28vw, 420px)
        );
        max-width: 100%;
        width: 100%;
        box-sizing: border-box;
    }

    /* Styled background for home pages only */
    .commits-counter-container.is-home .chart-container {
        background: var(--vp-c-bg-soft);
        border: 1px solid var(--vp-c-divider);
        height: max(
            var(--commits-counter-chart-height),
            clamp(320px, 38vw, 560px)
        );
        padding: 40px 32px;
    }

    @media (min-width: 640px) {
        .chart-container {
            padding: 24px 20px;
        }
        
        .commits-counter-container.is-home .chart-container {
            padding: 50px 40px;
        }
    }

    @media (min-width: 960px) {
        .chart-container {
            padding: 32px 24px;
        }
        
        .commits-counter-container.is-home .chart-container {
            padding: 60px 50px;
        }
    }

    @media (min-width: 1200px) {
        .chart-container {
            padding: 40px 32px;
        }
        
        .commits-counter-container.is-home .chart-container {
            padding: 70px 60px;
        }
    }

    .main-chart {
        width: 100%;
        height: 100% !important;
        min-height: 100%;
        display: block;
    }

    :deep(.main-chart > div:first-child) {
        height: 100% !important;
        min-height: 100%;
    }

    :deep(.main-chart > div:first-child canvas) {
        height: 100% !important;
    }

    :deep(.main-chart > div:not(:first-child)) {
        height: auto !important;
        min-height: 0 !important;
    }

    .chart-loading {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .chart-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vp-c-text-2);
        text-align: center;
        padding: 24px;
    }

    .loading-bars {
        display: flex;
        align-items: end;
        gap: 6px;
        height: 80px; /* Larger loading bars */
    }

    .bar {
        width: 10px;
        background: var(--vp-c-brand-1);
        border-radius: 5px;
        animation: loading-wave 1.5s ease-in-out infinite;
        animation-delay: calc(var(--i) * 0.1s);
    }

    .bar:nth-child(1) {
        --i: 0;
        height: 20%;
    }
    .bar:nth-child(2) {
        --i: 1;
        height: 40%;
    }
    .bar:nth-child(3) {
        --i: 2;
        height: 60%;
    }
    .bar:nth-child(4) {
        --i: 3;
        height: 80%;
    }
    .bar:nth-child(5) {
        --i: 4;
        height: 100%;
    }
    .bar:nth-child(6) {
        --i: 5;
        height: 70%;
    }
    .bar:nth-child(7) {
        --i: 6;
        height: 30%;
    }
    .bar:nth-child(8) {
        --i: 7;
        height: 50%;
    }
    .bar:nth-child(9) {
        --i: 8;
        height: 90%;
    }
    .bar:nth-child(10) {
        --i: 9;
        height: 40%;
    }
    .bar:nth-child(11) {
        --i: 10;
        height: 60%;
    }
    .bar:nth-child(12) {
        --i: 11;
        height: 35%;
    }
    .bar:nth-child(13) {
        --i: 12;
        height: 75%;
    }
    .bar:nth-child(14) {
        --i: 13;
        height: 85%;
    }
    .bar:nth-child(15) {
        --i: 14;
        height: 45%;
    }
    .bar:nth-child(16) {
        --i: 15;
        height: 65%;
    }
    .bar:nth-child(17) {
        --i: 16;
        height: 25%;
    }
    .bar:nth-child(18) {
        --i: 17;
        height: 55%;
    }
    .bar:nth-child(19) {
        --i: 18;
        height: 95%;
    }
    .bar:nth-child(20) {
        --i: 19;
        height: 35%;
    }

    @keyframes loading-wave {
        0%,
        100% {
            transform: scaleY(1);
            opacity: 0.7;
        }
        50% {
            transform: scaleY(1.5);
            opacity: 1;
        }
    }

    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
        .commits-counter {
            padding: 20px 0;
            max-width: 100%;
        }
        
        .commits-counter-container.is-home .commits-counter {
            padding: 40px 16px;
        }

        .chart-container {
            height: 280px;
            padding: 16px 12px;
        }
        
        .commits-counter-container.is-home .chart-container {
            height: 350px;
            padding: 30px 20px;
        }
    }
</style>
