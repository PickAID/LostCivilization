/**
 * Navigation configuration barrel module.
 *
 * @module utils/config/navConfig
 * @description
 * This is an **auto-assembled** barrel file — do **not** edit navigation data
 * here directly. Instead, edit the per-locale files:
 *
 *   `docs/.vitepress/config/locale/<locale-code>/nav.ts`
 *
 * At build time (and during dev HMR) this module:
 * 1. Uses `import.meta.glob` to eagerly load every `nav.ts` found under
 *    `config/locale/∗/`.
 * 2. Iterates over the languages declared in `projectConfig.languages` to
 *    build the `locales` map keyed by locale code (e.g. `"en-US"`).
 * 3. Re-exports the assembled `navConfig` object and all types from
 *    `nav-types.ts` so importers only need a single import.
 *
 * @example
 * ```ts
 * import { navConfig, type NavItem } from "@utils/config/navConfig";
 * const enNav = navConfig.locales["en-US"]; // NavItem[]
 * ```
 */

import { projectConfig } from "./project-config";
import type { NavConfig, NavItem } from "./navTypes";
import { assertNavItemsUseBuilders, normalizeNavItems } from "./navFactory";

/**
 * Eagerly-loaded locale nav modules discovered at build time.
 * The glob pattern is relative to **this file's location** in `utils/config/`.
 *
 * @internal
 */
// @ts-ignore — Vite's `import.meta.glob` types require the "vite/client" reference
const navModules = import.meta.glob("../../config/locale/*/nav.ts", {
    eager: true,
});

/**
 * Per-locale navigation arrays, keyed by locale code (e.g. `"en-US"`).
 * Populated by iterating `projectConfig.languages` so the map stays in sync
 * with the configured locales automatically.
 *
 * @internal
 */
const locales: Record<string, NavItem[]> = {};

for (const lang of projectConfig.languages) {
    const code = lang.code;
    const path = `../../config/locale/${code}/nav.ts`;
    const mod = navModules[path] as
        | { default?: NavItem[]; [key: string]: unknown }
        | undefined;
    if (mod) {
        // Prefer named default export; fall back to first value for CJS interop
        const localeNav = normalizeNavItems(
            mod.default ?? (Object.values(mod)[0] as NavItem[]),
        );
        assertNavItemsUseBuilders(localeNav, code);
        locales[code] = localeNav;
    }
}

/**
 * The assembled navigation configuration for all configured locales.
 *
 * Consumed by:
 * - `VPNavBarMenu.vue`   — desktop mega-menu trigger items
 * - `VPMobileNavSheet.vue` — mobile navigation sheet items
 * - `breadcrumbState.ts`  — breadcrumb trail generation
 *
 * Internal `link` fields are root-relative **without** a locale prefix.
 * Use `prefixNavLinks` from `api/navigation/NavLinkAccessService.ts` to prepend the active locale
 * path at runtime.
 */
export const navConfig: NavConfig = {
    locales,
};

// Re-export every type so consumers only need to import from this module
export * from "./navTypes";
