import type { DefaultTheme } from "vitepress";

/**
 * Language configuration interface for multi-language support
 *
 * @example
 * ```ts
 * const enConfig: LanguageConfig = {
 *   code: "en-US",           // Must match VitePress locale key
 *   name: "en-US",           // Internal identifier, usually same as code
 *   displayName: "English",  // What users see in language switcher
 *   isDefault: true,         // Makes this the default language (use "root" in VitePress)
 *   link: "/en-US/",         // URL path, determines VitePress language routing
 *   label: "English",        // Fallback for displayName in UI components
 *   fileName: "en.ts",       // Translation file name in i18n directory
 *   giscusLang: "en"         // Language for Giscus comment system
 * }
 * ```
 */
export interface LanguageConfig {
    /** ISO 639-1 language code (e.g., "en-US", "zh-CN") - must match VitePress locale configuration */
    code: string;

    /** Internal identifier for the language, typically same as code for consistency */
    name: string;

    /** Human-readable name shown in language switcher dropdown and UI */
    displayName: string;

    /** Set to true for default language (becomes "root" in VitePress config) */
    isDefault?: boolean;

    /** URL path prefix like "/en-US/" - determines VitePress language routing behavior */
    link?: string;

    /** Display label for UI components, falls back to displayName if not set */
    label?: string;

    /** Translation file name (e.g., "en.ts", "zh.ts") for i18n message files */
    fileName?: string;

    /** Language code for Giscus comment system integration */
    giscusLang?: string;
}

/**
 * File system paths configuration for VitePress project structure
 *
 * @example
 * ```ts
 * const paths: PathConfig = {
 *   root: ".",                    // Project root, usually current directory
 *   docs: "./src",               // Where your .md files live
 *   src: "./src",                // Source directory (same as docs typically)
 *   public: "./src/public",      // Static assets (images, favicons, etc.)
 *   vitepress: "./.vitepress",   // VitePress configuration folder
 *   config: "./.vitepress/config", // Configuration files location
 *   theme: "./.vitepress/theme",   // Custom theme files
 *   scripts: "./.vitepress/scripts", // Build and utility scripts
 *   utils: "./.vitepress/utils",    // Helper functions and utilities
 *   cache: "./.vitepress/cache",    // Build cache directory
 *   build: "./.vitepress/dist"      // Final build output directory
 * }
 * ```
 */
export interface PathConfig {
    /** Project root directory, typically "." for current directory */
    root: string;

    /** Documentation source directory where .md files are located */
    docs: string;

    /** Source files directory, usually same as docs for VitePress */
    src: string;

    /** Static assets directory for images, favicons, and other public files */
    public: string;

    /** VitePress configuration directory containing all VitePress-specific files */
    vitepress: string;

    /** Configuration files directory for project settings and options */
    config: string;

    /** Custom theme directory for theme overrides and customizations */
    theme: string;

    /** Build and utility scripts directory for automation and tooling */
    scripts: string;

    /** Utility functions directory for shared helper functions */
    utils: string;

    /** Build cache directory for faster subsequent builds */
    cache: string;

    /** Final build output directory where generated site files are placed */
    build: string;
}

/**
 * Configuration for the "Copy Link" button
 */
export interface CopyLinkConfig {
    /** Whether to remove the language key from the copied URL */
    removeLanguage: boolean;
}

/**
 * Configuration for a single social media button
 */
export interface SocialButton {
    /** Unique name for the button (used for i18n keys and CSS classes) */
    name: string;
    /** The text to display as a tooltip on hover */
    title: string;
    /** The URL the button links to */
    link: string;
    /** The raw SVG string for the button's icon */
    icon: string;
}

/**
 * Configuration for special 'Back' button navigation paths
 */
export interface SpecialBackPath {
    /** A string representing the regex to match the current path */
    regex: string;
    /** A template for the target path, where {n} is replaced by the nth capture group from the regex */
    targetPath: string;
}

/**
 * Footer options configuration interface
 */
export interface FooterOptionsConfig {
    /** Whether to show ICP filing information */
    showIcp: boolean;
    /** Whether to show police filing information */
    showPolice: boolean;
    /** Whether to show license information */
    showLicense: boolean;
    /** License text to display */
    licenseText: string;
    /** License link URL */
    licenseLink: string;
    /** Whether to show site statistics (visits, page views) */
    showSiteStats: boolean;
    /**
     * Site statistics provider ('busuanzi' | 'vercount' | 'custom')
     * Currently, only 'busuanzi' is supported.
     */
    siteStatsProvider: "busuanzi" | "vercount" | "custom";
}

