import test from "node:test";
import assert from "node:assert/strict";
import type {
    EffectiveDirConfig,
    SidebarUseChildrenCollapsedConfig,
} from "../types";
import {
    createChildTreeContext,
    normalizeUseChildrenCollapsed,
    resolveDisplayedCollapsedState,
} from "./useChildrenCollapsed";

function createConfig(
    overrides: Partial<EffectiveDirConfig> & {
        useChildrenCollapsed?: SidebarUseChildrenCollapsedConfig;
    } = {},
): EffectiveDirConfig {
    return {
        root: overrides.root ?? false,
        title: overrides.title ?? "Test",
        hidden: overrides.hidden ?? false,
        priority: overrides.priority ?? 0,
        maxDepth: overrides.maxDepth ?? 0,
        collapsed: overrides.collapsed ?? false,
        groups: overrides.groups ?? [],
        externalLinks: overrides.externalLinks ?? [],
        useChildrenCollapsed: normalizeUseChildrenCollapsed(
            overrides.useChildrenCollapsed,
        ),
        path: overrides.path ?? "/tmp/test",
        lang: overrides.lang ?? "zh",
        isDevMode: overrides.isDevMode ?? false,
        _baseRelativePathForChildren:
            overrides._baseRelativePathForChildren ?? "",
        _disableRootFlatten: overrides._disableRootFlatten ?? false,
        _activeMaxDepth: overrides._activeMaxDepth,
        _activeChildrenCollapsed: overrides._activeChildrenCollapsed,
    };
}

test("mode=self uses the current directory collapsed value for direct children", () => {
    const parent = createConfig({
        collapsed: true,
        useChildrenCollapsed: { mode: "self", depth: 1 },
    });
    const child = createConfig({ collapsed: false });

    assert.equal(resolveDisplayedCollapsedState(parent, child), true);
});

test("mode=open with depth=2 keeps working for grandchildren", () => {
    const parent = createConfig({
        useChildrenCollapsed: { mode: "open", depth: 2 },
    });
    const child = createConfig({ collapsed: true });
    const childTree = createChildTreeContext(parent, child, 0);
    const grandchild = createConfig({ collapsed: true });

    assert.equal(resolveDisplayedCollapsedState(parent, child), false);
    assert.equal(
        resolveDisplayedCollapsedState(childTree.nextConfig, grandchild),
        false,
    );
});

test("nearest descendant rule replaces the inherited rule for its subtree", () => {
    const parent = createConfig({
        collapsed: true,
        useChildrenCollapsed: { mode: "self", depth: 2 },
    });
    const child = createConfig({
        collapsed: false,
        useChildrenCollapsed: { mode: "children", depth: 1 },
    });
    const childTree = createChildTreeContext(parent, child, 0);
    const grandchild = createConfig({ collapsed: false });

    assert.equal(resolveDisplayedCollapsedState(parent, child), true);
    assert.equal(
        resolveDisplayedCollapsedState(childTree.nextConfig, grandchild),
        false,
    );
});

test("root views keep the active maxDepth budget for descendants", () => {
    const parent = createConfig({
        root: true,
        maxDepth: 1,
        _activeMaxDepth: 1,
    });
    const child = createConfig({
        root: true,
        maxDepth: 4,
        collapsed: true,
    });

    const result = createChildTreeContext(parent, child, 0);

    assert.equal(result.canRecurse, true);
    assert.equal(result.nextDepth, 1);
    assert.equal(result.nextConfig.maxDepth, 4);
    assert.equal(result.nextConfig._activeMaxDepth, 1);
    assert.equal(result.nextConfig._disableRootFlatten, false);
});

test("non-root views let direct children restart the local depth budget", () => {
    const parent = createConfig({
        root: false,
        maxDepth: 1,
    });
    const child = createConfig({
        root: true,
        maxDepth: 2,
    });

    const result = createChildTreeContext(parent, child, 0);

    assert.equal(result.canRecurse, true);
    assert.equal(result.nextDepth, 0);
    assert.equal(result.nextConfig._activeMaxDepth, 2);
    assert.equal(result.nextConfig._disableRootFlatten, true);
});
