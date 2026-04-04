import { computed } from "vue";
import { useData } from "vitepress";
import type { NavBadge, NavData, NavIcon, NavLink } from "./navLinkType";

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function asTarget(value: unknown): NavLink["target"] | undefined {
    return value === "_blank" || value === "_self" || value === "_parent"
        ? value
        : undefined;
}

function normalizeIcon(value: unknown): NavIcon | NavLink["icon"] | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "object") return value as NavLink["icon"];
    return undefined;
}

function normalizeBadge(value: unknown): NavBadge | undefined {
    if (typeof value === "string" && value.trim()) {
        return { text: value.trim(), type: "info" };
    }

    if (!value || typeof value !== "object") {
        return undefined;
    }

    const candidate = value as Record<string, unknown>;
    const text = asString(candidate.text);
    if (!text) return undefined;

    return {
        text,
        ...(asString(candidate.type)
            ? { type: candidate.type as NavBadge["type"] }
            : {}),
    };
}

function normalizeBadges(value: unknown): Array<string | NavBadge> | undefined {
    if (!Array.isArray(value)) return undefined;

    const badges = value
        .map((badge) => normalizeBadge(badge))
        .filter((badge): badge is NavBadge => Boolean(badge));

    return badges.length ? badges : undefined;
}

export function navLinksData() {
    const { frontmatter } = useData();

    const groups = computed<NavData[]>(() => {
        const raw = frontmatter.value?.navLinks;
        if (!Array.isArray(raw)) return [];

        return raw
            .map((group: Record<string, unknown>): NavData | null => {
                const items = Array.isArray(group.items)
                    ? group.items
                          .map((item: Record<string, unknown>): NavLink | null => {
                              const title = asString(item.title);
                              const link = asString(item.link);
                              if (!title || !link) return null;

                              const navItem: NavLink = { title, link };
                              const desc = asString(item.desc);
                              const icon = normalizeIcon(item.icon);
                              const badge = normalizeBadge(item.badge);
                              const badges = normalizeBadges(item.badges);
                              const tag = asString(item.tag);
                              const color = asString(item.color);
                              const target = asTarget(item.target);

                              if (desc) navItem.desc = desc;
                              if (icon) navItem.icon = icon;
                              if (badge) navItem.badge = badge;
                              if (badges) navItem.badges = badges;
                              if (tag) navItem.tag = tag;
                              if (color) navItem.color = color;
                              if (target) navItem.target = target;

                              return navItem;
                          })
                          .filter((item): item is NavLink => Boolean(item))
                    : [];

                const title = asString(group.title);
                if (!title || items.length === 0) {
                    return null;
                }

                const navGroup: NavData = { title, items };
                const description = asString(group.description);
                const columns = asNumber(group.columns);
                const collapsed = asBoolean(group.collapsed);
                const icon = normalizeIcon(group.icon);

                if (description) navGroup.description = description;
                if (columns != null) navGroup.columns = columns;
                if (collapsed != null) navGroup.collapsed = collapsed;
                if (icon) navGroup.icon = icon;

                return navGroup;
            })
            .filter((group): group is NavData => Boolean(group));
    });

    const hasNavLinks = computed(() => groups.value.length > 0);
    const pageColumns = computed<number | undefined>(() => {
        const value = frontmatter.value?.navLinksColumns;
        return value != null ? Number(value) : undefined;
    });
    const pageNoIcon = computed<boolean>(() => frontmatter.value?.navLinksNoIcon === true);

    return { groups, hasNavLinks, pageColumns, pageNoIcon };
}
