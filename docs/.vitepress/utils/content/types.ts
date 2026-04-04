/**
 * TypeScript types and interfaces for CryChicDoc utilities
 */

// Enhanced utility types
export interface UtilsConfig {
    content?: {
        defaultWordsPerMinute?: number;
        enableReadingTime?: boolean;
    };
    vitepress?: {
        enableSidebarGeneration?: boolean;
        defaultCollapsed?: boolean;
    };
    charts?: {
        defaultTheme?: "light" | "dark";
        enableInteractivity?: boolean;
    };
}

export interface WordCountResult {
    characters: number;
    words: number;
    lines: number;
    readingTime: number;
}

export interface EnhancedFileItem {
    text: string;
    link: string;
    collapsed?: boolean;
    items?: EnhancedFileItem[];
    badge?: string | { text: string; type: "info" | "tip" | "warning" | "danger" };
    icon?: string;
}

export interface EnhancedSidebar {
    text: string;
    collapsed: boolean;
    items: EnhancedFileItem[];
    icon?: string;
    badge?: string;
}

export interface UtilsPluginConfig {
    name: string;
    version?: string;
    enabled?: boolean;
    options?: Record<string, unknown>;
}

export interface MetadataConfig {
    update: (text: string) => string;
    wordCount: (text: number) => string;
    readTime: (text: number) => string;
    pageViews: (text: number) => string;
}

export interface TranslationDictionary {
    [key: string]: {
        [lang: string]: string;
    };
}

export interface ScrollPosition {
    x: number;
    y: number;
}

export interface GitHubCommit {
    commit: {
        author: {
            date: string;
        };
    };
}