/**
 * Draw.io plugin configuration interface
 */
export interface DrawioConfig {
    /** Default width of diagrams */
    width: string;
    /** Default height of diagrams */
    height: string;
    /** Start page index */
    page: number;
    /** Dark mode setting */
    darkMode: "light" | "dark" | "auto";
    /** Enable toolbar resize */
    resize: boolean;
    /** Enable toolbar change pages */
    pages: boolean;
    /** Enable toolbar zoom */
    zoom: boolean;
    /** Enable toolbar layers */
    layers: boolean;
    /** Enable toolbar lightbox */
    lightbox: boolean;
    /** Highlight color */
    highlight: string;
    /** Transparent background */
    transparent: boolean;
}

/**
 * Markdown Variables plugin configuration interface
 */
export interface MdVarConfig {
    /** Strings that start with this prefix are treated as variables */
    prefix: string;
    /** Strings that start with this prefix are NOT treated as variables */
    noVarPrefix: string;
    /** Enable variable persistence across pages */
    persistence: boolean;
    /** Styling theme: "default", "thr" (The Hacker Recipes), or custom CSS */
    styling: "default" | "thr" | string;
}

/**
 * Giscus comment system configuration interface
 */
export interface GiscusConfig {
    /** GitHub repository in format 'owner/repo' */
    repo: string;
    /** GitHub repository ID */
    repoId: string;
    /** Discussion category name */
    category: string;
    /** Discussion category ID */
    categoryId: string;
    /** Mapping between pages and discussions */
    mapping: "url" | "title" | "og:title" | "specific" | "number" | "pathname";
    /** Use strict title matching */
    strict: boolean;
    /** Enable reactions */
    reactionsEnabled: boolean;
    /** Emit discussion metadata */
    emitMetadata: boolean;
    /** Input position */
    inputPosition: "top" | "bottom";
    /** Theme configuration */
    theme: {
        light: string;
        dark: string;
    };
    /**
     * Whether different language versions should share the same comment area
     * - true: All languages share comments (e.g., '/test' for both /en-US/test and /zh-CN/test)
     * - false: Each language has separate comments (e.g., 'en-US/test' and 'zh-CN/test')
     * @default true
     */
    sharedComments: boolean;
}

/**
 * Search provider identifier.
 * Includes built-in providers and custom plugin providers.
 */
export type SearchProvider = "algolia" | "local" | "none" | (string & {});

/**
 * Grouped search locales keyed by provider id.
 * Built-in providers are typed and custom providers are supported.
 */
export interface SearchLocalesByProvider {
    algolia?: DefaultTheme.AlgoliaSearchOptions["locales"];
    local?: DefaultTheme.LocalSearchOptions["locales"];
    [provider: string]: Record<string, any> | undefined;
}

/**
 * Search provider resolver context used by extensible provider adapters.
 */
export interface SearchProviderResolverContext {
    provider: string;
    searchConfig: SearchConfig;
    providerConfig?: SearchCustomProviderConfig;
    searchLocales: SearchLocalesByProvider;
}

/**
 * Search provider resolver signature.
 * Returns a VitePress themeConfig.search value or undefined (disabled).
 */
export type SearchProviderResolver = (
    context: SearchProviderResolverContext,
) => DefaultTheme.Config["search"] | undefined;

/**
 * Built-in Algolia provider options.
 */
export interface SearchAlgoliaConfig {
    appId?: string;
    apiKey?: string;
    indexName?: string;
    options?: Omit<
        DefaultTheme.AlgoliaSearchOptions,
        "appId" | "apiKey" | "indexName" | "locales"
    >;
    locales?: DefaultTheme.AlgoliaSearchOptions["locales"];
}

/**
 * Built-in local search provider options.
 */
export interface SearchLocalConfig {
    options?: Omit<DefaultTheme.LocalSearchOptions, "locales">;
    locales?: DefaultTheme.LocalSearchOptions["locales"];
}

/**
 * Custom provider options for search plugins.
 */
export interface SearchCustomProviderConfig {
    options?: Record<string, any>;
    locales?: Record<string, any>;
    resolver?: SearchProviderResolver;
}

/**
 * Search configuration for selecting provider and provider-specific options.
 */
