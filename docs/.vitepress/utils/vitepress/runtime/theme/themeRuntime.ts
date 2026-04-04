import { onMounted, onUnmounted } from "vue";
import { Ref } from "vue";
import { getThemeLifecycleManager } from "./ThemeLifecycleManager";
import { ThemeStateStore } from "./ThemeStateStore";

export function getThemeRuntime(isDark: Ref<boolean>) {
    if (typeof window === "undefined") {
        const store = new ThemeStateStore(isDark);
        return {
            effectiveDark: store.effectiveDark,
            themeReady: store.themeReady,
            version: store.version,
        };
    }

    const lifecycleManager = getThemeLifecycleManager();
    const state = lifecycleManager.getState(isDark);

    onMounted(() => {
        lifecycleManager.mount(isDark);
    });

    onUnmounted(() => {
        lifecycleManager.unmount();
    });

    return state;
}
