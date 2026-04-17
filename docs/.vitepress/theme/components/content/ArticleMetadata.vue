<script lang="ts" setup>
    import { useData, useRoute } from "vitepress";
    import { computed, nextTick, onMounted, ref, watch } from "vue";
    import utils from "@utils";
    import ProgressLinear from "../ui/ProgressLinear.vue";
    import State from "../ui/State.vue";
    import { useSafeI18n } from "@utils/i18n/locale";
    import type {
        MetadataMetricKey,
        NormalizedMetadataChip,
        NormalizedMetadataSource,
    } from "@utils/vitepress/api/frontmatter/metadata";
    import {
        resolveEffectiveMetadataFrontmatter,
    } from "@utils/vitepress/api/frontmatter/metadata/DirectoryMetadataInheritance";
    import {
        normalizeMetadataFrontmatter,
        resolveRouteFallbackLabel,
    } from "@utils/vitepress/api/frontmatter/metadata";

    const { t } = useSafeI18n("article-metadata", {
        lastUpdated: "Last updated on: {date}",
        wordCount: "Word count: {count}",
        readingTime: "Reading time: {time} min",
        pageViews: "Page views: {count}",
        routeServerScripts: "Server Scripts",
        routeClientScripts: "Client Scripts",
        routeStartupScripts: "Startup Scripts",
        routeDatagen: "Datagen",
        routeRegistry: "Registry",
        routeNetworking: "Networking",
        routeMixin: "Mixin",
        routeCapability: "Capability",
        routeRendering: "Rendering",
        routeConfig: "Config",
        routeEvents: "Events",
        routeWorldgen: "Worldgen",
        routeCommand: "Commands",
        routeToolchain: "Toolchain",
        routeAddon: "Addon",
        routeBlock: "Block",
        routeItem: "Item",
        routeEntity: "Entity",
        routeLootTable: "Loot Table",
        routeGlobalScope: "Global Scope",
        routeRecipe: "Recipe",
        routeTag: "Tag",
        routeUpgrade: "Upgrade",
        routeCodeShare: "Code Share",
        sourceCurseforge: "CurseForge",
        sourceModrinth: "Modrinth",
        sourceMcmod: "MC百科",
        sourceDocs: "Docs",
        sourceGithub: "GitHub",
        sideServer: "Server Side",
        sideClient: "Client Side",
        sideBoth: "Both Sides",
    });

    const routeLabelKeys: Record<string, string> = {
        addon: "routeAddon",
        block: "routeBlock",
        capability: "routeCapability",
        client_scripts: "routeClientScripts",
        code_share: "routeCodeShare",
        command: "routeCommand",
        config: "routeConfig",
        datagen: "routeDatagen",
        entity: "routeEntity",
        events: "routeEvents",
        global_scope: "routeGlobalScope",
        item: "routeItem",
        loot_table: "routeLootTable",
        mixin: "routeMixin",
        networking: "routeNetworking",
        recipe: "routeRecipe",
        registry: "routeRegistry",
        rendering: "routeRendering",
        server_scripts: "routeServerScripts",
        startup_scripts: "routeStartupScripts",
        tag: "routeTag",
        toolchain: "routeToolchain",
        upgrade: "routeUpgrade",
        worldgen: "routeWorldgen",
    };

    const sourceLabelKeys: Record<string, string> = {
        curseforge: "sourceCurseforge",
        docs: "sourceDocs",
        github: "sourceGithub",
        mcmod: "sourceMcmod",
        modrinth: "sourceModrinth",
    };

    const sideLabelKeys: Record<string, string> = {
        server: "sideServer",
        client: "sideClient",
        both: "sideBoth",
    };

    const ALL_METRIC_KEYS: MetadataMetricKey[] = [
        "update",
        "wordCount",
        "readTime",
        "pageViews",
    ];

    const GROUP_KEY_ICONS: Record<string, string> = {
        currentVersion: "mdi-tag-outline",
        latestVersion: "mdi-tag-outline",
        requiredMods: "mdi-puzzle-outline",
        routes: "mdi-compass-outline",
        currentStack: "mdi-layers-outline",
        loaders: "mdi-cog-outline",
        side: "mdi-server-outline",
    };

    interface ContextItem {
        key: string;
        icon: string;
        label: string;
        href?: string;
        target?: string;
        rel?: string;
        hoverLines?: string[];
    }

    const { page, frontmatter, lang } = useData();
    const route = useRoute();

    const wordCount = ref(0);
    const imageCount = ref(0);
    const pageViewsLoading = ref(true);
    const pageViewsCount = ref<string | number>("-");
    let pageViewsRequestToken = 0;

    function translate(key: string, fallback: string): string {
        const value = (t as Record<string, string | undefined>)[key];
        return typeof value === "string" && value.length > 0 ? value : fallback;
    }

    function humanizeToken(token: string): string {
        return token
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    const resolvedMetadata = computed(() =>
        normalizeMetadataFrontmatter(
            resolveEffectiveMetadataFrontmatter(
                route.path,
                frontmatter.value?.metadata,
            ),
        ),
    );

    const isMetadata = computed(() => resolvedMetadata.value.enabled);

    const visibleMetricKeys = computed(() =>
        ALL_METRIC_KEYS.filter((key) => resolvedMetadata.value.metrics[key]),
    );

    const hasMetrics = computed(() => visibleMetricKeys.value.length > 0);

    const update = computed(() => {
        let timestamp = 0;

        if (typeof page.value.lastUpdated === "number") {
            timestamp = page.value.lastUpdated;
        } else if (frontmatter.value.date) {
            timestamp = +new Date(frontmatter.value.date);
        } else {
            timestamp = Date.now();
        }

        return new Date(timestamp).toLocaleDateString(lang.value, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    });

    const readTime = computed(() => {
        const time = utils.vitepress.readingTime.calculateTotalTime(
            wordCount.value,
            imageCount.value,
        );
        return typeof time === "number" ? time : 0;
    });

    const metadataContent = computed<
        Record<Exclude<MetadataMetricKey, "pageViews">, string>
    >(() => ({
        update: translate("lastUpdated", "Last updated on: {date}").replace(
            "{date}",
            update.value || "",
        ),
        wordCount: translate("wordCount", "Word count: {count}").replace(
            "{count}",
            String(wordCount.value || 0),
        ),
        readTime: translate("readingTime", "Reading time: {time} min").replace(
            "{time}",
            String(readTime.value || 0),
        ),
    }));

    function resolveChipLabel(chip: NormalizedMetadataChip): string {
        if (chip.kind === "route") {
            if (!chip.id) return chip.label;
            const key = routeLabelKeys[chip.id];
            if (!key) return resolveRouteFallbackLabel(chip.id);
            return translate(key, resolveRouteFallbackLabel(chip.id));
        }
        return chip.label;
    }

    function resolveChipLabelInGroup(chip: NormalizedMetadataChip, groupKey: string): string {
        if (groupKey === "side" && chip.id) {
            const key = sideLabelKeys[chip.id];
            if (key) return translate(key, chip.label);
        }
        return resolveChipLabel(chip);
    }

    function resolveSourceLabel(source: NormalizedMetadataSource): string {
        if (source.label) return source.label;
        const key = sourceLabelKeys[source.type];
        if (!key) return humanizeToken(source.type);
        return translate(key, humanizeToken(source.type));
    }

    const contextItems = computed<ContextItem[]>(() => {
        const meta = resolvedMetadata.value;
        if (meta.mode === "doc") return [];
        if (meta.groups.length === 0 && meta.sources.length === 0) return [];

        const items: ContextItem[] = [];

        for (const group of meta.groups) {
            if (group.items.length === 0) continue;

            const groupIcon =
                GROUP_KEY_ICONS[group.key] ?? "mdi-label-outline";
            const labels = group.items.map((chip) => resolveChipLabelInGroup(chip, group.key));

            const allHoverLines: string[] = [];
            if (group.items.length === 1) {
                allHoverLines.push(...(group.items[0].hoverLines ?? []));
            } else {
                for (const chip of group.items) {
                    const chipLabel = resolveChipLabelInGroup(chip, group.key);
                    const lines = chip.hoverLines ?? [];
                    if (lines.length > 0) {
                        allHoverLines.push(
                            `${chipLabel}: ${lines.join(", ")}`,
                        );
                    }
                }
            }

            items.push({
                key: group.key,
                icon: groupIcon,
                label: labels.join(" · "),
                hoverLines:
                    allHoverLines.length > 0 ? allHoverLines : undefined,
            });
        }

        for (const source of meta.sources) {
            items.push({
                key: `source-${source.type}-${source.href}`,
                icon: "",
                label: resolveSourceLabel(source),
                href: source.href,
                target: "_blank",
                rel: "noopener noreferrer",
            });
        }

        return items;
    });

    function analyze() {
        if (typeof window === "undefined" || typeof document === "undefined")
            return;

        utils.vitepress.contentAnalysis.cleanupMetadata();

        const mainContainer = window.document.querySelector(
            ".content-container .main",
        );
        if (!mainContainer) return;

        const clone = mainContainer.cloneNode(true) as HTMLElement;
        clone
            .querySelectorAll(".md-dialog-card")
            .forEach((element) => element.remove());

        const images = clone.querySelectorAll<HTMLImageElement>("img");
        imageCount.value = images.length || 0;

        const words = clone.textContent || "";
        const count = utils.content.countWord(words);
        wordCount.value = typeof count === "number" ? count : 0;
    }

    async function refreshDerivedMetadata() {
        await nextTick();
        analyze();
    }

    async function refreshPageViews() {
        if (typeof window === "undefined") return;
        if (!resolvedMetadata.value.metrics.pageViews) {
            pageViewsLoading.value = false;
            pageViewsCount.value = "-";
            return;
        }

        const requestToken = ++pageViewsRequestToken;
        pageViewsCount.value = "-";
        pageViewsLoading.value = true;
        await nextTick();
        const count = await utils.vitepress.fetchBusuanziPageViews();
        if (requestToken !== pageViewsRequestToken) {
            return;
        }
        pageViewsCount.value = count ?? "-";
        pageViewsLoading.value = false;
    }

    onMounted(() => {
        void refreshDerivedMetadata();
        void refreshPageViews();
    });

    watch(
        () => [
            route.path,
            page.value.filePath,
            page.value.lastUpdated,
            resolvedMetadata.value.metrics.pageViews,
        ],
        () => {
            void refreshDerivedMetadata();
            void refreshPageViews();
        },
        { flush: "post" },
    );

    function metricIcon(key: MetadataMetricKey) {
        return utils.vitepress.getMetadataIcon(key);
    }
</script>

<template>
    <div v-if="isMetadata" class="word">
        <div>
            <v-row v-if="hasMetrics" no-gutters>
                <v-col v-for="key in visibleMetricKeys" :key="key">
                    <v-btn
                        class="mx-0 btn btn-icon"
                        rounded="lg"
                        variant="text"
                        density="comfortable"
                        :prepend-icon="metricIcon(key)"
                    >
                        <span v-if="key !== 'pageViews'">
                            {{ metadataContent[key] }}
                        </span>
                        <span
                            v-else
                        >
                            <template v-if="pageViewsLoading">
                                {{ translate("pageViews", "Page views: {count}").replace("{count}", "") }}
                                <i class="fa fa-spinner fa-spin"></i>
                            </template>
                            <template v-else>
                                {{
                                    translate("pageViews", "Page views: {count}").replace(
                                        "{count}",
                                        String(pageViewsCount),
                                    )
                                }}
                            </template>
                        </span>
                    </v-btn>
                </v-col>
            </v-row>

            <v-row v-if="contextItems.length > 0" no-gutters>
                <v-col v-for="item in contextItems" :key="item.key">
                    <v-tooltip
                        v-if="item.hoverLines && item.hoverLines.length > 0"
                        location="bottom"
                        open-delay="150"
                        content-class="article-metadata__tooltip"
                    >
                        <template #activator="{ props: tooltipProps }">
                            <v-btn
                                class="mx-0 btn btn-icon"
                                rounded="lg"
                                variant="text"
                                density="comfortable"
                                :prepend-icon="item.icon || undefined"
                                v-bind="tooltipProps"
                            >
                                {{ item.label }}
                            </v-btn>
                        </template>
                        <div class="article-metadata__tooltip-body">
                            <div
                                v-for="(line, i) in item.hoverLines"
                                :key="i"
                                class="article-metadata__tooltip-line"
                            >
                                {{ line }}
                            </div>
                        </div>
                    </v-tooltip>

                    <v-btn
                        v-else
                        class="mx-0 btn btn-icon"
                        rounded="lg"
                        variant="text"
                        density="comfortable"
                        :prepend-icon="item.icon || undefined"
                        :href="item.href"
                        :target="item.target"
                        :rel="item.rel"
                    >
                        {{ item.label }}
                    </v-btn>
                </v-col>
            </v-row>

            <ProgressLinear />
        </div>
    </div>
    <State />
</template>

<style>
    .word,
    .btn {
        color: var(--metadata-text-color);
        font-size: var(--metadata-font-size);
    }

    .btn {
        padding-left: 12px;
        padding-right: 8px;
        font-weight: 300;
    }

    .btn-icon .v-btn__prepend {
        margin-inline: calc(var(--v-btn-height) / -9) 0px;
        color: var(--metadata-text-color);
        opacity: var(--metadata-icon-opacity);
    }

    /* ── tooltip ──────────────────────────────────────── */

    .article-metadata__tooltip {
        border-radius: var(--border-radius-md) !important;
        border: 1px solid var(--vp-c-divider);
        background: var(--vp-c-bg-soft) !important;
        box-shadow: none;
        padding: 0 !important;
        max-width: min(280px, calc(100vw - 32px));
    }

    .article-metadata__tooltip-body {
        padding: 6px 10px;
    }

    .article-metadata__tooltip-line {
        color: var(--vp-c-text-2);
        font-size: 12px;
        line-height: 1.6;
        font-weight: 400;
        letter-spacing: 0.01em;
    }

    .article-metadata__tooltip-line + .article-metadata__tooltip-line {
        margin-top: 3px;
        padding-top: 3px;
        border-top: 1px dashed color-mix(in srgb, var(--vp-c-divider) 60%, transparent);
    }
</style>
