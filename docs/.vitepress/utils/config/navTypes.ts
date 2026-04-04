/**
 * Navigation system type definitions.
 *
 * @module utils/config/nav-types
 * @description
 * Centralised TypeScript contracts for the navigation system.
 * All components, composables, and locale config files import from here.
 *
 * Type hierarchy (bottom → top):
 *   `NavBadge` / `NavTag` / `NavMedia`
 *     → `NavLinkPreview`
 *       → `NavLink`
 *         → `NavGroup`
 *           → `NavPanel`
 *             → (dropdown) `NavItem`
 *               → `NavConfig`
 */

// ─────────────────────────────────────────────────────────────────────────────
// Primitive decorators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A small badge chip rendered next to a nav item's text.
 * Use sparingly to draw attention to new or experimental features.
 */
export interface NavBadge {
    /** Short label, ideally ≤ 8 characters (e.g. `"new"`, `"beta"`). */
    text: string;
    /**
     * Controls the badge's background colour:
     * - `"new"` / `"info"` — brand accent (blue / teal)
     * - `"beta"` — warning orange
     * - `"warning"` — amber
     * - `"danger"` — red
     */
    type?: "new" | "beta" | "info" | "warning" | "danger";
    /** When `true`, adds a CSS pulse animation. Best used with `"new"`. */
    pulse?: boolean;
}

/**
 * A small coloured chip shown inside dropdown link rows.
 * Useful for categorising items (e.g. `"paid"`, `"OSS"`).
 */
