import test from "node:test";
import assert from "node:assert/strict";
import {
    resolveDirectoryLandingAwarePath,
    setDirectoryLandingSidebar,
} from "../../../sidebar/shared/directoryLandingRouteResolver";
import {
    resolveDirectoryLandingPathFromCache,
    resolveDirectoryTitleFromCache,
    setDirectoryRouteCache,
} from "../../api/frontmatter/metadata/DirectoryRouteCacheState";
import { buildBreadcrumbItems } from "./linkResolution";

test("breadcrumb labels fall back to current sidebar labels when nav config has no entry", () => {
    const sidebarTree = [
        {
            text: "KubeJS-1.20.1",
            items: [
                {
                    text: "须知",
                    link: "/zh/modpack/kubejs/1.20.1/Catalogue",
                    _relativePathKey: "Catalogue.md",
                },
                {
                    text: "起步",
                    link: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
                    items: [
                        {
                            text: "什么是KubeJS",
                            link: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
                            _relativePathKey: "Catalogue.md",
                        },
                    ],
                    _isDirectory: true,
                    _relativePathKey: "GettingStart",
                },
            ],
            _isDirectory: true,
            _isRoot: true,
        },
    ];

    setDirectoryLandingSidebar(sidebarTree);

    const breadcrumbs = buildBreadcrumbItems({
        routePath: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
        homeLink: "/zh/",
        homeText: "首页",
        pageTitle: "什么是KubeJS",
        knownPagePaths: [
            "/zh/modpack/kubejs/1.20.1/Catalogue",
            "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
        ],
        navTree: [
            {
                text: "1.20.1",
                link: "/modpack/kubejs/1.20.1/Catalogue",
            },
            ...sidebarTree,
        ],
        localeCodes: ["zh"],
        resolveLinkPath: resolveDirectoryLandingAwarePath,
    });

    const versionCrumb = breadcrumbs.find(
        (item) => item.link === "/zh/modpack/kubejs/1.20.1/Catalogue/",
    );
    const gettingStartCrumb = breadcrumbs.find(
        (item) =>
            item.link ===
            "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue/",
    );
    const currentPageCrumb = breadcrumbs[breadcrumbs.length - 1];

    assert.equal(versionCrumb?.text, "1.20.1");
    assert.equal(gettingStartCrumb?.text, "起步");
    assert.equal(currentPageCrumb?.text, "什么是KubeJS");
});

test("breadcrumb directory items prefer directory route cache for labels and landing links", () => {
    setDirectoryRouteCache({
        zh: {
            "/zh/modpack/kubejs/1.20.1/": {
                title: "KubeJS-1.20.1",
                landingPath: "/zh/modpack/kubejs/1.20.1/Catalogue",
                isRoot: true,
            },
            "/zh/modpack/kubejs/1.20.1/GettingStart/": {
                title: "起步",
                landingPath: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
                isRoot: false,
            },
        },
    });

    const breadcrumbs = buildBreadcrumbItems({
        routePath: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
        homeLink: "/zh/",
        homeText: "首页",
        pageTitle: "须知",
        knownPagePaths: [
            "/zh/modpack/kubejs/1.20.1/Catalogue",
            "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
        ],
        navTree: [
            {
                text: "KubeJS",
                link: "/modpack/kubejs/Catalogue",
            },
        ],
        localeCodes: ["zh"],
        resolveLinkPath: resolveDirectoryLandingAwarePath,
        resolveItemLink: (path, fallbackLink, isLast) => {
            if (isLast) {
                return undefined;
            }

            return (
                fallbackLink ??
                resolveDirectoryLandingPathFromCache(path) ??
                undefined
            );
        },
        resolveItemText: (path, fallbackText, isLast) => {
            if (isLast) {
                return fallbackText;
            }

            return resolveDirectoryTitleFromCache(path) ?? fallbackText;
        },
    });

    const versionCrumb = breadcrumbs.find(
        (item) => item.link === "/zh/modpack/kubejs/1.20.1/Catalogue/",
    );
    const gettingStartCrumb = breadcrumbs.find(
        (item) =>
            item.link ===
            "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue/",
    );
    const currentPageCrumb = breadcrumbs[breadcrumbs.length - 1];

    assert.equal(versionCrumb?.text, "1.20.1");
    assert.equal(gettingStartCrumb?.text, "起步");
    assert.equal(currentPageCrumb?.text, "须知");

    setDirectoryRouteCache({});
});
