import { projectConfig } from "../../../config/project-config";
import type { LanguageConfig } from "../project-types";

export function getLanguages(): LanguageConfig[] {
    return projectConfig.languages;
}

export function getDefaultLanguage(): LanguageConfig {
    return (
        projectConfig.languages.find((lang) => lang.isDefault) ||
        projectConfig.languages[0]
    );
}

export function getLanguageCodes(): string[] {
    return projectConfig.languages.map((lang) => lang.code);
}

export function getLanguageLinks(): string[] {
    return projectConfig.languages.map((lang) => lang.link);
}

export function getLanguageByCode(code: string): LanguageConfig | undefined {
    if (code === "root") {
        return getDefaultLanguage();
    }

    let language = projectConfig.languages.find((lang) => lang.code === code);
    if (language) {
        return language;
    }

    language = projectConfig.languages.find((lang) => {
        if (!lang.fileName) return false;
        const fileNameWithoutExt = lang.fileName.replace(".ts", "");
        return fileNameWithoutExt === code;
    });

    if (language) {
        return language;
    }

    return projectConfig.languages.find((lang) => {
        const shortCode = lang.code.split("-")[0];
        return shortCode === code;
    });
}

export function getLocalesConfig() {
    const locales: Record<string, any> = {};

    projectConfig.languages.forEach((lang) => {
        const key = lang.isDefault ? "root" : lang.code;
        locales[key] = {
            label: lang.label || lang.displayName,
            lang: lang.name,
            link: lang.link || (lang.isDefault ? "/" : `/${lang.code}/`),
        };
    });

    return locales;
}

export function getBasePath(): string {
    return projectConfig.base || "/";
}

export function removeBaseFromPath(path: string): string {
    const base = projectConfig.base;

    if (base === "/" || !base) {
        return path;
    }

    const baseWithoutTrailingSlash = base.endsWith("/")
        ? base.slice(0, -1)
        : base;

    if (path.startsWith(baseWithoutTrailingSlash)) {
        return path.substring(baseWithoutTrailingSlash.length) || "/";
    }

    return path;
}

export function removeLangFromPath(path: string): string {
    let cleanPath = removeBaseFromPath(path);

    if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
    }

    for (const lang of projectConfig.languages) {
        const langLink = lang.link || `/${lang.code}/`;

        if (lang.isDefault && cleanPath.startsWith(langLink)) {
            return `/${cleanPath.substring(langLink.length)}`;
        }

        if (!lang.isDefault && cleanPath.startsWith(langLink)) {
            return `/${cleanPath.substring(langLink.length)}`;
        }
    }

    return cleanPath;
}

export function getLangCodeFromVitepressLang(vitepressLang: string): string {
    if (vitepressLang === "root") {
        return getDefaultLanguage().code;
    }

    const langConfig = getLanguageByCode(vitepressLang);
    if (langConfig) {
        return langConfig.code;
    }

    return vitepressLang;
}

export function getLanguageFromPath(path: string): string {
    let cleanPath = removeBaseFromPath(path);

    if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
    }

    for (const lang of projectConfig.languages) {
        const langLink = lang.link || `/${lang.code}/`;
        if (cleanPath.startsWith(langLink)) {
            return lang.code;
        }
    }

    return getDefaultLanguage().code;
}

export function hasLangInPath(path: string): boolean {
    let cleanPath = removeBaseFromPath(path);

    if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
    }

    for (const lang of projectConfig.languages) {
        if (lang.isDefault) continue;

        const langLink = lang.link || `/${lang.code}/`;
        if (cleanPath.startsWith(langLink)) {
            return true;
        }
    }

    return false;
}

