import { normalizeMarkdownPageRoute } from "../../runtime/navigation/pageRouteIndex";

const markdownPages = import.meta.glob("../../../../src/**/*.md");

class NavMarkdownRouteIndex {
    private readonly accessibleInternalRoutes: Set<string>;

    constructor(pages: Record<string, unknown>) {
        this.accessibleInternalRoutes = new Set<string>(
            Object.keys(pages).map((filePath) =>
                normalizeMarkdownPageRoute(filePath).replace(/\/$/, "") || "/",
            ),
        );
    }

    hasRoute(path: string) {
        return this.accessibleInternalRoutes.has(path);
    }
}

export class NavLinkAccessService {
    private readonly routeIndex: NavMarkdownRouteIndex;

    constructor(pages: Record<string, unknown> = markdownPages) {
        this.routeIndex = new NavMarkdownRouteIndex(pages);
    }

    isExternalUrl(url: string) {
        return /^(https?:)?\/\//.test(url);
    }

    isAccessibleInternalNavPath(path?: string): boolean {
        if (!path) return false;
        if (this.isExternalUrl(path)) return true;
        if (!path.startsWith("/")) return false;
        return true;
    }

    resolveAccessibleNavHref(link?: string, href?: string): string | undefined {
        if (href) return href;
        if (!link) return undefined;
        if (this.isAccessibleInternalNavPath(link)) return link;
        if (this.isExternalUrl(link) || link.startsWith("/")) return link;
        return link;
    }

    prefixNavLinks<T>(items: T[], basePath: string): T[] {
        if (basePath === "/" || !basePath) return items;
        return items.map((item) => this.prefixSingleNavItem(item, basePath));
    }

    private prefixSingleNavItem<T>(item: T, basePath: string): T {
        const cloned = { ...item } as any;
        cloned.link = this.prefixInternalLink(cloned.link, basePath);

        if (Array.isArray(cloned.dropdown?.panels)) {
            cloned.dropdown = { ...cloned.dropdown };
            cloned.dropdown.panels = cloned.dropdown.panels.map((panel: any) =>
                this.prefixPanelLinks(panel, basePath),
            );
        }
        return cloned;
    }

    private prefixPanelLinks(panel: any, basePath: string) {
        const nextPanel = { ...panel };
        if (nextPanel.featured?.link) {
            nextPanel.featured = {
                ...nextPanel.featured,
                link: this.prefixInternalLink(nextPanel.featured.link, basePath),
            };
        }
        if (Array.isArray(nextPanel.groups)) {
            nextPanel.groups = nextPanel.groups.map((group: any) => ({
                ...group,
                items: this.prefixNavLinks(group.items, basePath),
            }));
        }
        return nextPanel;
    }

    private prefixInternalLink(link: string | undefined, basePath: string) {
        if (!link || !link.startsWith("/")) return link;
        if (this.isExternalUrl(link)) return link;
        if (link.startsWith(basePath)) return link;
        return `${basePath}${link.slice(1)}`;
    }
}

export const navLinkAccessService = new NavLinkAccessService();

export function isAccessibleInternalNavPath(path?: string) {
    return navLinkAccessService.isAccessibleInternalNavPath(path);
}

export function resolveAccessibleNavHref(link?: string, href?: string) {
    return navLinkAccessService.resolveAccessibleNavHref(link, href);
}

export function prefixNavLinks<T>(items: T[], basePath: string): T[] {
    return navLinkAccessService.prefixNavLinks(items, basePath);
}
