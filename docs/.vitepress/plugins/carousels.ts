import type { PluginSimple } from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";

const CONTAINER_MARKER = ":::";
const TAB_MARKER = /^@tab(?:\s+.+)?$/;

type CarouselConfig = {
    showArrows?: boolean | "hover";
    arrows?: boolean | "hover";
    cycle?: boolean;
    interval?: number;
    hideDelimiters?: boolean;
    undelimiters?: boolean;
    continuous?: boolean;
    height?: number | string;
};

const escapeAttr = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

function parseCarouselConfig(rawInfo: string): CarouselConfig {
    const rawConfig = rawInfo
        .trim()
        .slice("carousels".length)
        .trim()
        .replace(/^#/, "")
        .trim();

    if (!rawConfig) return {};

    try {
        return JSON.parse(rawConfig) as CarouselConfig;
    } catch (error) {
        console.warn("Failed to parse carousel config:", rawConfig, error);
        return {};
    }
}

function buildCarouselProps(config: CarouselConfig) {
    const aliases: Array<[keyof CarouselConfig, string]> = [
        ["showArrows", "show-arrows"],
        ["arrows", "show-arrows"],
        ["cycle", "cycle"],
        ["interval", "interval"],
        ["hideDelimiters", "hide-delimiters"],
        ["undelimiters", "hide-delimiters"],
        ["continuous", "continuous"],
        ["height", "height"],
    ];

    const seen = new Set<string>();
    const props: string[] = [];

    for (const [sourceKey, targetKey] of aliases) {
        const value = config[sourceKey];
        if (value === undefined || seen.has(targetKey)) continue;
        seen.add(targetKey);

        if (typeof value === "boolean" || typeof value === "number") {
            props.push(` :${targetKey}="${JSON.stringify(value)}"`);
            continue;
        }

        props.push(` ${targetKey}="${escapeAttr(String(value))}"`);
    }

    return props.join("");
}

function splitSlides(rawContent: string) {
    const lines = rawContent.split("\n");
    const slides: string[] = [];
    const current: string[] = [];
    let hasTabMarkers = false;
    let activeFence: string | null = null;

    const pushCurrent = () => {
        const content = current.join("\n").trim();
        if (content) slides.push(content);
        current.length = 0;
    };

    for (const line of lines) {
        const trimmed = line.trim();
        const fenceMatch = trimmed.match(/^(```+|~~~+)/);

        if (fenceMatch) {
            const fence = fenceMatch[1];
            if (!activeFence) {
                activeFence = fence;
            } else if (trimmed.startsWith(activeFence[0].repeat(activeFence.length))) {
                activeFence = null;
            }
        }

        if (!activeFence && TAB_MARKER.test(trimmed)) {
            hasTabMarkers = true;
            pushCurrent();
            continue;
        }

        current.push(line);
    }

    pushCurrent();

    if (!hasTabMarkers) {
        const content = rawContent.trim();
        return content ? [content] : [];
    }

    return slides;
}

function renderCarousel(slides: string[], config: CarouselConfig, md: any, env: any) {
    const props = buildCarouselProps(config);
    const renderedSlides = slides
        .map(
            (slide, index) =>
                `<template #slide-${index}>${md.render(slide, env)}</template>`,
        )
        .join("");

    return `<MdCarousel${props}>${renderedSlides}</MdCarousel>`;
}

const carouselBlockRule = (
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean,
) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    if (start + CONTAINER_MARKER.length > max) return false;
    if (state.src.slice(start, start + CONTAINER_MARKER.length) !== CONTAINER_MARKER) {
        return false;
    }

    const info = state.src
        .slice(start + CONTAINER_MARKER.length, max)
        .trim();

    if (!info.startsWith("carousels")) return false;
    if (silent) return true;

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
        const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
        const lineEnd = state.eMarks[nextLine];
        const line = state.src.slice(lineStart, lineEnd).trim();
        if (line === CONTAINER_MARKER) break;
        nextLine += 1;
    }

    if (nextLine >= endLine) return false;

    const content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], true);
    const slides = splitSlides(content);
    const token = state.push("html_block", "", 0);
    token.content = renderCarousel(
        slides,
        parseCarouselConfig(info),
        state.md,
        state.env,
    );

    state.line = nextLine + 1;
    return true;
};

export const carousels: PluginSimple = (md) => {
    md.block.ruler.before("fence", "carousels", carouselBlockRule, {
        alt: ["paragraph", "reference", "blockquote", "list"],
    });
};
