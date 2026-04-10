import type {
    EffectiveDirConfig,
    ResolvedSidebarUseChildrenCollapsed,
    SidebarUseChildrenCollapsedConfig,
} from "../types";

// 这个项目曾经相当依赖 sidebar JSON config。
// 有了 extension 之后，这一层终于可以退场了。
// 现在 sidebar 的真值留在作者真正维护的 markdown 里。

export interface ChildTreeContext {
    canRecurse: boolean
    nextDepth: number
    nextConfig: EffectiveDirConfig
}

function normalizeRelativePath(value?: string): string {
    if (!value) {
        return "";
    }

    return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function resolveMode(
    mode?: SidebarUseChildrenCollapsedConfig["mode"],
): ResolvedSidebarUseChildrenCollapsed["mode"] {
    switch (mode) {
        case "self":
        case "collapsed":
        case "open":
        case "children":
            return mode;
        default:
            return "children";
    }
}

export function joinSidebarBaseRelativePath(
    basePath: string | undefined,
    childPath: string,
): string {
    const normalizedBase = normalizeRelativePath(basePath);
    const normalizedChild = normalizeRelativePath(childPath);

    if (!normalizedBase) {
        return normalizedChild ? `${normalizedChild}/` : "";
    }

    if (!normalizedChild) {
        return `${normalizedBase}/`;
    }

    return `${normalizedBase}/${normalizedChild}/`;
}

export function normalizeUseChildrenCollapsed(
    config?:
        | SidebarUseChildrenCollapsedConfig
        | ResolvedSidebarUseChildrenCollapsed,
): ResolvedSidebarUseChildrenCollapsed | undefined {
    if (!config) {
        return undefined;
    }

    const rawDepth = Number(config.depth ?? 1);
    const depth =
        Number.isFinite(rawDepth) && rawDepth > 0 ? Math.floor(rawDepth) : 1;

    return {
        mode: resolveMode(config.mode),
        depth,
    };
}

function getActiveChildrenCollapsed(
    config: EffectiveDirConfig,
): ResolvedSidebarUseChildrenCollapsed | undefined {
    return config._activeChildrenCollapsed ?? config.useChildrenCollapsed;
}

export function resolveDisplayedCollapsedState(
    parentConfig: EffectiveDirConfig,
    childConfig: EffectiveDirConfig,
): boolean {
    const activeRule = getActiveChildrenCollapsed(parentConfig);

    if (!activeRule || activeRule.depth <= 0) {
        return childConfig.collapsed;
    }

    switch (activeRule.mode) {
        case "self":
            return parentConfig.collapsed;
        case "collapsed":
            return true;
        case "open":
            return false;
        case "children":
        default:
            return childConfig.collapsed;
    }
}

export function createNextChildrenCollapsedRule(
    parentConfig: EffectiveDirConfig,
    childConfig: EffectiveDirConfig,
): ResolvedSidebarUseChildrenCollapsed | undefined {
    if (childConfig.useChildrenCollapsed) {
        return childConfig.useChildrenCollapsed;
    }

    const activeRule = getActiveChildrenCollapsed(parentConfig);
    if (!activeRule || activeRule.depth <= 1) {
        return undefined;
    }

    return {
        ...activeRule,
        depth: activeRule.depth - 1,
    };
}

export function createChildTreeContext(
    parentConfig: EffectiveDirConfig,
    childConfig: EffectiveDirConfig,
    currentLevelDepth: number,
): ChildTreeContext {
    const inheritedMaxDepth = parentConfig._activeMaxDepth ?? parentConfig.maxDepth;
    const childStartsOwnBudget = currentLevelDepth === 0 && !parentConfig.root;
    const activeMaxDepth = childStartsOwnBudget
        ? childConfig.maxDepth
        : inheritedMaxDepth;

    return {
        canRecurse: childStartsOwnBudget
            ? childConfig.maxDepth > 0
            : currentLevelDepth < inheritedMaxDepth,
        nextDepth: childStartsOwnBudget ? 0 : currentLevelDepth + 1,
        nextConfig: {
            ...childConfig,
            _disableRootFlatten:
                (parentConfig._disableRootFlatten ?? false) || childStartsOwnBudget,
            _activeMaxDepth: activeMaxDepth,
            _activeChildrenCollapsed: createNextChildrenCollapsedRule(
                parentConfig,
                childConfig,
            ),
        },
    };
}
