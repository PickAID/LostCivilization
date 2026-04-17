import fs from "node:fs/promises";
import path from "node:path";
import glob from "fast-glob";
import matter from "gray-matter";
import {
    DIRECTORY_LANDING_FILE_CANDIDATES,
    SIDEBAR_CONFIG_FILE_CANDIDATES,
} from "../../../../sidebar/shared/sidebarFileConventions";
import {
    relativeDocsPathToDirectoryRoute,
    shouldReplaceDirectoryMetadataCandidate,
} from "./DirectoryMetadataSupport";
import type { DirectoryRouteCache, DirectoryRouteDescriptor } from "./DirectoryRouteCacheState";

type DirectoryMetadataCache = Record<
    string,
    Record<string, Record<string, unknown> | false | null>
>;

type GenerateDirectoryMetadataCacheOptions = {
    rootDir?: string;
    docsDir?: string;
};

type SyncDirectoryMetadataCacheOptions = GenerateDirectoryMetadataCacheOptions & {
    filePaths: string[];
};

type DirectoryMetadataValue = Record<string, unknown> | false | null;

type DirectoryMetadataEntry = {
    directoryRoute: string;
    locale: string;
    value: DirectoryMetadataValue;
};

type DirectoryRouteEntry = {
    directoryRoute: string;
    locale: string;
    value: DirectoryRouteDescriptor;
};

type DirectorySourceFrontmatter = {
    title: string | null;
    metadata: DirectoryMetadataValue | undefined;
    isRoot: boolean;
};

export const DIRECTORY_METADATA_CACHE_RELATIVE_PATH =
    ".cache/directory-metadata/directory_metadata.json";
export const DIRECTORY_ROUTE_CACHE_RELATIVE_PATH =
    ".cache/directory-metadata/directory_routes.json";

function normalizePath(value: string) {
    return value.replace(/\\/g, "/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function pathExists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return false;
        }

        throw error;
    }
}

async function readDirectorySourceFrontmatter(
    filePath: string,
): Promise<DirectorySourceFrontmatter> {
    const content = await fs.readFile(filePath, "utf8");
    const frontmatter = matter(content).data ?? {};

    const title =
        typeof frontmatter.title === "string" && frontmatter.title.trim()
            ? frontmatter.title.trim()
            : null;
    const isRoot = frontmatter.root === true;

    if (!Object.prototype.hasOwnProperty.call(frontmatter, "metadata")) {
        return {
            title,
            metadata: undefined,
            isRoot,
        };
    }

    const metadataValue = frontmatter.metadata;
    if (
        metadataValue !== false &&
        metadataValue !== null &&
        metadataValue !== undefined &&
        !isRecord(metadataValue)
    ) {
        return {
            title,
            metadata: undefined,
            isRoot,
        };
    }

    return {
        title,
        metadata: (metadataValue as DirectoryMetadataValue | undefined) ?? null,
        isRoot,
    };
}

async function resolveDirectoryLandingPath(
    directoryPath: string,
    directoryRoute: string,
) {
    for (const candidate of DIRECTORY_LANDING_FILE_CANDIDATES) {
        const candidatePath = normalizePath(path.join(directoryPath, candidate));
        if (!(await pathExists(candidatePath))) {
            continue;
        }

        const fileStem = candidate.replace(/\.md$/i, "");
        if (fileStem.toLowerCase() === "index") {
            return directoryRoute === "/"
                ? "/"
                : directoryRoute.replace(/\/+$/, "/");
        }

        return `${directoryRoute.replace(/\/$/, "")}/${fileStem}`;
    }

    return null;
}

async function resolveBestDirectoryMetadataSourceFile(directoryPath: string) {
    let bestSource:
        | {
              fileName: string;
              filePath: string;
          }
        | null = null;

    for (const candidate of SIDEBAR_CONFIG_FILE_CANDIDATES) {
        const candidatePath = normalizePath(path.join(directoryPath, candidate));
        if (!(await pathExists(candidatePath))) {
            continue;
        }

        if (
            !bestSource ||
            shouldReplaceDirectoryMetadataCandidate(
                bestSource.fileName,
                candidate,
            )
        ) {
            bestSource = {
                fileName: candidate,
                filePath: candidatePath,
            };
        }
    }

    return bestSource;
}

