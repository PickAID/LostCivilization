import type {
    EffectiveDirConfig,
    ResolvedSidebarCollapseControl,
    SidebarCollapseControlConfig,
} from "../types";

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

export function normalizeCollapseControl(
    collapseControl?: SidebarCollapseControlConfig | ResolvedSidebarCollapseControl,
): ResolvedSidebarCollapseControl {
    const normalizedPaths: Record<string, boolean> = {};

    if (collapseControl?.paths && typeof collapseControl.paths === "object") {
        for (const [path, collapsed] of Object.entries(collapseControl.paths)) {
            const normalizedPath = trimRelativePath(path);
            if (!normalizedPath || typeof collapsed !== "boolean") {
                continue;
            }

            normalizedPaths[normalizedPath] = collapsed;
        }
    }

    return {
        default:
            typeof collapseControl?.default === "boolean"
                ? collapseControl.default
                : undefined,
        paths: normalizedPaths,
    };
}

export function resolveChildCollapsedState(
    parentConfig: EffectiveDirConfig,
    childConfig: EffectiveDirConfig,
    itemRelativePathKey: string,
): boolean {
    const collapseControl = parentConfig.collapseControl;
    const childPath = joinRelativePath(
        parentConfig._baseRelativePathForChildren,
        itemRelativePathKey,
    );

    if (
        childPath &&
        Object.prototype.hasOwnProperty.call(collapseControl.paths, childPath)
    ) {
        return collapseControl.paths[childPath];
    }

    if (typeof collapseControl.default === "boolean") {
        return collapseControl.default;
    }

    return childConfig.collapsed;
}
