import { inBrowser } from "vitepress";
import type { Ref } from "vue";
import { watch } from "vue";
import {
    resolveDirectoryLandingCanonicalPath,
    setDirectoryLandingSidebar,
} from "../shared/directoryLandingRouteResolver";

type RouteLike = {
    path: string;
};

type RouterLike = {
    go: (href: string) => Promise<unknown> | unknown;
};

export function useDirectoryLandingRouteSync(
    route: RouteLike,
    router: RouterLike,
    sidebarSource?: Ref<unknown>,
) {
    let syncingDirectoryLandingRoute = false;

    watch(
        () => [route.path, sidebarSource?.value] as const,
        async ([path, sidebar]) => {
            if (!inBrowser || syncingDirectoryLandingRoute) return;
            if (sidebarSource) {
                setDirectoryLandingSidebar(sidebar);
            }

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
