<template>
    <span class="md-trigger" @click="open">{{ text || t.defaultText }}</span>

    <v-dialog v-model="isOpen" v-bind="dialogProps">
        <v-card
            class="md-dialog-card"
            :class="{ 'md-dialog-card--fullscreen': fullscreen }"
        >
            <v-card-title v-if="!fullscreen && title" class="md-card-title">{{
                title
            }}</v-card-title>

            <v-card-text class="md-card-content" :class="contentWrapperClasses">
                <div v-if="fullscreen" class="md-fullscreen-surface">
                    <div class="md-fullscreen-shell" :style="fullscreenShellStyle">
                        <header
                            class="md-fullscreen-header"
                            :class="{
                                'md-fullscreen-header--untitled': !title,
                            }"
                        >
                            <h1 v-if="title" class="md-fullscreen-title">
                                {{ title }}
                            </h1>
                            <div v-else class="md-fullscreen-title-spacer" />

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

                        <div class="vp-doc md-fullscreen-doc">
                            <slot></slot>
                        </div>
                    </div>
                </div>

                <div v-else class="vp-doc">
                    <slot></slot>
                </div>
            </v-card-text>

            <v-card-actions v-if="!fullscreen" class="md-card-actions">
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

const { t } = useSafeI18n("md-dialog", {
    defaultText: "Click to open",
    closeButton: "Close",
});

const props = defineProps({
    title: String,
    text: {
        type: String,
    },
    // Vuetify VDialog props
    fullscreen: {
        type: Boolean,
        default: false,
    },
    maxWidth: {
        type: [String, Number],
        default: "90vw",
    },
    maxHeight: {
        type: [String, Number],
        default: undefined,
    },
    width: {
        type: [String, Number],
        default: undefined,
    },
    height: {
        type: [String, Number],
        default: undefined,
    },
    persistent: {
        type: Boolean,
        default: false,
    },
    scrollable: {
        type: Boolean,
        default: true,
    },
    transition: {
        type: String,
        default: "dialog-transition",
    },
    activator: {
        type: String,
        default: undefined,
    },
    closeOnBack: {
        type: Boolean,
        default: true,
    },
    contained: {
        type: Boolean,
        default: false,
    },
    noClickAnimation: {
        type: Boolean,
        default: false,
    },
    scrim: {
        type: [Boolean, String],
        default: true,
    },
    zIndex: {
        type: [Number, String],
        default: 2400,
    },
});

const isOpen = ref(false);
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

// Build props to pass to v-dialog
const dialogProps = computed(() => {
    return {
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
    };
});

// Content wrapper classes
const contentWrapperClasses = computed(() => ({
    "md-content--fullscreen": props.fullscreen,
    "md-content--scrollable": props.scrollable,
}));

const open = () => {
    isOpen.value = true;
};

const close = () => {
    isOpen.value = false;
};
</script>