export function generateGiscusTerm(path: string, localeIndex: string): string {
    if (projectConfig.giscus.sharedComments) {
        const cleanedPath = removeLangFromPath(path);
        const term = cleanedPath.startsWith("/")
            ? cleanedPath.substring(1)
            : cleanedPath;
        return !term || term === "" || term === "/" ? "index" : term;
    }

    let cleanedPath = removeBaseFromPath(path);

    if (!cleanedPath.startsWith("/")) {
        cleanedPath = `/${cleanedPath}`;
    }

    const langCode = getLangCodeFromVitepressLang(localeIndex);
    const langConfig = getLanguageByCode(langCode);

    if (langConfig) {
        const langLink = langConfig.link || `/${langConfig.code}/`;
        if (!cleanedPath.startsWith(langLink)) {
            cleanedPath = `${langLink}${cleanedPath.substring(1)}`;
        }
    }

    const term = cleanedPath.startsWith("/")
        ? cleanedPath.substring(1)
        : cleanedPath;
    return !term || term === "" || term === "/"
        ? `${langCode}/index`
        : term;
}

export function getLangCodeFromLink(path: string): string {
    const defaultLang = getDefaultLanguage();
    const match = path.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
    if (match) {
        return match[1];
    }

    return defaultLang.code;
}

export function getSearchLocaleKey(langCode: string): string {
    const defaultLang = getDefaultLanguage();
    return langCode === defaultLang.code ? "root" : langCode;
}

// ── Language resolution utilities ────────────────────────────────────────

/**
 * Resolves any language identifier (code, short code, VitePress lang, path
 * segment, fileName, or "root") to its canonical `LanguageConfig`.
 *
 * Resolution order:
 *   1. "root" → default language
 *   2. Exact `code` match (e.g. "zh-CN")
 *   3. Exact `name` match
 *   4. `fileName` without extension (e.g. "zh" from "zh.ts")
 *   5. Short code derived from `code` (e.g. "zh" from "zh-CN")
 *   6. Path segment from `link` (e.g. "zh" from "/zh/")
 *
 * @returns The matched LanguageConfig, or `undefined` if nothing matches.
 */
export function resolveLanguage(identifier: string): LanguageConfig | undefined {
    if (!identifier) return undefined;
    if (identifier === "root") return getDefaultLanguage();

    const languages = projectConfig.languages;
    const id = identifier.trim();

    // Exact code match
    const byCode = languages.find((l) => l.code === id);
    if (byCode) return byCode;

    // Exact name match
    const byName = languages.find((l) => l.name === id);
    if (byName) return byName;

    // fileName without extension (e.g. "zh" matches "zh.ts")
    const byFile = languages.find((l) => {
        if (!l.fileName) return false;
        return l.fileName.replace(/\.\w+$/, "") === id;
    });
    if (byFile) return byFile;

    // Short code derived from code (e.g. "zh" from "zh-CN")
    const byShort = languages.find((l) => l.code.split("-")[0] === id);
    if (byShort) return byShort;

    // Path segment from link (e.g. "zh" from "/zh/")
    const byLink = languages.find((l) => {
        if (!l.link) return false;
        const segment = l.link.replace(/^\/|\/$/g, "");
        return segment === id;
    });
    if (byLink) return byLink;

    return undefined;
}

/**
 * Resolves any language identifier to its full language code (e.g. "zh-CN").
 * Falls back to the default language code if no match is found.
 */
export function resolveLanguageCode(identifier: string): string {
    return (resolveLanguage(identifier) ?? getDefaultLanguage()).code;
}

/**
 * Resolves any language identifier to the URL path segment used by VitePress.
 * Derived from `LanguageConfig.link` (e.g. "/zh/" → "zh").
 * Falls back to the default language path segment.
 */
export function resolveLanguagePathSegment(identifier: string): string {
    const lang = resolveLanguage(identifier) ?? getDefaultLanguage();
    const link = lang.link ?? `/${lang.code}/`;
    return link.replace(/^\/|\/$/g, "");
}

/**
 * Returns all known path segments from configured languages.
 * Useful for building sets of known language URL prefixes.
 */
export function getAllLanguagePathSegments(): Set<string> {
    return new Set(
        projectConfig.languages.map((l) => {
            const link = l.link ?? `/${l.code}/`;
            return link.replace(/^\/|\/$/g, "");
        }),
    );
}
