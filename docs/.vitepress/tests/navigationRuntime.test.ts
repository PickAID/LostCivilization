import assert from "node:assert/strict";
import test from "node:test";

import {
    buildBreadcrumbItems,
    resolveBaseAwareHref,
} from "../utils/vitepress/runtime/navigation/linkResolution";
import {
    buildKnownPagePathSet,
    buildKnownPagePathSetFromSidebar,
} from "../utils/vitepress/runtime/navigation/pageRouteIndex";

test("buildBreadcrumbItems links locale parent crumbs when matching index pages exist", () => {
    const items = buildBreadcrumbItems({
        routePath:
            "/M1honoVitepressTemplate/en-US/frontmatter/reference/developmentWorkflow.html",
        siteBase: "/M1honoVitepressTemplate/",
        homeLink: "/en-US/",
        homeText: "Home",
        pageTitle: "Development Workflow",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths: new Set([
            "/en-US/frontmatter/",
            "/en-US/frontmatter/reference/",
            "/en-US/frontmatter/reference/developmentWorkflow/",
        ]),
        navTree: [
            {
                text: "Frontmatter",
                link: "/frontmatter/",
            },
            {
                text: "Reference",
                link: "/frontmatter/reference/",
            },
            {
                text: "Development Workflow",
                link: "/frontmatter/reference/developmentWorkflow/",
            },
        ],
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/en-US/" },
        { text: "Frontmatter", link: "/en-US/frontmatter/" },
        { text: "Reference", link: "/en-US/frontmatter/reference/" },
        {
            text: "Development Workflow",
            link: "/en-US/frontmatter/reference/developmentWorkflow/",
        },
    ]);
});

test("buildBreadcrumbItems leaves missing parent pages non-clickable", () => {
    const items = buildBreadcrumbItems({
        routePath:
            "/M1honoVitepressTemplate/en-US/frontmatter/reference/developmentWorkflow.html",
        siteBase: "/M1honoVitepressTemplate/",
        homeLink: "/en-US/",
        homeText: "Home",
        pageTitle: "Development Workflow",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths: new Set([
            "/en-US/frontmatter/reference/developmentWorkflow/",
        ]),
        navTree: [
            {
                text: "Frontmatter",
                link: "/frontmatter/",
            },
            {
                text: "Reference",
                link: "/frontmatter/reference/",
            },
        ],
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/en-US/" },
        { text: "Frontmatter", link: undefined },
        { text: "Reference", link: undefined },
        {
            text: "Development Workflow",
            link: "/en-US/frontmatter/reference/developmentWorkflow/",
        },
    ]);
});

test("buildBreadcrumbItems accepts known page paths without locale prefixes", () => {
    const items = buildBreadcrumbItems({
        routePath:
            "/LostCivilization/zh-CN/Developing/Catalogue",
        siteBase: "/LostCivilization/",
        homeLink: "/zh-CN/",
        homeText: "Home",
        pageTitle: "Catalogue",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths: new Set([
            "/Developing/",
            "/Developing/Catalogue/",
        ]),
        navTree: [
            {
                text: "Developing",
                link: "/Developing/",
            },
            {
                text: "Catalogue",
                link: "/Developing/Catalogue/",
            },
        ],
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/zh-CN/" },
        { text: "Developing", link: "/zh-CN/Developing/" },
        { text: "Catalogue", link: "/zh-CN/Developing/Catalogue/" },
    ]);
});

test("buildKnownPagePathSet makes parent breadcrumbs clickable from markdown pages", () => {
    const knownPagePaths = buildKnownPagePathSet([
        "../../../../src/en-US/hero/index.md",
        "../../../../src/en-US/hero/matrix/index.md",
        "../../../../src/en-US/hero/matrix/configCoverage/index.md",
    ]);

    const items = buildBreadcrumbItems({
        routePath:
            "/M1honoVitepressTemplate/en-US/hero/matrix/configCoverage/",
        siteBase: "/M1honoVitepressTemplate/",
        homeLink: "/en-US/",
        homeText: "Home",
        pageTitle: "Hero Matrix Configuration Coverage",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths,
        navTree: [
            {
                text: "Hero",
                link: "/hero/",
            },
            {
                text: "Hero Matrix",
                link: "/hero/matrix/",
            },
            {
                text: "Hero Matrix Configuration Coverage",
                link: "/hero/matrix/configCoverage/",
            },
        ],
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/en-US/" },
        { text: "Hero", link: "/en-US/hero/" },
        { text: "Hero Matrix", link: "/en-US/hero/matrix/" },
        {
            text: "Hero Matrix Configuration Coverage",
            link: "/en-US/hero/matrix/configCoverage/",
        },
    ]);
});

test("buildKnownPagePathSet accepts both absolute and relative src roots", () => {
    const knownPagePaths = buildKnownPagePathSet([
        "/src/zh-CN/Developing/index.md",
        "../../../../src/zh-CN/Developing/Catalogue.md",
    ]);

    assert.deepEqual([...knownPagePaths].sort(), [
        "/zh-CN/Developing/",
        "/zh-CN/Developing/Catalogue/",
    ]);
});

