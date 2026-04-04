import { projectConfig } from "../../../config/project-config";
import type { LanguageConfig, SearchLocalesByProvider } from "../project-types";
import { getLangCodeFromLink } from "./language";
import { mergeLocales } from "../shared-utils";

type LanguageModule = Record<string, unknown>;
type LanguageConfigRecord = Record<string, unknown>;

function getModuleKey(languageCode: string): string {
    return languageCode.replace(/-/g, "_");
}

async function loadLanguageModule(fileName: string): Promise<LanguageModule> {
    return import(/* @vite-ignore */ `../../../config/lang/${fileName}`);
}

function resolveLanguageModuleConfig(
    lang: LanguageConfig,
    langModule: LanguageModule,
): LanguageConfigRecord | undefined {
    const possibleKeys = [
        getModuleKey(lang.code),
        lang.fileName?.replace(".ts", "").replace(/-/g, "_"),
        lang.code,
        lang.name.replace(/-/g, "_"),
    ].filter(Boolean) as string[];

    for (const key of possibleKeys) {
        const config = langModule[key];
        if (config && typeof config === "object") {
            return config as LanguageConfigRecord;
        }
    }

    return undefined;
}

function resolveLocaleKey(
    lang: LanguageConfig,
    useRootForDefault: boolean,
): string {
    if (useRootForDefault && lang.isDefault) return "root";
    if (useRootForDefault) return getLangCodeFromLink(lang.link);
    return lang.code;
}

export async function generateLocalesConfig(useRootForDefault: boolean = false) {
    const locales: Record<string, LanguageConfigRecord> = {};

    for (const lang of projectConfig.languages) {
        if (!lang.fileName) {
            console.warn(
                `No fileName specified for language ${lang.code}, skipping`,
            );
            continue;
        }

        try {
            const langModule = await loadLanguageModule(lang.fileName);
            const langConfig = resolveLanguageModuleConfig(lang, langModule);

            if (langConfig) {
                locales[resolveLocaleKey(lang, useRootForDefault)] = {
                    label: lang.displayName,
                    ...langConfig,
                };
            } else {
                console.warn(
                    `Language configuration not found for ${
                        lang.code
                    }. Available exports: ${Object.keys(langModule).join(", ")}`,
                );
            }
        } catch (error) {
            console.warn(
                `Failed to load language configuration for ${lang.code}:`,
                error,
            );
        }
    }

    return locales;
}

export async function autoDiscoverLanguageModules(): Promise<{
    langModules: Record<string, LanguageConfigRecord>;
    searchLocales: SearchLocalesByProvider;
}> {
    const langModules: Record<string, LanguageConfigRecord> = {};
    const searchLocales: SearchLocalesByProvider = {};

    for (const lang of projectConfig.languages) {
        if (!lang.fileName) {
            console.warn(
                `No fileName specified for language ${lang.code}, skipping`,
            );
            continue;
        }

        try {
            const langModule = await loadLanguageModule(lang.fileName);
            const foundConfig = resolveLanguageModuleConfig(lang, langModule);

            if (!foundConfig) {
                console.warn(
                    `No valid export found for ${
                        lang.code
                    }. Available exports: ${Object.keys(langModule).join(", ")}`,
                );
            } else {
                langModules[getModuleKey(lang.code)] = foundConfig;
            }

            if (
                langModule.searchLocales &&
                typeof langModule.searchLocales === "object"
            ) {
                for (const [provider, locales] of Object.entries(
                    langModule.searchLocales as Record<string, Record<string, unknown>>,
                )) {
                    searchLocales[provider] = mergeLocales(
                        searchLocales[provider],
                        locales,
                    );
                }
            } else if (langModule.search) {
                searchLocales.algolia = mergeLocales(
                    searchLocales.algolia,
                    langModule.search as Record<string, unknown>,
                );
            }
        } catch (error) {
            console.warn(
                `Failed to load language module for ${lang.code}:`,
                error,
            );
        }
    }

    return { langModules, searchLocales };
}

export async function generateLocalesConfigAuto(
    useRootForDefault: boolean = false,
) {
    const { langModules, searchLocales } = await autoDiscoverLanguageModules();
    const locales = generateLocalesConfigFromModules(
        langModules,
        useRootForDefault,
    );
    return { locales, searchLocales };
}

export function generateLocalesConfigFromModules(
    langModules: Record<string, LanguageConfigRecord>,
    useRootForDefault: boolean = false,
) {
    const locales: Record<string, LanguageConfigRecord> = {};

    for (const lang of projectConfig.languages) {
        const moduleKey = getModuleKey(lang.code);
        const langConfig = langModules[moduleKey];

        if (langConfig) {
            locales[resolveLocaleKey(lang, useRootForDefault)] = {
                label: lang.displayName,
                ...langConfig,
            };
        } else {
            console.warn(
                `Language configuration not found for ${lang.code} (expected export: ${moduleKey}).`,
            );
            console.warn(
                `Available keys in langModules: ${Object.keys(langModules).join(", ")}`,
            );
        }
    }

    return locales;
}

export function createAutoImportHelper() {
    const imports: string[] = [];
    const moduleMapping: string[] = [];

    for (const lang of projectConfig.languages) {
        if (!lang.fileName) continue;

        const moduleVarName = getModuleKey(lang.code);
        const filePath = `./config/lang/${lang.fileName.replace(".ts", "")}`;
        imports.push(`import { ${moduleVarName} } from "${filePath}"`);
        moduleMapping.push(`    ${moduleVarName}`);
    }

    const langModulesCode = `const langModules = {\n${moduleMapping.join(
        ",\n",
    )}\n};`;

    return {
        imports: imports.join("\n"),
        langModulesCode,
        moduleMapping,
        getRequiredImports: () => ({} as Record<string, unknown>),
    };
}

export function generateLocalesConfigSync(
    langModules: Record<string, LanguageConfigRecord>,
    useRootForDefault: boolean = false,
) {
    console.warn(
        "generateLocalesConfigSync is deprecated. Use generateLocalesConfigFromModules or generateLocalesConfigAuto instead.",
    );
    return generateLocalesConfigFromModules(langModules, useRootForDefault);
}
