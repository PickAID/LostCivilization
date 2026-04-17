export interface BreadcrumbItem {
    text: string;
    link?: string;
}

export interface BreadcrumbNavPanel {
    featured?: {
        title?: string;
        link?: string;
        href?: string;
    };
    groups?: Array<{
        items?: BreadcrumbNavNode[];
    }>;
}

export interface BreadcrumbNavNode {
    text?: string;
    link?: string;
    href?: string;
    items?: BreadcrumbNavNode[];
    dropdown?: {
        panels?: BreadcrumbNavPanel[];
    };
}

export interface BuildBreadcrumbItemsOptions {
    routePath: string;
    siteBase?: string;
    homeLink: string;
    homeText?: string;
    pageTitle?: string;
    knownPagePaths?: Iterable<string>;
    navTree?: BreadcrumbNavNode[];
    localeCodes?: Iterable<string>;
    resolveLinkPath?: (path: string) => string;
    resolveItemLink?: (
        path: string,
        fallbackLink: string | undefined,
        isLast: boolean,
    ) => string | undefined;
    resolveItemText?: (
        path: string,
        fallbackText: string,
        isLast: boolean,
    ) => string | undefined;
}

const EXTERNAL_OR_PASSTHROUGH_PATTERN =
    /^(?:https?:)?\/\/|^(?:mailto|tel|data|blob):/i;

export function isExternalUrl(value: string) {
    return EXTERNAL_OR_PASSTHROUGH_PATTERN.test(value);
}

export function resolveBaseAwareHref(
    href: string | undefined,
    applyBase: (value: string) => string,
) {
    if (!href) return undefined;
    if (href.startsWith("#") || isExternalUrl(href)) return href;
    return applyBase(href);
}

function ensureLeadingSlash(path: string) {
    return path.startsWith("/") ? path : `/${path}`;
}

function normalizeBase(base: string | undefined) {
    if (!base || base === "/") return "/";
    return `/${base.replace(/^\/|\/$/g, "")}/`;
}

function stripBase(path: string, base: string) {
    const normalizedPath = ensureLeadingSlash(path);
    if (base === "/") return normalizedPath;
    if (normalizedPath === base.slice(0, -1)) return "/";
    if (normalizedPath.startsWith(base)) {
        return ensureLeadingSlash(normalizedPath.slice(base.length));
    }
    return normalizedPath;
}

