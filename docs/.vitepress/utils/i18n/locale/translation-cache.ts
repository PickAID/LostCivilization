/// <reference types="vite/client" />

import { reactive, watchEffect } from "vue";
import { useData } from "vitepress";
import { getLanguages, getDefaultLanguage } from "@config/project-config";
import componentIdMappingData from "../../../config/locale/component-id-mapping.json";

type TranslationDictionary = Record<string, string>;
const languages = getLanguages();

interface ComponentIdMapping {
    mappings?: Record<string, string>;
}

const knownLocales = new Set(languages.map((language) => language.code));
const fallbackLocale = getDefaultLanguage().code;

function resolveLocaleCode(localeFromVitePress: string | undefined): string {
    if (localeFromVitePress && knownLocales.has(localeFromVitePress)) {
        return localeFromVitePress;
    }

    if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        for (const language of languages) {
            const basePath = language.link || `/${language.code}/`;
            if (pathname.startsWith(basePath)) {
                return language.code;
            }
        }
    }

    return fallbackLocale;
}

const componentIdMapping = (componentIdMappingData as ComponentIdMapping)?.mappings || {};
const translationModules = import.meta.glob("../../../config/locale/*/components/**/*.json");

const cache = reactive<Record<string, TranslationDictionary>>({});
const loading = new Set<string>();

function resolveComponentPath(componentId: string): string {
    return componentIdMapping[componentId] || componentId;
}

async function loadTranslation(locale: string, componentPath: string): Promise<TranslationDictionary> {
    const modulePath = `../../../config/locale/${locale}/components/${componentPath}.json`;
    const moduleFactory = translationModules[modulePath];
    if (!moduleFactory) return {};

    try {
        const moduleValue = await moduleFactory();
        const raw = (moduleValue as { default?: unknown }).default ?? moduleValue;
        return raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as TranslationDictionary)
            : {};
    } catch {
        return {};
    }
}

function ensureLoaded(componentId: string, locale: string, defaults: TranslationDictionary): void {
    const cacheKey = `${componentId}@${locale}`;
    if (loading.has(cacheKey)) return;

    loading.add(cacheKey);
    const componentPath = resolveComponentPath(componentId);

    loadTranslation(locale, componentPath)
        .then((translation) => {
            if (!cache[cacheKey]) {
                cache[cacheKey] = { ...defaults };
            }
            Object.assign(cache[cacheKey], translation);
        })
        .finally(() => loading.delete(cacheKey));
}

function getTranslationBucket(
    componentId: string,
    locale: string,
    defaults: TranslationDictionary,
): TranslationDictionary {
    const cacheKey = `${componentId}@${locale}`;
    if (!cache[cacheKey]) {
        cache[cacheKey] = { ...defaults };
    }
    ensureLoaded(componentId, locale, defaults);
    return cache[cacheKey];
}

function syncTranslationObject(
    target: Record<string, string>,
    nextValues: Record<string, string>,
): void {
    Object.keys(target).forEach((key) => {
        if (!(key in nextValues)) delete target[key];
    });
    Object.assign(target, nextValues);
}

export function useSafeI18n<T extends Record<string, string>>(
    componentId: string,
    defaultTranslations: T,
): { t: T } {
    const { lang } = useData();
    const translationState = reactive({ ...defaultTranslations }) as T;

    watchEffect(() => {
        const locale = resolveLocaleCode(lang.value);
        const cachedBucket = getTranslationBucket(componentId, locale, defaultTranslations);
        const nextValues = { ...defaultTranslations, ...cachedBucket } as Record<string, string>;
        syncTranslationObject(translationState as Record<string, string>, nextValues);
    });

    return { t: translationState };
}

export function createI18nHook<T extends Record<string, string>>(
    componentId: string,
    defaultTranslations: T,
) {
    return () => useSafeI18n(componentId, defaultTranslations);
}
