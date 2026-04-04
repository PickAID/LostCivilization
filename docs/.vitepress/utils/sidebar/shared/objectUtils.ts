/**
 * Object manipulation utilities for the sidebar generation system.
 */

export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (sources.length > 0 && sources[0]) {
        Object.assign(target, sources[0]);
    }
    return target;
}

export function normalizePathSeparators(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

export function sanitizeTitleForPath(title: string): string {
    if (!title) return 'untitled';

    let sanitized = title.toLowerCase();
    sanitized = sanitized.replace(/[\s/?<>\\:\*\|"\^]/g, '-');
    sanitized = sanitized.replace(/-+/g, '-');
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    return sanitized || 'untitled';
}

export function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1 as Record<string, unknown>);
    const keys2 = Object.keys(obj2 as Record<string, unknown>);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !isDeepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) {
            return false;
        }
    }

    return true;
}