import { withBase } from "vitepress";

const PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

function isDirectPath(value: string): boolean {
    return (
        value.startsWith("#") ||
        value.startsWith("//") ||
        value.startsWith("data:") ||
        value.startsWith("blob:") ||
        value.startsWith("./") ||
        value.startsWith("../") ||
        PROTOCOL_PATTERN.test(value)
    );
}

export function resolveAssetWithBase(path?: string | null): string {
    if (!path) return "";
    const value = path.trim();
    if (!value) return "";
    if (isDirectPath(value)) return value;
    return withBase(value.startsWith("/") ? value : `/${value}`);
}