import {
    EffectiveDirConfig,
    ResolvedSidebarViewControl,
    SidebarViewControlConfig,
} from "../types";

export interface ChildViewTransition {
    parentControlsChild: boolean
    canRecurse: boolean
    nextDepth: number
    nextConfig: EffectiveDirConfig
}

function getActiveMaxDepth(config: EffectiveDirConfig): number {
    return config._controllerMaxDepth ?? config.maxDepth;
}

function getActiveViewControl(config: EffectiveDirConfig): ResolvedSidebarViewControl {
    return config._controllerViewControl ?? config.viewControl;
}

function trimRelativePath(value?: string): string {
    if (!value) {
        return "";
    }

    return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function joinRelativePath(basePath: string | undefined, childPath: string): string {
    const normalizedBase = trimRelativePath(basePath);
    const normalizedChild = trimRelativePath(childPath);

    if (!normalizedBase) {
        return normalizedChild;
    }

    if (!normalizedChild) {
        return normalizedBase;
    }

    return `${normalizedBase}/${normalizedChild}`;
}

function modeLetsChildTakeControl(
    mode: ResolvedSidebarViewControl["mode"],
    isRootDirectory: boolean
): boolean {
    switch (mode) {
        case "self":
            return false;
        case "children":
            return !isRootDirectory;
        case "roots":
            return isRootDirectory;
        case "all":
        default:
            return true;
    }
}

function pathEscapesParentControl(
    parentViewControl: ResolvedSidebarViewControl,
    childControlPath: string
): boolean {
    const normalizedChildPath = trimRelativePath(childControlPath);

    if (!normalizedChildPath) {
        return false;
    }

    return parentViewControl.allow.some((allowedPath) => {
        const normalizedAllowedPath = trimRelativePath(allowedPath);

        return (
            normalizedChildPath === normalizedAllowedPath ||
            normalizedChildPath.startsWith(`${normalizedAllowedPath}/`)
        );
    });
}

export function joinSidebarBaseRelativePath(
    basePath: string | undefined,
    childPath: string
): string {
    const joinedPath = joinRelativePath(basePath, childPath);
    return joinedPath ? `${joinedPath}/` : "";
}

export function normalizeViewControl(
    viewControl: SidebarViewControlConfig | ResolvedSidebarViewControl | undefined,
    fallbackMode: ResolvedSidebarViewControl["mode"] = "all"
): ResolvedSidebarViewControl {
    const rawAllow = viewControl?.allow;
    const allow = Array.isArray(rawAllow)
        ? rawAllow
            .filter((item): item is string => typeof item === "string" && trimRelativePath(item).length > 0)
            .map((item) => trimRelativePath(item))
        : rawAllow && typeof rawAllow === "object"
        ? Object.entries(rawAllow)
            .filter(([key, enabled]) => Boolean(enabled) && trimRelativePath(key).length > 0)
            .map(([key]) => trimRelativePath(key))
        : [];

    return {
        mode: viewControl?.mode ?? fallbackMode,
        allow,
        controlledByParent: viewControl?.controlledByParent,
    };
}

export function resolveChildViewTransition(
    parentViewConfig: EffectiveDirConfig,
    childDirConfig: EffectiveDirConfig,
    itemRelativePathKey: string,
    currentLevelDepth: number
): ChildViewTransition {
    // This resolves ownership for the current generation pass only.
    // A child root that stays under parent control here still keeps its own
    // config and can use it again when generated as the active root later.
    const parentViewControl = getActiveViewControl(parentViewConfig);
    const parentMaxDepth = getActiveMaxDepth(parentViewConfig);
    const childViewControl = childDirConfig.viewControl;
    const childControlPath = joinRelativePath(
        parentViewConfig._controlRelativePath,
        itemRelativePathKey
    );

    let parentControlsChild: boolean;

    if (childViewControl.controlledByParent === true) {
        parentControlsChild = true;
    } else if (childViewControl.controlledByParent === false) {
        parentControlsChild = false;
    } else if (pathEscapesParentControl(parentViewControl, childControlPath)) {
        parentControlsChild = false;
    } else {
        parentControlsChild = !modeLetsChildTakeControl(
            parentViewControl.mode,
            childDirConfig.root
        );
    }

    if (parentControlsChild) {
        return {
            parentControlsChild,
            canRecurse: currentLevelDepth < parentMaxDepth,
            nextDepth: currentLevelDepth + 1,
            nextConfig: {
                ...childDirConfig,
                _controllerMaxDepth: parentMaxDepth,
                _controllerViewControl: parentViewControl,
                _controlRelativePath: childControlPath,
                _disableRootFlatten: parentViewConfig._disableRootFlatten ?? false,
            },
        };
    }

    return {
        parentControlsChild,
        canRecurse: childDirConfig.maxDepth > 0,
        nextDepth: 0,
        nextConfig: {
            ...childDirConfig,
            _controllerMaxDepth: childDirConfig.maxDepth,
            _controllerViewControl: childDirConfig.viewControl,
            _controlRelativePath: "",
            _disableRootFlatten: true,
        },
    };
}