export interface SearchConfig {
    enabled?: boolean;
    provider: SearchProvider;
    algolia?: SearchAlgoliaConfig;
    local?: SearchLocalConfig;
    providers?: Record<string, SearchCustomProviderConfig>;
}

/**
 * Deployment configuration interface for different deployment strategies
 * SSH credentials (host, username, private key) are managed via GitHub repository secrets for security
 *
 * @example
 * ```ts
 * // GitHub Pages deployment (default) - no additional configuration needed
 * const githubDeployment: DeploymentConfig = {
 *   type: 'github-pages',
 *   server: { remotePath: '', port: 22, excludeFiles: [] },
 *   custom: { deployCommand: '', postDeployCommand: '' }
 * }
 *
 * // Server deployment via SSH - credentials managed via GitHub secrets
 * const serverDeployment: DeploymentConfig = {
 *   type: 'server',
 *   server: {
 *     remotePath: '/var/www/html',              // Where to deploy files on server
 *     port: 22,                                 // SSH port (usually 22)
 *     excludeFiles: ['.git', 'node_modules', '*.log']  // Files to exclude from deployment
 *   },
 *   custom: { deployCommand: '', postDeployCommand: '' }
 * }
 * // Note: Set SSH_HOST, SSH_USERNAME, SSH_PRIVATE_KEY in GitHub repository secrets
 *
 * // Custom deployment with user-defined commands
 * const customDeployment: DeploymentConfig = {
 *   type: 'custom',
 *   server: { remotePath: '', port: 22, excludeFiles: [] },
 *   custom: {
 *     deployCommand: 'vercel --prod --dir docs/.vitepress/dist',
 *     postDeployCommand: 'curl -X POST https://your-webhook.com/deployed'
 *   }
 * }
 * ```
 */
export interface DeploymentConfig {
    /** Deployment strategy type: 'github-pages' | 'server' | 'custom' */
    type: "github-pages" | "server" | "custom";

    /** Server deployment configuration (only used when type is 'server') - SSH credentials managed via GitHub secrets */
    server: {
        /** Remote path on server where files should be deployed (e.g., '/var/www/html', '/home/user/public_html') */
        remotePath: string;
        /** SSH port number (default: 22, some servers use custom ports like 2222) */
        port: number;
        /** Files and directories to exclude from deployment (e.g., ['.git', 'node_modules', '*.log']) */
        excludeFiles: string[];
    };

    /** Custom deployment configuration (only used when type is 'custom') */
    custom: {
        /** Custom deployment command (e.g., 'vercel deploy', 'docker push', 'rsync -avz ...') */
        deployCommand: string;
        /** Optional post-deployment command (e.g., webhooks, cache invalidation, service restarts) */
        postDeployCommand: string;
    };
}

/**
 * Optional configuration for vitepress-plugin-llms output generation.
 */
export interface LlmsConfig {
    /** Canonical site domain used for absolute URLs in llms output. Must not end with "/" */
    domain?: string;
    /** Generate the llms.txt section index file */
    generateLLMsTxt?: boolean;
    /** Generate the llms-full.txt bundle */
    generateLLMsFullTxt?: boolean;
    /** Generate LLM-friendly markdown for each page */
    generateLLMFriendlyDocsForEachPage?: boolean;
    /** Strip HTML from generated markdown output */
    stripHTML?: boolean;
    /** Inject hidden LLM hints into rendered pages */
    injectLLMHint?: boolean;
    /** Restrict generation to a specific source subdirectory */
    workDir?: string;
    /** Extra file globs to skip */
    ignoreFiles?: string[];
    /** Exclude common non-doc content presets */
    excludeUnnecessaryFiles?: boolean;
    /** Exclude index pages from llms output */
    excludeIndexPage?: boolean;
    /** Exclude blog content from llms output */
    excludeBlog?: boolean;
    /** Exclude team pages from llms output */
    excludeTeam?: boolean;
}

/**
 * Complete project configuration interface containing all VitePress site settings
 *
 * @example
 * ```ts
 * const config: ProjectConfig = {
 *   name: "my-docs",                    // Site title and project name
 *   base: "/my-repo/",                  // GitHub Pages base path (CRITICAL for deployment)
 *   keyWords: ["docs", "guide"],        // SEO keywords for meta tags
 *   description: "My documentation",    // Site description for SEO
 *   version: "1.0.0",                   // Current project version
 *   author: "Your Name",                // Project author for metadata
 *   license: "MIT",                     // License type
 *   repository: {                       // Git repository information
 *     type: "git",
 *     url: "https://github.com/user/repo"
 *   },
 *   homepage: "https://user.github.io/repo/", // Live site URL
 *   defaultCurrency: "USD",             // For financial components
 *   languages: [...],                   // Multi-language configuration
 *   paths: {...},                       // File system paths
 *   features: {...},                    // Feature toggles
 *   sidebarTags: {...},                 // Sidebar tags configuration
 *   search: {...},                      // Search provider configuration
 *   algolia: {...},                     // Legacy Algolia credentials (backward compatibility)
 *   deployment: {...}                   // Deployment configuration
 * }
 * ```
 */
