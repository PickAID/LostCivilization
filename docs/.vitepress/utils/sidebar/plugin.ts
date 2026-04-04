/**
 * @fileoverview Vite plugin for automatic sidebar generation and hot reloading.
 * 
 * This module provides a Vite plugin that integrates sidebar generation
 * into the build process and development workflow. Features include:
 * - Automatic sidebar generation on build start
 * - Hot reloading when markdown files or configurations change
 * - Intelligent caching and change detection
 * - VitePress-specific integration and reload triggers
 * - Multi-language support with per-language generation
 * 
 * @module SidebarPlugin
 * @version 1.0.0
 * @author VitePress Sidebar Generator
 * @since 1.0.0
 */

import { Plugin } from "vite";
import { resolve } from "path";
import {
    _internalConfigureSidebar,
    getSidebar,
    clearCache,
    getConfig,
    isSidebarCacheStale,
    listSidebarConfigFiles,
    type SidebarLibConfig,
} from "./lib";
import { SIDEBAR_CONFIG_FILE_CANDIDATES } from "./shared/sidebarFileConventions";

/**
 * Configuration options specific to the sidebar Vite plugin.
 * Extends the base SidebarLibConfig with plugin-specific settings.
 * 
 * @interface SidebarPluginConfig
 * @extends SidebarLibConfig
 * @since 1.0.0
 */
export interface SidebarPluginConfig extends SidebarLibConfig {
    /** Enable hot reloading in development mode. Defaults to true */
    hotReload?: boolean;
    /** Delay in milliseconds before triggering reload after file changes. Defaults to 100ms */
    reloadDelay?: number;
    /**
     * When true, adding or removing an index file (index.md / sidebarIndex.md / root.md)
     * automatically triggers a server restart to rebuild the sidebar.
     * When false (default), use the VS Code extension "Sync Sidebar" button instead.
     */
    hotRestartOnIndexChange?: boolean;
}

/**
 * Reuses a single in-flight generation so watcher bursts don't race each other.
 */
let generationPromise: Promise<void> | null = null;

/**
 * Prevents overlapping dev-server restarts, which can lead to port churn.
 */
let isRestarting = false;

/**
 * Debounced refresh timer used to collapse rapid file events into a single sidebar rebuild.
 */
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Suppresses watcher echoes caused by the plugin's own server restart.
 */
let ignoreWatcherEventsUntil = 0;

