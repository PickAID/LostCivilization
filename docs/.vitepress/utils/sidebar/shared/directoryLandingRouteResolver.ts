import { DIRECTORY_LANDING_FILE_CANDIDATES } from "./sidebarFileConventions";
import {
    resolveDirectoryLandingPathFromCache,
    stripDirectoryLandingPathFromCache,
} from "@utils/vitepress/api/frontmatter/metadata/DirectoryRouteCacheState";

type SidebarItemLike = {
    link?: string;
    items?: SidebarItemLike[];
    _isDirectory?: boolean;
    _isRoot?: boolean;
    _relativePathKey?: string;
};

type SidebarEntryMap = Record<string, SidebarItemLike[]>;
type SidebarSource = SidebarEntryMap | SidebarItemLike[] | false | undefined;
type TrailingSlashMode = "preserve" | "ensure" | "strip";

const landingFileSegments = DIRECTORY_LANDING_FILE_CANDIDATES.map((fileName) => ({
    fileName,
    routeSegment: `/${fileName.replace(/\.md$/i, "")}`,
    isDirectoryIndex: fileName.toLowerCase() === "index.md",
}));

const nonIndexLandingSegments = landingFileSegments.filter(
    (entry) => !entry.isDirectoryIndex,
);
const landingFileNameSet = new Set(
    DIRECTORY_LANDING_FILE_CANDIDATES.map((fileName) => fileName.toLowerCase()),
);

let directoryLandingRoutes = new Map<string, string>();
let landingPathSet = new Set<string>();

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

    for (const segment of nonIndexLandingSegments) {
        if (normalized.endsWith(`${segment.routeSegment}/`)) {
            normalized = normalized.slice(0, -1);
            break;
        }
    }

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

function normalizeInternalLink(link: unknown): string | null {
    if (typeof link !== "string" || !link.startsWith("/")) {
        return null;
    }

    return normalizeRoutePath(link, "strip");
}

function pathToDirectory(path: string): string {
    const normalized = normalizeRoutePath(path, "strip");
    if (normalized === "/") return "/";

    const segments = normalized.split("/").filter(Boolean);
    if (segments.length === 0) return "/";

    segments.pop();
    return normalizeRoutePath(`/${segments.join("/")}`, "ensure");
}

function isLandingFileKey(value: unknown): value is string {
    return (
        typeof value === "string" &&
        landingFileNameSet.has(value.trim().toLowerCase())
    );
}

function setDirectoryLandingRoute(
    routes: Map<string, string>,
    directoryPath: string,
    landingPath: string,
) {
    const normalizedDirectory = normalizeRoutePath(directoryPath, "ensure");
    const normalizedLanding = normalizeRoutePath(landingPath, "strip");

    if (
        normalizedDirectory === "/" ||
        normalizedDirectory === normalizedLanding ||
        routes.has(normalizedDirectory)
    ) {
        return;
    }

    routes.set(normalizedDirectory, normalizedLanding);
}

function findRootLandingPath(
    items: SidebarItemLike[],
    basePath: string,
): string | null {
    const visitCandidates = (candidates: SidebarItemLike[]) => {
        for (const item of candidates) {
            if (!isLandingFileKey(item._relativePathKey)) continue;
            const landingPath = normalizeInternalLink(item.link);
            if (!landingPath) continue;
            if (basePath === "/" || pathToDirectory(landingPath) === basePath) {
                return landingPath;
            }
        }
        return null;
    };

    for (const item of items) {
        if (!item._isRoot || !Array.isArray(item.items)) continue;
        const landingPath = visitCandidates(item.items);
        if (landingPath) return landingPath;
    }

    return visitCandidates(items);
}

function walkSidebarItems(
    items: SidebarItemLike[],
    visit: (item: SidebarItemLike) => void,
) {
    for (const item of items) {
        visit(item);
        if (Array.isArray(item.items) && item.items.length > 0) {
            walkSidebarItems(item.items, visit);
        }
    }
}

function getSidebarEntries(sidebar: SidebarSource): [string, SidebarItemLike[]][] {
    if (!sidebar) {
        return [];
    }

    if (Array.isArray(sidebar)) {
        return [["/", sidebar]];
    }

    if (typeof sidebar === "object") {
        return Object.entries(sidebar).filter((entry): entry is [string, SidebarItemLike[]] =>
            Array.isArray(entry[1]),
        );
    }

    return [];
}

function buildDirectoryLandingRoutes(sidebar: SidebarSource) {
    const routes = new Map<string, string>();

    for (const [basePath, items] of getSidebarEntries(sidebar)) {
        const normalizedBasePath = normalizeRoutePath(basePath, "ensure");
        const rootLandingPath = findRootLandingPath(items, normalizedBasePath);
        if (rootLandingPath) {
            const inferredRootBasePath =
                normalizedBasePath === "/"
                    ? pathToDirectory(rootLandingPath)
                    : normalizedBasePath;
            setDirectoryLandingRoute(
                routes,
                inferredRootBasePath,
                rootLandingPath,
            );
        }

        walkSidebarItems(items, (item) => {
            if (!item._isDirectory) return;

            const landingPath = normalizeInternalLink(item.link);
            if (!landingPath) return;

            setDirectoryLandingRoute(
                routes,
                pathToDirectory(landingPath),
                landingPath,
            );
        });
    }

    return routes;
}

export function setDirectoryLandingSidebar(sidebar: SidebarSource) {
    directoryLandingRoutes = buildDirectoryLandingRoutes(sidebar);
    landingPathSet = new Set(directoryLandingRoutes.values());
}

function resolveLandingPath(path: string) {
    return directoryLandingRoutes.get(normalizeRoutePath(path, "ensure")) ?? null;
}

export function resolveDirectoryLandingCanonicalPath(path: string): string | null {
    const normalized = normalizeRoutePath(path);
    const cachedLandingPath = resolveDirectoryLandingPathFromCache(normalized);
    if (
        normalized === "/" ||
        landingPathSet.has(normalized) ||
        cachedLandingPath === normalized
    ) {
        return null;
    }

    return cachedLandingPath ?? resolveLandingPath(normalized);
}

export function resolveDirectoryLandingAwarePath(path: string): string {
    const normalized = normalizeRoutePath(path);
    return resolveDirectoryLandingCanonicalPath(normalized) ?? normalized;
}

export function stripDirectoryLandingPath(path: string): string {
    const normalized = normalizeRoutePath(path, "strip");
    const cachedDirectoryPath = stripDirectoryLandingPathFromCache(normalized);
    if (cachedDirectoryPath) {
        return normalizeRoutePath(cachedDirectoryPath, "strip");
    }

    for (const [directoryPath, landingPath] of directoryLandingRoutes.entries()) {
        if (landingPath === normalized) {
            return normalizeRoutePath(directoryPath, "strip");
        }
    }

    return normalized;
}
