import { getDefaultLanguage } from "@config/project-api";

import { navDropdownLayoutRegistry } from "./NavDropdownLayoutRegistryApi";

type TranslationDictionary = Record<string, Record<string, string>>;

export interface ScrollPosition {
    x: number;
    y: number;
}

export interface NavigationPathRule {
    regex: RegExp;
    getTargetPath: (match: RegExpMatchArray) => string;
}

export class ScrollNavigationService {
    toTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    toBottom() {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }

    getCurrentPosition(): ScrollPosition {
        return { x: window.scrollX, y: window.scrollY };
    }

    shouldShowBackTop(threshold = 300) {
        return window.scrollY > threshold;
    }
}

export class BrowserNavigationService {
    refresh() {
        window.location.reload();
    }

    goBack() {
        window.history.back();
    }

    async copyCurrentUrl() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            return true;
        } catch (error) {
            console.error("Failed to copy URL:", error);
            return false;
        }
    }

    openInNewTab(url: string) {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

export class PathNavigationService {
    private readonly rules: NavigationPathRule[];

    constructor(rules?: NavigationPathRule[]) {
        this.rules = rules ?? [
            {
                regex: /^\/(zh|en|jp)\/modpack\/kubejs\/1\.20\.1\/KubeJSCourse\//,
                getTargetPath: (match) => `/${match[1]}/modpack/kubejs/1.20.1/`,
            },
            {
                regex: /^\/(zh|en|jp)\/modpack\/kubejs\/?$/,
                getTargetPath: (match) => `/${match[1]}/`,
            },
            {
                regex: /^\/(zh|en|jp)\/modpack\/kubejs\/1\.20\.1\/Introduction\/Catalogue$/,
                getTargetPath: (match) => `/${match[1]}/modpack/kubejs/1.20.1/`,
            },
            {
                regex: /^\/(zh|en|jp)\/modpack\/kubejs\/1\.20\.1\/(?!KubeJSCourse)/,
                getTargetPath: (match) => `/${match[1]}/modpack/kubejs/1.20.1/`,
            },
        ];
    }

    getRules() {
        return this.rules;
    }

    getTargetPath(currentPath: string): string | null {
        for (const pathRule of this.rules) {
            const match = currentPath.match(pathRule.regex);
            if (match) return pathRule.getTargetPath(match);
        }
        return null;
    }
}

export class NavigationI18nService {
    private readonly translations: TranslationDictionary;

    constructor(translations?: TranslationDictionary) {
        this.translations = translations ?? {
            backToTop: { "en-US": "Back to Top", "zh-CN": "返回顶部" },
            copyLink: { "en-US": "Copy Link", "zh-CN": "复制链接" },
            refresh: { "en-US": "Refresh", "zh-CN": "刷新" },
            back: { "en-US": "Back", "zh-CN": "返回" },
            comment: { "en-US": "Comment", "zh-CN": "评论" },
            qq: { "en-US": "QQ", "zh-CN": "QQ" },
            discord: { "en-US": "Discord", "zh-CN": "Discord" },
        };
    }

    getTranslations() {
        return this.translations;
    }

    getText(key: string, lang: string) {
        const fallbackCode = getDefaultLanguage().code;
        return this.translations[key]?.[lang] || this.translations[key]?.[fallbackCode] || key;
    }
}

export class NavigationApi {
    readonly scroll = new ScrollNavigationService();
    readonly browser = new BrowserNavigationService();
    readonly pathNavigation = new PathNavigationService();
    readonly i18n = new NavigationI18nService();
    readonly layouts = navDropdownLayoutRegistry;
}

export const navigationApi = new NavigationApi();
export const scroll = navigationApi.scroll;
export const browser = navigationApi.browser;
export const pathNavigation = navigationApi.pathNavigation;
export const navigationTranslations = navigationApi.i18n.getTranslations();
export const getNavigationText = (key: string, lang: string) =>
    navigationApi.i18n.getText(key, lang);
export const navDropdownLayouts = navigationApi.layouts;
