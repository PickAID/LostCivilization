<template>
    <div class="tags-page">
        <header class="tags-page__hero">
            <h1 class="tags-page__title">
                {{ frontmatter.value?.title || t.pageTitle }}
            </h1>
            <div v-if="!isLoading && totalTags > 0" class="tags-page__hero-stats">
                <span class="tags-page__hero-pill">
                    <strong>{{ totalTags }}</strong>
                    {{ t.totalTags }}
                </span>
                <span class="tags-page__hero-pill">
                    <strong>{{ totalPages }}</strong>
                    {{ t.totalPages }}
                </span>
                <span class="tags-page__hero-pill">
                    <strong>{{ filteredTags.length }}</strong>
                    {{ t.matchingTags }}
                </span>
            </div>
        </header>

        <div v-if="isLoading" class="tags-page__status">
            <v-progress-circular indeterminate color="primary" size="28" />
            <p>{{ t.loadingTagData }}</p>
        </div>

        <div v-else-if="loadError" class="tags-page__status">
            <p>{{ t.loadingError }}</p>
            <v-btn variant="outlined" rounded @click="loadTagData">{{ t.retry }}</v-btn>
        </div>

        <div v-else-if="totalTags === 0" class="tags-page__status">
            <p>{{ t.noTagsFound }}</p>
        </div>

        <template v-else>
            <section class="tags-page__panel tags-page__panel--controls">
                <div class="toolbar">
                    <div class="toolbar__search-wrap">
                        <v-text-field
                            v-model="searchQuery"
                            :placeholder="t.searchPlaceholder"
                            prepend-inner-icon="mdi-magnify"
                            variant="outlined"
                            density="comfortable"
                            rounded
                            hide-details
                            class="tags-page__search"
                        />
                    </div>

                    <div class="toolbar__side">
                        <span class="toolbar__hint muted small">
                            {{ filteredTags.length }} {{ t.matchingTags }}
                        </span>

                        <v-btn-toggle
                            v-model="viewMode"
                            mandatory
                            density="comfortable"
                            rounded
                            variant="outlined"
                            divided
                            color="primary"
                            class="toolbar__toggle"
                        >
                            <v-btn value="cloud" size="small">{{ t.tagCloud }}</v-btn>
                            <v-btn value="list" size="small">{{ t.list }}</v-btn>
                        </v-btn-toggle>
                    </div>
                </div>
            </section>

            <section class="tags-page__panel tags-page__panel--browser">
                <div class="tags-page__section-head">
                    <div class="tags-page__section-copy">
                        <p class="tags-page__section-kicker">Browse</p>
                        <h2 class="tags-page__section-title">
                            {{ viewMode === 'cloud' ? t.tagCloud : t.list }}
                        </h2>
                    </div>
                    <p class="tags-page__section-meta muted small">
                        {{ filteredTags.length }} {{ t.matchingTags }}
                    </p>
                </div>

                <div v-if="viewMode === 'cloud'" class="cloud">
                    <TagBadge
                        v-for="tag in filteredTags"
                        :key="tag.name"
                        :tag="tag.name"
                        :count="tag.count"
                        :clickable="true"
                        class="cloud__tag"
                        :class="{ 'cloud__tag--active': selectedTags.includes(tag.name) }"
                        :style="{ fontSize: tagSize(tag.count) }"
                        @click="toggleTag(tag.name)"
                    />
                </div>

                <div v-else class="list">
                    <v-card
                        v-for="tag in filteredTags"
                        :key="tag.name"
                        variant="flat"
                        :ripple="false"
                        hover
                        :class="[
                            'list__item',
                            { 'list__item--active': selectedTags.includes(tag.name) },
                        ]"
                        @click="toggleTag(tag.name)"
                    >
                        <div class="list__item-inner">
                            <div class="list__item-head">
                                <v-chip
                                    :color="getTagColor(tag.name)"
                                    variant="tonal"
                                    size="small"
                                    label
                                >{{ tag.name }}</v-chip>
                                <span class="muted small">{{ tag.count }} {{ t.pages }}</span>
                            </div>
                            <p class="list__item-preview muted small">
                                {{ tag.pages.slice(0, 3).map((p) => p?.title || p?.path || 'Untitled').join(', ') }}
                                <span v-if="tag.pages.length > 3" class="dimmed">
                                    {{ t.morePages.replace('{count}', String(tag.pages.length - 3)) }}
                                </span>
                            </p>
                        </div>
                    </v-card>
                </div>
            </section>

            <section v-if="selectedTags.length > 0" class="results tags-page__panel tags-page__panel--results">
                <div class="results__header">
                    <div class="results__heading-wrap">
                        <p class="tags-page__section-kicker">Selected</p>
                        <h2 class="results__heading">
                            {{ t.selectedTags }}
                        </h2>
                        <div class="results__chips">
                            <v-chip
                                v-for="tag in selectedTags"
                                :key="tag"
                                closable
                                size="small"
                                variant="tonal"
                                color="primary"
                                @click:close="toggleTag(tag)"
                            >{{ tag }}</v-chip>
                        </div>
                    </div>
                    <div class="results__header-actions">
                        <div class="results__meta-badge">
                            <strong>{{ selectedTagPages.length }}</strong>
                            <span>{{ t.pages }}</span>
                        </div>
                        <v-btn variant="outlined" size="small" class="results__clear-btn" @click="clearSelection">
                            {{ t.clearSelection }}
                        </v-btn>
                    </div>
                </div>

                <div v-if="selectedTagPages.length > 0" class="results__list">
                    <v-card
                        v-for="pg in selectedTagPages"
                        :key="pg.path"
                        tag="a"
                        :href="pg.path"
                        variant="flat"
                        :ripple="false"
                        hover
                        class="result-row"
                    >
                        <div class="result-row__inner">
                            <div class="result-row__head">
                                <h3 class="result-row__title">{{ pg.title || pg.path || 'Untitled' }}</h3>
                                <div v-if="pg.progress != null" class="result-row__progress">
                                    <v-progress-linear
                                        :model-value="pg.progress"
                                        color="primary"
                                        rounded
                                        height="4"
                                        style="width: 56px;"
                                    />
                                    <span class="dimmed small">{{ pg.progress }}%</span>
                                </div>
                            </div>
                            <p v-if="pg.description" class="result-row__desc muted">{{ pg.description }}</p>
                            <div class="result-row__tags">
                                <v-chip
                                    v-for="tg in (pg.tags || []).slice(0, 4)"
                                    :key="tg"
                                    size="x-small"
                                    variant="tonal"
                                    label
                                >{{ tg }}</v-chip>
                                <span v-if="(pg.tags || []).length > 4" class="dimmed small">+{{ (pg.tags || []).length - 4 }}</span>
                            </div>
                        </div>
                    </v-card>
                </div>

                <div v-else class="tags-page__status tags-page__status--compact">
                    <p>{{ t.noMatchingPages }}</p>
                    <p class="dimmed small">{{ t.noMatchingPagesHint }}</p>
                </div>
            </section>

            <footer class="stats tags-page__panel tags-page__panel--stats">
                <v-card v-for="stat in statsItems" :key="stat.label" variant="flat" class="stats__item">
                    <div class="stats__item-inner">
                        <span class="stats__number">{{ stat.value }}</span>
                        <span class="muted small">{{ stat.label }}</span>
                    </div>
                </v-card>
            </footer>
        </template>
    </div>
