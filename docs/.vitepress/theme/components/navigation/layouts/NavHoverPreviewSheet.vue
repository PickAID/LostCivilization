<script lang="ts" setup>
    import { computed } from "vue";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";
    import type { NavLink, NavPreviewPanel } from "@utils/config/navTypes";
    import LottieDisplay from "../../hero/image/LottieDisplay.vue";
    import MarkdownIt from "markdown-it";

    /**
     * markdown-it instance used to render the `body` field of `NavLinkPreview`.
     * `html: true` enables raw HTML inside body strings (e.g. `<span style="color:…">`).
     */
    const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

    const props = defineProps<{
        /** The nav link whose preview is being displayed. `null` falls back to dropdown preview. */
        link?: NavLink | null;
        /** Optional dropdown-level preview shown when no leaf link is active. */
        preview?: NavPreviewPanel | null;
    }>();

    /** Resolved preview config from the active link. */
    const previewConfig = computed(() => props.link?.preview || props.preview || null);

    /** Title shown in the preview header. Falls back to the link's `text`. */
    const previewTitle = computed(
        () => previewConfig.value?.title || props.link?.text || "",
    );

    /**
     * Raw Markdown/HTML string for the preview body.
     * Prefers `body` over `desc` (the latter is a single-line fallback).
     */
    const previewText = computed(() => {
        const richBody = previewConfig.value?.body;
        if (typeof richBody === "string" && richBody.trim()) return richBody;
        const desc =
            previewConfig.value?.desc ||
            props.link?.desc ||
            props.preview?.desc ||
            "";
        return typeof desc === "string" ? desc : "";
    });

    /** Optional media element config. */
    const previewMedia = computed(() => previewConfig.value?.media || null);

    const previewMediaType = computed(() => previewMedia.value?.type || "image");
    const previewMediaVariant = computed(
        () => previewMedia.value?.variant || "plain",
    );

    /** Resolved (base-prefixed) media URL. */
    const previewMediaSrc = computed(() =>
        resolveAssetWithBase(previewMedia.value?.src),
    );

    /** Accessible alt text for the media element. */
    const previewMediaAlt = computed(
        () => previewMedia.value?.alt || previewTitle.value || "preview-media",
    );

    /** CSS aspect-ratio for the media container. */
    const previewAspect = computed(
        () => previewMedia.value?.aspect || "16 / 9",
    );

    function applyLimitedRichPlaceholders(source: string): string {
        const richText = previewConfig.value?.richText;
        const hasPlaceholders =
            Array.isArray(richText?.placeholders) &&
            richText.placeholders.length > 0;

        if (richText?.mode !== "limited-rich" && !hasPlaceholders) {
            return source;
        }

        const placeholders = new Set(richText?.placeholders || ["bold", "image"]);
        let result = source;

        if (placeholders.has("bold")) {
            result = result.replace(
                /\{bold:\s*([^}]+?)\s*\}/gi,
                (_match, content: string) => `**${content.trim()}**`,
            );
        }

        if (placeholders.has("image")) {
            result = result.replace(
                /\{image:\s*([^}|]+?)\s*(?:\|\s*([^}]+?)\s*)?\}/gi,
                (_match, path: string, alt?: string) => {
                    const src = path.trim();
                    if (!src) return "";
                    return `![${(alt || "").trim()}](${src})`;
                },
            );
        }

        return result;
    }

    /**
     * Fully rendered HTML string for `v-html`.
     * Runs `previewText` through markdown-it, then prefixes any root-relative
     * `src` attributes so they resolve correctly under the VitePress base path.
     */
    const renderedBody = computed(() => {
        if (!previewText.value) return "";
        const normalizedText = applyLimitedRichPlaceholders(previewText.value);
        let html = md.render(normalizedText);
        // Prefix root-relative image sources to match the configured base path
        html = html.replace(/src="(\/[^"]+)"/g, (_match, path) => {
            return `src="${resolveAssetWithBase(path)}"`;
        });
        return html;
    });
</script>

