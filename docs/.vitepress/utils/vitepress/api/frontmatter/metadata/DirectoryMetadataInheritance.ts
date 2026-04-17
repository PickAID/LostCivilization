import type { MetadataFrontmatterInput } from "./MetadataFrontmatterApi";
import { shallowRef } from "vue";
import {
    extractRouteLocale,
    pagePathToDirectoryRoute,
} from "./DirectoryMetadataSupport";

type DirectoryMetadataCache = Record<
    string,
    Record<string, MetadataFrontmatterInput | false | null>
>;

const directoryMetadataModules = import.meta.glob(
    "../../../../../../.cache/directory-metadata/*.json",
    {
        eager: true,
        import: "default",
    },
) as Record<string, DirectoryMetadataCache | undefined>;

function readDirectoryMetadataCache(): DirectoryMetadataCache {
    for (const value of Object.values(directoryMetadataModules)) {
        if (value && typeof value === "object") {
            return value;
        }
    }

    return {};
}

const directoryMetadataCache = shallowRef(readDirectoryMetadataCache());

export async function refreshDirectoryMetadataCache() {
    if (!import.meta.env.DEV || typeof window === "undefined") {
        return;
    }

    const response = await fetch(
        `/__m1hono_template__/directory-metadata?t=${Date.now()}`,
    );
    if (!response.ok) {
        throw new Error(
            `Failed to refresh directory metadata cache: ${response.status}`,
        );
    }

    directoryMetadataCache.value = (await response.json()) as DirectoryMetadataCache;
}

if (import.meta.hot) {
    import.meta.hot.on(
        "m1honoTemplate:derived-docs-updated",
        async () => {
            try {
                await refreshDirectoryMetadataCache();
            } catch (error) {
                console.warn(
                    "[m1honoTemplate] Failed to refresh directory metadata cache.",
                    error,
                );
            }
        },
    );
}

export function resolveEffectiveMetadataFrontmatter(
    pagePath: string,
    metadata: unknown,
): unknown {
    if (metadata !== undefined) {
        return metadata;
    }

    const locale = extractRouteLocale(pagePath);
    if (!locale) {
        return undefined;
    }

    const localeCache = directoryMetadataCache.value[locale];
    if (!localeCache) {
        return undefined;
    }

    const directoryRoute = pagePathToDirectoryRoute(pagePath);
    if (!Object.prototype.hasOwnProperty.call(localeCache, directoryRoute)) {
        return undefined;
    }

    return localeCache[directoryRoute];
}
