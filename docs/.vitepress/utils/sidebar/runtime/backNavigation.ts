import {
    resolveDirectoryLandingAwarePath,
    stripDirectoryLandingPath,
} from "../shared/directoryLandingRouteResolver";

type SpecialBackPath = {
    regex: string;
    targetPath: string;
};

function normalizePath(path: string) {
    return resolveDirectoryLandingAwarePath(path);
}

function buildParentPath(path: string) {
    const resolvedPath = stripDirectoryLandingPath(normalizePath(path));
    const segments = resolvedPath.split("/").filter(Boolean);
    if (segments.length <= 1) return "/";

    segments.pop();
    return normalizePath(`/${segments.join("/")}`);
}

export function resolveBackNavigationTarget(options: {
    configuredBackPath?: string;
    currentHref: string;
    currentPath: string;
    specialBackPaths: SpecialBackPath[];
}) {
    const {
        configuredBackPath,
        currentHref,
        currentPath,
        specialBackPaths,
    } = options;

    if (configuredBackPath) {
        return normalizePath(new URL(configuredBackPath, currentHref).pathname);
    }

    const normalizedCurrentPath = normalizePath(currentPath);

    for (const { regex, targetPath } of specialBackPaths) {
        const match = normalizedCurrentPath.match(new RegExp(regex));
        if (!match) continue;

        const resolvedTargetPath = normalizePath(
            targetPath.replace(/{(\d+)}/g, (_, n) => match[Number.parseInt(n)]),
        );
        if (resolvedTargetPath !== normalizedCurrentPath) {
            return resolvedTargetPath;
        }
    }

    return buildParentPath(normalizedCurrentPath);
}
