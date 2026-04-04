import type MarkdownIt from "markdown-it";
import { ref, watchEffect } from "vue";

const fetchCache = new Map<string, Promise<unknown>>();
const resolvedFetchCache = new Map<string, unknown>();
const FETCH_PATTERN = /\{fetch:([^}]+)\}/g;
const CAN_RESOLVE_DYNAMIC_FETCH = typeof window !== "undefined" && typeof fetch === "function";

export function decodeEscapedText(value?: string | null): string {
    return String(value ?? "")
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n");
}

export function decodeEscapedTextDeep<T>(value: T): T {
    if (typeof value === "string") {
        return decodeEscapedText(value) as T;
    }
    if (Array.isArray(value)) {
        return value.map((item) => decodeEscapedTextDeep(item)) as T;
    }
    if (value && typeof value === "object") {
        const next: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
            next[key] = decodeEscapedTextDeep(item);
        });
        return next as T;
    }
    return value;
}

export async function resolveDynamicText(value?: string | null): Promise<string> {
    const base = decodeEscapedText(value);
    if (!base || !FETCH_PATTERN.test(base)) {
        FETCH_PATTERN.lastIndex = 0;
        return base;
    }
    if (!CAN_RESOLVE_DYNAMIC_FETCH) {
        FETCH_PATTERN.lastIndex = 0;
        return base;
    }
    FETCH_PATTERN.lastIndex = 0;
    const matches = Array.from(base.matchAll(FETCH_PATTERN));
    const replacements = await Promise.all(matches.map(async (match) => {
        const token = match[0];
        const spec = match[1] || "";
        try {
            return [token, await resolveFetchToken(spec)] as const;
        } catch {
            return [token, ""] as const;
        }
    }));

    let output = base;
    replacements.forEach(([token, resolved]) => {
        output = output.replace(token, resolved);
    });
    return output;
}

export function resolveDynamicTextFromCache(value?: string | null): string {
    const base = decodeEscapedText(value);
    if (!base || !FETCH_PATTERN.test(base)) {
        FETCH_PATTERN.lastIndex = 0;
        return base;
    }
    FETCH_PATTERN.lastIndex = 0;
    return base.replace(FETCH_PATTERN, (_, spec: string) => resolveFetchTokenFromCache(spec));
}

export async function resolveDynamicValueDeep<T>(value: T): Promise<T> {
    if (typeof value === "string") {
        return (await resolveDynamicText(value)) as T;
    }
    if (Array.isArray(value)) {
        const next = await Promise.all(value.map((item) => resolveDynamicValueDeep(item)));
        return next as T;
    }
    if (value && typeof value === "object") {
        const entries = await Promise.all(
            Object.entries(value as Record<string, unknown>).map(async ([key, item]) => {
                return [key, await resolveDynamicValueDeep(item)] as const;
            }),
        );
        return Object.fromEntries(entries) as T;
    }
    return value;
}

export function useResolvedText(source: () => string | undefined | null) {
    const resolved = ref(decodeEscapedText(source()));

    watchEffect((onCleanup) => {
        let cancelled = false;
        const raw = source();
        resolved.value = decodeEscapedText(raw);
        resolveDynamicText(raw).then((next) => {
            if (!cancelled) resolved.value = next;
        });
        onCleanup(() => {
            cancelled = true;
        });
    });

    return resolved;
}

export function useResolvedInlineMarkdown(
    source: () => string | undefined | null,
    md: MarkdownIt,
) {
    const rendered = ref(renderInlineMarkdown(decodeEscapedText(source()), md));

    watchEffect((onCleanup) => {
        let cancelled = false;
        const raw = source();
        rendered.value = renderInlineMarkdown(decodeEscapedText(raw), md);
        resolveDynamicText(raw).then((next) => {
            if (!cancelled) {
                rendered.value = renderInlineMarkdown(next, md);
            }
        });
        onCleanup(() => {
            cancelled = true;
        });
    });

    return rendered;
}

function renderInlineMarkdown(value: string, md: MarkdownIt): string {
    if (!value) return "";
    return md.renderInline(value.replace(/\n/g, "<br />")).trim();
}

async function resolveFetchToken(spec: string): Promise<string> {
    const [rawUrlPart, fallbackPathPart, fallbackValuePart] = splitFetchSpec(spec);
    const [urlPart, hashPathPart] = splitUrlAndHashPath(rawUrlPart?.trim() || "");
    const pathPart = fallbackPathPart || hashPathPart;
    const fallbackPart = fallbackValuePart;
    const url = urlPart?.trim();
    if (!url) return fallbackPart || "";
    const payload = await fetchJson(url);
    const target = pathPart ? readPath(payload, pathPart.trim()) : payload;
    if (target == null || target === "") {
        return fallbackPart || "";
    }
    return stringifyValue(target);
}

async function fetchJson(url: string): Promise<unknown> {
    if (!fetchCache.has(url)) {
        fetchCache.set(
            url,
            fetch(url).then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                const payload = await response.json();
                resolvedFetchCache.set(url, payload);
                return payload;
            }),
        );
    }
    return fetchCache.get(url)!;
}

function resolveFetchTokenFromCache(spec: string): string {
    const [rawUrlPart, fallbackPathPart, fallbackValuePart] = splitFetchSpec(spec);
    const [urlPart, hashPathPart] = splitUrlAndHashPath(rawUrlPart?.trim() || "");
    const pathPart = fallbackPathPart || hashPathPart;
    const fallbackPart = fallbackValuePart;
    const url = urlPart?.trim();
    if (!url) return fallbackPart || "";
    if (!resolvedFetchCache.has(url)) return fallbackPart || `{fetch:${spec}}`;
    const payload = resolvedFetchCache.get(url);
    const target = pathPart ? readPath(payload, pathPart.trim()) : payload;
    if (target == null || target === "") {
        return fallbackPart || "";
    }
    return stringifyValue(target);
}

function splitFetchSpec(spec: string): string[] {
    const parts: string[] = [];
    let current = "";
    let escaped = false;
    for (const char of spec) {
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        if (char === "|") {
            parts.push(current.trim());
            current = "";
            continue;
        }
        current += char;
    }
    parts.push(current.trim());
    return parts;
}

function splitUrlAndHashPath(rawUrl: string): [string, string] {
    const hashIndex = rawUrl.indexOf("#");
    if (hashIndex === -1) return [rawUrl, ""];
    return [rawUrl.slice(0, hashIndex), rawUrl.slice(hashIndex + 1)];
}

function readPath(source: unknown, path: string): unknown {
    if (!path) return source;
    const segments = path.match(/[^.[\]]+|\[(\d+)\]/g) || [];
    return segments.reduce<unknown>((current, segment) => {
        if (current == null) return undefined;
        const key = segment.startsWith("[") ? Number(segment.slice(1, -1)) : segment;
        if (Array.isArray(current) && typeof key === "number") {
            return current[key];
        }
        if (typeof current === "object") {
            return (current as Record<string, unknown>)[String(key)];
        }
        return undefined;
    }, source);
}

function stringifyValue(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
}
