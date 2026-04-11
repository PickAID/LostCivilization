import type { DefaultTheme, HeadConfig, UserConfig } from "vitepress";
import { resolve } from "path";
import { fileURLToPath } from "url";
import {
    getProjectInfo,
    isFeatureEnabled,
    getPaths,
    getLanguageLinks,
    autoDiscoverLanguageModules,
    projectConfig,
} from "../utils/config/project-config";
import { templateCompilerOptions } from "@tresjs/core";
import llmstxt from "vitepress-plugin-llms";

import { sidebarPlugin } from "../utils/sidebar/";
import { markdown } from "./markdown-plugins";
import {
    groupIconVitePlugin,
    localIconLoader,
} from "vitepress-plugin-group-icons";

const projectInfo = getProjectInfo();
const projectPaths = getPaths();
import contributors from "../config/contributors.json";

interface Contributor {
    avatar: string;
    [key: string]: any;
}

function generateAvatarUrl(username: string) {
    return `https://github.com/${username}.png`;
}

function normalizeLlmsDomain(domain?: string) {
    return domain?.replace(/\/+$/u, "") || undefined;
}

function createLlmsSettings() {
    return {
        ...projectConfig.llms,
        domain: normalizeLlmsDomain(
            projectConfig.llms?.domain || projectInfo.homepage,
        ),
        generateLLMsTxt: projectConfig.llms?.generateLLMsTxt ?? true,
        generateLLMsFullTxt: projectConfig.llms?.generateLLMsFullTxt ?? true,
        generateLLMFriendlyDocsForEachPage:
            projectConfig.llms?.generateLLMFriendlyDocsForEachPage ?? true,
        injectLLMHint: projectConfig.llms?.injectLLMHint ?? true,
    };
}

