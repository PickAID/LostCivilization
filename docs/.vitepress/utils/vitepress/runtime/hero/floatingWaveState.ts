import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ComputedRef, Ref } from "vue";
import { HeroActionConfig, HeroFrontmatterConfig, HeroWavesConfig } from "@utils/vitepress/api/frontmatter/hero";

interface SnippetCategoryConfig {
    snippets?: string[];
    enabled?: boolean;
}

export interface HeroFloatingWaveStateOptions {
    heroConfig: ComputedRef<HeroFrontmatterConfig>;
    floatingConfig: ComputedRef<Record<string, any> | undefined>;
    resolvedActions: ComputedRef<HeroActionConfig[] | undefined>;
    resolvedTagline: ComputedRef<string | undefined>;
    resolvedWavesConfig: ComputedRef<HeroWavesConfig>;
    viewportEnabled: ComputedRef<boolean>;
    hasWaves: ComputedRef<boolean>;
    hasImage: ComputedRef<boolean>;
    heroRoot: Ref<HTMLElement | null>;
}

class SnippetWordCollector {
    collect(source: unknown): string[] {
        if (!Array.isArray(source)) return [];
        const words: string[] = [];
        source.forEach((item) => this.collectItem(words, item));
        return Array.from(new Set(words));
    }

    private collectItem(words: string[], item: unknown) {
        if (typeof item === "string") {
            const trimmed = item.trim();
            if (trimmed) words.push(trimmed);
            return;
        }
        if (!item || typeof item !== "object") return;
        const category = item as SnippetCategoryConfig;
        if (category.enabled === false) {
            words.length = 0;
            return;
        }
        if (!Array.isArray(category.snippets)) return;
        category.snippets.forEach((snippet) => {
            if (typeof snippet === "string" && snippet.trim()) {
                words.push(snippet.trim());
            }
        });
    }
}

class HeroWavePriorityController {
    floatingSnippetWords = ref<string[]>([]);
    hideTaglineForWavePriority = ref(false);
    hideActionsForWavePriority = ref(false);
    maxVisibleActionsForWavePriority = ref<number | null>(null);
    hasScrolledFromHeroTop = ref(false);

    private wavePriorityFrame: number | null = null;
    private scrollStateFrame: number | null = null;
    private heroResizeObserver: ResizeObserver | null = null;
    private removeFontsListener: (() => void) | null = null;

    constructor(private readonly options: HeroFloatingWaveStateOptions) {}

    hasFloatingItems = computed(() => {
        if (this.options.floatingConfig.value?.enabled === false) return false;
        const items = this.options.floatingConfig.value?.items;
        return (Array.isArray(items) && items.length > 0) || this.floatingSnippetWords.value.length > 0;
    });

    showScrollArrow = computed(() => {
        const actionsCount = this.options.resolvedActions.value?.length ?? 0;
        const trimmedActions =
            typeof this.maxVisibleActionsForWavePriority.value === "number" &&
            this.maxVisibleActionsForWavePriority.value < actionsCount;
        const hasHiddenContent =
            this.hideTaglineForWavePriority.value || this.hideActionsForWavePriority.value || trimmedActions;
        return this.options.viewportEnabled.value && hasHiddenContent && !this.hasScrolledFromHeroTop.value;
    });

    syncSnippetWords(source: unknown) {
        this.floatingSnippetWords.value = new SnippetWordCollector().collect(source);
    }

    mount() {
        if (typeof window !== "undefined") {
            window.addEventListener("resize", this.queueWavePriorityLayout);
            window.addEventListener("orientationchange", this.queueWavePriorityLayout);
            window.addEventListener("scroll", this.queueScrollStateUpdate, { passive: true });
            window.addEventListener("load", this.queueWavePriorityLayout, { once: true });
        }
        this.setupResizeObserver();
        this.setupFontsListener();
        this.queueWavePriorityLayout();
    }

    unmount() {
        if (typeof window !== "undefined") {
            window.removeEventListener("resize", this.queueWavePriorityLayout);
            window.removeEventListener("orientationchange", this.queueWavePriorityLayout);
            window.removeEventListener("scroll", this.queueScrollStateUpdate);
            this.cancelFrames();
        }
        if (this.heroResizeObserver) this.heroResizeObserver.disconnect();
        this.heroResizeObserver = null;
        if (this.removeFontsListener) this.removeFontsListener();
        this.removeFontsListener = null;
    }

    scrollPastHero() {
        if (typeof window === "undefined") return;
        window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
    }

    queueWavePriorityLayout = () => {
        if (typeof window === "undefined") return;
        if (this.wavePriorityFrame !== null) window.cancelAnimationFrame(this.wavePriorityFrame);
        this.wavePriorityFrame = window.requestAnimationFrame(() => {
            this.wavePriorityFrame = null;
            void this.applyWavePriorityLayout();
        });
    };

    queueScrollStateUpdate = () => {
        if (typeof window === "undefined") return;
        if (this.scrollStateFrame !== null) window.cancelAnimationFrame(this.scrollStateFrame);
        this.scrollStateFrame = window.requestAnimationFrame(() => {
            this.scrollStateFrame = null;
            this.updateScrollState();
        });
    };

