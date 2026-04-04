import type { NavBadge, NavData, NavLink } from "./navLinkType";

export type MNavLinkOptions = Omit<NavLink, "title" | "link">;
export type MNavDataOptions = Omit<NavData, "title" | "items">;

export function createMNavBadge(
    text: string,
    type: NavBadge["type"] = "info",
): NavBadge {
    return { text, type };
}

export function createMNavLink(
    title: string,
    link: string,
    options: MNavLinkOptions = {},
): NavLink {
    return {
        title,
        link,
        ...options,
    };
}

export function createMNavData(
    title: string,
    items: NavLink[],
    options: MNavDataOptions = {},
): NavData {
    return {
        title,
        items,
        ...options,
    };
}

export function defineMNavData(groups: NavData[]): NavData[] {
    return groups;
}
