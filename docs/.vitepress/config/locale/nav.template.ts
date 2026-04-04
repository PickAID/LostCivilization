import { NavItem } from "@utils/config/navTypes";

class NavTemplatePreviewFactory {
    create(
        title: string,
        desc: string,
        body: string,
        background: string,
    ) {
        return {
            title,
            desc,
            body,
            media: {
                type: "screenshot" as const,
                background,
                aspect: "21 / 9",
                alt: title,
            },
        };
    }
}

class NavTemplateBuilder {
    private readonly previewFactory = new NavTemplatePreviewFactory();

    build(): NavItem[] {
        return [
            this.createHomeItem(),
            this.createDocsItem(),
            this.createResourcesItem(),
        ];
    }

    private createHomeItem(): NavItem {
        return {
            text: "Home",
            link: "/",
        };
    }

    private createDocsItem(): NavItem {
        return {
            text: "Docs",
            dropdown: {
                layout: "spotlight",
                panels: [
                    {
                        featured: {
                            title: "Getting Started",
                            desc: "Project onboarding and structure overview.",
                            link: "/",
                            media: {
                                type: "image",
                                src: "/svg/logo.svg",
                                alt: "Project logo",
                                background:
                                    "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 64, 175, 0.85) 100%)",
                            },
                        },
                        groups: [
                            {
                                label: "Core",
                                items: [
                                    {
                                        text: "Hero Matrix",
                                        link: "/hero/matrix/",
                                        desc: "Primary entry for matrix hero capabilities.",
                                        preview: this.previewFactory.create(
                                            "Hero Matrix",
                                            "Frontmatter-based hero layout and visual system.",
                                            `Recommended baseline for template extensions:

- Typography presets and motion controls
- Shader, wave, and floating combinations
- Stable layout contract across locales`,
                                            "linear-gradient(135deg, #1d3557 0%, #457b9d 100%)",
                                        ),
                                    },
                                    {
                                        text: "All Config",
                                        link: "/hero/AllConfig/",
                                        desc: "Centralized frontmatter configuration reference.",
                                        preview: this.previewFactory.create(
                                            "All Config",
                                            "Canonical source for frontmatter keys and value contracts.",
                                            `Use this page before introducing new keys:

- Verify existing fields first
- Keep naming and typing consistent
- Extend via documented API contracts`,
                                            "linear-gradient(135deg, #2a9d8f 0%, #1d3557 100%)",
                                        ),
                                    },
                                ],
                            },
                            {
                                label: "Developer Guides",
                                items: [
                                    {
                                        text: "Maintainability Guide",
                                        link: "/frontmatter/reference/maintainability",
                                        desc: "High-level extension standards and ownership rules.",
                                    },
                                    {
                                        text: "Development Workflow",
                                        link: "/frontmatter/reference/developmentWorkflow",
                                        desc: "Recommended change order and verification flow.",
                                    },
                                    {
                                        text: "Extension Architecture",
                                        link: "/frontmatter/reference/extensionArchitecture",
                                        desc: "Placement guide for components, runtime, config, and styles.",
                                    },
                                    {
                                        text: "Hero Extension",
                                        link: "/frontmatter/reference/heroExtension",
                                        desc: "Typography, floating, shader, and background extension playbook.",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };
    }

    private createResourcesItem(): NavItem {
        return {
            text: "Resources",
            dropdown: {
                layout: "columns",
                panels: [
                    {
                        weight: 1,
                        groups: [
                            {
                                label: "Template",
                                items: [
                                    {
                                        text: "Styles & Plugins",
                                        link: "/stylesPlugins/",
                                        desc: "Supported markdown and plugin pipeline.",
                                    },
                                    {
                                        text: "All Pages",
                                        link: "/allPages",
                                        desc: "Global index of template documentation pages.",
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        weight: 1,
                        groups: [
                            {
                                label: "Community",
                                items: [
                                    {
                                        text: "GitHub",
                                        href: "https://github.com/M1hono/M1honoVitepressTemplate",
                                        desc: "Source, issues, and release workflow.",
                                    },
                                    {
                                        text: "Discord",
                                        href: "https://discord.gg/",
                                        desc: "Community communication channel.",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };
    }
}

export function createNavTemplate() {
    return new NavTemplateBuilder().build();
}

const navTemplate = createNavTemplate();

export default navTemplate;