async function resolveDirectoryCacheEntries(
    directoryPath: string,
    docsPath: string,
): Promise<{
    metadataEntry: DirectoryMetadataEntry | null;
    routeEntry: DirectoryRouteEntry | null;
}> {
    const bestSource = await resolveBestDirectoryMetadataSourceFile(directoryPath);
    if (!bestSource) {
        return {
            metadataEntry: null,
            routeEntry: null,
        };
    }

    const frontmatter = await readDirectorySourceFrontmatter(bestSource.filePath);
    const relativePath = normalizePath(path.relative(docsPath, bestSource.filePath));
    const locale = relativePath.split("/")[0];
    if (!locale) {
        return {
            metadataEntry: null,
            routeEntry: null,
        };
    }

    const directoryRoute = relativeDocsPathToDirectoryRoute(relativePath);
    const landingPath = await resolveDirectoryLandingPath(
        directoryPath,
        directoryRoute,
    );

    return {
        metadataEntry:
            frontmatter.metadata === undefined
                ? null
                : {
                      directoryRoute,
                      locale,
                      value: frontmatter.metadata,
                  },
        routeEntry: {
            directoryRoute,
            locale,
            value: {
                title: frontmatter.title,
                landingPath,
                isRoot: frontmatter.isRoot,
            },
        },
    };
}

async function readDirectoryMetadataCacheFile(cachePath: string) {
    try {
        const content = await fs.readFile(cachePath, "utf8");
        const parsed = JSON.parse(content) as DirectoryMetadataCache;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return {};
        }

        throw error;
    }
}

async function writeJsonCache(
    cachePath: string,
    value: Record<string, unknown>,
) {
    const cacheDir = path.dirname(cachePath);
    const nextCacheContent = JSON.stringify(value, null, 2) + "\n";

    await fs.mkdir(cacheDir, { recursive: true });

    let previousCacheContent: string | null = null;
    try {
        previousCacheContent = await fs.readFile(cachePath, "utf8");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }
    }

    const changed = previousCacheContent !== nextCacheContent;
    if (changed) {
        await fs.writeFile(cachePath, nextCacheContent, "utf8");
    }

    return {
        cachePath,
        changed,
        localeCount: Object.keys(value).length,
    };
}

async function writeDirectoryMetadataCache(
    cachePath: string,
    directoryMetadataByLocale: DirectoryMetadataCache,
) {
    return writeJsonCache(cachePath, directoryMetadataByLocale);
}

async function writeDirectoryRouteCache(
    cachePath: string,
    directoryRouteByLocale: DirectoryRouteCache,
) {
    return writeJsonCache(cachePath, directoryRouteByLocale);
}

export function resolveDirectoryMetadataCachePath(rootDir = process.cwd()) {
    return path.resolve(rootDir, DIRECTORY_METADATA_CACHE_RELATIVE_PATH);
}

export function resolveDirectoryRouteCachePath(rootDir = process.cwd()) {
    return path.resolve(rootDir, DIRECTORY_ROUTE_CACHE_RELATIVE_PATH);
}

export function isDirectoryMetadataSourceFile(
    filePath: string,
    docsRoot: string,
): boolean {
    const normalizedFilePath = normalizePath(path.resolve(filePath));
    const normalizedDocsRoot = normalizePath(path.resolve(docsRoot));

    if (
        normalizedFilePath !== normalizedDocsRoot &&
        !normalizedFilePath.startsWith(`${normalizedDocsRoot}/`)
    ) {
        return false;
    }

    const fileName = path.basename(normalizedFilePath).trim().toLowerCase();
    return SIDEBAR_CONFIG_FILE_CANDIDATES.some(
        (candidate) => candidate.toLowerCase() === fileName,
    );
}