</template>

<script setup lang="ts">
import { getDefaultLanguage, resolveLanguageCode } from "@config/project-api";
import { useSafeI18n } from "@utils/i18n/locale";
import { useData, withBase } from "vitepress";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import TagBadge from "../ui/TagBadge.vue";

interface PageInfo {
	title: string;
	path: string;
	tags: string[];
	description?: string;
	progress?: number;
}

interface TagInfo {
	name: string;
	count: number;
	pages: PageInfo[];
}

type TagData = Record<string, TagInfo>;

const { t } = useSafeI18n("tags-page", {
	pageTitle: "Tags",
	loadingTagData: "Loading tag data...",
	loadingError: "Failed to load tag data. Please try again.",
	retry: "Retry",
	noTagsFound: "No tags found.",
	searchPlaceholder: "Search tags...",
	tagCloud: "Cloud",
	list: "List",
	pages: "pages",
	morePages: "and {count} more.",
	selectedTags: "Pages with tags:",
	clearSelection: "Clear",
	noMatchingPages: "No pages match all selected tags.",
	noMatchingPagesHint: "Try removing some tags to see more results.",
	totalTags: "Total Tags",
	totalPages: "Total Pages",
	matchingTags: "Matching Tags",
});

const { frontmatter, lang } = useData();

