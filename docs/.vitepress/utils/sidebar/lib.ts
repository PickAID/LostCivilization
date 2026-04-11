/**
 * High-level library interface for markdown-driven sidebar generation.
 *
 * Sidebars are generated on demand and cached only in memory so the runtime no
 * longer depends on intermediate JSON files.
 */

import { resolve } from "path";
import { existsSync, readdirSync, statSync } from "fs";
import { generateSidebars } from "./main";

export interface SidebarLibConfig {
    /** Root directory of the project. Defaults to process.cwd() */
    rootDir?: string;
    /** Relative path to the docs directory from rootDir. Defaults to "./docs" */
    docsDir?: string;
    /** Enable debug logging for troubleshooting. Defaults to false */
    debug?: boolean;
    /** Enable development mode features. Defaults to NODE_ENV === "development" */
    devMode?: boolean;
    /** Array of language codes to generate sidebars for. Required field */
    languages: string[];
}

type SidebarMap = Record<string, any[]>;

type MemoryCacheEntry = {
    data: SidebarMap;
    timestamp: number;
    sourceVersion: number;
};

const defaultConfig: Omit<Required<SidebarLibConfig>, "languages"> = {
    rootDir: process.cwd(),
    docsDir: "./docs",
    debug: false,
    devMode: process.env.NODE_ENV === "development",
};

let currentConfig: SidebarLibConfig | null = null;

const memoryCache = new Map<string, MemoryCacheEntry>();

const CACHE_EXPIRY = 5 * 60 * 1000;

export function _internalConfigureSidebar(config: SidebarLibConfig): void {
    if (!config.languages || config.languages.length === 0) {
        throw new Error(
            "[SidebarLib] Configuration error: languages array is required and cannot be empty"
        );
    }

    currentConfig = { ...defaultConfig, ...config };

    if (currentConfig.debug) {
        console.log("[SidebarLib] Configuration updated:", currentConfig);
    }
}

/**
 * @deprecated Use sidebarPlugin configuration instead
 */
export function configureSidebar(config: SidebarLibConfig): void {
    console.warn(
        "[SidebarLib] configureSidebar() is deprecated. Please configure via sidebarPlugin() in your vite config instead."
    );
    _internalConfigureSidebar(config);
}

export function getConfig(): Required<SidebarLibConfig> {
    if (!currentConfig) {
        console.warn(
            "[SidebarLib] No configuration found. Please ensure sidebarPlugin is properly configured in your vite config."
        );

        return {
            ...defaultConfig,
            languages: [""],
        };
    }

    return currentConfig as Required<SidebarLibConfig>;
}

function validateLanguage(lang: string): void {
    const config = getConfig();

    if (!config.languages.includes(lang)) {
        throw new Error(
            `[SidebarLib] Language "${lang}" is not configured. Available languages: ${config.languages.join(", ")}`
        );
    }
}

function getCacheKey(lang: string): string {
    return `sidebar_${lang || "root"}`;
}

function getNewestMatchingMtime(
    rootPath: string,
    matcher: (fileName: string) => boolean
): number {
    if (!existsSync(rootPath)) return 0;

    let newestMtime = 0;
    const queue: string[] = [rootPath];

    while (queue.length > 0) {
        const currentPath = queue.pop() as string;
        let entries: any[] = [];

        try {
            entries = readdirSync(currentPath, { withFileTypes: true }) as any[];
        } catch {
            continue;
        }

        for (const entry of entries) {
            const entryName = String(entry.name);
            const entryPath = resolve(currentPath, entryName);
            if (entry.isDirectory()) {
                queue.push(entryPath);
                continue;
            }
            if (!entry.isFile() || !matcher(entryName)) {
                continue;
            }

            try {
                const mtime = statSync(entryPath).mtime.getTime();
                if (mtime > newestMtime) {
                    newestMtime = mtime;
                }
            } catch {
                // Ignore transient file-system errors while walking cache inputs.
            }
        }
    }

    return newestMtime;
}

function getNewestDocsMtime(lang: string): number {
    const config = getConfig();
    const docsPath = resolve(config.rootDir, config.docsDir, lang);
    return getNewestMatchingMtime(docsPath, (name) =>
        name.toLowerCase().endsWith(".md")
    );
}

function getGlobalConfigMtime(): number {
    const config = getConfig();
    const globalConfigPath = resolve(
        config.rootDir,
        config.docsDir,
        ".sidebarrc.yml"
    );

    try {
        return statSync(globalConfigPath).mtime.getTime();
    } catch {
        return 0;
    }
}

function getCurrentSourceVersion(lang: string): number {
    return Math.max(getNewestDocsMtime(lang), getGlobalConfigMtime());
}

function isMemoryCacheValid(
    lang: string,
    entry: MemoryCacheEntry | undefined
): entry is MemoryCacheEntry {
    if (!entry) {
        return false;
    }

    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        return false;
    }

    return entry.sourceVersion >= getCurrentSourceVersion(lang);
}

function readMemoryCache(lang: string): SidebarMap | null {
    const config = getConfig();
    const entry = memoryCache.get(getCacheKey(lang));

    if (!isMemoryCacheValid(lang, entry)) {
        return null;
    }

    if (config.debug) {
        console.log(`[SidebarLib] Memory cache hit for ${lang}`);
    }

    return entry.data;
}

function storeMemoryCache(lang: string, data: SidebarMap): void {
    const config = getConfig();
    memoryCache.set(getCacheKey(lang), {
        data,
        timestamp: Date.now(),
        sourceVersion: getCurrentSourceVersion(lang),
    });

    if (config.debug) {
        console.log(`[SidebarLib] Memory cache written for ${lang}`);
    }
}

