import { createTabPlugin, configMappers } from "./tab-plugin-factory";

const escapeAttr = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

const normalizeSrc = (value: unknown) => {
    const src = String(value ?? "").trim();
    if (!src) return "";
    if (src.startsWith("<") && src.endsWith(">")) {
        return src.slice(1, -1).trim();
    }
    return src;
};

export const iframes = createTabPlugin({
    name: "iframes",
    containerComponent: "div",
    tabComponent: "span",

    requiredConfig: ["src"],

    configMapping: {
        height: configMappers.attr("height"),
    },

    containerRenderer: (info, config) => {
        const src = normalizeSrc(config.src);
        if (!src) return "";

        const baseConfig =
            'style="width: 100%; border: none;" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"';
        let iframeConfig = `${baseConfig} src="${escapeAttr(src)}"`;

        if (config.height) {
            iframeConfig += ` height="${escapeAttr(String(config.height))}"`;
        }

        return `<div class="iframe-container"><iframe ${iframeConfig}>`;
    },

    containerCloseRenderer: () => `</iframe></div>`,
});