const tagData = ref<TagData>({});
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const searchQuery = ref("");
const viewMode = ref<"cloud" | "list">("cloud");
const selectedTags = ref<string[]>([]);

const filteredTags = computed(() => {
	const tags = Object.values(tagData.value);
	const sorted = tags.sort((a, b) => b.count - a.count);
	if (!searchQuery.value) return sorted;
	const q = searchQuery.value.toLowerCase();
	return sorted.filter((tag) => tag.name.toLowerCase().includes(q));
});

function tagSize(count: number): string {
	const tags = Object.values(tagData.value);
	if (!tags.length) return "1rem";
	const max = Math.max(...tags.map((t) => t.count));
	const min = Math.min(...tags.map((t) => t.count));
	const range = max - min || 1;
	const t = (count - min) / range;
	return `${0.82 + t * 0.72}rem`;
}

const selectedTagPages = computed<PageInfo[]>(() => {
	if (selectedTags.value.length === 0) return [];
	if (selectedTags.value.length === 1) {
		return (tagData.value[selectedTags.value[0]]?.pages ?? []).filter(
			(pg): pg is PageInfo => Boolean(pg?.path),
		);
	}

	const sets = selectedTags.value.map(
		(tag) =>
			new Set(
				(tagData.value[tag]?.pages ?? [])
					.filter((pg): pg is PageInfo => Boolean(pg?.path))
					.map((p) => p.path),
			),
	);
	const first = (tagData.value[selectedTags.value[0]]?.pages ?? []).filter(
		(pg): pg is PageInfo => Boolean(pg?.path),
	);
	return first.filter((pg) => sets.every((s) => s.has(pg.path)));
});

const totalTags = computed(() => Object.keys(tagData.value).length);
const totalPages = computed(() =>
	Object.values(tagData.value).reduce((sum, tag) => sum + tag.count, 0),
);

const statsItems = computed(() => [
	{ value: totalTags.value, label: t.totalTags },
	{ value: totalPages.value, label: t.totalPages },
	{ value: filteredTags.value.length, label: t.matchingTags },
]);

function getTagColor(tagName: string): string {
	const colorMap: Record<string, string> = {
		minecraft: "#62c462",
		neoforge: "#ff6b35",
		forge: "#ff6b35",
		fabric: "#dba213",
		tutorial: "#3b82f6",
		api: "#8b5cf6",
		guide: "#10b981",
		kubejs: "#5518fe",
	};
	const lower = tagName.toLowerCase();
	for (const [key, color] of Object.entries(colorMap)) {
		if (lower.includes(key)) return color;
	}
	// Hash-based fallback
	const fallbacks = [
		"#22c55e",
		"#eab308",
		"#6b7280",
		"#dc2626",
		"#2563eb",
		"#059669",
		"#7c3aed",
		"#f43f5e",
		"#a855f7",
		"#14b8a6",
	];
	let hash = 0;
	for (let i = 0; i < tagName.length; i++)
		hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
	return fallbacks[Math.abs(hash) % fallbacks.length];
}

