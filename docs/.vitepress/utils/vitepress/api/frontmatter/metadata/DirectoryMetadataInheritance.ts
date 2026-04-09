import type { MetadataFrontmatterInput } from "./MetadataFrontmatterApi";
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

const directoryMetadataCache = readDirectoryMetadataCache();

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

    const localeCache = directoryMetadataCache[locale];
    if (!localeCache) {
        return undefined;
    }

    const directoryRoute = pagePathToDirectoryRoute(pagePath);
    if (!Object.prototype.hasOwnProperty.call(localeCache, directoryRoute)) {
        return undefined;
    }

    return localeCache[directoryRoute];
}
