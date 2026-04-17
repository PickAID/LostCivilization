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

    private waitForClientApi(maxAttempts = 30, intervalMs = 200) {
        return new Promise<boolean>((resolve) => {
            if (typeof window === "undefined") {
                resolve(false);
                return;
            }

            let attempts = 0;
            const poll = () => {
                if (window.busuanzi?.fetch) {
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

        if (window.busuanzi?.fetch) {
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