<template>
    <article class="nav-preview-sheet">
        <!-- Optional media block: image, video, lottie, or plain background -->
        <div
            v-if="previewMedia && (previewMediaSrc || previewMedia.background)"
            class="preview-media"
            :class="[
                `preview-media--${previewMediaType}`,
                `preview-media--${previewMediaVariant}`,
            ]"
            :style="{ aspectRatio: previewAspect }"
        >
            <div
                v-if="
                    previewMedia.type === 'screenshot' &&
                    previewMediaVariant === 'framed'
                "
                class="preview-browser-chrome"
            >
                <span class="preview-browser-dots">
                    <i />
                    <i />
                    <i />
                </span>
                <span class="preview-browser-label">{{ previewMediaAlt }}</span>
            </div>

            <div class="preview-media-canvas">
                <img
                    v-if="
                        (previewMedia.type === 'image' ||
                            previewMedia.type === 'svg' ||
                            previewMedia.type === 'screenshot') &&
                        previewMediaSrc
                    "
                    :src="previewMediaSrc"
                    :alt="previewMediaAlt"
                    loading="lazy"
                />

                <video
                    v-else-if="previewMedia.type === 'video' && previewMediaSrc"
                    :src="previewMediaSrc"
                    autoplay
                    muted
                    loop
                    playsinline
                />

                <LottieDisplay
                    v-else-if="previewMedia.type === 'lottie' && previewMediaSrc"
                    :src="previewMediaSrc"
                    :alt="previewMediaAlt"
                    :loop="true"
                    :autoplay="true"
                    fit="cover"
                />

                <div
                    v-else-if="previewMedia.background"
                    class="preview-media-bg"
                    :style="{ background: previewMedia.background }"
                />
            </div>
        </div>

        <!-- Header: title + optional keyboard shortcut hint -->
        <header class="preview-header">
            <h4 class="preview-title">{{ previewTitle }}</h4>
            <kbd v-if="link?.shortcut" class="preview-shortcut">
                {{ link.shortcut }}
            </kbd>
        </header>

        <!-- Body: full Markdown rendered via markdown-it -->
        <div v-if="renderedBody" class="preview-rich" v-html="renderedBody" />
    </article>
</template>