    private setupResizeObserver() {
        if (typeof ResizeObserver === "undefined" || !(this.options.heroRoot.value instanceof HTMLElement)) return;
        this.heroResizeObserver = new ResizeObserver(() => this.queueWavePriorityLayout());
        this.heroResizeObserver.observe(this.options.heroRoot.value);
        const container = this.options.heroRoot.value.querySelector(".container") as HTMLElement | null;
        if (container) this.heroResizeObserver.observe(container);
    }

    private setupFontsListener() {
        if (typeof document === "undefined" || !(("fonts" as keyof Document) in document)) return;
        const fontSet = document.fonts;
        const onFontsLoaded = () => this.queueWavePriorityLayout();
        fontSet.ready.then(onFontsLoaded).catch(() => undefined);
        fontSet.addEventListener("loadingdone", onFontsLoaded);
        this.removeFontsListener = () => fontSet.removeEventListener("loadingdone", onFontsLoaded);
    }

    private resetVisibility() {
        this.hideTaglineForWavePriority.value = false;
        this.hideActionsForWavePriority.value = false;
        this.maxVisibleActionsForWavePriority.value = null;
    }

    private cancelFrames() {
        if (typeof window === "undefined") return;
        if (this.wavePriorityFrame !== null) window.cancelAnimationFrame(this.wavePriorityFrame);
        if (this.scrollStateFrame !== null) window.cancelAnimationFrame(this.scrollStateFrame);
        this.wavePriorityFrame = null;
        this.scrollStateFrame = null;
    }

    private resolveWaveReserve() {
        if (typeof window === "undefined") return 120;
        const isMobileLayout = window.innerWidth < 960;
        return Math.max(
            Number(this.options.resolvedWavesConfig.value.height ?? 80) + (isMobileLayout ? 42 : 26),
            isMobileLayout ? 172 : 120,
        );
    }

    private getContainerWaveOverflow(waveReserve: number) {
        if (!this.options.heroRoot.value || typeof window === "undefined") return 0;
        const container = this.options.heroRoot.value.querySelector(".container") as HTMLElement | null;
        if (!container) return 0;
        const containerBottom = container.getBoundingClientRect().bottom;
        const allowedBottom = window.innerHeight - waveReserve;
        return Math.max(0, containerBottom - allowedBottom);
    }

    private async applyWavePriorityLayout() {
        if (!this.options.heroRoot.value || typeof window === "undefined") return;
        this.resetVisibility();
        if (!this.options.hasWaves.value || !this.options.viewportEnabled.value || this.hasScrolledFromHeroTop.value) return;
        await nextTick();
        const waveReserve = this.resolveWaveReserve();
        if (this.getContainerWaveOverflow(waveReserve) <= 0) return;

        const totalActions = this.options.resolvedActions.value?.length ?? 0;
        if (totalActions > 1) {
            this.maxVisibleActionsForWavePriority.value = 1;
            await nextTick();
        }
        if (this.getContainerWaveOverflow(waveReserve) <= 0) return;

        if (totalActions > 0) {
            this.hideActionsForWavePriority.value = true;
            this.maxVisibleActionsForWavePriority.value = 0;
            await nextTick();
        }
        if (this.getContainerWaveOverflow(waveReserve) <= 0) return;

        if (this.options.resolvedTagline.value) {
            this.hideTaglineForWavePriority.value = true;
            await nextTick();
        }
    }

    private updateScrollState() {
        if (typeof window === "undefined") return;
        const nextScrolled = window.scrollY > 10;
        if (nextScrolled === this.hasScrolledFromHeroTop.value) return;
        this.hasScrolledFromHeroTop.value = nextScrolled;
        if (nextScrolled) {
            this.resetVisibility();
            return;
        }
        this.queueWavePriorityLayout();
    }
}

export function createHeroFloatingWaveState(options: HeroFloatingWaveStateOptions) {
    const controller = new HeroWavePriorityController(options);

    watch(
        () => [options.heroConfig.value.snippets, options.floatingConfig.value?.enabled],
        () => controller.syncSnippetWords(options.heroConfig.value.snippets),
        { immediate: true, deep: true },
    );

    watch(
        () => [
            options.viewportEnabled.value,
            options.hasWaves.value,
            controller.hasScrolledFromHeroTop.value,
            options.resolvedTagline.value,
            options.resolvedActions.value?.length ?? 0,
            options.resolvedWavesConfig.value.height,
            options.hasImage.value,
        ],
        () => controller.queueWavePriorityLayout(),
        { flush: "post" },
    );

    onMounted(() => controller.mount());
    onBeforeUnmount(() => controller.unmount());

    return {
        floatingSnippetWords: controller.floatingSnippetWords,
        hasFloatingItems: controller.hasFloatingItems,
        hideTaglineForWavePriority: controller.hideTaglineForWavePriority,
        hideActionsForWavePriority: controller.hideActionsForWavePriority,
        maxVisibleActionsForWavePriority: controller.maxVisibleActionsForWavePriority,
        showScrollArrow: controller.showScrollArrow,
        scrollPastHero: () => controller.scrollPastHero(),
    };
}

