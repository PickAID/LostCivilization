import {
    setDirectoryRouteCache,
    type DirectoryRouteCache,
} from "./DirectoryRouteCacheState";

const directoryRouteModules = import.meta.glob(
    "../../../../../../.cache/directory-metadata/directory_routes.json",
    {
        eager: true,
        import: "default",
    },
) as Record<string, DirectoryRouteCache | undefined>;

function readDirectoryRouteCache(): DirectoryRouteCache {
    for (const value of Object.values(directoryRouteModules)) {
        if (value && typeof value === "object") {
            return value;
        }
    }

    return {};
}

let runtimeInstalled = false;

export async function refreshDirectoryRouteCache() {
    if (!import.meta.env.DEV || typeof window === "undefined") {
        return;
    }

    const response = await fetch(
        `/__m1hono_template__/directory-routes?t=${Date.now()}`,
    );
    if (!response.ok) {
        throw new Error(
            `Failed to refresh directory route cache: ${response.status}`,
        );
    }

    setDirectoryRouteCache((await response.json()) as DirectoryRouteCache);
}

export function installDirectoryRouteCacheRuntime() {
    if (runtimeInstalled) {
        return;
    }

    runtimeInstalled = true;
    setDirectoryRouteCache(readDirectoryRouteCache());

    if (import.meta.hot) {
        import.meta.hot.on(
            "m1honoTemplate:derived-docs-updated",
            async () => {
                try {
                    await refreshDirectoryRouteCache();
                } catch (error) {
                    console.warn(
                        "[m1honoTemplate] Failed to refresh directory route cache.",
                        error,
                    );
                }
            },
        );
    }
}