<style scoped>
    /* ── Container ───────────────────────────────── */
    .nav-preview-sheet {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
        padding: 16px;
        border-radius: 16px;
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        transform: translateZ(0);
    }

    /* ── Media block ─────────────────────────────── */
    .preview-media {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: 12px;
        background: transparent;
        border: 0;
        box-shadow: none;
    }

    .preview-media--framed {
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 62%, transparent);
        background:
            radial-gradient(
                circle at top,
                color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent),
                transparent 54%
            ),
            color-mix(in srgb, var(--vp-c-bg-soft) 94%, transparent);
        box-shadow:
            0 18px 48px -24px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        isolation: isolate;
    }

    .preview-media--framed::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
            linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.06) 0%,
                transparent 28%
            ),
            linear-gradient(
                180deg,
                transparent 56%,
                rgba(0, 0, 0, 0.22) 100%
            );
        pointer-events: none;
    }

    .preview-media--screenshot.preview-media--framed {
        padding: 0;
        background:
            linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.06) 0%,
                rgba(255, 255, 255, 0.02) 100%
            ),
            color-mix(in srgb, var(--vp-c-bg-soft) 96%, transparent);
    }

    .preview-browser-chrome {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 34px;
        padding: 0 12px;
        border-bottom: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 56%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg-elv) 82%, transparent);
    }

    .preview-browser-dots {
        display: inline-flex;
        gap: 6px;
        flex: 0 0 auto;
    }

    .preview-browser-dots i {
        display: block;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--vp-c-text-3) 52%, transparent);
    }

    .preview-browser-dots i:nth-child(1) {
        background: rgba(255, 95, 86, 0.78);
    }

    .preview-browser-dots i:nth-child(2) {
        background: rgba(255, 189, 46, 0.78);
    }

    .preview-browser-dots i:nth-child(3) {
        background: rgba(39, 201, 63, 0.78);
    }

    .preview-browser-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--vp-c-text-2);
        font-size: 11px;
        letter-spacing: 0.02em;
    }

    .preview-media-canvas {
        position: relative;
        min-height: 0;
        width: 100%;
        height: 100%;
    }

    .preview-media img,
    .preview-media video,
    .preview-media :deep(.lottie-display) {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .preview-media-bg {
        width: 100%;
        height: 100%;
    }

    /* ── Header ──────────────────────────────────── */
    .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-width: 0;
    }

    .preview-title {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.01em;
        color: var(--vp-c-text-1);
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
        line-height: 1.35;
    }

    .preview-shortcut {
        flex-shrink: 0;
        padding: 1px 6px;
        border-radius: 6px;
        border: 1px solid var(--vp-c-divider);
        background: var(--vp-c-bg-soft);
        color: var(--vp-c-text-2);
        font-size: 10px;
        line-height: 1.4;
        font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", monospace;
    }

    /* ── Rich body — full markdown-it output ─────── */
    .preview-rich {
        margin: 0;
        min-width: 0;
        font-size: 12.5px;
        line-height: 1.65;
        color: var(--vp-c-text-2);
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .preview-rich :deep(p) {
        margin: 0 0 8px;
    }
    .preview-rich :deep(p:last-child) {
        margin-bottom: 0;
    }

    /* Headings */
    .preview-rich :deep(h3),
    .preview-rich :deep(h4) {
        margin: 10px 0 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--vp-c-text-1);
        line-height: 1.3;
    }
    .preview-rich :deep(h3:first-child),
    .preview-rich :deep(h4:first-child) {
        margin-top: 0;
    }

    /* Bold & italic */
    .preview-rich :deep(strong) {
        font-weight: 650;
        color: var(--vp-c-text-1);
    }
    .preview-rich :deep(em) {
        font-style: italic;
        color: var(--vp-c-text-1);
    }

    /* Inline code — brand-tinted chip */
    .preview-rich :deep(code) {
        padding: 1px 5px;
        border-radius: 5px;
        background: color-mix(
            in srgb,
            var(--vp-c-brand-soft) 30%,
            var(--vp-c-bg-soft)
        );
        color: var(--vp-c-brand-1);
        font-size: 11.5px;
        font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", monospace;
    }

    /* Fenced code blocks */
    .preview-rich :deep(pre) {
        margin: 8px 0;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--vp-c-bg-soft);
        overflow-x: auto;
    }
    .preview-rich :deep(pre code) {
        padding: 0;
        background: none;
        color: var(--vp-c-text-1);
        font-size: 11px;
    }

    /* Images inline in body */
    .preview-rich :deep(img) {
        display: block;
        width: 100%;
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 60%, transparent);
        margin: 8px 0;
    }
    .preview-rich :deep(img:last-child) {
        margin-bottom: 0;
    }

    .preview-rich :deep(blockquote) {
        margin: 10px 0;
        padding: 10px 12px;
        border-left: 3px solid
            color-mix(in srgb, var(--vp-c-brand-1) 72%, transparent);
        border-radius: 0 10px 10px 0;
        background: color-mix(in srgb, var(--vp-c-bg-soft) 84%, transparent);
        color: var(--vp-c-text-2);
    }

    .preview-rich :deep(blockquote p:last-child) {
        margin-bottom: 0;
    }

    .preview-rich :deep(table) {
        width: 100%;
        margin: 10px 0;
        border-collapse: separate;
        border-spacing: 0;
        overflow: hidden;
        border-radius: 10px;
        border: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 56%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg-soft) 90%, transparent);
    }

    .preview-rich :deep(th),
    .preview-rich :deep(td) {
        padding: 8px 10px;
        font-size: 11.5px;
        line-height: 1.45;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid
            color-mix(in srgb, var(--vp-c-divider) 42%, transparent);
    }

    .preview-rich :deep(th) {
        font-weight: 650;
        color: var(--vp-c-text-1);
        background: color-mix(in srgb, var(--vp-c-brand-soft) 24%, transparent);
    }

    .preview-rich :deep(tr:last-child td) {
        border-bottom: 0;
    }

    /* Links */
    .preview-rich :deep(a) {
        color: var(--vp-c-brand-1);
        text-decoration: none;
    }
    .preview-rich :deep(a:hover) {
        text-decoration: underline;
    }

    /* Lists */
    .preview-rich :deep(ul),
    .preview-rich :deep(ol) {
        margin: 6px 0;
        padding-left: 18px;
    }
    .preview-rich :deep(li) {
        margin: 2px 0;
    }

    /* HTML color spans (markdown-it html: true) */
    .preview-rich :deep(span[style]) {
        display: inline;
    }

    /* Horizontal rule */
    .preview-rich :deep(hr) {
        margin: 10px 0;
        border: none;
        border-top: 1px solid var(--vp-c-divider);
    }
</style>
