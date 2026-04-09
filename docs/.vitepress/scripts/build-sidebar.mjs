import {
    getSidebar,
    getConfiguredLanguages,
    _internalConfigureSidebar,
    clearCache,
    DEFAULT_SIDEBAR_CACHE_DIR,
} from "../utils/sidebar/index.ts";
import { getLanguageLinks } from "../utils/config/project-config.ts";
import { getSrcPath } from "../utils/config/path-resolver.js";
import { generateDirectoryMetadataCache } from "./generate-directory-metadata-cache.mjs";

async function buildSidebars() {
    console.log("🚀 Starting sidebar generation...");
    
    const languageLinks = getLanguageLinks();
    // Convert links like '/zh/', '/en/' to language codes like 'zh', 'en'
    const languages = languageLinks.map(link => link.replace(/^\/|\/$/g, ''));
    const srcPath = getSrcPath();
    _internalConfigureSidebar({
        languages: languages,
        debug: process.env.NODE_ENV === 'development',
        rootDir: process.cwd(),
        docsDir: srcPath,
        cacheDir: DEFAULT_SIDEBAR_CACHE_DIR,
    });

    clearCache();
    
    const configuredLanguages = getConfiguredLanguages();
    console.log(`📚 Using configured languages: ${configuredLanguages.join(", ")}`);
    
    for (const lang of configuredLanguages) {
        console.log(`\n📖 Generating sidebar for language: ${lang || "root"}`);

        const sidebar = await getSidebar(lang);

        if (Object.keys(sidebar).length > 0) {
            console.log(
                `✅ Successfully generated sidebar for ${lang || "root"}`
            );
            console.log(`   Generated ${Object.keys(sidebar).length} route(s)`);

            for (const [route, items] of Object.entries(sidebar)) {
                console.log(`   📄 ${route}: ${items.length} item(s)`);
            }
        }
    }

    await generateDirectoryMetadataCache();
}

buildSidebars();
