import { ThemeStateStore } from "./ThemeStateStore";

export class ThemeRuntimeController {
    private themeObserver: MutationObserver | null = null;
    private settleRafA: number | null = null;
    private settleRafB: number | null = null;

    constructor(private readonly store: ThemeStateStore) {}

    getState() {
        return {
            effectiveDark: this.store.effectiveDark,
            themeReady: this.store.themeReady,
            version: this.store.version,
        };
    }

    private readDomDark() {
        if (typeof document === "undefined") return null;

        const rootClassList = document.documentElement.classList;
        if (rootClassList.contains("dark")) return true;
        if (rootClassList.contains("light")) return false;

        return null;
    }

    private readStableDark() {
        const domDark = this.readDomDark();
        return domDark ?? this.store.reactiveDark.value;
    }

    private syncStableTheme() {
        this.store.syncStableDark(this.readStableDark());
    }

    private cancelSettleFrames() {
        if (this.settleRafA !== null) {
            window.cancelAnimationFrame(this.settleRafA);
            this.settleRafA = null;
        }

        if (this.settleRafB !== null) {
            window.cancelAnimationFrame(this.settleRafB);
            this.settleRafB = null;
        }
    }

    private scheduleSettle() {
        if (typeof window === "undefined") return;

        this.cancelSettleFrames();
        this.settleRafA = window.requestAnimationFrame(() => {
            this.settleRafA = null;
            this.settleRafB = window.requestAnimationFrame(() => {
                this.settleRafB = null;
                this.syncStableTheme();
                this.store.setFirstPaintSettled(true);
            });
        });
    }

    private startThemeObserver() {
        if (
            typeof document === "undefined" ||
            typeof MutationObserver === "undefined"
        ) {
            return;
        }

        this.themeObserver?.disconnect();
        this.themeObserver = new MutationObserver(() => {
            this.scheduleSettle();
        });
        this.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style"],
        });
    }

    mount() {
        if (typeof window === "undefined") return;

        this.store.setMounted(true);
        this.syncStableTheme();
        this.startThemeObserver();
        this.scheduleSettle();
    }

    syncFromReactiveDark() {
        if (!this.store.clientMounted.value) return;
        this.scheduleSettle();
    }

    unmount() {
        if (typeof window === "undefined") return;

        this.cancelSettleFrames();
        this.themeObserver?.disconnect();
        this.themeObserver = null;
        this.store.resetForClientTeardown();
    }
}
