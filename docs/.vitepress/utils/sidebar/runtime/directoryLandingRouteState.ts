import { inBrowser } from "vitepress";
import { watch } from "vue";
import { resolveDirectoryLandingCanonicalPath } from "../shared/directoryLandingRouteResolver";

type RouteLike = {
    path: string;
};

type RouterLike = {
    go: (href: string) => Promise<unknown> | unknown;
};

export function useDirectoryLandingRouteSync(
    route: RouteLike,
    router: RouterLike,
) {
    let syncingDirectoryLandingRoute = false;

    watch(
        () => route.path,
        async (path) => {
            if (!inBrowser || syncingDirectoryLandingRoute) return;

            const canonicalPath = resolveDirectoryLandingCanonicalPath(path);
            if (!canonicalPath) return;

            const nextHref = `${canonicalPath}${window.location.search}${window.location.hash}`;
            syncingDirectoryLandingRoute = true;

            try {
                if (window.location.pathname !== canonicalPath) {
                    window.history.replaceState(history.state, "", nextHref);
                }
                await router.go(nextHref);
            } finally {
                syncingDirectoryLandingRoute = false;
            }
        },
        { immediate: true },
    );
}
