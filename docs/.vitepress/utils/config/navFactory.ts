import type {
    NavBadge,
    NavDropdown,
    NavGroup,
    NavItem,
    NavLink,
    NavLinkPreview,
    NavMedia,
    NavPanel,
    NavPreviewPanel,
} from "./navTypes";

const NAV_BUILDER_MARK = "__navBuilderKind";

type NavBuilderKind =
    | "group"
    | "panel"
    | "preview-panel"
    | "dropdown"
    | "linked-item"
    | "dropdown-item";

type LinkTarget = string | { link?: string; href?: string };
type BadgeOptions = Omit<NavBadge, "text" | "type">;
type LinkOptions = Omit<NavLink, "text" | "link" | "href">;
type GroupOptions = Omit<NavGroup, "label" | "items">;
type PanelOptions = Omit<NavPanel, "groups">;
type DropdownOptions = Omit<NavDropdown, "panels">;
type PreviewOptions = Omit<NavLinkPreview, "title" | "desc" | "body" | "media">;
type PreviewPanelOptions = Omit<
    NavPreviewPanel,
    "type" | "title" | "desc" | "body" | "media"
>;
type NavItemOptions = Omit<NavItem, "text" | "link" | "href" | "dropdown">;
type MediaOptions = Omit<NavMedia, "type">;
type ScreenshotInput =
    | string
    | {
          src?: string;
          background?: string;
          aspect?: string;
          alt?: string;
          variant?: NavMedia["variant"];
      };

function markNavBuilder<T extends Record<string, unknown>>(
    value: T,
    kind: NavBuilderKind,
): T {
    Object.defineProperty(value, NAV_BUILDER_MARK, {
        value: kind,
        enumerable: false,
        configurable: false,
        writable: false,
    });
    return value;
}

function readNavBuilderKind(value: unknown): NavBuilderKind | undefined {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[NAV_BUILDER_MARK] as
        | NavBuilderKind
        | undefined;
}

function normalizeNavGroup(group: NavGroup): NavGroup {
    if (readNavBuilderKind(group) === "group") return group;
    return markNavBuilder({ ...group }, "group");
}

function normalizeNavPanel(panel: NavPanel): NavPanel {
    if (readNavBuilderKind(panel) === "panel") return panel;
    return markNavBuilder(
        {
            ...panel,
            groups: Array.isArray(panel.groups)
                ? panel.groups.map(normalizeNavGroup)
                : [],
        },
        "panel",
    );
}

function normalizeNavPreviewPanel(preview: NavPreviewPanel): NavPreviewPanel {
    if (readNavBuilderKind(preview) === "preview-panel") return preview;
    return markNavBuilder(
        { ...preview, type: "preview" as const },
        "preview-panel",
    );
}

function normalizeNavDropdown(dropdown: NavDropdown): NavDropdown {
    if (readNavBuilderKind(dropdown) === "dropdown") return dropdown;
    return markNavBuilder(
        {
            ...dropdown,
            panels: Array.isArray(dropdown.panels)
                ? dropdown.panels.map(normalizeNavPanel)
                : [],
            ...(dropdown.preview
                ? { preview: normalizeNavPreviewPanel(dropdown.preview) }
                : {}),
        },
        "dropdown",
    );
}

function ensureBuilder(
    value: unknown,
    kinds: NavBuilderKind[],
    message: string,
): asserts value {
    const kind = readNavBuilderKind(value);
    if (kind && kinds.includes(kind)) return;
    throw new Error(message);
}

function isExternalTarget(target: string) {
    return /^(https?:)?\/\//.test(target);
}

function resolveTarget(target: LinkTarget) {
    if (typeof target === "string") {
        return isExternalTarget(target) ? { href: target } : { link: target };
    }
    return target;
}

export function createNavBadge(
    text: string,
    type: NavBadge["type"] = "info",
    options: BadgeOptions = {},
): NavBadge {
    return {
        text,
        type,
        ...options,
    };
}

export function createNavMedia(
    type: NavMedia["type"],
    options: MediaOptions = {},
): NavMedia {
    return {
        type,
        ...options,
    };
}

export function createScreenshotMedia(
    alt: string,
    src: string,
    background: string,
    aspect = "16 / 10",
    variant: NavMedia["variant"] = "plain",
): NavMedia {
    return createNavMedia("screenshot", {
        alt,
        src,
        background,
        aspect,
        variant,
    });
}

