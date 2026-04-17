export type DirectoryRouteDescriptor = {
    title?: string | null;
    landingPath?: string | null;
    isRoot?: boolean;
};

export type DirectoryRouteCache = Record<
    string,
    Record<string, DirectoryRouteDescriptor | undefined>
>;

const LANDING_ROUTE_SEGMENTS = ["index", "catalogue", "readme"] as const;

let directoryRouteCache: DirectoryRouteCache = {};

type TrailingSlashMode = "preserve" | "ensure" | "strip";

function normalizeRoutePath(
    path: string,
    trailingSlash: TrailingSlashMode = "preserve",
): string {
    let normalized = decodeURI(path || "/").trim();
    if (!normalized) return "/";

    normalized = normalized.split(/[?#]/)[0] || "/";
    if (!normalized.startsWith("/")) normalized = `/${normalized}`;
    normalized = normalized.replace(/\/{2,}/g, "/");
    normalized = normalized.replace(/\.html$/i, "");

    if (trailingSlash === "ensure") {
        return normalized === "/" || normalized.endsWith("/")
            ? normalized
            : `${normalized}/`;
    }

    if (trailingSlash === "strip") {
        return normalized.length > 1 && normalized.endsWith("/")
            ? normalized.slice(0, -1)
            : normalized;
    }

    return normalized;
}

function stripLandingSegment(path: string) {
    const normalized = normalizeRoutePath(path, "strip");
    const lowerPath = normalized.toLowerCase();

    for (const segment of LANDING_ROUTE_SEGMENTS) {
        const suffix = `/${segment}`;
        if (!lowerPath.endsWith(suffix)) {
            continue;
        }

        const basePath = normalized.slice(0, -suffix.length);
        return normalizeRoutePath(basePath || "/", "ensure");
    }

    return null;
}

function normalizeDirectoryRoute(path: string) {
    const landingStripped = stripLandingSegment(path);
    if (landingStripped) {
        return landingStripped;
    }

    return normalizeRoutePath(path, "ensure");
}

function extractRouteLocale(path: string) {
    const normalized = normalizeRoutePath(path, "strip");
    const segments = normalized.split("/").filter(Boolean);
    return segments[0] ?? null;
}

export function setDirectoryRouteCache(cache: DirectoryRouteCache) {
    directoryRouteCache = cache;
}

export function getDirectoryRouteCache() {
    return directoryRouteCache;
}

export function resolveDirectoryRouteDescriptor(
    path: string,
): DirectoryRouteDescriptor | null {
    const directoryRoute = normalizeDirectoryRoute(path);
    const locale = extractRouteLocale(directoryRoute);
    if (!locale) {
        return null;
    }

    return directoryRouteCache[locale]?.[directoryRoute] ?? null;
}

export function resolveDirectoryTitleFromCache(path: string): string | null {
    const descriptor = resolveDirectoryRouteDescriptor(path);
    if (
        !descriptor ||
        descriptor.isRoot === true ||
        typeof descriptor.title !== "string" ||
        !descriptor.title.trim()
    ) {
        return null;
    }

    return descriptor.title.trim();
}

export function resolveDirectoryLandingPathFromCache(path: string): string | null {
    const descriptor = resolveDirectoryRouteDescriptor(path);
    if (
        !descriptor ||
        typeof descriptor.landingPath !== "string" ||
        !descriptor.landingPath.trim()
    ) {
        return null;
    }

    return normalizeRoutePath(descriptor.landingPath, "strip");
}

export function stripDirectoryLandingPathFromCache(path: string): string | null {
    const normalized = normalizeRoutePath(path, "strip");

    for (const localeEntries of Object.values(directoryRouteCache)) {
        for (const [directoryRoute, descriptor] of Object.entries(localeEntries)) {
            if (
                descriptor?.landingPath &&
                normalizeRoutePath(descriptor.landingPath, "strip") === normalized
            ) {
                return normalizeRoutePath(directoryRoute, "strip");
            }
        }
    }

    return null;
}