function toggleTag(tagName: string) {
	const next = selectedTags.value.includes(tagName)
		? selectedTags.value.filter((t) => t !== tagName)
		: [...selectedTags.value, tagName];
	selectedTags.value = next;
	syncTagsToUrl(next);
}

function clearSelection() {
	selectedTags.value = [];
	syncTagsToUrl([]);
}

function syncTagsToUrl(tags: string[]) {
	const url = new URL(window.location.href);
	if (tags.length > 0) {
		url.searchParams.set("tags", tags.join(","));
	} else {
		url.searchParams.delete("tags");
	}
	window.history.pushState({}, "", url.toString());
}

function readTagsFromUrl(): string[] {
	const param = new URLSearchParams(window.location.search).get("tags");
	return param ? param.split(",").filter(Boolean) : [];
}

function onPopState() {
	selectedTags.value = readTagsFromUrl();
}

async function loadTagData() {
	isLoading.value = true;
	loadError.value = null;

	try {
		const langCode = resolveLanguageCode(lang.value);
		const defaultCode = getDefaultLanguage().code;
		const urls = Array.from(
			new Set([
				withBase(`/data/${langCode}/tags.json`),
				withBase(`/data/${defaultCode}/tags.json`),
			]),
		);

		let loaded: { tags?: TagData } | null = null;
		for (const url of urls) {
			const res = await fetch(url);
			if (!res.ok) continue;
			loaded = await res.json();
			break;
		}

		tagData.value = loaded?.tags ?? {};
		if (!loaded) loadError.value = t.loadingError;
	} catch {
		loadError.value = t.loadingError;
		tagData.value = {};
	} finally {
		isLoading.value = false;
	}
}

watch(lang, (next, prev) => {
	if (next !== prev) loadTagData();
});

onMounted(() => {
	loadTagData();
	selectedTags.value = readTagsFromUrl();
	window.addEventListener("popstate", onPopState);
});

onBeforeUnmount(() => {
	window.removeEventListener("popstate", onPopState);
});
</script>

<style scoped>
.tags-page {
    width: 100%;
    max-width: 100%;
    margin: clamp(1.35rem, 2.9vw, 2.05rem) 0 0;
    padding-inline: clamp(1.34rem, 3vw, 2.55rem);
    padding-bottom: clamp(0.9rem, 2vw, 1.45rem);
    display: grid;
    gap: 1.45rem;
    box-sizing: border-box;
}

.tags-page__panel {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
}

.tags-page__panel--browser,
.tags-page__panel--stats {
    padding: 1.05rem;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
    border-radius: 18px;
    background: color-mix(in srgb, var(--vp-c-bg-soft) 84%, var(--vp-c-bg) 16%);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 72%, transparent);
}

.tags-page__hero {
    display: grid;
    gap: 0.8rem;
    max-width: 74ch;
    padding: 0 0 1.05rem;
    border-bottom: 1px solid color-mix(in srgb, var(--vp-c-divider) 82%, transparent);
}

.tags-page__title {
    margin: 0;
    font-size: clamp(2rem, 3.2vw, 2.7rem);
    font-weight: 760;
    letter-spacing: -0.04em;
    color: var(--vp-c-text-1);
    line-height: 1;
    text-wrap: balance;
}

.tags-page__hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
}

.tags-page__hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.36rem 0.72rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 560;
    color: var(--vp-c-text-2);
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 74%, transparent);
    background: color-mix(in srgb, var(--vp-c-bg-soft) 76%, var(--vp-c-bg) 24%);
}

.tags-page__hero-pill strong {
    font-size: 0.8rem;
    color: var(--vp-c-text-1);
}

.muted { color: var(--vp-c-text-2); }
.dimmed { color: var(--vp-c-text-3); }
.small { font-size: 0.85rem; }

