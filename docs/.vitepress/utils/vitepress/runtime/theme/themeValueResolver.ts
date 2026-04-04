export interface ThemeValueRecord<T> {
    light?: T;
    dark?: T;
    value?: T;
}

export interface ThemeSourceRecord {
    src?: string;
    light?: string;
    dark?: string;
}

export function isThemeValueRecord<T>(
    value: unknown,
): value is ThemeValueRecord<T> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
        "light" in candidate || "dark" in candidate || "value" in candidate
    );
}

export function resolveThemeValueByMode<T>(
    value: T | ThemeValueRecord<T> | undefined,
    isDark: boolean,
): T | undefined {
    if (value === undefined || value === null) return undefined;
    if (!isThemeValueRecord<T>(value)) return value as T;

    return isDark ? (value.dark ?? value.value) : (value.light ?? value.value);
}

export function resolveThemeColorByMode(
    value: string | ThemeValueRecord<string> | undefined,
    isDark: boolean,
    fallback: string,
): string {
    return resolveThemeValueByMode(value, isDark) ?? fallback;
}

export function resolveThemeSourceByMode(
    source: ThemeSourceRecord | undefined,
    isDark: boolean,
): string | undefined {
    if (!source) return undefined;
    return isDark ? (source.dark ?? source.src) : (source.light ?? source.src);
}
