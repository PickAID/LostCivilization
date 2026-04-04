<script setup lang="ts">
    import { computed, useSlots } from "vue";
    import { Icon } from "@iconify/vue";
    import { withBase } from "vitepress";

    /**
     * Button component props interface.
     */
    export interface ButtonProps {
        /** Custom HTML tag to render */
        tag?: string;
        /** Button theme/color variant */
        theme?: "brand" | "alt" | "outline" | "ghost" | "sponsor" | "danger";
        /** Button size */
        size?: "small" | "medium" | "large";
        /** Button text content */
        text?: string;
        /** URL for link buttons */
        href?: string;
        /** Link target attribute */
        target?: string;
        /** Link rel attribute */
        rel?: string;
        /** Whether button is disabled */
        disabled?: boolean;
        /** Whether to show loading state */
        loading?: boolean;
        /** Icon name (Iconify) */
        icon?: string;
        /** Icon position relative to text */
        iconPosition?: "left" | "right";
        /** Whether button takes full width */
        block?: boolean;
        /** Whether button is fully rounded */
        round?: boolean;
        /** Custom styling configuration */
        custom?: {
            background?: string;
            color?: string;
            borderColor?: string;
            borderWidth?: string;
            borderStyle?: string;
            shadow?: string;
            radius?: string;
            padding?: string;
            fontWeight?: string | number;
            letterSpacing?: string;
            hoverBackground?: string;
            hoverColor?: string;
            hoverBorderColor?: string;
            hoverShadow?: string;
        };
    }

    const props = withDefaults(defineProps<ButtonProps>(), {
        theme: "brand",
        size: "medium",
        iconPosition: "left",
        disabled: false,
        loading: false,
        block: false,
        round: false,
    });

    const emit = defineEmits<{
        click: [event: MouseEvent];
    }>();

    const slots = useSlots();

    /** Whether the button renders as a link */
    const isLink = computed(() => Boolean(props.href));

    /** Whether the href is an external URL */
    const isExternalLink = computed(() =>
        Boolean(props.href && /^(https?:)?\/\//.test(props.href)),
    );

    /** Whether href uses a special protocol (mailto, tel, #) */
    const isSpecialProtocol = computed(() =>
        Boolean(props.href && /^(mailto:|tel:|#)/.test(props.href)),
    );

    /** Whether default slot has content */
    const hasSlotContent = computed(() => Boolean(slots.default));

    /** Whether button shows only an icon */
    const isIconOnly = computed(() =>
        Boolean(props.icon && !props.text && !hasSlotContent.value),
    );

    /** Resolved HTML tag to render */
    const componentTag = computed(() => {
        if (props.tag) return props.tag;
        return isLink.value ? "a" : "button";
    });

    /** Normalized href with base path applied for internal links */
    const normalizedHref = computed(() => {
        if (!props.href) return undefined;
        if (isExternalLink.value || isSpecialProtocol.value) return props.href;
        return withBase(
            props.href.replace(/\.md$/, "").replace(/\/index$/, "/"),
        );
    });

    /** Resolved target attribute */
    const linkTarget = computed(() => {
        if (!isLink.value) return undefined;
        if (props.target) return props.target;
        return isExternalLink.value ? "_blank" : undefined;
    });

    /** Resolved rel attribute */
    const linkRel = computed(() => {
        if (!isLink.value) return undefined;
        if (props.rel) return props.rel;
        return isExternalLink.value ? "noopener noreferrer" : undefined;
    });

    /** Computed class names for button */
    const buttonClasses = computed(() => [
        "vp-button",
        `vp-button--${props.theme}`,
        `vp-button--${props.size}`,
        {
            "vp-button--disabled": props.disabled || props.loading,
            "vp-button--loading": props.loading,
            "vp-button--block": props.block,
            "vp-button--round": props.round,
            "vp-button--icon-only": isIconOnly.value,
            "vp-button--custom": Boolean(props.custom),
        },
    ]);

    /** CSS custom properties for custom styling */
    const customStyleVars = computed(() => {
        if (!props.custom) return undefined;

        const style: Record<string, string> = {};
        const custom = props.custom;
        if (custom.background)
            style["--vp-button-custom-bg"] = custom.background;
        if (custom.color) style["--vp-button-custom-color"] = custom.color;
        if (custom.borderColor)
            style["--vp-button-custom-border-color"] = custom.borderColor;
        if (custom.borderWidth)
            style["--vp-button-custom-border-width"] = custom.borderWidth;
        if (custom.borderStyle)
            style["--vp-button-custom-border-style"] = custom.borderStyle;
        if (custom.shadow) style["--vp-button-custom-shadow"] = custom.shadow;
        if (custom.radius) style.borderRadius = custom.radius;
        if (custom.padding) style.padding = custom.padding;
        if (custom.fontWeight !== undefined)
            style.fontWeight = String(custom.fontWeight);
        if (custom.letterSpacing) style.letterSpacing = custom.letterSpacing;
        if (custom.hoverBackground)
            style["--vp-button-custom-hover-bg"] = custom.hoverBackground;
        if (custom.hoverColor)
            style["--vp-button-custom-hover-color"] = custom.hoverColor;
        if (custom.hoverBorderColor)
            style["--vp-button-custom-hover-border-color"] =
                custom.hoverBorderColor;
        if (custom.hoverShadow)
            style["--vp-button-custom-hover-shadow"] = custom.hoverShadow;
        return style;
    });

    /** Click event handler */
    function handleClick(event: MouseEvent) {
        if (props.disabled || props.loading) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        emit("click", event);
    }
</script>

<template>
    <component
        :is="componentTag"
        :class="buttonClasses"
        :href="normalizedHref"
        :target="linkTarget"
        :rel="linkRel"
        :style="customStyleVars"
        :type="!isLink ? 'button' : undefined"
        :disabled="!isLink ? disabled || loading : undefined"
        @click="handleClick"
    >
        <span class="vp-button__content">
            <span v-if="loading" class="vp-button__loading" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="vp-button__loading-icon">
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-dasharray="32"
                        stroke-dashoffset="18"
                    />
                </svg>
            </span>

            <Icon
                v-if="icon && iconPosition === 'left' && !loading"
                :icon="icon"
                class="vp-button__icon"
            />

            <span v-if="text || hasSlotContent" class="vp-button__text">
                <slot>{{ text }}</slot>
            </span>

            <Icon
                v-if="icon && iconPosition === 'right' && !loading"
                :icon="icon"
                class="vp-button__icon"
            />

            <span
                v-if="!icon && isExternalLink && !loading"
                class="vp-button__external"
                aria-hidden="true"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                    />
                    <path d="M15 3h6v6" />
                    <path d="M10 14L21 3" />
                </svg>
            </span>
        </span>
    </component>
</template>

<style scoped>
    /* ── Base ─────────────────────────────────────────────────────── */
    .vp-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-radius: 8px;
        border: 1.5px solid transparent;
        font-family: inherit;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.01em;
        line-height: 1.4;
        text-decoration: none;
        text-align: center;
        white-space: nowrap;
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        transition:
            background-color 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease,
            box-shadow 0.18s ease;
        box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
    }

    .vp-button:focus-visible {
        outline: 2px solid var(--vp-c-brand-1);
        outline-offset: 2px;
    }

    /* ── Content wrappers ─────────────────────────────────────────── */
    .vp-button__content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
    }

    .vp-button__text {
        display: inline-flex;
        align-items: center;
    }

    .vp-button__icon,
    .vp-button__external {
        display: inline-flex;
        flex-shrink: 0;
        width: 1.1em;
        height: 1.1em;
    }

    .vp-button__external {
        opacity: 0.65;
    }

    .vp-button__loading {
        display: inline-flex;
    }

    .vp-button__loading-icon {
        width: 1.1em;
        height: 1.1em;
        animation: vp-button-spin 0.8s linear infinite;
    }

    /* ── Sizes ────────────────────────────────────────────────────── */
    .vp-button--small {
        min-height: 32px;
        padding: 6px 13px;
        font-size: 13px;
        border-radius: 6px;
    }

    .vp-button--medium {
        min-height: 38px;
        padding: 8px 17px;
    }

    .vp-button--large {
        min-height: 44px;
        padding: 10px 22px;
        font-size: 15px;
        border-radius: 10px;
    }

    /* ── Themes ───────────────────────────────────────────────────── */

    /* Brand — filled */
    .vp-button--brand {
        color: var(--vp-c-white);
        background: var(--vp-c-brand-1);
        border-color: transparent;
        box-shadow: 0 8px 16px rgba(var(--vp-c-brand-rgb), 0.2);
    }
    .vp-button--brand:hover:not(.vp-button--disabled) {
        background: var(--vp-c-brand-2);
        box-shadow: 0 10px 20px rgba(var(--vp-c-brand-rgb), 0.24);
    }

    /* Alt — outlined secondary */
    .vp-button--alt {
        color: var(--vp-c-text-1);
        background: transparent;
        border-color: var(--vp-c-divider);
        box-shadow: none;
    }
    .vp-button--alt:hover:not(.vp-button--disabled) {
        color: var(--vp-c-brand-1);
        border-color: var(--vp-c-brand-1);
        background: rgba(var(--vp-c-brand-rgb), 0.05);
        box-shadow: 0 0 0 1px rgba(var(--vp-c-brand-rgb), 0.08) inset;
    }

    /* Outline — transparent with brand border */
    .vp-button--outline {
        color: var(--vp-c-brand-1);
        background: transparent;
        border-color: var(--vp-c-brand-1);
        box-shadow: none;
    }
    .vp-button--outline:hover:not(.vp-button--disabled) {
        background: var(--vp-c-brand-1);
        color: var(--vp-c-white);
        box-shadow: 0 8px 16px rgba(var(--vp-c-brand-rgb), 0.2);
    }

    /* Ghost — minimal, border appears on hover */
    .vp-button--ghost {
        color: var(--vp-c-text-2);
        background: transparent;
        border-color: transparent;
        box-shadow: none;
    }
    .vp-button--ghost:hover:not(.vp-button--disabled) {
        color: var(--vp-c-text-1);
        background: var(--vp-c-bg-soft);
        border-color: var(--vp-c-divider);
    }

    /* Sponsor */
    .vp-button--sponsor {
        color: var(--vp-c-white);
        background: #de4a63;
        border-color: transparent;
        box-shadow: 0 8px 16px rgba(222, 74, 99, 0.28);
    }
    .vp-button--sponsor:hover:not(.vp-button--disabled) {
        background: #ce3e79;
        box-shadow: 0 10px 20px rgba(206, 62, 121, 0.32);
    }

    /* Danger */
    .vp-button--danger {
        color: var(--vp-c-white);
        background: #d64545;
        border-color: transparent;
        box-shadow: 0 8px 16px rgba(214, 69, 69, 0.26);
    }
    .vp-button--danger:hover:not(.vp-button--disabled) {
        background: #c43d3d;
        box-shadow: 0 10px 20px rgba(196, 61, 61, 0.3);
    }

    .vp-button--custom {
        color: var(--vp-button-custom-color, var(--vp-c-text-1));
        background: var(--vp-button-custom-bg, transparent);
        border-color: var(--vp-button-custom-border-color, var(--vp-c-divider));
        border-width: var(--vp-button-custom-border-width, 1.5px);
        border-style: var(--vp-button-custom-border-style, solid);
        box-shadow: var(--vp-button-custom-shadow, none);
    }

    .vp-button--custom:hover:not(.vp-button--disabled) {
        color: var(
            --vp-button-custom-hover-color,
            var(--vp-button-custom-color, var(--vp-c-text-1))
        );
        background: var(
            --vp-button-custom-hover-bg,
            var(--vp-button-custom-bg, transparent)
        );
        border-color: var(
            --vp-button-custom-hover-border-color,
            var(--vp-button-custom-border-color, var(--vp-c-divider))
        );
        box-shadow: var(
            --vp-button-custom-hover-shadow,
            var(--vp-button-custom-shadow, none)
        );
    }

    /* ── Modifiers ────────────────────────────────────────────────── */
    .vp-button--block {
        width: 100%;
    }
    .vp-button--round {
        border-radius: 999px;
    }

    .vp-button--icon-only {
        min-width: 38px;
        padding-left: 9px;
        padding-right: 9px;
    }
    .vp-button--small.vp-button--icon-only {
        min-width: 32px;
        padding-left: 7px;
        padding-right: 7px;
    }

    .vp-button--disabled,
    .vp-button--loading {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
        box-shadow: none !important;
    }

    /* ── Keyframes ────────────────────────────────────────────────── */
    @keyframes vp-button-spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* ── Responsive ───────────────────────────────────────────────── */
    @media (max-width: 640px) {
        .vp-button {
            min-height: 44px;
            border-radius: 12px;
            font-size: 15px;
            letter-spacing: 0;
        }

        .vp-button--small {
            min-height: 38px;
            padding: 7px 14px;
            font-size: 13px;
        }

        .vp-button--medium {
            min-height: 46px;
            padding: 10px 18px;
        }

        .vp-button--large {
            min-height: 50px;
            padding: 11px 20px;
            font-size: 15px;
            border-radius: 13px;
        }

        .vp-button__content {
            gap: 8px;
        }

        .vp-button--brand {
            box-shadow: 0 7px 16px rgba(var(--vp-c-brand-rgb), 0.22);
        }

        .vp-button--alt,
        .vp-button--outline {
            border-width: 1.5px;
        }

        .vp-button:active:not(.vp-button--disabled):not(.vp-button--loading) {
            filter: brightness(0.98);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .vp-button {
            transition:
                background-color 0.1s ease,
                border-color 0.1s ease,
                color 0.1s ease;
        }
        .vp-button__loading-icon {
            animation-duration: 1.5s;
        }
    }
</style>
