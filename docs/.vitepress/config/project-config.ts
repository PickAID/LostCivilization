import type { ProjectConfig } from "../utils/config/project-types";

/**
 * Main project configuration
 * Modify values below to customize your VitePress site
 */
export const projectConfig: ProjectConfig = {
    /**
     * Project name， Not important, but can be used in various places like page titles, meta tags, etc.
     */
    name: "Lost Civilization",

    /**
     * IMPORTANT: Change this to your repository name for GitHub Pages deployment
     * If deploying to GitHub Pages under a user/organization page, set this to "/"
     * Format: "/your-repo-name/"
     */
    base: "/LostCivilization/",

    keyWords: [
        "Minecraft",
        "modpack",
        "archaeology",
        "Forge",
        "pseudo-instance",
        "resonance",
    ],
    version: "2.0.1",
    author: "PickAID",
    license: "CC BY-SA 4.0",

    /**
     * Favicon configuration
     * Can be a local file path (relative to base) or external URL
     */
    favicon: "logo.png", // or "favicon.ico" or "https://example.com/icon.svg"

    /**
     * Logo configuration
     * Can be a simple string path or an object with light/dark theme logos
     */
    logo: {
        light: "/logo.png",
        dark: "/logodark.png",
        alt: "Site Logo",
    },
    repository: {
        type: "git",
        url: "https://github.com/PickAID/LostCivilization",
    },
    homepage: "https://pickaid.github.io/LostCivilization/",

    defaultCurrency: "CNY",

    /**
     * Language configurations for multi-language support
     * Add or modify languages here to enable i18n functionality
     * See LanguageConfig interface below for detailed field documentation
     * Note: The 'code' field should follow the format "language-region" (e.g., "en-US", "zh-CN") for proper locale handling
     * When adding new languages, ensure you create corresponding language files (e.g., "en.ts", "zh.ts") in the config directory and update the 'fileName' field accordingly
     */
    languages: [
        {
            code: "zh-CN",
            name: "zh-CN",
            displayName: "简体中文",
            isDefault: false,
            link: "/zh-CN/",
            label: "简体中文",
            fileName: "zh.ts",
            giscusLang: "zh-CN",
        },
        {
            code: "en-US",
            name: "en-US",
            displayName: "English",
            isDefault: true,
            link: "/en-US/",
            label: "English",
            fileName: "en.ts",
            giscusLang: "en",
        },
    ],

    paths: {
        root: ".",
        docs: "./src",
        src: "./src",
        public: "./src/public",
        vitepress: "./.vitepress",
        config: "./.vitepress/config",
        theme: "./.vitepress/theme",
        scripts: "./.vitepress/scripts",
        utils: "./.vitepress/utils",
        cache: "./.vitepress/cache",
        build: "./.vitepress/dist",
    },

    /**
     * Algolia search configuration
     * Set up your Algolia credentials to enable search
     */
    algolia: {
        appId: "",
        apiKey: "",
        indexName: "",
    },

    /**
     * Search provider configuration
     * provider:
     * - "local": VitePress local search (no external service)
     * - "algolia": Algolia DocSearch
     * - "none": disable search UI
     * - custom string: resolve via search.providers[provider].resolver
     */
    search: {
        enabled: false,
        provider: "local",
        algolia: {
            // Optional: keep empty when not using Algolia.
            appId: "",
            apiKey: "",
            indexName: "",
            options: {},
        },
        local: {
            options: {
                detailedView: "auto",
                disableQueryPersistence: false,
            },
        },
        providers: {
            // Example plugin provider:
            // "my-search-plugin": {
            //     options: {},
            //     locales: {},
            //     resolver: ({ provider, providerConfig }) => ({
            //         provider: provider as "algolia" | "local",
            //         options: providerConfig?.options as any,
            //     }),
            // },
        },
    },

    /**
     * Feature toggles
     * Enable or disable features as needed
     */
    features: {
        // Global search toggle. Set false to force-disable search.
        search: true,
        gitChangelog: false,
        llms: false,
        mermaid: true,
        drawio: true,
        markmap: true,
        multilingual: true,
        autoSidebar: true,
        editLink: false,
    },

    llms: {
        domain: "https://pickaid.github.io/LostCivilization",
        workDir: "en-US",
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        generateLLMFriendlyDocsForEachPage: true,
        injectLLMHint: true,
    },

    /**
     * Deployment configuration
     * Set type to control deployment strategy: 'github-pages' | 'server' | 'custom'
     * Note: SSH credentials (host, username, private key) are managed via GitHub repository secrets
     */
    deployment: {
        type: "github-pages",
        server: {
            remotePath: "/var/www/html",
            port: 22,
            excludeFiles: [".git", "node_modules", "*.log"],
        },
        custom: {
            deployCommand: "",
            postDeployCommand: "",
        },
    },

    /**
     * Configuration for the "Copy Link" button
     */
    copyLinkConfig: {
        removeLanguage: false,
    },

    /**
     * Header social media links
     */
    headerSocialLinks: [
        {
            icon: "github",
            link: "https://github.com/PickAID/LostCivilization",
            ariaLabel: "GitHub",
        },
    ],

    /**
     * Edit link configuration
     */
    editLink: {
        pattern:
            "https://github.com/M1hono/M1honoVitepressTemplate/edit/main/docs/src/:path",
        text: "Edit this page on GitHub",
    },

    /**
     * Configuration for floating social media buttons
     * Add or modify buttons that appear on the side of the page
     */
    socialButtons: [],

    /**
     * Special path configurations for the 'Back' button
     * Defines custom navigation behavior for specific URL patterns
     */
    specialBackPaths: [
        {
            regex: "^/(\\w{2}-\\w{2}|\\w{2})/guide/advanced/\\w+",
            targetPath: "/{1}/guide/advanced/",
        },
        {
            regex: "^/(\\w{2}-\\w{2}|\\w{2})/blog/(\\d{4})/\\w+",
            targetPath: "/{1}/blog/{2}/",
        },
        {
            regex: "^/(\\w{2}-\\w{2}|\\w{2})/reference/components/\\w+",
            targetPath: "/{1}/reference/components/",
        },
    ],

    /**
     * Footer options configuration
     */
    footerOptions: {
        showIcp: false,
        showPolice: false,
        showLicense: true,
        licenseText: "CC BY-SA 4.0",
        licenseLink: "https://creativecommons.org/licenses/by-sa/4.0/",
        showSiteStats: false,
        siteStatsProvider: "busuanzi",
    },

    /**
     * Draw.io plugin configuration
     */
    drawio: {
        width: "100%",
        height: "600px",
        page: 0,
        darkMode: "auto",
        resize: true,
        pages: true,
        zoom: true,
        layers: false,
        lightbox: true,
        highlight: "#0000ff",
        transparent: false,
    },

    /**
     * Markdown Variables plugin configuration
     */
    mdVar: {
        prefix: "-%",
        noVarPrefix: "\\%",
        persistence: true,
        styling: "default",
    },

    /**
     * Giscus comment system configuration
     */
    giscus: {
        repo: "PickAID/LostCivilization",
        repoId: "R_kgDOR4d_Hg",
        category: "Announcements",
        categoryId: "DIC_kwDOR4d_Hs4C595B-",
        mapping: "specific",
        strict: true,
        reactionsEnabled: true,
        emitMetadata: false,
        inputPosition: "top",
        theme: {
            light: "noborder_light",
            dark: "noborder_dark",
        },
        /**
         * Share comments across all language versions
         * Set to false if you want each language to have separate comment sections
         */
        sharedComments: true,
    },
};
