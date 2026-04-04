import {
    _internalConfigureSidebar,
    getSidebar,
    DEFAULT_SIDEBAR_CACHE_DIR,
} from "../utils/sidebar/lib";
import { getLanguageLinks } from "../utils/config/project-api/index.js";
import { getSrcPath } from "../utils/config/path-resolver.js";

/**
 * Exports sidebar trees for llms.txt organization.
 *
 * @returns {Promise<void>}
 */
async function exportLlmsSidebars(): Promise<void> {
    const languages = getLanguageLinks().map((link) =>
        link.replace(/^\/|\/$/g, ""),
    );

    _internalConfigureSidebar({
        languages,
        debug: false,
        rootDir: process.cwd(),
        docsDir: getSrcPath(),
        cacheDir: DEFAULT_SIDEBAR_CACHE_DIR,
    });

    const output: Record<string, Record<string, any[]>> = {};

    for (const lang of languages) {
        output[lang] = await getSidebar(lang);
    }

    process.stdout.write(JSON.stringify(output));
}

exportLlmsSidebars().catch((error) => {
    process.stderr.write(String(error));
    process.exit(1);
});
