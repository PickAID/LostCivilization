import test from "node:test";
import assert from "node:assert/strict";
import {
    resolveDirectoryLandingAwarePath,
    resolveDirectoryLandingCanonicalPath,
    setDirectoryLandingSidebar,
} from "./directoryLandingRouteResolver";

test("current sidebar arrays infer their root landing routes from the landing child", () => {
    setDirectoryLandingSidebar([
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
                    _isDirectory: true,
                    _relativePathKey: "GettingStart",
                },
            ],
            _isDirectory: true,
            _isRoot: true,
        },
    ]);

    assert.equal(
        resolveDirectoryLandingCanonicalPath("/zh/modpack/kubejs/1.20.1/"),
        "/zh/modpack/kubejs/1.20.1/Catalogue",
    );
    assert.equal(
        resolveDirectoryLandingAwarePath(
            "/zh/modpack/kubejs/1.20.1/GettingStart/",
        ),
        "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
    );
});