export function createShowcasePreview(
    title: string,
    desc: string,
    body: string,
    media: ScreenshotInput,
    options: PreviewOptions = {},
): NavLinkPreview {
    return createNavLinkPreview(
        title,
        desc,
        body,
        createNavMedia("screenshot", {
            ...(typeof media === "string" ? { background: media } : media),
            aspect: typeof media === "string" ? "21 / 9" : media.aspect || "21 / 9",
            alt: typeof media === "string" ? title : media.alt || title,
            variant:
                typeof media === "string" ? "plain" : media.variant || "plain",
        }),
        options,
    );
}

export function createNavLinkPreview(
    title: string,
    desc: string,
    body: string,
    media?: NavMedia,
    options: PreviewOptions = {},
): NavLinkPreview {
    return {
        title,
        desc,
        body,
        ...(media ? { media } : {}),
        ...options,
    };
}

export function createNavPreviewPanel(
    title: string,
    desc: string,
    body: string,
    media?: NavMedia,
    options: PreviewPanelOptions = {},
): NavPreviewPanel {
    return markNavBuilder(
        {
            type: "preview" as const,
            title,
            desc,
            body,
            ...(media ? { media } : {}),
            ...options,
        },
        "preview-panel",
    );
}

export function createNavLink(
    text: string,
    target: LinkTarget,
    options: LinkOptions = {},
): NavLink {
    return {
        text,
        ...resolveTarget(target),
        ...options,
    };
}

export function createNavGroup(
    label: string | undefined,
    items: NavLink[],
    options: GroupOptions = {},
): NavGroup {
    return markNavBuilder(
        {
        ...(label ? { label } : {}),
        items,
        ...options,
        },
        "group",
    );
}

export function createNavPanel(
    groups: NavGroup[],
    options: PanelOptions = {},
): NavPanel {
    return markNavBuilder(
        {
            groups: groups.map(normalizeNavGroup),
            ...options,
        },
        "panel",
    );
}

export function createNavDropdown(
    panels: NavPanel[],
    options: DropdownOptions = {},
): NavDropdown {
    return normalizeNavDropdown({
        ...options,
        panels,
    });
}

export function createLinkedNavItem(
    text: string,
    target: LinkTarget,
    options: NavItemOptions = {},
): NavItem {
    return markNavBuilder(
        {
            text,
            ...resolveTarget(target),
            ...options,
        },
        "linked-item",
    );
}

export function createDropdownNavItem(
    text: string,
    dropdown: NavDropdown,
    options: NavItemOptions = {},
): NavItem {
    return markNavBuilder(
        {
            text,
            dropdown: normalizeNavDropdown(dropdown),
            ...options,
        },
        "dropdown-item",
    );
}

export function createNavItems(...items: NavItem[]): NavItem[] {
    return items;
}

export function normalizeNavItems(items: NavItem[]): NavItem[] {
    return items.map((item) => {
        if (!item.dropdown) return item;
        return {
            ...item,
            dropdown: normalizeNavDropdown(item.dropdown),
        };
    });
}

export function assertNavItemsUseBuilders(
    items: NavItem[],
    localeCode: string,
) {
    items.forEach((item) => {
        const itemLabel = item.text || "(unnamed)";
        const base = `Navigation item "${itemLabel}" in locale "${localeCode}" must be created through navigation helpers.`;

        if (item.dropdown) {
            ensureBuilder(
                item.dropdown,
                ["dropdown"],
                `${base} Dropdown formulas must come from createNavDropdown(...) or typed section builders.`,
            );
            item.dropdown.panels?.forEach((panel, panelIndex) => {
                ensureBuilder(
                    panel,
                    ["panel"],
                    `${base} Panel #${panelIndex + 1} must use createNavPanel(...).`,
                );
                panel.groups?.forEach((group, groupIndex) => {
                    ensureBuilder(
                        group,
                        ["group"],
                        `${base} Group #${groupIndex + 1} in panel #${panelIndex + 1} must use createNavGroup(...).`,
                    );
                });
            });
            if (item.dropdown.preview) {
                ensureBuilder(
                    item.dropdown.preview,
                    ["preview-panel"],
                    `${base} Dropdown preview panels must use createNavPreviewPanel(...).`,
                );
            }
            return;
        }

        // Simple top-level links do not need the dropdown formula builders.
    });
}
