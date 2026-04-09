import test from "node:test";
import assert from "node:assert/strict";
import type { SidebarItem } from "../types";
import { isFlattenedRootWrapper } from "./RecursiveSynchronizer";

test("link-only child root is not treated as a flattened root wrapper", () => {
    const items: SidebarItem[] = [
        {
            text: "冠军再续",
            link: "/zh/mods/adventure/Champions-Unofficial/Catalogue",
            items: [],
            _isDirectory: true,
            _isRoot: true,
            _relativePathKey: "Champions-Unofficial/",
        },
    ];

    assert.equal(isFlattenedRootWrapper(items), false);
});

test("single root wrapper with children is treated as flattened", () => {
    const items: SidebarItem[] = [
        {
            text: "冒险模组",
            items: [
                {
                    text: "冠军再续",
                    link: "/zh/mods/adventure/Champions-Unofficial/Catalogue",
                    _isDirectory: true,
                    _isRoot: true,
                    _relativePathKey: "Champions-Unofficial/",
                },
            ],
            _isDirectory: true,
            _isRoot: true,
        },
    ];

    assert.equal(isFlattenedRootWrapper(items), true);
});
