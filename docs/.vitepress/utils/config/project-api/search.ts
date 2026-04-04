import type { DefaultTheme } from "vitepress";
import { projectConfig } from "../../../config/project-config";
import type {
    SearchConfig,
    SearchLocalesByProvider,
    SearchProvider,
    SearchProviderResolver,
    SearchProviderResolverContext,
} from "../project-types";

const searchProviderResolvers = new Map<string, SearchProviderResolver>();

function mergeLocales<T extends Record<string, any> | undefined>(
    ...parts: T[]
): Record<string, any> | undefined {
    const merged = Object.assign({}, ...parts.filter(Boolean));
    return Object.keys(merged).length > 0 ? merged : undefined;
}

function resolveBuiltInAlgoliaSearch(
    context: SearchProviderResolverContext,
): DefaultTheme.Config["search"] | undefined {
    const algoliaConfig = context.searchConfig.algolia;

    if (
        !algoliaConfig?.appId ||
        !algoliaConfig.apiKey ||
        !algoliaConfig.indexName
    ) {
        console.warn(
            "[search] Algolia provider selected but appId/apiKey/indexName is incomplete; search is disabled.",
        );
        return undefined;
    }

    const locales = mergeLocales(
        context.searchLocales.algolia,
        algoliaConfig.locales,
    ) as DefaultTheme.AlgoliaSearchOptions["locales"] | undefined;

    return {
        provider: "algolia",
        options: {
            ...(algoliaConfig.options || {}),
            appId: algoliaConfig.appId,
            apiKey: algoliaConfig.apiKey,
            indexName: algoliaConfig.indexName,
            ...(locales ? { locales } : {}),
        },
    };
}

function resolveBuiltInLocalSearch(
    context: SearchProviderResolverContext,
): DefaultTheme.Config["search"] | undefined {
    const localConfig = context.searchConfig.local;
    const locales = mergeLocales(
        context.searchLocales.local,
        localConfig?.locales,
    ) as DefaultTheme.LocalSearchOptions["locales"] | undefined;

    return {
        provider: "local",
        options: {
            ...(localConfig?.options || {}),
            ...(locales ? { locales } : {}),
        },
    };
}

function resolveNoSearch(): undefined {
    return undefined;
}

searchProviderResolvers.set("algolia", resolveBuiltInAlgoliaSearch);
searchProviderResolvers.set("local", resolveBuiltInLocalSearch);
searchProviderResolvers.set("none", resolveNoSearch);

export function getProjectSearchConfig(): SearchConfig {
    const rawSearch = projectConfig.search || {
        provider: "algolia",
    };

    const rawAlgolia = rawSearch.algolia || {};

    return {
        enabled:
            rawSearch.enabled === undefined
                ? projectConfig.features.search
                : rawSearch.enabled,
        provider: rawSearch.provider || "none",
        algolia: {
            appId: rawAlgolia.appId ?? projectConfig.algolia?.appId ?? "",
            apiKey: rawAlgolia.apiKey ?? projectConfig.algolia?.apiKey ?? "",
            indexName:
                rawAlgolia.indexName ?? projectConfig.algolia?.indexName ?? "",
            options: rawAlgolia.options || {},
            locales: rawAlgolia.locales,
        },
        local: {
            options: rawSearch.local?.options || {},
            locales: rawSearch.local?.locales,
        },
        providers: rawSearch.providers || {},
    };
}

export function getSearchProvider(): SearchProvider {
    return getProjectSearchConfig().provider;
}

export function registerSearchProviderResolver(
    provider: string,
    resolver: SearchProviderResolver,
) {
    searchProviderResolvers.set(provider, resolver);
}

export function unregisterSearchProviderResolver(provider: string) {
    searchProviderResolvers.delete(provider);
}

export function getRegisteredSearchProviders(): string[] {
    return Array.from(searchProviderResolvers.keys());
}

export function resolveThemeSearchConfig(
    searchLocales: SearchLocalesByProvider = {},
): DefaultTheme.Config["search"] | undefined {
    const searchConfig = getProjectSearchConfig();

    if (!projectConfig.features.search || searchConfig.enabled === false) {
        return undefined;
    }

    const provider = searchConfig.provider;
    const providerConfig = searchConfig.providers?.[provider];
    const resolver =
        searchProviderResolvers.get(provider) || providerConfig?.resolver;

    if (!resolver) {
        console.warn(
            `[search] No resolver registered for provider "${provider}". Search is disabled.`,
        );
        return undefined;
    }

    return resolver({
        provider,
        searchConfig,
        providerConfig,
        searchLocales,
    });
}