test("buildKnownPagePathSetFromSidebar includes section roots and nested links", () => {
    const knownPagePaths = buildKnownPagePathSetFromSidebar({
        "/en-US/hero/": [
            {
                text: "Hero Config Matrix",
                link: "/en-US/hero/matrix/",
                items: [
                    {
                        text: "Hero Matrix Configuration Coverage",
                        link: "/en-US/hero/matrix/configCoverage/",
                    },
                ],
            },
        ],
    });

    const items = buildBreadcrumbItems({
        routePath:
            "/M1honoVitepressTemplate/en-US/hero/matrix/configCoverage/",
        siteBase: "/M1honoVitepressTemplate/",
        homeLink: "/en-US/",
        homeText: "Home",
        pageTitle: "Hero Matrix Configuration Coverage",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths,
        navTree: [
            {
                text: "Hero",
                link: "/hero/",
            },
            {
                text: "Hero Matrix",
                link: "/hero/matrix/",
            },
            {
                text: "Hero Matrix Configuration Coverage",
                link: "/hero/matrix/configCoverage/",
            },
        ],
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/en-US/" },
        { text: "Hero", link: "/en-US/hero/" },
        { text: "Hero Matrix", link: "/en-US/hero/matrix/" },
        {
            text: "Hero Matrix Configuration Coverage",
            link: "/en-US/hero/matrix/configCoverage/",
        },
    ]);
});

test("buildBreadcrumbItems resolves directory landing pages from sidebar-aware paths", () => {
    const items = buildBreadcrumbItems({
        routePath:
            "/LostCivilization/zh-CN/ModdingDeveloping/Design/Survey",
        siteBase: "/LostCivilization/",
        homeLink: "/zh-CN/",
        homeText: "Home",
        pageTitle: "Survey",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths: new Set([
            "/zh-CN/ModdingDeveloping/Catalogue/",
            "/zh-CN/ModdingDeveloping/Design/Catalogue/",
            "/zh-CN/ModdingDeveloping/Design/Survey/",
        ]),
        navTree: [
            {
                text: "ModdingDeveloping",
                link: "/ModdingDeveloping/Catalogue",
            },
            {
                text: "Design",
                link: "/ModdingDeveloping/Design/Catalogue",
            },
            {
                text: "Survey",
                link: "/ModdingDeveloping/Design/Survey",
            },
        ],
        resolveLinkPath: (path) => {
            if (path === "/zh-CN/ModdingDeveloping/") {
                return "/zh-CN/ModdingDeveloping/Catalogue";
            }
            if (path === "/zh-CN/ModdingDeveloping/Design/") {
                return "/zh-CN/ModdingDeveloping/Design/Catalogue";
            }
            return path;
        },
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/zh-CN/" },
        {
            text: "ModdingDeveloping",
            link: "/zh-CN/ModdingDeveloping/Catalogue/",
        },
        {
            text: "Design",
            link: "/zh-CN/ModdingDeveloping/Design/Catalogue/",
        },
        { text: "Survey", link: "/zh-CN/ModdingDeveloping/Design/Survey/" },
    ]);
});

test("buildBreadcrumbItems keeps the first nav label when multiple entries share a landing href", () => {
    const items = buildBreadcrumbItems({
        routePath:
            "/LostCivilization/zh-CN/ModdingDeveloping/Design/Survey",
        siteBase: "/LostCivilization/",
        homeLink: "/zh-CN/",
        homeText: "Home",
        pageTitle: "Survey",
        localeCodes: ["en-US", "zh-CN"],
        knownPagePaths: new Set([
            "/zh-CN/ModdingDeveloping/Catalogue/",
            "/zh-CN/ModdingDeveloping/Design/Catalogue/",
            "/zh-CN/ModdingDeveloping/Design/Survey/",
        ]),
        navTree: [
            {
                text: "ModdingDeveloping",
                link: "/ModdingDeveloping/Catalogue",
                items: [
                    {
                        text: "Catalogue",
                        link: "/ModdingDeveloping/Catalogue",
                    },
                    {
                        text: "Design",
                        link: "/ModdingDeveloping/Design/Catalogue",
                        items: [
                            {
                                text: "Catalogue",
                                link: "/ModdingDeveloping/Design/Catalogue",
                            },
                            {
                                text: "Survey",
                                link: "/ModdingDeveloping/Design/Survey",
                            },
                        ],
                    },
                ],
            },
        ],
        resolveLinkPath: (path) => {
            if (path === "/zh-CN/ModdingDeveloping/") {
                return "/zh-CN/ModdingDeveloping/Catalogue";
            }
            if (path === "/zh-CN/ModdingDeveloping/Design/") {
                return "/zh-CN/ModdingDeveloping/Design/Catalogue";
            }
            return path;
        },
    });

    assert.deepEqual(items, [
        { text: "Home", link: "/zh-CN/" },
        {
            text: "ModdingDeveloping",
            link: "/zh-CN/ModdingDeveloping/Catalogue/",
        },
        {
            text: "Design",
            link: "/zh-CN/ModdingDeveloping/Design/Catalogue/",
        },
        { text: "Survey", link: "/zh-CN/ModdingDeveloping/Design/Survey/" },
    ]);
});

test("resolveBaseAwareHref applies site base only to internal links", () => {
    const applyBase = (value: string) => `/M1honoVitepressTemplate${value}`;

    assert.equal(
        resolveBaseAwareHref("/downloads", applyBase),
        "/M1honoVitepressTemplate/downloads",
    );
    assert.equal(
        resolveBaseAwareHref("https://vitepress.dev", applyBase),
        "https://vitepress.dev",
    );
});
