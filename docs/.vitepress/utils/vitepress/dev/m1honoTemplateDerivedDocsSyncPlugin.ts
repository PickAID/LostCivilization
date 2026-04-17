import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import {
    clearCache,
    getConfiguredLanguages,
    getSidebar,
} from "../../sidebar/lib";
import {
    isSidebarConfigFileName,
    SIDEBAR_CONFIG_FILE_CANDIDATES,
} from "../../sidebar/shared/sidebarFileConventions";
import {
    generateDirectoryMetadataCache,
    isDirectoryMetadataSourceFile,
    resolveDirectoryMetadataCachePath,
    resolveDirectoryRouteCachePath,
    syncDirectoryMetadataCache,
} from "../api/frontmatter/metadata/directoryMetadataCache";

type M1honoTemplateDerivedDocsSyncPluginOptions = {
    rootDir: string;
    docsDir: string;
    debug?: boolean;
    reloadDelay?: number;
};

type SyncMode = "hmr" | "restart";

const GLOBAL_SIDEBAR_CONFIG_FILE_NAME = ".sidebarrc.yml";

function normalizePath(value: string) {
    return path.resolve(value).replace(/\\/g, "/").replace(/\/+$/g, "");
}

function resolvePreferredSyncMode(current: SyncMode | null, next: SyncMode) {
    if (current === "restart" || next === "restart") {
        return "restart";
    }

    return next;
}