<style scoped>
    .md-trigger {
        color: var(--vp-c-brand-1);
        cursor: pointer;
        text-decoration: underline;
        text-decoration-color: var(--vp-c-brand-1);
        text-underline-offset: 2px;
        transition: all 0.25s;
    }

    .md-trigger:hover {
        color: var(--vp-c-brand-2);
        text-decoration-color: var(--vp-c-brand-2);
    }

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
        padding: 0 !important;
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
        margin-bottom: 28px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .md-fullscreen-header--untitled {
        justify-content: flex-end;
        margin-bottom: 12px;
        padding-bottom: 0;
        border-bottom: 0;
    }

    .md-fullscreen-title {
        margin: 0;
        font-size: clamp(1.9rem, 2.8vw, 2.35rem);
        line-height: 1.18;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--vp-c-text-1);
    }

    .md-fullscreen-title-spacer {
        flex: 1;
        min-height: 1px;
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
        min-height: 200px;
        max-height: 70vh;
        overflow-y: auto;
        box-sizing: border-box;
        width: 100%;
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

    .md-card-actions {
        background: var(--vp-c-bg-alt) !important;
        border-top: 1px solid var(--vp-c-divider) !important;
        padding: 16px 24px !important;
    }

    /* VitePress doc styles */
    .vp-doc {
        font-family: var(--vp-font-family-base);
        font-size: 16px;
        line-height: 1.7;
        color: var(--vp-c-text-1);
        word-wrap: break-word;
    }
    .vp-doc :deep(h1),
    .vp-doc :deep(h2),
    .vp-doc :deep(h3),
    .vp-doc :deep(h4),
    .vp-doc :deep(h5),
    .vp-doc :deep(h6) {
        position: relative;
        font-weight: 600;
        outline: none;
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

    /* Mobile responsive styles */
    @media (max-width: 768px) {
        .md-dialog-card:not(.md-dialog-card--fullscreen) {
            margin: 1rem !important;
            max-width: calc(100vw - 2rem) !important;
            max-height: calc(100vh - 2rem) !important;
            border-radius: 8px !important;
        }

        .md-card-title {
            padding: 16px 20px !important;
            font-size: 1.1rem !important;
        }

        .md-card-content:not(.md-content--fullscreen) {
            padding: 16px 20px !important;
            max-height: calc(100vh - 200px) !important;
        }

        .md-card-actions {
            padding: 12px 20px !important;
        }

        .md-content--scrollable {
            max-height: calc(100vh - 200px) !important;
        }

        .vp-doc {
            font-size: 15px;
        }

        .vp-doc :deep(h1) {
            font-size: 24px;
        }

        .vp-doc :deep(h2) {
            font-size: 20px;
        }

        .vp-doc :deep(h3) {
            font-size: 18px;
        }

        .vp-doc :deep(h4) {
            font-size: 16px;
        }

        .md-fullscreen-surface {
            padding:
                max(20px, env(safe-area-inset-top))
                max(16px, env(safe-area-inset-right))
                max(28px, env(safe-area-inset-bottom))
                max(16px, env(safe-area-inset-left));
        }

        .md-fullscreen-header {
            margin-bottom: 22px;
            padding-bottom: 14px;
        }

        .md-fullscreen-title {
            font-size: clamp(1.55rem, 7vw, 2rem);
        }
    }

    @media (max-width: 480px) {
        .md-dialog-card:not(.md-dialog-card--fullscreen) {
            margin: 0.5rem !important;
            max-width: calc(100vw - 1rem) !important;
            max-height: calc(100vh - 1rem) !important;
            border-radius: 6px !important;
        }

        .md-card-title {
            padding: 12px 16px !important;
            font-size: 1rem !important;
        }

        .md-card-content:not(.md-content--fullscreen) {
            padding: 12px 16px !important;
            max-height: calc(100vh - 150px) !important;
            min-height: 150px;
        }

        .md-card-actions {
            padding: 10px 16px !important;
        }

        .md-content--scrollable {
            max-height: calc(100vh - 150px) !important;
        }

        .vp-doc {
            font-size: 14px;
        }

        .vp-doc :deep(h1) {
            font-size: 22px;
        }

        .vp-doc :deep(h2) {
            font-size: 18px;
        }

        .vp-doc :deep(h3) {
            font-size: 16px;
        }

        .vp-doc :deep(h4) {
            font-size: 15px;
        }

        .vp-doc :deep(pre code) {
            padding: 16px 20px;
        }

        .vp-doc :deep(th),
        .vp-doc :deep(td) {
            padding: 6px 12px;
        }

        .md-fullscreen-surface {
            padding:
                max(16px, env(safe-area-inset-top))
                max(12px, env(safe-area-inset-right))
                max(24px, env(safe-area-inset-bottom))
                max(12px, env(safe-area-inset-left));
        }

        .md-fullscreen-header {
            gap: 12px;
            margin-bottom: 18px;
            padding-bottom: 12px;
        }
    }

    /* Very small screens - auto fullscreen */
    @media (max-width: 360px) {
        .md-dialog-card:not(.md-dialog-card--fullscreen) {
            margin: 0 !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            height: 100vh !important;
        }

        .md-card-content {
            max-height: calc(100vh - 120px) !important;
            padding: 10px 12px !important;
        }

        .md-card-title {
            padding: 10px 12px !important;
            font-size: 0.9rem !important;
        }

        .md-card-actions {
            padding: 8px 12px !important;
        }
    }
</style>
 