.tags-page__status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 0;
    gap: 1rem;
    text-align: center;
    color: var(--vp-c-text-3);
}
.tags-page__status p { margin: 0; font-size: 0.95rem; color: var(--vp-c-text-2); }
.tags-page__status--compact { padding: 2rem 0 1rem; }

.tags-page__section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.95rem;
}

.tags-page__section-copy {
    display: grid;
    gap: 0.2rem;
}

.tags-page__section-kicker {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--vp-c-brand-1) 72%, var(--vp-c-text-2));
}

.tags-page__section-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 730;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--vp-c-text-1);
}

.tags-page__section-meta {
    margin: 0;
}

/* Toolbar */
.toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.85rem 1rem;
    align-items: center;
    padding: 0.9rem 0.95rem;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 82%, transparent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--vp-c-bg-soft) 86%, var(--vp-c-bg) 14%);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 74%, transparent);
}

.toolbar__search-wrap {
    min-width: 0;
    width: 100%;
}

.tags-page__search {
    width: 100%;
    max-width: 100%;
}

.toolbar__side {
    display: inline-grid;
    grid-auto-flow: column;
    align-items: center;
    gap: 0.55rem;
    margin-left: auto;
    justify-content: end;
    padding: 0.2rem;
    border-radius: 14px;
    background: color-mix(in srgb, var(--vp-c-bg) 74%, var(--vp-c-bg-soft) 26%);
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 70%, transparent);
    min-width: fit-content;
}

.toolbar__hint {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    padding: 0.32rem 0.62rem;
    border-radius: 999px;
    border: 0;
    background: transparent;
    font-weight: 560;
}

.toolbar__toggle {
    border-radius: 12px;
    overflow: hidden;
    background: color-mix(in srgb, var(--vp-c-bg) 88%, var(--vp-c-bg-soft) 12%);
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
    padding: 0.16rem;
}

.toolbar__toggle :deep(.v-btn) {
    letter-spacing: 0;
    text-transform: none;
    font-weight: 650;
    min-width: 78px;
    border-radius: 9px !important;
    color: var(--vp-c-text-2);
    background: transparent;
    box-shadow: none !important;
    min-height: 34px;
}

.toolbar__toggle :deep(.v-btn--active) {
    background: color-mix(in srgb, var(--vp-c-bg-soft) 100%, transparent) !important;
    color: var(--vp-c-text-1) !important;
    box-shadow: 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 72%, transparent) !important;
}

.tags-page__search :deep(.v-field) {
    border-radius: 12px;
    background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-bg-soft) 8%);
    box-shadow: none;
}

.tags-page__search :deep(.v-field__input) {
    min-height: 42px;
}

.tags-page__search :deep(.v-field__outline) {
    --v-field-border-opacity: 0.75;
}

/* Cloud: flex-wrap word cloud */
.cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 0.72rem;
    margin: 0;
    align-items: center;
    min-height: 6.25rem;
}

.cloud :deep(.tag-badge) {
    padding: 0.54em 0.84em;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--tag-color) 18%, var(--vp-c-divider));
    background: color-mix(in srgb, var(--vp-c-bg) 84%, var(--tag-color) 16%);
    color: color-mix(in srgb, var(--vp-c-text-1) 90%, var(--tag-color));
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 65%, transparent);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease,
        background-color 0.2s ease;
}

.cloud :deep(.tag-badge__text) {
    font-weight: 620;
    letter-spacing: -0.01em;
}

.cloud :deep(.tag-badge__count) {
    opacity: 0.72;
    font-weight: 600;
}

.cloud :deep(.tag-badge:hover) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--vp-c-text-1) 8%, transparent);
}

.cloud :deep(.cloud__tag--active) {
    border-color: color-mix(in srgb, var(--tag-color) 40%, var(--vp-c-divider));
    background: color-mix(in srgb, var(--vp-c-bg) 72%, var(--tag-color) 28%);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--tag-color) 14%, transparent);
}

