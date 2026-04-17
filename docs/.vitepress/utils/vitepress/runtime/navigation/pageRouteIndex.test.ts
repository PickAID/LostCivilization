import test from "node:test";
import assert from "node:assert/strict";
import { buildKnownPagePathSetFromSidebar } from "./pageRouteIndex";

test("buildKnownPagePathSetFromSidebar supports resolved sidebar arrays", () => {
    const routes = buildKnownPagePathSetFromSidebar([
        {
            text: "KubeJS-1.20.1",
            items: [
                {
                    text: "须知",
                    link: "/zh/modpack/kubejs/1.20.1/Catalogue",
                },
                {
                    text: "起步",
                    link: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
                    items: [
                        {
                            text: "什么是KubeJS",
                            link: "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue",
                        },
                    ],
                },
            ],
        },
    ]);

    assert.deepEqual(
        [...routes].sort(),
        [
            "/zh/modpack/kubejs/1.20.1/Catalogue/",
            "/zh/modpack/kubejs/1.20.1/GettingStart/Catalogue/",
        ],
    );
});
