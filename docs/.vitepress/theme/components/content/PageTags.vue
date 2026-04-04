<template>
    <div v-if="tags.length > 0" class="page-tags" aria-label="Page tags">
        <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            class="page-tag"
            :title="tag"
            :style="getTagStyle(tag)"
            @click="navigateToTag(tag)"
        >
            <span class="page-tag__prefix">#</span>
            <span class="page-tag__label">{{ tag }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { useRouter, useData, withBase } from "vitepress";
    import { resolveLanguagePathSegment } from "@config/project-api";

    interface Props {
        tags?: string[];
    }

    const props = defineProps<Props>();
    const router = useRouter();
    const { frontmatter, lang } = useData();

    const tags = computed(() => props.tags || frontmatter.value.tags || []);

    function navigateToTag(tag: string) {
        const segment = resolveLanguagePathSegment(lang.value);
        router.go(withBase(`/${segment}/tags?tags=${encodeURIComponent(tag)}`));
    }

    function hashTag(tag: string): number {
        let hash = 0;
        for (const char of tag) {
            hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
        }
        return hash;
    }

    function getTagStyle(tag: string): Record<string, string> {
        const hash = hashTag(tag);
        const hue = hash % 360;
        const saturation = 46 + (hash % 18);
        const lightness = 44 + (hash % 10);

        return {
            "--page-tag-accent": `hsl(${hue}deg ${saturation}% ${lightness}%)`,
        };
    }
</script>

<style scoped>
    .page-tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.3rem 0.85rem;
        margin: 0.18rem 0 0.95rem;
        max-width: 48rem;
        font-size: var(--metadata-font-size, 0.84rem);
        line-height: 1.45;
    }

    .page-tag {
        --page-tag-accent: var(--vp-c-brand-1);
        --page-tag-text-color: color-mix(
            in srgb,
            var(--metadata-text-color, var(--vp-c-text-2)) 58%,
            var(--page-tag-accent) 42%
        );
        display: inline-flex;
        align-items: baseline;
        gap: 0.2rem;
        min-width: 0;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--page-tag-text-color);
        font: inherit;
        line-height: inherit;
        cursor: pointer;
        transition: color 0.18s ease, opacity 0.18s ease;
    }

    .page-tag:hover,
    .page-tag:focus-visible {
        color: color-mix(in srgb, var(--page-tag-accent) 88%, var(--vp-c-text-1) 12%);
        outline: none;
    }

    .page-tag__prefix {
        color: var(--page-tag-accent);
        opacity: 0.72;
        flex: 0 0 auto;
    }

    .page-tag__label {
        min-width: 0;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    @media (max-width: 768px) {
        .page-tags {
            gap: 0.26rem 0.68rem;
            margin-bottom: 0.82rem;
            max-width: 100%;
        }
    }
</style>
