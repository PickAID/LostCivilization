import type { DefaultTheme } from "vitepress";
import type { SearchLocalesByProvider } from "../../utils/config/project-config";
import {
    getProjectInfo,
    getLanguageByCode,
    getLangCodeFromLink,
    getSearchLocaleKey,
    isFeatureEnabled,
} from "../../utils/config/project-config";
import { getSidebarSync } from "../../utils/sidebar/lib";

const projectInfo = getProjectInfo();
// Note: The 'code' field should follow the format "language-region" (e.g., "en-US", "zh-CN") for proper locale handling
const langConfig = getLanguageByCode("lang-Code")!;

/**
 * This is a template language configuration file for Vitepress.
 * You must replace 'lang-Code' with the actual language code you want to support (e.g., 'en-US', 'zh-CN').
 * The name of the exported constant should also follow the format 'lang_Code' to ensure the logic in config.ts can correctly import and use it.
 *
 * When adding a new language, make sure to:
 * 1. Add the language configuration in project-config.ts with the correct 'code' and 'fileName' fields.
 * 2. Copy this template file, rename it to match the 'fileName' specified in project-config.ts (e.g., 'en.ts', 'zh.ts'), and update the content with appropriate translations and settings for the new language.
 * 3. Change the name to a corresponding language file (e.g., 'en.ts', 'zh.ts') in the config directory with the appropriate translations and settings.
 * 4. Update the 'languages' array in project-config.ts to include your new language configuration.
 * 5. Ensure that any features you want to enable for this language are properly configured in this file and project-config.ts.
 */
export const lang_Code = <DefaultTheme.Config>{
    label: langConfig.displayName,
    lang: langConfig.giscusLang,
    link: langConfig.link,
    title: "Mihono Vitepress Template",
    description: "A template for Vitepress documentation",
    themeConfig: {
        sidebar: isFeatureEnabled("autoSidebar")
            ? getSidebarSync(getLangCodeFromLink(langConfig.link!))
            : [],
        outline: {
            level: "deep",
            label: "Page Content",
        },
        docFooter: {
            prev: "Previous Page",
            next: "Next Page",
        },
        lastUpdated: {
            text: "Last Updated",
            formatOptions: {
                dateStyle: "short",
                timeStyle: "medium",
            },
        },
        editLink:
            isFeatureEnabled("editLink") && projectInfo.editLink
                ? {
                      pattern: projectInfo.editLink.pattern,
                      text:
                          projectInfo.editLink.text ||
                          "Edit this page on GitHub",
                  }
                : undefined,
        langMenuLabel: "Change Language",
        darkModeSwitchLabel: "Switch Theme",
        lightModeSwitchTitle: "Switch to light mode",
        darkModeSwitchTitle: "Switch to dark mode",
        returnToTopLabel: "Return to top",
        sidebarMenuLabel: "Menu",
    },
};

export const search: DefaultTheme.AlgoliaSearchOptions["locales"] = {
    [getSearchLocaleKey(langConfig.code)]: {
        placeholder: "Search docs",
        translations: {
            button: {
                buttonText: "Search",
                buttonAriaLabel: "Search",
            },
            modal: {
                searchBox: {
                    resetButtonTitle: "Clear the query",
                    resetButtonAriaLabel: "Clear the query",
                    cancelButtonText: "Cancel",
                    cancelButtonAriaLabel: "Cancel",
                },
                startScreen: {
                    recentSearchesTitle: "Recent",
                    noRecentSearchesText: "No recent searches",
                    saveRecentSearchButtonTitle: "Save this search",
                    removeRecentSearchButtonTitle:
                        "Remove this search from history",
                    favoriteSearchesTitle: "Favorites",
                    removeFavoriteSearchButtonTitle:
                        "Remove this search from favorites",
                },
                errorScreen: {
                    titleText: "Unable to fetch results",
                    helpText: "You might want to check your network connection",
                },
                footer: {
                    selectText: "to select",
                    navigateText: "to navigate",
                    closeText: "to close",
                    searchByText: "Search by",
                },
                noResultsScreen: {
                    noResultsText: "No results for",
                    suggestedQueryText: "Try searching for",
                    reportMissingResultsText:
                        "Believe this query should return results?",
                    reportMissingResultsLinkText: "Let us know",
                },
            },
        },
    },
};

export const localSearch: DefaultTheme.LocalSearchOptions["locales"] = {
    [getSearchLocaleKey(langConfig.code)]: {
        translations: {
            button: {
                buttonText: "Search",
                buttonAriaLabel: "Search",
            },
            modal: {
                displayDetails: "Display detailed list",
                resetButtonTitle: "Clear query",
                backButtonTitle: "Close search",
                noResultsText: "No results for $q",
                footer: {
                    selectText: "to select",
                    navigateText: "to navigate",
                    closeText: "to close",
                },
            },
        },
    },
};

export const searchLocales: SearchLocalesByProvider = {
    algolia: search,
    local: localSearch,
};
