import { generateAllLanguageTagData } from "../utils/content/tagCollector.ts";
import { getSrcPath } from "../utils/config/path-resolver.ts";
import { getPaths } from "../utils/config/project-config.ts";

async function main() {
    const srcPath = getSrcPath();
    const paths = getPaths();
    const outputDir = paths.public;
    
    generateAllLanguageTagData(srcPath, outputDir);
}

main().catch(console.error);