export function m1honoTemplateDerivedDocsSyncPlugin(
    options: M1honoTemplateDerivedDocsSyncPluginOptions,
): Plugin {
    const rootDir = normalizePath(options.rootDir);
    const docsRoot = normalizePath(path.resolve(rootDir, options.docsDir));
    const globalSidebarConfigPath = normalizePath(
        path.join(docsRoot, GLOBAL_SIDEBAR_CONFIG_FILE_NAME),
    );
    const directoryMetadataCachePath = resolveDirectoryMetadataCachePath(rootDir);
    const directoryRouteCachePath = resolveDirectoryRouteCachePath(rootDir);
    const reloadDelay = options.reloadDelay ?? 120;
    const debug = options.debug === true;

    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    let syncPromise: Promise<void> | null = null;
    let pendingMode: SyncMode | null = null;
    const pendingFiles = new Set<string>();

    function log(message: string, extra?: unknown) {
        if (!debug) return;

        if (extra === undefined) {
            console.log(`[m1honoTemplate:derived-docs-sync] ${message}`);
            return;
        }

        console.log(
            `[m1honoTemplate:derived-docs-sync] ${message}`,
            extra,
        );
    }

    function isRelevantFile(filePath: string) {
        const normalizedFilePath = normalizePath(filePath);
        if (normalizedFilePath === globalSidebarConfigPath) {
            return true;
        }

        if (!isDirectoryMetadataSourceFile(normalizedFilePath, docsRoot)) {
            return false;
        }

        return isSidebarConfigFileName(path.basename(normalizedFilePath));
    }

    function getAffectedLanguages(filePaths: Iterable<string>) {
        const configuredLanguages = getConfiguredLanguages();
        const affectedLanguages = new Set<string>();

        for (const filePath of filePaths) {
            const normalizedFilePath = normalizePath(filePath);
            if (normalizedFilePath === globalSidebarConfigPath) {
                configuredLanguages.forEach((lang) => affectedLanguages.add(lang));
                continue;
            }

            const relativePath = normalizedFilePath.startsWith(`${docsRoot}/`)
                ? normalizedFilePath.slice(docsRoot.length + 1)
                : "";
            const [candidateLanguage] = relativePath.split("/");
            if (
                candidateLanguage &&
                configuredLanguages.includes(candidateLanguage)
            ) {
                affectedLanguages.add(candidateLanguage);
            }
        }

        if (affectedLanguages.size === 0) {
            configuredLanguages.forEach((lang) => affectedLanguages.add(lang));
        }

        return [...affectedLanguages];
    }

    async function warmDerivedDocsState(filePaths: string[]) {
        const affectedLanguages = getAffectedLanguages(filePaths);

        affectedLanguages.forEach((lang) => clearCache(lang));
        await Promise.all(affectedLanguages.map((lang) => getSidebar(lang)));
        const metadataSync = await syncDirectoryMetadataCache({
            rootDir,
            docsDir: docsRoot,
            filePaths,
        });

        return {
            affectedLanguages,
            metadataChanged: metadataSync.changed,
        };
    }

    async function runSync(server: ViteDevServer, mode: SyncMode) {
        const filePaths = [...pendingFiles];
        pendingFiles.clear();
        pendingMode = null;

        if (filePaths.length === 0) {
            return;
        }

        const { affectedLanguages, metadataChanged } = await warmDerivedDocsState(filePaths);
        log(`${mode} sync completed`, {
            affectedLanguages,
            filePaths,
            metadataChanged,
        });

        if (mode === "restart") {
            if (typeof server.restart === "function") {
                await server.restart();
                return;
            }

            server.ws.send({ type: "full-reload" });
            return;
        }

        server.ws.send({
            type: "custom",
            event: "m1honoTemplate:derived-docs-updated",
            data: {
                affectedLanguages,
                filePaths,
                metadataChanged,
            },
        });
    }

    function queueSync(server: ViteDevServer, filePath: string, mode: SyncMode) {
        pendingFiles.add(normalizePath(filePath));
        pendingMode = resolvePreferredSyncMode(pendingMode, mode);

        if (syncTimer) {
            clearTimeout(syncTimer);
        }

        syncTimer = setTimeout(() => {
            syncTimer = null;
            if (syncPromise) {
                return;
            }

            syncPromise = runSync(server, pendingMode ?? "hmr").finally(() => {
                syncPromise = null;
                if (pendingFiles.size > 0 && pendingMode) {
                    queueSync(server, [...pendingFiles][0], pendingMode);
                }
            });
        }, reloadDelay);
    }

    return {
        name: "m1honoTemplate-derived-docs-sync",
        async buildStart() {
            await generateDirectoryMetadataCache({
                rootDir,
                docsDir: docsRoot,
            });
        },
        configureServer(server) {
            const serveCacheFile = async (
                cachePath: string,
                res: Parameters<
                    Parameters<ViteDevServer["middlewares"]["use"]>[1]
                >[1],
            ) => {
                try {
                    const content = await fs.readFile(cachePath, "utf8");
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.end(content);
                } catch (error) {
                    res.statusCode = 500;
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                        JSON.stringify({
                            ok: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                        }),
                    );
                }
            };

            server.middlewares.use(
                "/__m1hono_template__/directory-metadata",
                async (req, res, next) => {
                    if (req.method !== "GET") {
                        next();
                        return;
                    }

                    await serveCacheFile(directoryMetadataCachePath, res);
                },
            );

            server.middlewares.use(
                "/__m1hono_template__/directory-routes",
                async (req, res, next) => {
                    if (req.method !== "GET") {
                        next();
                        return;
                    }

                    await serveCacheFile(directoryRouteCachePath, res);
                },
            );

            void generateDirectoryMetadataCache({
                rootDir,
                docsDir: docsRoot,
            }).catch((error) => {
                console.warn(
                    "[m1honoTemplate:derived-docs-sync] Failed to prime directory metadata cache.",
                    error,
                );
            });

            const handleChange = (filePath: string, mode: SyncMode) => {
                if (!isRelevantFile(filePath)) {
                    return;
                }

                queueSync(server, filePath, mode);
            };

            const handleWatcherEvent = (eventName: string, filePath: string) => {
                if (eventName === "change") {
                    handleChange(filePath, "hmr");
                    return;
                }

                if (eventName === "add" || eventName === "unlink") {
                    handleChange(filePath, "restart");
                }
            };

            server.watcher.on("all", handleWatcherEvent);

            server.httpServer?.once("close", () => {
                server.watcher.off("all", handleWatcherEvent);
            });
        },
    };
}
