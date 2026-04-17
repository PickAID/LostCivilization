class ReadingTimeService {
    calculateWordTime(wordCount: number, wordsPerMinute = 275) {
        return (wordCount / wordsPerMinute) * 60;
    }

    calculateImageTime(imageCount: number) {
        if (imageCount <= 10) {
            return imageCount * 13 + (imageCount * (imageCount - 1)) / 2;
        }
        return 175 + (imageCount - 10) * 3;
    }

    calculateTotalTime(wordCount: number, imageCount: number, wordsPerMinute = 275) {
        const wordTime = this.calculateWordTime(wordCount, wordsPerMinute);
        const imageTime = this.calculateImageTime(imageCount);
        return Math.ceil((wordTime + imageTime) / 60);
    }
}

class ContentMetadataService {
    analyzeContent(selector = "#VPContent") {
        const container = window.document.querySelector(selector);
        const imgs = container?.querySelectorAll<HTMLImageElement>(".content-container .main img");
        const imageCount = imgs?.length || 0;
        return { wordCount: 0, imageCount };
    }

    cleanupMetadata() {
        document.querySelectorAll(".meta-des").forEach((node) => node.remove());
    }
}

class BusuanziService {
    private pendingInit: Promise<boolean> | null = null;
    private pendingFetch: Promise<Record<string, string | number> | null> | null =
        null;
    private readonly endpoint =
        "//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback";
    private readonly fetchTimeoutMs = 4000;

    private waitForClientApi(maxAttempts = 30, intervalMs = 200) {
        return new Promise<boolean>((resolve) => {
            if (typeof window === "undefined") {
                resolve(false);
                return;
            }

            let attempts = 0;
            const poll = () => {
                if (window.bszCaller?.fetch && window.bszTag?.texts) {
                    resolve(true);
                    return;
                }

                attempts += 1;
                if (attempts >= maxAttempts) {
                    resolve(false);
                    return;
                }

                window.setTimeout(poll, intervalMs);
            };

            poll();
        });
    }

    private waitForTargets(
        selectors: string[],
        maxAttempts = 40,
        intervalMs = 100,
    ) {
        return new Promise<boolean>((resolve) => {
            if (typeof window === "undefined" || typeof document === "undefined") {
                resolve(false);
                return;
            }

            let attempts = 0;
            const poll = () => {
                if (selectors.some((selector) => document.querySelector(selector))) {
                    resolve(true);
                    return;
                }

                attempts += 1;
                if (attempts >= maxAttempts) {
                    resolve(false);
                    return;
                }

                window.setTimeout(poll, intervalMs);
            };

            poll();
        });
    }

    init() {
        if (typeof window === "undefined") {
            return Promise.resolve(false);
        }

        if (window.bszCaller?.fetch && window.bszTag?.texts) {
            return Promise.resolve(true);
        }

        if (this.pendingInit) {
            return this.pendingInit;
        }

        const existing = window.document.querySelector<HTMLScriptElement>(
            'script[src*="busuanzi"]',
        );
        if (existing) {
            this.pendingInit = this.waitForClientApi().finally(() => {
                this.pendingInit = null;
            });
            return this.pendingInit;
        }

        const script = document.createElement("script");
        script.src = "//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
        script.async = true;
        this.pendingInit = new Promise<boolean>((resolve) => {
            script.onload = () => {
                void this.waitForClientApi().then(resolve);
            };
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        }).finally(() => {
            this.pendingInit = null;
        });

        return this.pendingInit;
    }

