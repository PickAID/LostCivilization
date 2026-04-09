import path from "node:path";
import fs from "node:fs/promises";
import glob from "fast-glob";
import matter from "gray-matter";
import { getSrcPath } from "../utils/config/path-resolver.js";
import {
    relativeDocsPathToDirectoryRoute,
    shouldReplaceDirectoryMetadataCandidate,
} from "../utils/vitepress/api/frontmatter/metadata/DirectoryMetadataSupport.ts";

const CONFIG_FILE_CANDIDATES = [
    "sidebarIndex.md",
    "root.md",
    "index.md",
    "Catalogue.md",
];

function normalizePath(value) {
    return value.replace(/\\/g, "/");
}

export async function generateDirectoryMetadataCache() {
    const docsPath = path.resolve(getSrcPath());
    const cacheDir = path.resolve(".cache/directory-metadata");
    const cachePath = path.join(cacheDir, "directory_metadata.json");
    const patterns = CONFIG_FILE_CANDIDATES.map((fileName) =>
        normalizePath(path.join(docsPath, "**", fileName)),
    );

    const files = await glob(patterns, {
        absolute: true,
        onlyFiles: true,
    });

    const bestConfigByDirectory = new Map();

    for (const filePath of files) {
        const normalizedFilePath = normalizePath(filePath);
        const directoryPath = normalizePath(path.dirname(normalizedFilePath));
        const fileName = path.basename(normalizedFilePath);
        const current = bestConfigByDirectory.get(directoryPath);

        if (
            !current ||
            shouldReplaceDirectoryMetadataCandidate(current.fileName, fileName)
        ) {
            bestConfigByDirectory.set(directoryPath, {
                fileName,
                filePath: normalizedFilePath,
            });
        }
    }

    const directoryMetadataByLocale = {};

    for (const { filePath } of bestConfigByDirectory.values()) {
        const content = await fs.readFile(filePath, "utf8");
        const frontmatter = matter(content).data ?? {};

        if (!Object.prototype.hasOwnProperty.call(frontmatter, "metadata")) {
            continue;
        }

        const relativePath = normalizePath(path.relative(docsPath, filePath));
        const locale = relativePath.split("/")[0];
        if (!locale) {
            continue;
        }

        const directoryRoute = relativeDocsPathToDirectoryRoute(relativePath);
        if (!directoryMetadataByLocale[locale]) {
            directoryMetadataByLocale[locale] = {};
        }

        directoryMetadataByLocale[locale][directoryRoute] =
            frontmatter.metadata;
    }

    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(
        cachePath,
        JSON.stringify(directoryMetadataByLocale, null, 2) + "\n",
        "utf8",
    );

    console.log(
        `🧭 Generated directory metadata cache with ${Object.keys(directoryMetadataByLocale).length} locale(s)`,
    );
}