export interface ProjectConfig {
    /** Project name used in site title, metadata, and branding */
    name: string;

    /** Base URL path for deployment - MUST match your repository name for GitHub Pages (e.g., "/my-repo/") */
    base: string;

    /** SEO keywords array for meta tags and search engine optimization */
    keyWords: string[];

    /** Current project version for display and tracking */
    version: string;

    /** Project author name for copyright and metadata */
    author: string;

    /** License type (e.g., "MIT", "Apache-2.0") for legal information */
    license: string;

    /** Favicon path (relative to base) or external URL */
    favicon: string;

    /** Logo configuration - can be string for single logo or object for light/dark themes */
    logo:
        | string
        | {
              /** Logo for light theme */
              light: string;
              /** Logo for dark theme */
              dark: string;
              /** Alt text for the logo */
              alt?: string;
          };

    /** Git repository information for source links and integrations */
    repository: {
        /** Repository type, typically "git" */
        type: string;
        /** Full repository URL for GitHub integration and edit links */
        url: string;
    };

    /** Live site URL for canonical links and social media */
    homepage: string;

    /** Default currency code for Bills component and financial calculations */
    defaultCurrency: string;

    /** Multi-language configuration array for i18n support */
    languages: LanguageConfig[];

    /** File system paths configuration for project structure */
    paths: PathConfig;

    /** Feature toggle flags for enabling/disabling optional functionality */
    features: {
        /** Enable or disable search globally */
        search: boolean;
        /** Enable Git-based changelog generation from commit history */
        gitChangelog: boolean;
        /** Enable llms.txt / llms-full.txt generation */
        llms: boolean;
        /** Enable Mermaid diagram support in markdown */
        mermaid: boolean;
        /** Enable Draw.io diagram support in markdown */
        drawio: boolean;
        /** Enable Markmap diagram support in markdown */
        markmap: boolean;
        /** Enable multi-language support and language switcher */
        multilingual: boolean;
        /**
         * Enable automatic sidebar generation from file structure
         * When enabled, sidebars are automatically generated from markdown files
         * When disabled, you need to manually configure sidebars in language config files
         */
        autoSidebar: boolean;
        /** Enable edit link in page footer */
        editLink: boolean;
    };

    /** Algolia search service configuration (leave empty to disable search) */
    algolia: {
        /** Algolia application ID from your Algolia dashboard */
        appId: string;
        /** Algolia search API key (public, not admin key) */
        apiKey: string;
        /** Algolia search index name for your documentation */
        indexName: string;
    };

    /** Search provider configuration (algolia/local/none/custom) */
    search?: SearchConfig;

    /** Optional LLM-friendly documentation generation settings */
    llms?: LlmsConfig;

    /** Deployment configuration for different deployment strategies */
    deployment: DeploymentConfig;

    /** Configuration for floating social media buttons */
    socialButtons: SocialButton[];

    /** Special path configurations for the 'Back' button */
    specialBackPaths: SpecialBackPath[];

    /** Configuration for the "Copy Link" button */
    copyLinkConfig: CopyLinkConfig;

    /** Social media links in header */
    headerSocialLinks?: Array<{
        icon: string | { svg: string };
        link: string;
        ariaLabel?: string;
    }>;

    /** Edit link configuration */
    editLink?: {
        pattern: string;
        text?: string;
    };

    /** Footer options configuration */
    footerOptions: FooterOptionsConfig;

    /** Draw.io plugin configuration */
    drawio: DrawioConfig;

    /** Markdown Variables plugin configuration */
    mdVar: MdVarConfig;

    /** Giscus comment system configuration */
    giscus: GiscusConfig;
}

/**
 * Get all configured languages from project configuration
 * @returns Array of all language configurations
 *
 * @example
 * ```ts
 * const languages = getLanguages();
 * console.log(languages.map(lang => lang.displayName)); // ["English", "简体中文"]
 * ```
 */