export const commonConfig: UserConfig<DefaultTheme.Config> = {
    title: projectInfo.name,
    description:
        "Documentation for an archaeology-first Minecraft 1.20.1 Forge modpack built around pseudo-instance site events and resonance.",
    base: projectInfo.base,

    srcDir: projectPaths.src,
    outDir: projectPaths.build,
    cacheDir: projectPaths.cache,

    lastUpdated: true,
    cleanUrls: true,
    metaChunk: true,
    ignoreDeadLinks: true,

    head: [
        [
            "link",
            {
                rel: "icon",
                href: projectInfo.favicon.startsWith("http")
                    ? projectInfo.favicon
                    : `${projectInfo.base}${projectInfo.favicon}`,
            },
        ],
        [
            "meta",
            {
                name: "keywords",
                content:
                    (projectInfo as any).keyWords?.join(", ") ||
                    "minecraft, modpack, archaeology, forge, resonance",
            },
        ],
        ["meta", { name: "author", content: projectInfo.author }],
        ["meta", { property: "og:title", content: projectInfo.name }],
        [
            "meta",
            {
                property: "og:description",
                content:
                    "Documentation for an archaeology-first Minecraft 1.20.1 Forge modpack built around pseudo-instance site events and resonance.",
            },
        ],
        ["meta", { property: "og:url", content: projectInfo.homepage }],
        ["meta", { property: "og:type", content: "website" }],
    ] as HeadConfig[],

    transformHead({ assets }) {
        const faviconHref = projectInfo.favicon.startsWith("http")
            ? projectInfo.favicon
            : `${projectInfo.base}${projectInfo.favicon}`;
        return [["link", { rel: "icon", href: faviconHref }]];
    },

    transformPageData(pageData) {
        const fm = pageData.frontmatter;
        const isTagPage = fm.layout === "tags";
        const isNavLinksLayout = fm.layout === "navlinks";
        const hasNavLinksData = Array.isArray(fm.navLinks) && fm.navLinks.length > 0;

        if (isTagPage) {
            fm.layout = "MNavLayout";
            fm.tagPage = true;
        }
        if (isNavLinksLayout) {
            fm.layout = "MNavLayout";
        }

        if (isTagPage || isNavLinksLayout || hasNavLinksData) {
            const defaults: Record<string, unknown> = {
                sidebar: false,
                prev: false,
                next: false,
                editLink: false,
                editor: false,
                gitChangelog: false,
                showComment: false,
                metadata: false,
                buttons: false,
            };
            for (const [key, value] of Object.entries(defaults)) {
                if (fm[key] === undefined) {
                    fm[key] = value;
                }
            }
        }
    },

    markdown: { ...markdown },

    vue: {
        template: {
            compilerOptions: {
                whitespace: "preserve",
                // TresJS template compiler options will be added via vite config
                ...templateCompilerOptions.template.compilerOptions,
            },
        },
    },

    themeConfig: {
        logo: projectInfo.logo,

        socialLinks:
            projectInfo.headerSocialLinks &&
            projectInfo.headerSocialLinks.length > 0
                ? projectInfo.headerSocialLinks
                : [],

        langMenuLabel: "Change Language",

        editLink:
            isFeatureEnabled("editLink") && projectInfo.editLink
                ? {
                      pattern: projectInfo.editLink.pattern,
                      text: projectInfo.editLink.text || "Edit this page",
                  }
                : undefined,
    } satisfies DefaultTheme.Config,

    vite: {
        resolve: {
            alias: [
                {
                    find: /^.*\/VPHero\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/VPHero.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPFeatures\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/VPFeatures.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPButton\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/VPButton.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPNavBarTranslations\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/VPNavBarTranslations.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPNavScreenTranslations\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/VPNavScreenTranslations.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPNav\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/navigation/nav/VPNav.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPNavBar\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/navigation/nav/VPNavBar.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPLocalNav\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/navigation/outline/VPLocalNav.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^.*\/VPLocalNavOutlineDropdown\.vue$/,
                    replacement: fileURLToPath(
                        new URL(
                            "../theme/components/navigation/outline/VPLocalNavOutlineDropdown.vue",
                            import.meta.url,
                        ),
                    ),
                },
                {
                    find: /^motion-dom$/,
                    replacement: resolve(
                        projectPaths.root,
                        "node_modules/motion-dom/dist/es/index.mjs",
                    ),
                },
                {
                    find: /^motion-utils$/,
                    replacement: resolve(
                        projectPaths.root,
                        "node_modules/motion-utils/dist/es/index.mjs",
                    ),
                },
                {
                    find: "@utils",
                    replacement: resolve(projectPaths.vitepress, "utils"),
                },
                {
                    find: "@config",
                    replacement: resolve(
                        projectPaths.vitepress,
                        "utils/config",
                    ),
                },
                {
                    find: "@components",
                    replacement: resolve(
                        projectPaths.vitepress,
                        "theme/components",
                    ),
                },
                {
                    find: "@/locale",
                    replacement: resolve(projectPaths.config, "locale"),
                },
            ],
        },
        optimizeDeps: {
            exclude: [
                "@nolebase/vitepress-plugin-enhanced-readabilities",
                "@nolebase/ui",
                "@nolebase/vitepress-plugin-inline-link-preview",
                "shiki-magic-move",
            ],
            include: [
                "vue",
                "@vueuse/core",
                "mermaid",
                "vitepress-plugin-nprogress",
                "vitepress-plugin-tabs/client",
                "@lite-tree/vue",
            ],
            force: true,
        },
        build: {
            chunkSizeWarningLimit: 1500,
            target: "esnext",
            minify: "esbuild",
        },
        ssr: {
            noExternal: [
                "vuetify",
                "@nolebase/ui",
                "@nolebase/vitepress-plugin-enhanced-readabilities",
                "@nolebase/vitepress-plugin-inline-link-preview",
                "@nolebase/markdown-it-bi-directional-links",
                "@nolebase/vitepress-plugin-highlight-targeted-heading",
                "vitepress-plugin-tabs",
                "shiki-magic-move",
                "markdown-it-multiple-choice",
                "motion-v",
                "framer-motion",
                "motion-dom",
                "motion-utils",
            ],
            external: [
                "path",
                "fs",
                "fast-glob",
                "gray-matter",
                "@nolebase/vitepress-plugin-git-changelog",
            ],
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: "modern",
                },
            },
        },
        define: {
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__:
                process.env.NODE_ENV === "development",
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            __GIT_CHANGELOG_ENABLED__: isFeatureEnabled("gitChangelog"),
        },
        plugins: [
            ...(isFeatureEnabled("gitChangelog")
                ? [
                      (async () => {
                          const { GitChangelog, GitChangelogMarkdownSection } =
                              await import(
                                  "@nolebase/vitepress-plugin-git-changelog/vite"
                              );
                          return [
                              // @ts-ignore
                              GitChangelog({
                                  repoURL: () => projectInfo.repository.url,
                                  mapAuthors: (
                                      contributors as Contributor[]
                                  ).map((author) => ({
                                      ...author,
                                      avatar: generateAvatarUrl(author.avatar),
                                  })),
                              }),
                              // @ts-ignore
                              GitChangelogMarkdownSection(),
                          ];
                      })(),
                  ]
                : []),
            ...(isFeatureEnabled("llms") ? [llmstxt(createLlmsSettings())] : []),
            // Conditionally load sidebar plugin based on autoSidebar feature flag
            ...(isFeatureEnabled("autoSidebar")
                ? [
                      // @ts-ignore
                      sidebarPlugin({
                          languages: getLanguageLinks().map((link) =>
                              link.replace(/^\/|\/$/g, ""),
                          ),
                          debug: process.env.NODE_ENV === "development",
                          docsDir: projectPaths.docs,
                          hotRestartOnIndexChange: false,
                      }),
                  ]
                : []),
            // @ts-ignore
            groupIconVitePlugin({
                customIcon: {
                    json: localIconLoader(
                        import.meta.url,
                        `../../src/public/svg/json.svg`,
                    ),
                    md: localIconLoader(
                        import.meta.url,
                        `../../src/public/svg/markdown.svg`,
                    ),
                    ts: "logos:typescript-icon-round",
                    java: "logos:java",
                    css: "logos:css-3",
                    git: "logos:git-icon",
                },
            }),
        ],
    },
};

export default commonConfig;
