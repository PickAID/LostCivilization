const EXTERNAL_OR_PASSTHROUGH_PATTERN =
    /^(?:https?:)?\/\/|^(?:mailto|tel|data|blob):/i;

const CONTENT_ROOT_PREFIXES = ["docs", "src"] as const;

export function normalizeKnownRoutePath(path: string) {
    let route = (path || "/").trim();
    if (!route) return "/";

    route = route.replace(/\\/g, "/");
    route = route.split(/[?#]/)[0] || "/";
    route = route.replace(/\/index(?:\.(?:md|html))?$/i, "/");
    route = route.replace(/\.(md|html)$/i, "");
    route = route.replace(/\/{2,}/g, "/");

    if (!route.startsWith("/")) route = `/${route}`;
    if (route !== "/" && !route.endsWith("/")) route += "/";

    return route;
}

function stripContentRoot(route: string) {
    for (const root of CONTENT_ROOT_PREFIXES) {
        const embeddedIndex = route.lastIndexOf(`/${root}/`);
        if (embeddedIndex >= 0) {
            return route.slice(embeddedIndex + `/${root}`.length);
        }

        if (route.startsWith(`${root}/`)) {
            return route.slice(root.length);
        }

        if (route.startsWith(`/${root}`)) {
            return route.slice(`/${root}`.length);
        }
    }

    return route;
}

export function normalizeMarkdownPageRoute(filePath: string) {
    let route = (filePath || "/").trim();
    if (!route) return "/";

    route = route.replace(/\\/g, "/");
    route = route.split(/[?#]/)[0] || "/";
    route = stripContentRoot(route);

    return normalizeKnownRoutePath(route);
}

export function buildKnownPagePathSet(pageFiles: Iterable<string>) {
    const set = new Set<string>();

    for (const filePath of pageFiles) {
        if (typeof filePath !== "string") continue;
        set.add(normalizeMarkdownPageRoute(filePath));
    }

    return set;
}

function collectSidebarLinks(
    entries: unknown,
    addPath: (value: unknown) => void,
) {
    if (!Array.isArray(entries)) return;

    for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue;
        const node = entry as Record<string, unknown>;
        addPath(node.link);
        addPath(node.href);
        collectSidebarLinks(node.items, addPath);
    }
}

export function buildKnownPagePathSetFromSidebar(sidebarConfig: unknown) {
    const set = new Set<string>();
    if (!sidebarConfig || typeof sidebarConfig !== "object") return set;

    const addPath = (value: unknown) => {
        if (typeof value !== "string") return;
        const trimmed = value.trim();
        if (!trimmed || EXTERNAL_OR_PASSTHROUGH_PATTERN.test(trimmed)) return;
        set.add(normalizeKnownRoutePath(trimmed));
    };

    if (Array.isArray(sidebarConfig)) {
        collectSidebarLinks(sidebarConfig, addPath);
        return set;
    }

    for (const [basePath, entries] of Object.entries(
        sidebarConfig as Record<string, unknown>,
    )) {
        addPath(basePath);
        collectSidebarLinks(entries, addPath);
    }

    return set;
}