export async function generateDirectoryMetadataCache(
    options: GenerateDirectoryMetadataCacheOptions = {},
) {
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const docsPath = path.resolve(rootDir, options.docsDir ?? "docs");
    const metadataCachePath = resolveDirectoryMetadataCachePath(rootDir);
    const routeCachePath = resolveDirectoryRouteCachePath(rootDir);
    const patterns = SIDEBAR_CONFIG_FILE_CANDIDATES.map((fileName) =>
        normalizePath(path.join(docsPath, "**", fileName)),
    );

    const files = await glob(patterns, {
        absolute: true,
        onlyFiles: true,
    });

    const bestConfigByDirectory = new Map<
        string,
        {
            fileName: string;
            filePath: string;
        }
    >();

    for (const filePath of files) {
        const normalizedFilePath = normalizePath(filePath);
        const directoryPath = normalizePath(path.dirname(normalizedFilePath));
        const fileName = path.basename(normalizedFilePath);
        const current = bestConfigByDirectory.get(directoryPath);

        if (
            !current ||
            shouldReplaceDirectoryMetadataCandidate(current.fileName, fileName)
        ) {
            bestConfigByDirectory.set(directoryPath, {
                fileName,
                filePath: normalizedFilePath,
            });
        }
    }

    const directoryMetadataByLocale: DirectoryMetadataCache = {};
    const directoryRouteByLocale: DirectoryRouteCache = {};

    for (const { filePath } of bestConfigByDirectory.values()) {
        const directoryPath = normalizePath(path.dirname(filePath));
        const { metadataEntry, routeEntry } = await resolveDirectoryCacheEntries(
            directoryPath,
            docsPath,
        );

        if (routeEntry) {
            if (!directoryRouteByLocale[routeEntry.locale]) {
                directoryRouteByLocale[routeEntry.locale] = {};
            }

            directoryRouteByLocale[routeEntry.locale][routeEntry.directoryRoute] =
                routeEntry.value;
        }

        if (!metadataEntry) {
            continue;
        }

        if (!directoryMetadataByLocale[metadataEntry.locale]) {
            directoryMetadataByLocale[metadataEntry.locale] = {};
        }

        directoryMetadataByLocale[metadataEntry.locale][metadataEntry.directoryRoute] =
            metadataEntry.value;
    }

    const metadataWriteResult = await writeDirectoryMetadataCache(
        metadataCachePath,
        directoryMetadataByLocale,
    );
    await writeDirectoryRouteCache(routeCachePath, directoryRouteByLocale);

    return metadataWriteResult;
}

export async function syncDirectoryMetadataCache(
    options: SyncDirectoryMetadataCacheOptions,
) {
    const rootDir = path.resolve(options.rootDir ?? process.cwd());
    const docsPath = path.resolve(rootDir, options.docsDir ?? "docs");
    const metadataCachePath = resolveDirectoryMetadataCachePath(rootDir);
    const routeCachePath = resolveDirectoryRouteCachePath(rootDir);
    const directoryMetadataByLocale = await readDirectoryMetadataCacheFile(
        metadataCachePath,
    );
    const directoryRouteByLocale = await readDirectoryMetadataCacheFile(
        routeCachePath,
    ) as DirectoryRouteCache;
    const directories = new Set<string>();

    for (const filePath of options.filePaths) {
        const normalizedFilePath = normalizePath(path.resolve(filePath));
        if (!isDirectoryMetadataSourceFile(normalizedFilePath, docsPath)) {
            continue;
        }

        directories.add(normalizePath(path.dirname(normalizedFilePath)));
    }

    for (const directoryPath of directories) {
        const relativeDirectoryPath = normalizePath(
            path.relative(docsPath, directoryPath),
        ).replace(/^\/+|\/+$/g, "");
        const locale = relativeDirectoryPath.split("/")[0];
        if (!locale) {
            continue;
        }

        const directoryRoute = relativeDirectoryPath
            ? `/${relativeDirectoryPath}/`.replace(/\/{2,}/g, "/")
            : "/";

        if (directoryMetadataByLocale[locale]) {
            delete directoryMetadataByLocale[locale][directoryRoute];
            if (Object.keys(directoryMetadataByLocale[locale]).length === 0) {
                delete directoryMetadataByLocale[locale];
            }
        }

        if (directoryRouteByLocale[locale]) {
            delete directoryRouteByLocale[locale][directoryRoute];
            if (Object.keys(directoryRouteByLocale[locale]).length === 0) {
                delete directoryRouteByLocale[locale];
            }
        }

        const { metadataEntry, routeEntry } = await resolveDirectoryCacheEntries(
            directoryPath,
            docsPath,
        );

        if (routeEntry) {
            if (!directoryRouteByLocale[routeEntry.locale]) {
                directoryRouteByLocale[routeEntry.locale] = {};
            }

            directoryRouteByLocale[routeEntry.locale][routeEntry.directoryRoute] =
                routeEntry.value;
        }

        if (!metadataEntry) {
            continue;
        }

        if (!directoryMetadataByLocale[metadataEntry.locale]) {
            directoryMetadataByLocale[metadataEntry.locale] = {};
        }

        directoryMetadataByLocale[metadataEntry.locale][metadataEntry.directoryRoute] =
            metadataEntry.value;
    }

    const metadataWriteResult = await writeDirectoryMetadataCache(
        metadataCachePath,
        directoryMetadataByLocale,
    );
    await writeDirectoryRouteCache(routeCachePath, directoryRouteByLocale);

    return metadataWriteResult;
}
