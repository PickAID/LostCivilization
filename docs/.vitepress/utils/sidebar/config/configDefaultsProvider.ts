/**
 * @fileoverview Configuration defaults provider for sidebar generation.
 * 
 * This module provides functionality to apply system defaults to partial
 * configuration objects, ensuring all required fields are present with
 * appropriate fallback values. It resolves final configuration objects
 * from merged partial configurations.
 * 
 * @module ConfigDefaultsProvider
 * @version 1.0.0
 * @author M1hono
 * @since 1.0.0
 */

import path from 'node:path';
import { EffectiveDirConfig, GlobalSidebarConfig, DirectoryConfig, GroupConfig, ExternalLinkConfig } from '../types';
import { normalizeUseChildrenCollapsed } from '../structure/useChildrenCollapsed';

/**
 * @function applyConfigDefaults
 * @description Applies system defaults to a partial configuration object to create a complete EffectiveDirConfig.
 * Resolves all optional fields with appropriate fallback values and ensures the configuration
 * is complete and valid for use throughout the sidebar generation process.
 * 
 * Default values applied:
 * - root: false (unless explicitly set to true)
 * - title: directory name (derived from path)
 * - hidden: false
 * - priority: 0
 * - maxDepth: 3 (or from global defaults)
 * - collapsed: false (or from global defaults)
 * - groups: [] (empty array)
 * - externalLinks: [] (empty array)
 * 
 * @param {Partial<EffectiveDirConfig>} partialConfig - Partial configuration object to complete
 * @param {string} directoryPath - Absolute path to the directory for this configuration
 * @param {string} lang - Language code for this configuration
 * @param {boolean} isDevMode - Whether running in development mode
 * @param {any} [globalDefaults] - Optional global defaults to use as fallbacks
 * @returns {EffectiveDirConfig} Complete configuration object with all required fields resolved
 * @public
 * @example
 * ```typescript
 * const complete = applyConfigDefaults(
 *   { title: "Guide", maxDepth: 2 },
 *   '/docs/en/guide',
 *   'en',
 *   false,
 *   { maxDepth: 3, collapsed: false }
 * );
 * // Returns complete EffectiveDirConfig with title "Guide", maxDepth 2, other defaults applied
 * ```
 */
export function applyConfigDefaults(
    partialConfig: Partial<EffectiveDirConfig>,
    directoryPath: string,
    lang: string,
    isDevMode: boolean,
    globalDefaults?: any
): EffectiveDirConfig {
    const defaults = globalDefaults || {};
    const dirName = path.basename(directoryPath);
    
    const root = partialConfig.root ?? false;
    const title = partialConfig.title ?? dirName;
    const hidden = partialConfig.hidden ?? defaults.hidden ?? false;
    const priority = partialConfig.priority ?? 0;
    const maxDepth = partialConfig.maxDepth ?? defaults.maxDepth ?? 3;
    const collapsed = partialConfig.collapsed ?? defaults.collapsed ?? false;
    const groups = Array.isArray(partialConfig.groups) ? partialConfig.groups : [];
    const externalLinks = Array.isArray(partialConfig.externalLinks) ? partialConfig.externalLinks : [];
    const useChildrenCollapsed = normalizeUseChildrenCollapsed(
        partialConfig.useChildrenCollapsed ?? defaults.useChildrenCollapsed
    );

    return {
        ...partialConfig,
        root,
        title,
        hidden,
        priority,
        maxDepth,
        collapsed,
        groups,
        externalLinks,
        useChildrenCollapsed,
        path: directoryPath,
        lang,
        isDevMode,
    };
} 