export function sidebarPlugin(config: SidebarPluginConfig): Plugin {
    if (!config.languages || config.languages.length === 0) {
        throw new Error(
            "[SidebarPlugin] Configuration error: languages array is required and cannot be empty"
        );
    }

    _internalConfigureSidebar(config);

    const finalConfig = getConfig();
    const hotReload = config.hotReload !== false;
    const reloadDelay = config.reloadDelay || 100;
    const hotRestartOnIndexChange = config.hotRestartOnIndexChange ?? false;

    const docsPath = resolve(finalConfig.rootDir, finalConfig.docsDir);
    const configPath = resolve(
        finalConfig.rootDir,
        ".vitepress/config/sidebar"
    );
    const configuredLanguages = new Set(finalConfig.languages);

    function normalizeWatchedPath(filePath: string): string {
        return resolve(filePath).replace(/\\/g, "/").replace(/\/+$/, "");
    }

    function extractLanguageFromPath(filePath: string, rootPath: string): string | null {
        const normalizedRoot = normalizeWatchedPath(rootPath);
        const normalizedFile = normalizeWatchedPath(filePath);
        const relativePath = normalizedFile.startsWith(`${normalizedRoot}/`)
            ? normalizedFile.slice(normalizedRoot.length + 1)
            : null;

        if (!relativePath) {
            return null;
        }

        const [candidate] = relativePath.split("/");
        return candidate && configuredLanguages.has(candidate) ? candidate : null;
    }

    function getAffectedLanguages(filePath: string): string[] {
        const docsLanguage = extractLanguageFromPath(filePath, docsPath);
        if (docsLanguage) {
            return [docsLanguage];
        }

        const configLanguage = extractLanguageFromPath(filePath, configPath);
        if (configLanguage) {
            return [configLanguage];
        }

        return finalConfig.languages;
    }

    function isUserSidebarJson(filePath: string): boolean {
        const normalizedPath = filePath.replace(/\\/g, "/");
        return (
            normalizedPath.includes("/.vitepress/config/sidebar/") &&
            normalizedPath.endsWith(".json") &&
            !normalizedPath.includes("/.vitepress/config/sidebar/.metadata/") &&
            !normalizedPath.includes("/.vitepress/config/sidebar/.archive/")
        );
    }

    async function generateSidebarsForAllLanguages() {
        if (generationPromise) {
            return generationPromise;
        }

        generationPromise = (async () => {
            try {
                for (const lang of finalConfig.languages) {
                    if (isSidebarCacheStale(lang)) {
                        try {
                            await getSidebar(lang);

                            if (finalConfig.debug) {
                                console.log(
                                    `[SidebarPlugin] Generated sidebar for ${lang}`
                                );
                            }
                        } catch (error) {
                            console.error(
                                `[SidebarPlugin] Failed to generate sidebar for ${lang}:`,
                                error
                            );
                        }
                    }
                }
            } finally {
                generationPromise = null;
            }
        })();

        return generationPromise;
    }

    function shouldTriggerRegeneration(filePath: string): boolean {
        const lowerFilePath = filePath.toLowerCase();
        return SIDEBAR_CONFIG_FILE_CANDIDATES.some(
            (name) => lowerFilePath.endsWith(name.toLowerCase()),
        );
    }

    function shouldQueueSidebarRefresh(filePath: string): boolean {
        return getAffectedLanguages(filePath).some((lang) =>
            isSidebarCacheStale(lang),
        );
    }

    async function triggerVitePressReload(server: any) {
        if (!hotReload) return;

        if (isRestarting) {
            return;
        }

        try {
            isRestarting = true;
            ignoreWatcherEventsUntil = Date.now() + Math.max(reloadDelay * 4, 1000);
            if (typeof server.restart === "function") {
                await server.restart();
            } else {
                server.ws.send({ type: "full-reload" });
            }
        } catch (error) {
            console.warn(
                "[SidebarPlugin] Failed to restart cleanly; falling back to full reload.",
                error,
            );
            server.ws.send({ type: "full-reload" });
        } finally {
            isRestarting = false;
        }
    }

    function queueSidebarRefresh(server: any, filePath: string) {
        for (const lang of getAffectedLanguages(filePath)) {
            clearCache(lang);
        }

        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }

        refreshTimer = setTimeout(async () => {
            refreshTimer = null;
            await generateSidebarsForAllLanguages();
            await triggerVitePressReload(server);
        }, reloadDelay);
    }

    return {
        name: "vitepress-smart-sidebar",

        async buildStart() {
            if (finalConfig.debug) {
                console.log(
                    "[SidebarPlugin] Starting build with config:",
                    finalConfig
                );
                console.log(
                    "[SidebarPlugin] Configured languages:",
                    finalConfig.languages
                );
            }

            await generateSidebarsForAllLanguages();
        },

        configureServer(server) {
            if (finalConfig.debug) {
                console.log("[SidebarPlugin] Configuring development server");
                console.log(
                    "[SidebarPlugin] Watching languages:",
                    finalConfig.languages
                );
            }
            server.middlewares.use(
                "/__sidebar-sync",
                async (req: { method?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (s: string) => void }, next: () => void) => {
                    if (req.method !== "POST") { next(); return; }

                    try {
                        clearCache();
                        await generateSidebarsForAllLanguages();
                        await triggerVitePressReload(server);
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ ok: true }));
                    } catch (error) {
                        res.statusCode = 500;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({
                            ok: false,
                            error: error instanceof Error ? error.message : String(error),
                        }));
                    }
                }
            );

            if (hotRestartOnIndexChange) {
                const handleSidebarSourceEvent = (filePath: string) => {
                    if (Date.now() < ignoreWatcherEventsUntil) {
                        return;
                    }
                    if (
                        shouldTriggerRegeneration(filePath) &&
                        shouldQueueSidebarRefresh(filePath)
                    ) {
                        queueSidebarRefresh(server, filePath);
                    }
                };

                server.watcher.on("add", handleSidebarSourceEvent);
                server.watcher.on("unlink", handleSidebarSourceEvent);
            }

            const jsonConfigFiles = listSidebarConfigFiles();
            for (const jsonFile of jsonConfigFiles) {
                server.watcher.add(jsonFile);
            }
        },
    };
}
