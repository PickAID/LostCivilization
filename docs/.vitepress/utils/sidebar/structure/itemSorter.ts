/**
 * @fileoverview Item sorting utilities for sidebar generation.
 *
 * This module provides functionality for sorting sidebar items based on
 * priority values and fallback alphabetical ordering. It handles explicit
 * priority assignments declared in markdown/frontmatter.
 *
 * @module ItemSorter
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import { SidebarItem } from '../types';

/**
 * Sorts an array of SidebarItems based on priority values with alphabetical fallback.
 *
 * Recursively sorts nested items to maintain proper hierarchical ordering
 * throughout the sidebar tree.
 *
 * @param {SidebarItem[]} itemsToSort - The array of SidebarItems to sort
 * @returns {SidebarItem[]} A new array of sorted SidebarItems
 * @since 1.0.0
 * @public
 */
export function sortItems(itemsToSort: SidebarItem[]): SidebarItem[] {
    const itemsWithSortInfo = itemsToSort.map(item => ({
        item,
        priority: item._priority ?? 0,
        originalText: item.text || item._relativePathKey || ''
    }));

    itemsWithSortInfo.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }

        return a.originalText.localeCompare(b.originalText);
    });

    return itemsWithSortInfo.map(({ item }) => {
        if (item.items && Array.isArray(item.items)) {
            item.items = sortItems(item.items);
        }

        return item;
    });
}
