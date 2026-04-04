import { watch } from "vue";
import { Ref } from "vue";
import { ThemeRuntimeController } from "./ThemeRuntimeController";
import { ThemeStateStore } from "./ThemeStateStore";

export class ThemeLifecycleManager {
    private store: ThemeStateStore | null = null;
    private controller: ThemeRuntimeController | null = null;
    private stopReactiveWatch: (() => void) | null = null;
    private mountedUsers = 0;

    private ensureController(isDark: Ref<boolean>) {
        if (!this.store || !this.controller) {
            this.store = new ThemeStateStore(isDark);
            this.controller = new ThemeRuntimeController(this.store);
            this.stopReactiveWatch = watch(
                this.store.reactiveDark,
                () => {
                    this.controller?.syncFromReactiveDark();
                },
                { flush: "post" },
            );
            return this.controller;
        }

        this.store.setReactiveDarkSource(isDark);
        return this.controller;
    }

    getState(isDark: Ref<boolean>) {
        return this.ensureController(isDark).getState();
    }

    mount(isDark: Ref<boolean>) {
        const controller = this.ensureController(isDark);
        this.mountedUsers += 1;

        if (this.mountedUsers === 1) {
            controller.mount();
        } else {
            controller.syncFromReactiveDark();
        }
    }

    unmount() {
        this.mountedUsers = Math.max(0, this.mountedUsers - 1);

        if (this.mountedUsers > 0) {
            return;
        }

        this.controller?.unmount();
        this.stopReactiveWatch?.();
        this.stopReactiveWatch = null;
        this.controller = null;
        this.store = null;
    }
}

let sharedThemeLifecycleManager: ThemeLifecycleManager | null = null;

export function getThemeLifecycleManager() {
    if (!sharedThemeLifecycleManager) {
        sharedThemeLifecycleManager = new ThemeLifecycleManager();
    }

    return sharedThemeLifecycleManager;
}
