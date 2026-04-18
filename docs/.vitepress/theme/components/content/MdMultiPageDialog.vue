<template>
    <span class="md-trigger" @click="open">{{ text || t.defaultText }}</span>

    <v-dialog v-model="isOpen" v-bind="dialogProps">
        <v-card
            class="md-dialog-card"
            :class="{ 'md-dialog-card--fullscreen': fullscreen }"
        >
            <v-card-title v-if="!fullscreen && title" class="md-card-title">{{
                title || t.defaultTitle
            }}</v-card-title>

            <v-card-text
                class="md-card-content"
                :class="contentWrapperClasses"
            >
                <div v-if="fullscreen" class="md-fullscreen-surface">
                    <div class="md-fullscreen-shell" :style="fullscreenShellStyle">
                        <header class="md-fullscreen-header">
                            <h1 class="md-fullscreen-title">
                                {{ title || t.defaultTitle }}
                            </h1>

                            <v-btn
                                icon
                                variant="text"
                                :aria-label="t.closeButton"
                                @click="close"
                                class="md-close-btn md-close-btn--plain"
                            >
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </header>

                        <div
                            v-if="pageCount > 1"
                            class="md-fullscreen-meta"
                        >
                            <div class="md-fullscreen-page-indicator">
                                {{
                                    t.pageIndicator
                                        .replace(
                                            "{current}",
                                            (currentPage + 1).toString(),
                                        )
                                        .replace(
                                            "{total}",
                                            pageCount.toString(),
                                        )
                                }}
                            </div>

                            <div class="md-fullscreen-navigation">
                                <v-btn
                                    :disabled="currentPage === 0"
                                    @click="prevPage"
                                    variant="text"
                                    size="small"
                                    prepend-icon="mdi-chevron-left"
                                    class="md-fullscreen-nav-btn"
                                >
                                    {{ t.prevButton }}
                                </v-btn>

                                <span class="md-fullscreen-page-dots">
                                    <template
                                        v-for="(item, index) in visiblePages"
                                        :key="index"
                                    >
                                        <v-btn
                                            v-if="item.type === 'page'"
                                            size="x-small"
                                            :variant="
                                                item.page === currentPage + 1
                                                    ? 'flat'
                                                    : 'text'
                                            "
                                            @click="goToPage(item.page - 1)"
                                            class="md-fullscreen-dot-btn"
                                        >
                                            {{ item.page }}
                                        </v-btn>
                                        <span
                                            v-else-if="item.type === 'ellipsis'"
                                            class="md-fullscreen-ellipsis"
                                            >...</span
                                        >
                                    </template>
                                </span>

                                <v-btn
                                    :disabled="currentPage === pageCount - 1"
                                    @click="nextPage"
                                    variant="text"
                                    size="small"
                                    append-icon="mdi-chevron-right"
                                    class="md-fullscreen-nav-btn"
                                >
                                    {{ t.nextButton }}
                                </v-btn>
                            </div>
                        </div>

                        <div class="vp-doc md-fullscreen-doc">
                            <div
                                v-for="pageIndex in pageCount"
                                :key="pageIndex"
                                class="page-content"
                                v-show="currentPage === pageIndex - 1"
                            >
                                <slot :name="`page${pageIndex}`"></slot>
                            </div>
                        </div>
                    </div>
                </div>

                <template v-else>
                    <div
                        v-if="pageCount > 1"
                        class="page-indicator"
                    >
                        {{ t.pageIndicator.replace('{current}', (currentPage + 1).toString()).replace('{total}', pageCount.toString()) }}
                    </div>

                    <div class="vp-doc">
                        <div
                            v-for="pageIndex in pageCount"
                            :key="pageIndex"
                            class="page-content"
                            v-show="currentPage === pageIndex - 1"
                        >
                            <slot :name="`page${pageIndex}`"></slot>
                        </div>
                    </div>
                </template>
            </v-card-text>

            <!-- Regular Navigation -->
            <v-card-actions
                v-if="!fullscreen && pageCount > 1"
                class="navigation-toolbar md-card-actions"
            >
                <v-btn
                    :disabled="currentPage === 0"
                    @click="prevPage"
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-chevron-left"
                    class="nav-btn"
                >
                    {{ t.prevButton }}
                </v-btn>
                <v-spacer></v-spacer>
                <div class="page-dots">
                    <template
                        v-for="(item, index) in visiblePages"
                        :key="index"
                    >
                        <v-btn
                            v-if="item.type === 'page'"
                            size="small"
                            :variant="
                                item.page === currentPage + 1 ? 'flat' : 'text'
                            "
                            @click="goToPage(item.page - 1)"
                            class="dot-btn"
                        >
                            {{ item.page }}
                        </v-btn>
                        <span
                            v-else-if="item.type === 'ellipsis'"
                            class="page-ellipsis"
                            >...</span
                        >
                    </template>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                    :disabled="currentPage === pageCount - 1"
                    @click="nextPage"
                    variant="outlined"
                    size="small"
                    append-icon="mdi-chevron-right"
                    class="nav-btn"
                >
                    {{ t.nextButton }}
                </v-btn>
            </v-card-actions>

            <!-- Close button for single page (or non-navigable) -->
            <v-card-actions v-else-if="!fullscreen" class="md-card-actions">
                <v-spacer></v-spacer>
                <v-btn @click="close" color="primary" variant="text">{{
                    t.closeButton
                }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
// @i18n
import { ref, computed, getCurrentInstance } from "vue";
import { useSafeI18n } from "@utils/i18n/locale";
import { resolveDialogFullscreenShellMaxWidth } from "./dialogFullscreenWidth";

const { t } = useSafeI18n("md-multipage-dialog", {
    defaultTitle: "Multi-Page Dialog",
    defaultText: "Click to open",
    pageIndicator: "Page {current} of {total}",
    prevButton: "Prev",
    nextButton: "Next",
    closeButton: "Close",
});

const props = defineProps({
    title: { type: String },
    text: { type: String },
    pageCount: { type: Number, default: 1 },
    fullscreen: { type: Boolean, default: false },
    maxWidth: { type: [String, Number], default: 900 },
    maxHeight: { type: [String, Number], default: undefined },
    width: { type: [String, Number], default: undefined },
    height: { type: [String, Number], default: undefined },
    persistent: { type: Boolean, default: false },
    scrollable: { type: Boolean, default: true },
    transition: { type: String, default: "dialog-transition" },
    activator: { type: String, default: undefined },
    closeOnBack: { type: Boolean, default: true },
    contained: { type: Boolean, default: false },
    noClickAnimation: { type: Boolean, default: false },
    scrim: { type: [Boolean, String], default: true },
    zIndex: { type: [Number, String], default: 2400 },
});

const isOpen = ref(false);
const currentPage = ref(0);
const rawVNodeProps = getCurrentInstance()?.vnode.props ?? {};

function hasExplicitDialogProp(name) {
    const kebabName = name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
    return (
        Object.prototype.hasOwnProperty.call(rawVNodeProps, name) ||
        Object.prototype.hasOwnProperty.call(rawVNodeProps, kebabName)
    );
}

const dialogContentClass = computed(() =>
    props.fullscreen
        ? "md-dialog-overlay md-dialog-overlay--fullscreen"
        : "md-dialog-overlay",
);

const fullscreenShellStyle = computed(() => ({
    "--md-fullscreen-shell-max-width": resolveDialogFullscreenShellMaxWidth({
        width: props.width,
        maxWidth: props.maxWidth,
        hasExplicitWidth: hasExplicitDialogProp("width"),
        hasExplicitMaxWidth: hasExplicitDialogProp("maxWidth"),
    }),
}));

const dialogProps = computed(() => ({
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
    width: props.width,
    height: props.height,
    persistent: props.persistent,
    scrollable: props.scrollable,
    transition: props.transition,
    activator: props.activator,
    closeOnBack: props.closeOnBack,
    contained: props.contained,
    noClickAnimation: props.noClickAnimation,
    scrim: props.scrim,
    zIndex: props.zIndex,
    fullscreen: props.fullscreen,
    contentClass: dialogContentClass.value,
}));

const contentWrapperClasses = computed(() => ({
    "md-content--fullscreen": props.fullscreen,
    "md-content--scrollable": props.scrollable,
}));

const open = () => {
    isOpen.value = true;
    currentPage.value = 0;
};

const close = () => {
    isOpen.value = false;
};
const nextPage = () => {
    if (currentPage.value < props.pageCount - 1) currentPage.value++;
};
const prevPage = () => {
    if (currentPage.value > 0) currentPage.value--;
};
const goToPage = (index) => {
    currentPage.value = index;
};

const visiblePages = computed(() => {
    const total = props.pageCount;
    const current = currentPage.value + 1;
    const maxVisible = 7;
    if (total <= maxVisible) {
        return Array.from({ length: total }, (_, i) => ({
            type: "page",
            page: i + 1,
        }));
    }
    const result = [];
    result.push({ type: "page", page: 1 });
    let startPage, endPage;
    if (current <= 4) {
        startPage = 2;
        endPage = 5;
    } else if (current >= total - 3) {
        startPage = total - 4;
        endPage = total - 1;
    } else {
        startPage = current - 1;
        endPage = current + 1;
    }
    if (startPage > 2) result.push({ type: "ellipsis" });
    for (let i = startPage; i <= endPage; i++)
        result.push({ type: "page", page: i });
    if (endPage < total - 1) result.push({ type: "ellipsis" });
    if (total > 1) result.push({ type: "page", page: total });
    return result;
});
</script>

<style scoped>
    /* Basic Trigger */
    .md-trigger {
        color: var(--vp-c-brand-1);
        cursor: pointer;
        text-decoration: underline;
    }

    /* Dialog Card */
    .md-dialog-card {
        border-radius: 12px !important;
        background-color: var(--vp-c-bg) !important;
        border: 1px solid var(--vp-c-divider) !important;
    }
    .md-dialog-card--fullscreen {
        border-radius: 0 !important;
        width: 100% !important;
        height: 100dvh !important;
        min-height: 100dvh !important;
        max-height: 100dvh !important;
        max-width: 100vw !important;
        border: none !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        margin: 0 !important;
        box-shadow: none !important;
    }

    :deep(.md-dialog-overlay--fullscreen) {
        margin: 0 !important;
        inset: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100dvh !important;
        max-height: 100dvh !important;
    }

    .md-fullscreen-surface {
        width: 100%;
        min-height: 100%;
        display: flex;
        justify-content: center;
        padding:
            max(28px, env(safe-area-inset-top))
            max(24px, env(safe-area-inset-right))
            max(40px, env(safe-area-inset-bottom))
            max(24px, env(safe-area-inset-left));
        box-sizing: border-box;
    }

    .md-fullscreen-shell {
        width: 100%;
        max-width: var(--md-fullscreen-shell-max-width, 860px);
    }

    .md-fullscreen-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .md-fullscreen-title {
        margin: 0;
        font-size: clamp(1.9rem, 2.8vw, 2.35rem);
        line-height: 1.18;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--vp-c-text-1);
    }

    .md-close-btn--plain {
        flex-shrink: 0;
        margin: -8px -12px 0 0;
        color: var(--vp-c-text-2) !important;
    }

    .md-close-btn--plain:hover {
        color: var(--vp-c-text-1) !important;
        background: var(--vp-c-default-soft) !important;
    }

    .md-fullscreen-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px 24px;
        flex-wrap: wrap;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, transparent);
    }

    .md-fullscreen-page-indicator {
        color: var(--vp-c-text-2);
        font-size: 0.95rem;
        line-height: 1.5;
    }

    .md-fullscreen-navigation {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .md-fullscreen-nav-btn {
        color: var(--vp-c-text-2) !important;
    }

    .md-fullscreen-page-dots {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .md-fullscreen-dot-btn {
        min-width: 30px !important;
        height: 30px !important;
        color: var(--vp-c-text-2) !important;
    }

    .md-fullscreen-dot-btn.v-btn--variant-flat {
        background: var(--vp-c-default-soft) !important;
        color: var(--vp-c-text-1) !important;
    }

    .md-fullscreen-ellipsis {
        color: var(--vp-c-text-3);
        user-select: none;
    }

    .md-card-title {
        background: var(--vp-c-bg-alt) !important;
        color: var(--vp-c-text-1) !important;
        border-bottom: 1px solid var(--vp-c-divider) !important;
        font-size: 1.25rem !important;
        font-weight: 600 !important;
        padding: 20px 24px !important;
    }
    .md-card-content {
        background: var(--vp-c-bg) !important;
        color: var(--vp-c-text-1) !important;
        padding: 24px !important;
        flex: 1;
        overflow-y: auto;
    }

    .md-content--fullscreen {
        min-height: 100% !important;
        max-height: 100dvh !important;
        padding: 0 !important;
        flex: 1 !important;
        overflow-y: auto !important;
    }

    .md-content--scrollable {
        max-height: 60vh !important;
    }

    /* Regular Page Indicator */
    .page-indicator {
        background: var(--vp-c-bg-soft) !important;
        color: var(--vp-c-text-2) !important;
        padding: 8px 16px !important;
        margin-bottom: 20px !important;
        border-radius: 6px !important;
        font-size: 0.875rem !important;
        text-align: center;
    }

    /* Regular Navigation */
    .md-card-actions {
        background: var(--vp-c-bg-alt) !important;
        border-top: 1px solid var(--vp-c-divider) !important;
        padding: 16px 24px !important;
    }
    .navigation-toolbar {
        display: flex;
        justify-content: space-between !important;
        align-items: center !important;
    }
    .page-dots {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .nav-btn {
        min-width: 100px !important;
        color: var(--vp-c-brand-1) !important;
        border-color: var(--vp-c-brand-1) !important;
    }
    .dot-btn {
        min-width: 44px !important;
        height: 44px !important;
        color: var(--vp-c-text-2) !important;
    }
    .dot-btn.v-btn--variant-flat {
        background: var(--vp-c-brand-1) !important;
        color: white !important;
    }
    .page-ellipsis {
        color: var(--vp-c-text-2);
        user-select: none;
        line-height: 44px;
    }

    /* VitePress Doc Styles */
    .vp-doc {
        font-family: var(--vp-font-family-base);
        line-height: 1.7;
        color: var(--vp-c-text-1);
    }
    .vp-doc :deep(h1),
    .vp-doc :deep(h2),
    .vp-doc :deep(h3),
    .vp-doc :deep(h4) {
        font-weight: 600;
        color: var(--vp-c-text-1);
        margin-top: 32px;
    }
    .vp-doc :deep(h1) {
        font-size: 28px;
    }
    .vp-doc :deep(h2) {
        font-size: 24px;
        border-top: 1px solid var(--vp-c-divider);
        padding-top: 24px;
    }
    .vp-doc :deep(h3) {
        font-size: 20px;
    }
    .vp-doc :deep(h4) {
        font-size: 18px;
    }
    .vp-doc :deep(p) {
        margin: 16px 0;
    }
    .vp-doc :deep(a) {
        color: var(--vp-c-brand-1);
        text-decoration: underline;
    }
    .vp-doc :deep(code) {
        font-size: 0.875em;
        color: var(--vp-c-text-code);
        background-color: var(--vp-c-mute);
        border-radius: 4px;
        padding: 3px 6px;
    }
    .vp-doc :deep(pre) {
        background-color: var(--vp-code-block-bg);
        border-radius: 6px;
    }
    .vp-doc :deep(pre code) {
        padding: 20px 24px;
    }
    .vp-doc :deep(ul),
    .vp-doc :deep(ol) {
        padding-left: 1.25rem;
        margin: 16px 0;
    }
    .vp-doc :deep(li) {
        margin: 8px 0;
    }
    .vp-doc :deep(blockquote) {
        margin: 16px 0;
        border-left: 2px solid var(--vp-c-divider);
        padding-left: 16px;
        color: var(--vp-c-text-2);
    }
    .vp-doc :deep(hr) {
        margin: 16px 0;
        border-top: 1px solid var(--vp-c-divider);
    }
    .vp-doc :deep(table) {
        border-collapse: collapse;
        margin: 20px 0;
        display: block;
        overflow-x: auto;
    }
    .vp-doc :deep(th),
    .vp-doc :deep(td) {
        border: 1px solid var(--vp-c-divider);
        padding: 8px 16px;
    }

    @media (max-width: 768px) {
        .md-fullscreen-surface {
            padding:
                max(20px, env(safe-area-inset-top))
                max(16px, env(safe-area-inset-right))
                max(28px, env(safe-area-inset-bottom))
                max(16px, env(safe-area-inset-left));
        }

        .md-fullscreen-header {
            margin-bottom: 18px;
            padding-bottom: 14px;
        }

        .md-fullscreen-title {
            font-size: clamp(1.55rem, 7vw, 2rem);
        }

        .md-fullscreen-meta {
            align-items: flex-start;
        }

        .md-fullscreen-navigation {
            width: 100%;
            justify-content: space-between;
        }
    }

    @media (max-width: 480px) {
        .md-fullscreen-surface {
            padding:
                max(16px, env(safe-area-inset-top))
                max(12px, env(safe-area-inset-right))
                max(24px, env(safe-area-inset-bottom))
                max(12px, env(safe-area-inset-left));
        }

        .md-fullscreen-header {
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 12px;
        }

        .md-fullscreen-meta {
            gap: 12px;
            margin-bottom: 18px;
            padding-bottom: 12px;
        }

        .md-fullscreen-navigation {
            gap: 6px;
        }

        .md-fullscreen-page-dots {
            flex-wrap: wrap;
        }
    }
</style>
