import { container } from "@mdit/plugin-container";
import type Token from "markdown-it/lib/token.mjs";
import type MarkdownIt from "markdown-it";

const SHADER_LANGS = new Set(["glsl", "shader", "hlsl", "wgsl"]);

interface ShaderEffectConfig {
    preset?: string;
    speed?: number;
    paused?: boolean;
    vertexShader?: string;
    fragmentShader?: string;
}

function escapeAttr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function parseShaderEffectConfig(raw: string): ShaderEffectConfig {
    const info = raw.trim();
    if (!info || !info.startsWith("{")) return {};
    try {
        const parsed = JSON.parse(info);
        return typeof parsed === "object" && parsed ? parsed : {};
    } catch (error) {
        console.warn("[shader-effect] Invalid JSON config:", info, error);
        return {};
    }
}

function findContainerCloseIndex(tokens: Token[], openIndex: number): number {
    const openType = tokens[openIndex]?.type;
    const closeType = openType?.replace("_open", "_close");
    if (!openType || !closeType) return -1;
    let depth = 1;
    for (let i = openIndex + 1; i < tokens.length; i++) {
        if (tokens[i].type === openType) depth += 1;
        if (tokens[i].type === closeType) {
            depth -= 1;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function extractShaderSources(
    tokens: Token[],
    openIndex: number,
    closeIndex: number,
): Pick<ShaderEffectConfig, "vertexShader" | "fragmentShader"> {
    const blocks: string[] = [];
    for (let i = openIndex + 1; i < closeIndex; i++) {
        const token = tokens[i];
        if (token.type !== "fence") continue;
        const lang = (token.info || "")
            .trim()
            .split(/\s+/)[0]
            ?.toLowerCase();
        if (lang && !SHADER_LANGS.has(lang)) continue;
        blocks.push(token.content || "");
    }
    if (blocks.length >= 2) {
        return {
            vertexShader: blocks[0],
            fragmentShader: blocks[1],
        };
    }
    if (blocks.length === 1) {
        return { fragmentShader: blocks[0] };
    }
    return {};
}

function renderShaderEffectProps(config: ShaderEffectConfig): string {
    let props = "";
    if (config.preset) {
        props += ` preset="${escapeAttr(config.preset)}"`;
    }
    if (typeof config.speed === "number" && Number.isFinite(config.speed)) {
        props += ` :speed="${config.speed}"`;
    }
    if (typeof config.paused === "boolean") {
        props += ` :paused="${config.paused}"`;
    }
    if (config.vertexShader) {
        props += ` vertex-shader="${escapeAttr(config.vertexShader)}"`;
    }
    if (config.fragmentShader) {
        props += ` fragment-shader="${escapeAttr(config.fragmentShader)}"`;
    }
    return props;
}

export function shaderEffect(md: MarkdownIt): void {
    const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules);
    const defaultCodeInline = md.renderer.rules.code_inline?.bind(
        md.renderer.rules,
    );

    md.use(container, {
        name: "shader-effect",
        validate: (params) => params.trim().startsWith("shader-effect"),
        openRender: (tokens, idx) => {
            const token = tokens[idx];
            const rawInfo = token.info
                .trim()
                .slice("shader-effect".length)
                .trim();
            const config = parseShaderEffectConfig(rawInfo);
            const closeIndex = findContainerCloseIndex(tokens, idx);
            if (closeIndex > idx) {
                const sources = extractShaderSources(tokens, idx, closeIndex);
                Object.assign(config, sources);
                for (let i = idx + 1; i < closeIndex; i++) {
                    tokens[i].hidden = true;
                }
            }
            return `<ShaderEffectBlock${renderShaderEffectProps(config)} />`;
        },
        closeRender: () => "",
    });

    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        if (token.hidden) return "";
        const info = (token.info || "").trim();
        const lang = info.split(/\s+/)[0]?.toLowerCase() || "";

        if (!SHADER_LANGS.has(lang)) {
            return defaultFence
                ? defaultFence(tokens, idx, options, env, self)
                : self.renderToken(tokens, idx, options);
        }

        const escaped = md.utils.escapeHtml(token.content);
        return `<pre class="shader-code" data-lang="${lang}"><code class="language-${lang}">${escaped}</code></pre>`;
    };

    md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const content = token.content || "";

        if (!content.startsWith("shader:")) {
            return defaultCodeInline
                ? defaultCodeInline(tokens, idx, options, env, self)
                : self.renderToken(tokens, idx, options);
        }

        const escaped = md.utils.escapeHtml(
            content.slice("shader:".length).trim(),
        );
        return `<code class="shader-inline">${escaped}</code>`;
    };
}

export default shaderEffect;
