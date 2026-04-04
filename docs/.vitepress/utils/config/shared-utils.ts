/**
 * Shared utility functions for configuration modules.
 *
 * @module utils/config/shared-utils
 */

/**
 * Merges multiple locale record objects into a single record.
 * Filters out undefined/null inputs and returns undefined if the result is empty.
 *
 * @param parts - Variable number of locale records to merge
 * @returns Merged record or undefined if empty
 */
export function mergeLocales<T extends Record<string, unknown> | undefined>(
    ...parts: T[]
): Record<string, unknown> | undefined {
    const merged = Object.assign({}, ...parts.filter(Boolean));
    return Object.keys(merged).length > 0 ? merged : undefined;
}