    private executeFetch(timeoutMs = this.fetchTimeoutMs) {
        if (this.pendingFetch) {
            return this.pendingFetch;
        }

        this.pendingFetch = new Promise<Record<string, string | number> | null>((resolve) => {
            if (!window.bszCaller?.fetch || !window.bszTag?.texts) {
                resolve(null);
                return;
            }

            let settled = false;
            const finalize = (payload: Record<string, string | number> | null) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeoutId);
                resolve(payload);
            };

            const timeoutId = window.setTimeout(() => {
                console.warn("[busuanzi] Stats request timed out.");
                finalize(null);
            }, timeoutMs);

            try {
                window.bszCaller.fetch(this.endpoint, (payload) => {
                    finalize(payload);
                });
            } catch (error) {
                console.warn("[busuanzi] Failed to fetch stats payload.", error);
                finalize(null);
            }
        }).finally(() => {
            this.pendingFetch = null;
        });

        return this.pendingFetch;
    }

    private applyPayload(payload: Record<string, string | number>) {
        try {
            window.bszTag?.texts(payload);
            window.bszTag?.shows?.();
        } catch (error) {
            console.warn("[busuanzi] Failed to apply refreshed stats.", error);
            window.bszTag?.hides?.();
        }
    }

    async fetchStats(
        selectors?: string | string[],
        options?: {
            maxAttempts?: number;
            intervalMs?: number;
            timeoutMs?: number;
        },
    ) {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return null;
        }

        const initialized = await this.init();
        if (initialized === false && !window.bszCaller?.fetch) {
            return null;
        }

        if (selectors) {
            const selectorList = Array.isArray(selectors) ? selectors : [selectors];
            const targetsReady = await this.waitForTargets(
                selectorList,
                options?.maxAttempts,
                options?.intervalMs,
            );
            if (!targetsReady) {
                return null;
            }
        }

        return this.executeFetch(options?.timeoutMs);
    }

    async refresh(
        selectors: string | string[],
        options?: {
            maxAttempts?: number;
            intervalMs?: number;
            timeoutMs?: number;
        },
    ) {
        const payload = await this.fetchStats(
            selectors,
            options,
        );
        if (!payload) {
            return false;
        }

        this.applyPayload(payload);
        return true;
    }

    async fetchPageViews(options?: {
        maxAttempts?: number;
        intervalMs?: number;
        timeoutMs?: number;
    }) {
        const payload = await this.fetchStats(undefined, options);
        return payload?.page_pv ?? null;
    }
}

const readingTimeService = new ReadingTimeService();
const contentMetadataService = new ContentMetadataService();
const busuanziService = new BusuanziService();

export const readingTime = {
    calculateWordTime: (wordCount: number, wordsPerMinute?: number) =>
        readingTimeService.calculateWordTime(wordCount, wordsPerMinute),
    calculateImageTime: (imageCount: number) => readingTimeService.calculateImageTime(imageCount),
    calculateTotalTime: (wordCount: number, imageCount: number, wordsPerMinute?: number) =>
        readingTimeService.calculateTotalTime(wordCount, imageCount, wordsPerMinute),
};

export const contentAnalysis = {
    analyzeContent: (selector?: string) => contentMetadataService.analyzeContent(selector),
    cleanupMetadata: () => contentMetadataService.cleanupMetadata(),
};

export const metadataTranslations: { icons: Record<string, string> } = {
    icons: {
        update: "mdi-refresh",
        wordCount: "mdi-text-shadow",
        readTime: "mdi-timer-outline",
        pageViews: "mdi-eye-outline",
    },
};

export const getMetadataIcon = (key: string): string => metadataTranslations.icons[key] || "";
export const initBusuanzi = (): Promise<boolean> => busuanziService.init();
export const refreshBusuanzi = (
    selectors: string | string[],
    options?: {
        maxAttempts?: number;
        intervalMs?: number;
        timeoutMs?: number;
    },
): Promise<boolean> => busuanziService.refresh(selectors, options);
export const fetchBusuanziStats = (
    options?: {
        maxAttempts?: number;
        intervalMs?: number;
        timeoutMs?: number;
    },
): Promise<Record<string, string | number> | null> =>
    busuanziService.fetchStats(undefined, options);
export const refreshBusuanziPageViews = (options?: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
}): Promise<boolean> =>
    busuanziService.refresh("#busuanzi_value_page_pv", options);
export const fetchBusuanziPageViews = (options?: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
}): Promise<string | number | null> => busuanziService.fetchPageViews(options);
