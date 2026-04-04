declare module "vitepress/dist/client/theme-default/composables/outline" {
    import type { DefaultTheme } from "vitepress/theme";
    export function resolveTitle(theme: any): string;
    export function getHeaders(range: any): any[];
    export function useActiveAnchor(container: any, marker: any): void;
}

declare module "vitepress/dist/client/theme-default/composables/local-nav" {
    import type { Ref } from "vue";
    export function useLocalNav(): {
        headers: Ref<any[]>;
        hasLocalNav: Ref<boolean>;
    };
}

declare module "vitepress/dist/client/theme-default/composables/sidebar" {
    import type { Ref } from "vue";
    export function useSidebar(): {
        isOpen: Ref<boolean>;
        sidebar: Ref<any[]>;
        sidebarGroups: Ref<any[]>;
        hasSidebar: Ref<boolean>;
        hasAside: Ref<boolean>;
        leftAside: Ref<boolean>;
        isSidebarEnabled: Ref<boolean>;
        open: () => void;
        close: () => void;
        toggle: () => void;
    };
}

declare module "vitepress/dist/client/theme-default/components/*" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

declare module "@localSearchIndex" {
    const data: Record<string, () => Promise<any>>;
    export default data;
}

declare global {
    interface Window {
        busuanzi?: {
            fetch: () => void;
        };
    }
}

export {};
