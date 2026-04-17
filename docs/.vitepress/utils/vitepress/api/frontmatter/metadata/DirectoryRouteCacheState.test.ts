import test from "node:test";
import assert from "node:assert/strict";
import {
    resolveDirectoryLandingPathFromCache,
    resolveDirectoryTitleFromCache,
    setDirectoryRouteCache,
    stripDirectoryLandingPathFromCache,
} from "./DirectoryRouteCacheState";

test("directory route cache resolves titles and landing paths", () => {
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
            },
        },
    });

    assert.equal(
        resolveDirectoryLandingPathFromCache("/zh/modpack/kubejs/1.20.1/"),
        "/zh/modpack/kubejs/1.20.1/Catalogue",
    );
    assert.equal(
        resolveDirectoryTitleFromCache("/zh/modpack/kubejs/1.20.1/GettingStart/"),
        "起步",
    );
    assert.equal(
        stripDirectoryLandingPathFromCache(
            "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
        ),
        "/zh/modpack/kubejs/1.20.1/GettingStart",
    );

    setDirectoryRouteCache({});
});