/* List grid */
.list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.85rem;
}
.list__item {
    cursor: pointer;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent) !important;
    background: color-mix(in srgb, var(--vp-c-bg-soft) 88%, var(--vp-c-bg) 12%) !important;
    border-radius: 16px !important;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease !important;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 72%, transparent);
}
.list__item:hover {
    border-color: color-mix(in srgb, var(--vp-c-brand-1) 28%, var(--vp-c-divider)) !important;
    box-shadow: 0 14px 28px color-mix(in srgb, var(--vp-c-text-1) 8%, transparent) !important;
    transform: translateY(-1px);
}
.list__item--active {
    border-color: color-mix(in srgb, var(--vp-c-brand-1) 34%, var(--vp-c-divider)) !important;
    box-shadow: 0 14px 28px color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent) !important;
}
.list__item :deep(.v-card__overlay) { display: none; }
.list__item-inner { padding: 1rem 1rem 0.95rem; text-align: left; }
.list__item-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.82rem; }
.list__item-preview { margin: 0; line-height: 1.72; }

.list__item :deep(.v-chip) {
    font-weight: 650;
}

/* Results */
.results {
    display: grid;
    gap: 1rem;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
    border-radius: 18px;
    padding: 1rem;
    background: color-mix(in srgb, var(--vp-c-bg-soft) 90%, var(--vp-c-bg) 10%);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 72%, transparent);
}

.results__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding-bottom: 1.05rem;
    border-bottom: 1px solid color-mix(in srgb, var(--vp-c-divider) 78%, transparent);
}

.results__heading-wrap {
    display: grid;
    gap: 0.55rem;
}

.results__heading {
    margin: 0;
    font-size: 1.08rem;
    font-weight: 740;
    letter-spacing: -0.02em;
}

.results__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.42rem;
}

.results__header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding: 0.22rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--vp-c-bg-soft) 74%, var(--vp-c-bg) 26%);
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 74%, transparent);
}

.results__meta-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    min-height: 34px;
    padding: 0.42rem 0.8rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%);
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 76%, transparent);
    color: var(--vp-c-text-2);
    line-height: 1;
    font-size: 0.76rem;
    font-weight: 620;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 78%, transparent);
}

.results__meta-badge strong {
    font-size: 0.8rem;
    font-weight: 760;
    color: var(--vp-c-text-1);
}

.results__meta-badge span {
    display: inline-block;
    transform: translateY(-0.02rem);
}

.results__clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    min-height: 34px !important;
    padding: 0.42rem 0.8rem !important;
    border-radius: 999px !important;
    background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%) !important;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 76%, transparent) !important;
    color: var(--vp-c-text-2) !important;
    line-height: 1;
    font-size: 0.76rem !important;
    font-weight: 620 !important;
    letter-spacing: 0 !important;
    text-transform: none !important;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 78%, transparent) !important;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease;
}

.results__clear-btn :deep(.v-btn__content) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
}

.results__clear-btn :deep(.v-btn__overlay),
.results__clear-btn :deep(.v-btn__underlay) {
    display: none;
}

.results__clear-btn:hover {
    border-color: color-mix(in srgb, var(--vp-c-brand-1) 18%, var(--vp-c-divider)) !important;
    background: color-mix(in srgb, var(--vp-c-brand-soft) 10%, var(--vp-c-bg-soft) 90%) !important;
    color: var(--vp-c-text-1) !important;
}

.results__chips :deep(.v-chip) {
    font-weight: 640;
}

.result-row__tags :deep(.v-chip) {
    font-weight: 600;
}

.results__list { display: grid; gap: 0.75rem; }

