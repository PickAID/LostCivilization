/**
 * @file Type definitions for the component-scoped i18n system.
 */

export type TranslationFile = Record<string, string>;

export type TranslationsCache = Record<string, Record<string, TranslationFile>>;

export interface LocaleManagerOptions {}