export interface NavTag {
    /** Display text of the tag. */
    text: string;
    /**
     * Background/text colour override.
     * Accepts any CSS colour value or custom property (e.g. `"var(--vp-c-brand-1)"`).
     */
    color?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rich content containers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A rich media block that can be embedded in featured cards or hover previews.
 */
export interface NavMedia {
    /**
     * Media renderer to use:
     * - `"image"` / `"svg"` / `"screenshot"` — renders as `<img>`
     * - `"video"`   — renders as `<video autoplay muted loop>`
     * - `"lottie"`  — renders via `LottieDisplay`
     * - `"icon-grid"` — reserved for future grid-of-icons layout
     */
    type: "image" | "svg" | "video" | "lottie" | "icon-grid" | "screenshot";
    /**
     * Fully-qualified URL or root-relative path to the media asset.
     * SVG files are supported via `type: "image"` or `type: "svg"`.
     */
    src?: string;
    /** Accessible alt text for screen readers. */
    alt?: string;
    /**
     * CSS `aspect-ratio` value for the media container.
     * Defaults to `"16 / 9"` when omitted.
     */
    aspect?: string;
    /**
     * Overrides the media element with a plain CSS gradient or solid colour.
     * Convenient for placeholder or brand-coloured hero cards.
     */
    background?: string;
    /**
     * Visual treatment applied by nav preview and showcase renderers.
     * - `"plain"` — full-bleed media with no chrome, frame, or shadow
     * - `"framed"` — decorative browser-style shell for showcase-heavy menus
     *
     * Default: `"plain"`.
     */
    variant?: "plain" | "framed";
}

/**
 * Configuration for the hover/focus preview sheet shown beside a leaf link
 * in the mega-menu.
 *
 * The `body` field supports **full Markdown** rendered via `markdown-it`,
 * including images (`![alt](url)`), **bold**, `code`, lists, and tables.
 */
export interface NavLinkPreview {
    /** Override for the preview panel title (defaults to the link's `text`). */
    title?: string;
    /**
     * One-line description shown below the title when `body` is absent.
     * Rendered as plain text.
     */
    desc?: string;
    /**
     * Extended preview body rendered as **Markdown** via `markdown-it`.
     *
     * Supports the full CommonMark spec plus:
     * - `**bold**`, `*italic*`, `` `code` ``
     * - `[links](url)`, `![images](url)`
     * - Fenced code blocks with syntax highlighting
     *
     * @example
     * ```ts
     * body: "Install with:\n\n```bash\nnpm install vitepress\n```"
     * ```
     */
    body?: string;
    /** Optional media element displayed at the top of the preview. */
    media?: NavMedia;
    /**
     * @deprecated
     * Rich-text rendering is now handled by `markdown-it`.
     * This field is retained for backward compatibility but has no effect
     * in the current implementation.
     */
    richText?: {
        mode?: "plain" | "limited-rich";
        placeholders?: Array<"bold" | "image">;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav item building blocks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single leaf navigation link — the smallest unit of the nav system.
 * Used inside {@link NavGroup.items} and as top-level items without a dropdown.
 */
export interface NavLink {
    /** Display text shown in the link row. */
    text: string;
    /**
     * Internal VitePress route.
     * Write **without** a locale prefix (e.g. `"/hero/matrix/"`).
     * `prefixNavLinks` in `api/navigation/NavLinkAccessService.ts` will prepend the active locale
     * base path (e.g. `"/en-US/"`) automatically at runtime.
     */
    link?: string;
    /**
     * External URL. Opens in a new tab (`target="_blank" rel="noreferrer"`).
     * Cannot be combined with `link`.
     */
    href?: string;
    /** Short one-line description rendered below the link text in list views. */
    desc?: string;
    /**
     * Icon displayed to the left of the `text`.
     * Accepts: an SVG string, a URL, or a single emoji.
     */
    icon?: string;
    /**
     * Custom font override for specialised brand or monospace links.
     * Most links should rely on the theme's default typeface.
     */
    font?: {
        /** CSS `font-family` value. */
        family?: string;
        /** CSS `font-weight` value (numeric or keyword string). */
        weight?: number | string;
    };
    /** Badge chip rendered beside the link text. */
    badge?: NavBadge;
    /** Tag chips rendered in the link row (e.g. `"paid"`, `"OSS"`). */
    tags?: NavTag[];
    /**
     * When `true`, styles this link as the highlighted "featured" entry
     * within its parent panel or group.
     */
    featured?: boolean;
    /**
     * Content shown in a side-sheet when the user hovers or focuses this link.
     * Renders Markdown via `markdown-it`.
     */
    preview?: NavLinkPreview;
    /**
     * Keyboard shortcut hint displayed on the right edge of the link row
     * (e.g. `"⌘K"`, `"Ctrl+K"`).
     */
    shortcut?: string;
    /**
     * Pattern passed to Vue Router's `active-class` matching logic.
     * The link is highlighted when the current route matches this pattern.
     */
    activeMatch?: string;
}

/**
 * A labelled section of links within a {@link NavPanel} column.
 * Rendered as a group heading followed by a vertical list of {@link NavLink}s.
 */
export interface NavGroup {
    /** Section heading displayed above the group. Omit for unlabelled groups. */
    label?: string;
    /** Optional icon for the group heading. */
    icon?: string;
    /** Ordered list of navigation links in this group. */
    items: NavLink[];
    /**
     * When `true`, renders items as image thumbnail cards instead of
     * plain text rows.
     */
    cardLayout?: boolean;
    /**
     * Number of columns for the card grid when `cardLayout` is `true`.
     * Default: `2`.
     */
    columns?: 1 | 2 | 3 | 4;
}

/**
 * A single column panel inside a mega-menu dropdown.
 * A dropdown can contain one or more panels laid out side-by-side.
 */
export interface NavPanel {
    /**
     * Relative width of this panel compared to siblings.
     * Works like CSS `flex-grow`. Default: `1`.
     */
    weight?: number;
    /** Ordered list of group sections in this panel. */
    groups: NavGroup[];
    /**
     * Optional hero-style featured card rendered at the top of the panel
     * (above the groups). Used in the `spotlight` layout's main panel.
     */
    featured?: {
        /** Card title (required). */
        title: string;
        /** One-line description below the title. */
        desc: string;
        /** Internal route — auto-prefixed with the active locale path. */
        link?: string;
        /** External URL — opens in a new tab. */
        href?: string;
        /** Optional media shown in the featured card. */
        media?: NavMedia;
        /** Optional badge on the featured card. */
        badge?: NavBadge;
    };
}

/**
 * An optional full-width page-preview pane rendered to the right of the
 * dropdown columns.
 *
 * Useful for showing a live or static snapshot of the destination page.
 */
export interface NavPreviewPanel {
    type: "preview";
    /** Panel title. */
    title?: string;
    /** Short description below the title. */
    desc?: string;
    /**
     * Markdown body rendered via `markdown-it`.
     * @see {@link NavLinkPreview.body}
     */
    body?: string;
    /** Media element displayed in the preview pane. */
    media?: NavMedia;
    /** Internal route to preview. */
    link?: string;
    /**
     * @deprecated — use `body` with Markdown instead.
     */
    richText?: {
        mode?: "plain" | "limited-rich";
        placeholders?: Array<"bold" | "image">;
    };
    /**
     * When `true`, renders the target page inside an `<iframe>`.
     * Only works for internal VitePress routes.
     * **Not yet implemented** — reserved for future use.
     */
    livePreview?: boolean;
}

/**
 * Dropdown configuration for a top-level navigation item.
 */
export interface NavDropdown {
    /**
     * Visual layout of the dropdown panel:
     * - `"columns"`   — panels side-by-side (default)
     * - `"spotlight"` — large featured hero on the left, links on the right
     * - any custom string registered via `navDropdownLayoutRegistry.registerLayout(...)`
     */
    layout?: string;
    /**
     * Optional explicit Vue component name for this dropdown.
     * When present, it overrides `layout` registry resolution.
     *
     * This allows projects to ship custom dropdown implementations
     * without changing core navbar system code.
     */
    layoutComponent?: string;
    /** Ordered list of panel columns inside the dropdown. */
    panels?: NavPanel[];
    /** Optional right-side preview pane (shown beside the last column). */
    preview?: NavPreviewPanel;
    /**
     * Maximum CSS width of the dropdown container.
     * Default: `"860px"`.
     */
    maxWidth?: string;
    /**
     * Horizontal alignment of the dropdown relative to its trigger:
     * - `"start"` — left-aligns dropdown to the trigger's left edge
     * - `"center"` — centres the dropdown below the trigger
     * - `"end"` — right-aligns dropdown to the trigger's right edge
     */
    align?: "start" | "center" | "end";
    /**
     * Global keyboard shortcut to open this dropdown
     * (e.g. `"⌘P"`, `"Ctrl+Shift+K"`).
     */
    shortcut?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level nav item
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A top-level navigation item rendered directly in the nav bar.
 * Can be either a simple link or a dropdown trigger.
 */
export interface NavItem {
    /** Display text for the nav bar button or link. */
    text: string;
    /**
     * Icon shown directly beside the `text` in the top nav bar.
     * Use sparingly to keep the bar uncluttered.
     */
    icon?: string;
    /** Custom font for the nav bar label (e.g. brand-specific wordmarks). */
    font?: {
        family?: string;
        weight?: number | string;
    };
    /** Badge rendered inline beside the nav bar text. */
    badge?: NavBadge;
    /**
     * Simple internal link (no dropdown).
     * Cannot be combined with `dropdown`.
     */
    link?: string;
    /**
     * Simple external URL (no dropdown).
     * Cannot be combined with `dropdown`.
     */
    href?: string;
    /**
     * Vue Router active-class match pattern.
     * The nav item is styled as active when the route matches.
     */
    activeMatch?: string;
    /**
     * Dropdown configuration.
     * When provided, this item renders as a dropdown trigger button.
     * Mutually exclusive with `link` / `href`.
     */
    dropdown?: NavDropdown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root config shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The root navigation configuration object assembled by `navConfig.ts`.
 * Keyed by locale code (e.g. `"en-US"`, `"zh-CN"`).
 *
 * VitePress components consume `navConfig.locales[lang]` to obtain the
 * appropriate array of top-level nav items for the active locale.
 */
export interface NavConfig {
    /** Map of locale code → top-level nav item array. */
    locales: Record<string, NavItem[]>;
}