.result-row {
    text-decoration: none !important;
    color: inherit !important;
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 78%, transparent) !important;
    background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--vp-c-bg-soft) 6%) !important;
    border-radius: 14px !important;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease !important;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 72%, transparent);
}
.result-row:hover {
    border-color: color-mix(in srgb, var(--vp-c-brand-1) 24%, var(--vp-c-divider)) !important;
    box-shadow: 0 16px 30px color-mix(in srgb, var(--vp-c-text-1) 8%, transparent) !important;
    transform: translateY(-1px);
}
.result-row :deep(.v-card__overlay) { display: none; }
.result-row__inner { display: grid; gap: 0.68rem; padding: 1rem 1.05rem; }
.result-row__head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.result-row__title { margin: 0; font-size: 0.99rem; font-weight: 720; color: var(--vp-c-text-1); letter-spacing: -0.015em; }
.result-row__progress { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.result-row__desc { margin: 0; font-size: 0.9rem; line-height: 1.64; max-width: 82ch; }
.result-row__tags { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }

/* Stats */
.stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
}
.stats__item {
    border: 1px solid color-mix(in srgb, var(--vp-c-divider) 78%, transparent) !important;
    background: color-mix(in srgb, var(--vp-c-bg-soft) 84%, var(--vp-c-bg) 16%) !important;
    border-radius: 14px !important;
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--vp-c-bg) 72%, transparent);
}
.stats__item :deep(.v-card__overlay) { display: none; }
.stats__item-inner { padding: 0.92rem 0.98rem; }
.stats__number {
    display: block; font-size: 1.6rem; font-weight: 740;
    color: var(--vp-c-text-1); line-height: 1; margin-bottom: 0.45rem; letter-spacing: -0.02em;
}

@media (max-width: 960px) {
    .toolbar {
        grid-template-columns: 1fr;
        align-items: stretch;
    }

    .toolbar__side {
        margin-left: 0;
        width: 100%;
        justify-content: space-between;
        padding: 0.3rem;
    }

    .stats { grid-template-columns: 1fr; }

    .tags-page__section-head {
        align-items: start;
        flex-direction: column;
    }
}
@media (max-width: 768px) {
    .tags-page {
        margin-top: 1.15rem;
        padding-inline: clamp(1.02rem, 4.4vw, 1.22rem);
        padding-bottom: 1.1rem;
        gap: 1.12rem;
    }
    .tags-page__hero {
        padding-bottom: 1rem;
    }
    .toolbar {
        grid-template-columns: 1fr;
        gap: 0.78rem;
        padding: 0.82rem;
    }
    .tags-page__search { max-width: none; }
    .tags-page__search :deep(.v-input),
    .tags-page__search :deep(.v-input__control),
    .tags-page__search :deep(.v-field) {
        width: 100%;
    }
    .tags-page__search :deep(.v-field) {
        border-radius: 14px;
        background: color-mix(in srgb, var(--vp-c-bg) 96%, var(--vp-c-bg-soft) 4%);
    }
    .tags-page__search :deep(.v-field__input) {
        min-height: 44px;
    }
    .toolbar__side {
        margin-left: 0;
        width: 100%;
        grid-auto-flow: row;
        align-items: stretch;
        justify-content: stretch;
        gap: 0.5rem;
        padding: 0;
        border: 0;
        background: transparent;
    }
    .toolbar__hint {
        justify-content: flex-start;
        padding: 0;
    }
    .toolbar__toggle {
        width: 100%;
        padding: 0.18rem;
    }
    .toolbar__toggle :deep(.v-btn) {
        flex: 1 1 0;
    }
    .results__header { align-items: flex-start; }
    .results__header-actions {
        width: 100%;
        justify-content: flex-start;
        align-items: center;
        gap: 0.45rem;
        padding: 0;
        border: 0;
        background: transparent;
    }
    .results__meta-badge,
    .results__clear-btn {
        min-height: 36px;
    }
    .results__clear-btn {
        padding-inline: 0.78rem !important;
    }
    .result-row__head { flex-direction: column; align-items: flex-start; }
    .cloud,
    .results,
    .tags-page__panel--browser,
    .tags-page__panel--stats {
        padding: 0.9rem;
        border-radius: 16px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .cloud :deep(.cloud__tag),
    .list__item,
    .result-row {
        transition: none !important;
    }
}
</style>
