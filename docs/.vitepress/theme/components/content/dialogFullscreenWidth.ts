export interface DialogFullscreenWidthOptions {
    width?: string | number;
    maxWidth?: string | number;
    hasExplicitWidth?: boolean;
    hasExplicitMaxWidth?: boolean;
    fallbackMaxWidth?: string;
}

function normalizeCssSize(value?: string | number): string | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return `${value}px`;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
}

export function resolveDialogFullscreenShellMaxWidth(
    options: DialogFullscreenWidthOptions,
): string {
    const fallback = options.fallbackMaxWidth?.trim() || "860px";

    if (options.hasExplicitWidth) {
        const width = normalizeCssSize(options.width);
        if (width) return width;
    }

    if (options.hasExplicitMaxWidth) {
        const maxWidth = normalizeCssSize(options.maxWidth);
        if (maxWidth) return maxWidth;
    }

    return fallback;
}
