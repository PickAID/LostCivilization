import test from "node:test";
import assert from "node:assert/strict";
import {
    fetchBusuanziStats,
    fetchBusuanziPageViews,
    refreshBusuanziPageViews,
} from "./metadataService";

type QueryableDocument = {
    querySelector: (selector: string) => unknown;
    createElement: () => {
        src: string;
        async: boolean;
        onload: (() => void) | null;
        onerror: (() => void) | null;
    };
    body: {
        appendChild: () => void;
    };
};

type WindowLike = {
    bszCaller?: {
        fetch: (
            url: string,
            callback: (payload: Record<string, string | number>) => void,
        ) => void;
    };
    bszTag?: {
        texts: (payload: Record<string, string | number>) => void;
        shows: () => void;
        hides: () => void;
    };
    document: QueryableDocument;
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
};

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

function createScriptElement() {
    return {
        src: "",
        async: false,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
    };
}

function installDom(options: {
    hasTarget: () => boolean;
    onFetch?: () => void;
    onTexts?: (payload: Record<string, string | number>) => void;
    payload?: Record<string, string | number>;
    invokeCallback?: boolean;
}) {
    const documentStub: QueryableDocument = {
        querySelector(selector) {
            if (selector === "#busuanzi_value_page_pv") {
                return options.hasTarget() ? { id: "busuanzi_value_page_pv" } : null;
            }

            if (selector === 'script[src*="busuanzi"]') {
                return null;
            }

            return null;
        },
        createElement: createScriptElement,
        body: {
            appendChild() {},
        },
    };

    const windowStub: WindowLike = {
        bszCaller: {
            fetch: (_url, callback) => {
                options.onFetch?.();

                if (options.invokeCallback === false) {
                    return;
                }

                callback(
                    options.payload ?? {
                        site_pv: 128,
                        page_pv: 42,
                        site_uv: 64,
                    },
                );
            },
        },
        bszTag: {
            texts: (payload) => {
                options.onTexts?.(payload);
            },
            shows() {},
            hides() {},
        },
        document: documentStub,
        setTimeout,
        clearTimeout,
    };

    globalThis.window = windowStub as never;
    globalThis.document = documentStub as never;
}

test.afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
});

test("refreshBusuanziPageViews waits for the page view target before fetching", async () => {
    let fetchCount = 0;
    let targetVisible = false;
    let pageViewValue: string | number | undefined;

    installDom({
        hasTarget: () => targetVisible,
        onFetch: () => {
            fetchCount += 1;
        },
        onTexts: (payload) => {
            pageViewValue = payload.page_pv;
        },
    });

    setTimeout(() => {
        targetVisible = true;
    }, 5);

    const refreshed = await refreshBusuanziPageViews({
        maxAttempts: 20,
        intervalMs: 5,
    });

    assert.equal(refreshed, true);
    assert.equal(fetchCount, 1);
    assert.equal(pageViewValue, 42);
});

test("refreshBusuanziPageViews stops when the target never appears", async () => {
    let fetchCount = 0;

    installDom({
        hasTarget: () => false,
        onFetch: () => {
            fetchCount += 1;
        },
    });

    const refreshed = await refreshBusuanziPageViews({
        maxAttempts: 3,
        intervalMs: 1,
    });

    assert.equal(refreshed, false);
    assert.equal(fetchCount, 0);
});

test("fetchBusuanziPageViews returns the latest page view count without relying on DOM ids", async () => {
    let fetchCount = 0;

    installDom({
        hasTarget: () => false,
        onFetch: () => {
            fetchCount += 1;
        },
    });

    const pageViews = await fetchBusuanziPageViews();

    assert.equal(pageViews, 42);
    assert.equal(fetchCount, 1);
});

test("fetchBusuanziStats returns the full payload for footer counters", async () => {
    installDom({
        hasTarget: () => false,
        onFetch: () => {},
    });

    const stats = await fetchBusuanziStats();

    assert.deepEqual(stats, {
        site_pv: 128,
        page_pv: 42,
        site_uv: 64,
    });
});

test("fetchBusuanziStats returns null when the callback never resolves", async () => {
    let fetchCount = 0;
    const originalWarn = console.warn;

    installDom({
        hasTarget: () => false,
        onFetch: () => {
            fetchCount += 1;
        },
        invokeCallback: false,
    });

    console.warn = () => {};

    try {
        const stats = await fetchBusuanziStats({
            timeoutMs: 10,
        });

        assert.equal(stats, null);
        assert.equal(fetchCount, 1);
    } finally {
        console.warn = originalWarn;
    }
});