export function isSidebarCacheStale(lang: string): boolean {
    validateLanguage(lang);
    return !isMemoryCacheValid(lang, memoryCache.get(getCacheKey(lang)));
}

async function generateSidebarForLang(lang: string): Promise<SidebarMap> {
    const config = getConfig();

    if (config.debug) {
        console.log(`[SidebarLib] Generating sidebar for language: ${lang}`);
    }

    try {
        const result = await generateSidebars({
            docsPath: resolve(config.rootDir, config.docsDir),
            isDevMode: config.devMode,
            lang: lang,
        });

        if (!result) {
            if (config.debug) {
                console.warn(`[SidebarLib] No sidebar generated for ${lang}`);
            }
            return {};
        }

        const langPrefix = lang ? `/${lang}/` : "/";
        const langSidebar: SidebarMap = {};

        for (const [path, items] of Object.entries(result)) {
            if (path.startsWith(langPrefix)) {
                const filteredItems = filterHiddenItems(items as any[]);
                if (filteredItems.length > 0) {
                    langSidebar[path] = filteredItems;
                }
            }
        }

        return langSidebar;
    } catch (error) {
        console.error(`[SidebarLib] Error generating sidebar for ${lang}:`, error);
        return {};
    }
}

function filterHiddenItems(items: any[]): any[] {
    if (!Array.isArray(items)) return items;

    return items
        .filter((item) => !item._hidden)
        .map((item) => {
            if (item.items && Array.isArray(item.items)) {
                return {
                    ...item,
                    items: filterHiddenItems(item.items),
                };
            }
            return item;
        });
}

function ensureConfigured(): void {
    if (!currentConfig) {
        console.warn(
            "[SidebarLib] No configuration found. Auto-initializing with fallback config."
        );
        _internalConfigureSidebar({
            languages: [""],
            debug: process.env.NODE_ENV === "development",
        });
    }
}

function _getSidebarSyncInternal(lang: string): SidebarMap {
    ensureConfigured();
    validateLanguage(lang);

    const config = getConfig();
    const cached = readMemoryCache(lang);
    if (cached) {
        return cached;
    }

    if (config.debug) {
        console.warn(
            `[SidebarLib] No warm sidebar cache available for ${lang}, generating asynchronously...`
        );
    }

    generateSidebarForLang(lang)
        .then((data) => {
            storeMemoryCache(lang, data);
        })
        .catch((error) => {
            console.error(`[SidebarLib] Async generation failed for ${lang}:`, error);
        });

    return {};
}

export function getSidebarSync(lang: string): any {
    let cachedSidebar: SidebarMap | null = null;
    let isGenerating = false;

    return new Proxy(
        {},
        {
            get(target, prop, receiver) {
                if (isGenerating) {
                    return [];
                }
                if (cachedSidebar) {
                    const result = Reflect.get(cachedSidebar, prop, receiver);
                    return result === undefined ? [] : result;
                }
                try {
                    isGenerating = true;
                    cachedSidebar = _getSidebarSyncInternal(lang);
                    const result = Reflect.get(cachedSidebar, prop, receiver);
                    return result === undefined ? [] : result;
                } catch (error) {
                    console.warn("[SidebarLib] Error generating sidebar:", error);
                    return [];
                } finally {
                    isGenerating = false;
                }
            },

            has(target, prop) {
                if (isGenerating) return false;
                if (!cachedSidebar) {
                    try {
                        isGenerating = true;
                        cachedSidebar = _getSidebarSyncInternal(lang);
                    } catch (error) {
                        console.warn("[SidebarLib] Error generating sidebar:", error);
                        return false;
                    } finally {
                        isGenerating = false;
                    }
                }
                return cachedSidebar ? Reflect.has(cachedSidebar, prop) : false;
            },

            ownKeys() {
                if (isGenerating) return [];
                if (!cachedSidebar) {
                    try {
                        isGenerating = true;
                        cachedSidebar = _getSidebarSyncInternal(lang);
                    } catch (error) {
                        console.warn("[SidebarLib] Error generating sidebar:", error);
                        return [];
                    } finally {
                        isGenerating = false;
                    }
                }
                return cachedSidebar ? Reflect.ownKeys(cachedSidebar) : [];
            },

            getOwnPropertyDescriptor(target, prop) {
                if (isGenerating) return undefined;
                if (!cachedSidebar) {
                    try {
                        isGenerating = true;
                        cachedSidebar = _getSidebarSyncInternal(lang);
                    } catch (error) {
                        console.warn("[SidebarLib] Error generating sidebar:", error);
                        return undefined;
                    } finally {
                        isGenerating = false;
                    }
                }
                return cachedSidebar
                    ? Reflect.getOwnPropertyDescriptor(cachedSidebar, prop)
                    : undefined;
            },
        }
    );
}

export async function getSidebar(lang: string): Promise<SidebarMap> {
    ensureConfigured();
    validateLanguage(lang);

    const cached = readMemoryCache(lang);
    if (cached) {
        return cached;
    }

    const data = await generateSidebarForLang(lang);
    storeMemoryCache(lang, data);

    return data;
}

export async function getAllSidebars(): Promise<Record<string, SidebarMap>> {
    const config = getConfig();
    const result: Record<string, SidebarMap> = {};

    for (const lang of config.languages) {
        result[lang || "root"] = await getSidebar(lang);
    }

    return result;
}

export function clearCache(lang?: string): void {
    const config = getConfig();

    if (lang) {
        validateLanguage(lang);
        memoryCache.delete(getCacheKey(lang));
    } else {
        memoryCache.clear();
    }

    if (config.debug) {
        console.log(
            `[SidebarLib] Cache cleared${lang ? ` for ${lang}` : " (all)"}`
        );
    }
}

export function getConfiguredLanguages(): string[] {
    const config = getConfig();
    return [...config.languages];
}
