const SIDEBAR_CONFIG_PRIORITY = [
    "sidebarindex.md",
    "root.md",
    "index.md",
    "catalogue.md",
] as const;

const SIDEBAR_CONFIG_PRIORITY_MAP = new Map(
    SIDEBAR_CONFIG_PRIORITY.map((fileName, index) => [fileName, index]),
);

function normalizeSlashes(value: string): string {
    return value.replace(/\\/g, "/");
}

function normalizeRoutePath(value: string): string {
    let normalized = normalizeSlashes(value).trim();

    if (!normalized) return "/";

    normalized = normalized.split(/[?#]/)[0] || "/";
    normalized = normalized.replace(/\.html$/i, "");
    normalized = normalized.replace(/\/{2,}/g, "/");

    if (!normalized.startsWith("/")) {
        normalized = `/${normalized}`;
    }

    return normalized;
}

export function getDirectoryMetadataCandidatePriority(
    fileName: string,
): number {
    return (
        SIDEBAR_CONFIG_PRIORITY_MAP.get(fileName.trim().toLowerCase()) ??
        Number.MAX_SAFE_INTEGER
    );
}

export function shouldReplaceDirectoryMetadataCandidate(
    currentFileName: string | null | undefined,
    nextFileName: string,
): boolean {
    if (!currentFileName) return true;

    return (
        getDirectoryMetadataCandidatePriority(nextFileName) <
        getDirectoryMetadataCandidatePriority(currentFileName)
    );
}

export function relativeDocsPathToDirectoryRoute(relativePath: string): string {
    const normalized = normalizeSlashes(relativePath)
        .replace(/^\/+|\/+$/g, "")
        .replace(/\/[^/]+$/, "");

    if (!normalized) return "/";

    return `/${normalized}/`.replace(/\/{2,}/g, "/");
}

export function pagePathToDirectoryRoute(pagePath: string): string {
    const normalized = normalizeRoutePath(pagePath);

    if (normalized === "/") {
        return "/";
    }

    if (normalized.endsWith("/")) {
        return normalized;
    }

    const segments = normalized.split("/").filter(Boolean);
    segments.pop();

    if (segments.length === 0) {
        return "/";
    }

    return `/${segments.join("/")}/`;
}

export function extractRouteLocale(pagePath: string): string | null {
    const normalized = normalizeRoutePath(pagePath);
    const segments = normalized.split("/").filter(Boolean);
    return segments[0] ?? null;
}
