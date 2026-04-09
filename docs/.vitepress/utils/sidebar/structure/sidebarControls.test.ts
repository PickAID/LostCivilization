import test from "node:test";
import assert from "node:assert/strict";
import type {
    EffectiveDirConfig,
    SidebarCollapseControlConfig,
    SidebarViewControlConfig,
} from "../types";
import { normalizeViewControl, resolveChildViewTransition } from "./viewControl";
import {
    normalizeCollapseControl,
    resolveChildCollapsedState,
} from "./collapseControl";

function createConfig(
    overrides: Partial<EffectiveDirConfig> & {
        viewControl?: SidebarViewControlConfig;
        collapseControl?: SidebarCollapseControlConfig;
    } = {},
): EffectiveDirConfig {
    const root = overrides.root ?? false;
    return {
        root,
        title: overrides.title ?? "Test",
        hidden: overrides.hidden ?? false,
        priority: overrides.priority ?? 0,
        maxDepth: overrides.maxDepth ?? 0,
        collapsed: overrides.collapsed ?? false,
        itemOrder: overrides.itemOrder ?? {},
        groups: overrides.groups ?? [],
        externalLinks: overrides.externalLinks ?? [],
        viewControl: normalizeViewControl(
            overrides.viewControl,
            root ? "self" : "all",
        ),
        collapseControl: normalizeCollapseControl(overrides.collapseControl),
        path: overrides.path ?? "/tmp/test",
        lang: overrides.lang ?? "zh",
        isDevMode: overrides.isDevMode ?? false,
        _baseRelativePathForChildren:
            overrides._baseRelativePathForChildren ?? "",
        _controlRelativePath: overrides._controlRelativePath ?? "",
        _disableRootFlatten: overrides._disableRootFlatten ?? false,
        _controllerMaxDepth: overrides._controllerMaxDepth,
        _controllerViewControl: overrides._controllerViewControl,
    };
}

test(
    "parent-controlled child root keeps its own local config while inheriting active controller state",
    () => {
        const parent = createConfig({
            root: true,
            maxDepth: 1,
            viewControl: { mode: "self" },
            _controllerMaxDepth: 1,
            _controllerViewControl: normalizeViewControl({ mode: "self" }, "self"),
        });
        const childRoot = createConfig({
            root: true,
            maxDepth: 4,
            viewControl: { mode: "roots" },
            collapsed: true,
        });

        const result = resolveChildViewTransition(
            parent,
            childRoot,
            "Neoforge",
            0,
        );

        assert.equal(result.parentControlsChild, true);
        assert.equal(result.canRecurse, true);
        assert.equal(result.nextDepth, 1);
        assert.equal(result.nextConfig.maxDepth, 4);
        assert.equal(result.nextConfig.viewControl.mode, "roots");
        assert.equal(result.nextConfig._controllerMaxDepth, 1);
        assert.equal(result.nextConfig._controllerViewControl?.mode, "self");
    },
);

test("child root taking control resets the active controller to its own config", () => {
    const parent = createConfig({
        root: true,
        maxDepth: 1,
        viewControl: { mode: "roots" },
        _controllerMaxDepth: 1,
        _controllerViewControl: normalizeViewControl({ mode: "roots" }, "self"),
    });
    const childRoot = createConfig({
        root: true,
        maxDepth: 2,
        viewControl: { mode: "children" },
    });

    const result = resolveChildViewTransition(parent, childRoot, "Neoforge", 0);

    assert.equal(result.parentControlsChild, false);
    assert.equal(result.canRecurse, true);
    assert.equal(result.nextDepth, 0);
    assert.equal(result.nextConfig.maxDepth, 2);
    assert.equal(result.nextConfig.viewControl.mode, "children");
    assert.equal(result.nextConfig._controllerMaxDepth, 2);
    assert.equal(result.nextConfig._controllerViewControl?.mode, "children");
    assert.equal(result.nextConfig._disableRootFlatten, true);
    assert.equal(result.nextConfig._controlRelativePath, "");
});

test("collapse control applies a parent default and allows path overrides", () => {
    const parent = createConfig({
        root: true,
        collapsed: false,
        collapseControl: {
            default: true,
            paths: {
                "Introduction/Neoforge": false,
            },
        },
    });
    const child = createConfig({
        root: true,
        collapsed: false,
    });

    assert.equal(
        resolveChildCollapsedState(parent, child, "Mixin"),
        true,
    );

    const nestedParent = createConfig({
        ...parent,
        _baseRelativePathForChildren: "Introduction/",
    });

    assert.equal(
        resolveChildCollapsedState(nestedParent, child, "Neoforge"),
        false,
    );
});