function normalizeRoutePath(path: string) {
    let normalized = ensureLeadingSlash(path.split(/[?#]/)[0] || "/");
    normalized = normalized.replace(/\/index(?:\.(?:md|html))?$/i, "/");
    normalized = normalized.replace(/\.(md|html)$/i, "");
    normalized = normalized.replace(/\/{2,}/g, "/");
    if (normalized !== "/" && !normalized.endsWith("/")) normalized += "/";
    return normalized;
}

function normalizeRouteSet(
    paths: Iterable<string> | undefined,
    homeLink?: string,
    resolveLinkPath?: (path: string) => string,
) {
    const set = new Set<string>();
    if (!paths) return set;
    for (const path of paths) {
        const normalizedPath = normalizeRoutePath(path);
        set.add(normalizedPath);
        if (resolveLinkPath) {
            set.add(normalizeRoutePath(resolveLinkPath(normalizedPath)));
        }
        if (homeLink) {
            const localizedPath = prefixLocalePath(normalizedPath, homeLink);
            set.add(localizedPath);
            if (resolveLinkPath) {
                set.add(normalizeRoutePath(resolveLinkPath(localizedPath)));
            }
        }
    }
    return set;
}

function humanizeSegment(segment: string) {
    return segment
        .replace(/\.(html|md)$/i, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function prefixLocalePath(path: string, homeLink: string) {
    if (!path.startsWith("/") || isExternalUrl(path)) return path;

    const localeRoot = normalizeRoutePath(homeLink);
    if (path === "/") return localeRoot;

    const normalizedPath = normalizeRoutePath(path);
    if (normalizedPath.startsWith(localeRoot)) {
        return normalizedPath;
    }

    return normalizeRoutePath(
        `${localeRoot.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    );
}

function collectNavLinks(
    nodes: BreadcrumbNavNode[] | undefined,
    homeLink: string,
    linkMap: Map<string, string>,
    resolveLinkPath?: (path: string) => string,
) {
    if (!Array.isArray(nodes)) return;

    const register = (text: string | undefined, href: string | undefined) => {
        if (!text || !href || isExternalUrl(href)) return;
        const localizedPath = prefixLocalePath(href, homeLink);
        if (!linkMap.has(localizedPath)) {
            linkMap.set(localizedPath, text);
        }
        if (resolveLinkPath) {
            const resolvedPath = normalizeRoutePath(
                resolveLinkPath(localizedPath),
            );
            if (!linkMap.has(resolvedPath)) {
                linkMap.set(resolvedPath, text);
            }
        }
    };

    for (const node of nodes) {
        register(node.text, node.link || node.href);

        if (Array.isArray(node.items)) {
            collectNavLinks(node.items, homeLink, linkMap, resolveLinkPath);
        }

        if (!Array.isArray(node.dropdown?.panels)) continue;

        for (const panel of node.dropdown.panels) {
            register(
                panel.featured?.title,
                panel.featured?.link || panel.featured?.href,
            );
            for (const group of panel.groups ?? []) {
                collectNavLinks(group.items, homeLink, linkMap, resolveLinkPath);
            }
        }
    }
}

function dedupeBreadcrumbs(items: BreadcrumbItem[]) {
    return items.filter(
        (item, index, all) =>
            all.findIndex(
                (candidate) =>
                    candidate.text === item.text &&
                    candidate.link === item.link,
            ) === index,
    );
}

export function buildBreadcrumbItems({
    routePath,
    siteBase,
    homeLink,
    homeText = "Home",
    pageTitle,
    knownPagePaths,
    navTree,
    localeCodes,
    resolveLinkPath,
    resolveItemLink,
    resolveItemText,
}: BuildBreadcrumbItemsOptions): BreadcrumbItem[] {
    const normalizedHomeLink = normalizeRoutePath(homeLink);
    const knownRoutes = normalizeRouteSet(
        knownPagePaths,
        normalizedHomeLink,
        resolveLinkPath,
    );
    const linkMap = new Map<string, string>();
    collectNavLinks(navTree, normalizedHomeLink, linkMap, resolveLinkPath);

    const rawPath = stripBase(routePath, normalizeBase(siteBase));
    const normalizedRoute = normalizeRoutePath(rawPath);
    const parts = normalizedRoute.split("/").filter(Boolean);
    const knownLocaleSegments = new Set(localeCodes ?? []);
    const homeSegments = normalizedHomeLink.split("/").filter(Boolean);
    const currentLocaleSegment = homeSegments[0];
    const contentParts =
        parts.length > 0 &&
        (parts[0] === currentLocaleSegment || knownLocaleSegments.has(parts[0]))
            ? parts.slice(1)
            : parts;

    const items: BreadcrumbItem[] = [
        {
            text: homeText,
            link: normalizedHomeLink,
        },
    ];

    let currentPath = normalizedHomeLink;
    contentParts.forEach((part, index) => {
        currentPath = normalizeRoutePath(
            `${currentPath.replace(/\/$/, "")}/${part}`,
        );
        const resolvedCurrentPath = resolveLinkPath
            ? normalizeRoutePath(resolveLinkPath(currentPath))
            : currentPath;

        const isLast = index === contentParts.length - 1;
        const fallbackText =
            linkMap.get(resolvedCurrentPath) ||
            linkMap.get(currentPath) ||
            (isLast && pageTitle ? pageTitle : humanizeSegment(part));
        const fallbackLink =
            isLast ||
            knownRoutes.has(resolvedCurrentPath) ||
            knownRoutes.has(currentPath)
                ? resolvedCurrentPath
                : undefined;
        const resolvedText =
            resolveItemText?.(currentPath, fallbackText, isLast) || fallbackText;
        const resolvedLink =
            resolveItemLink?.(currentPath, fallbackLink, isLast) ?? fallbackLink;

        items.push({
            text: resolvedText,
            link: resolvedLink,
        });
    });

    if (items.length > 1 && pageTitle) {
        items[items.length - 1].text = pageTitle;
    }

    return dedupeBreadcrumbs(items);
}
