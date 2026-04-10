import path from "node:path";
import glob from "fast-glob";
import matter from "gray-matter";
import {
    SidebarMulti,
    EffectiveDirConfig,
    SidebarItem,
    GlobalSidebarConfig,
} from "./types";
import { ConfigReaderService } from "./config";
import { StructuralGeneratorService } from "./structure";
import { GitBookService } from "./external";
import { GitBookParserService } from "./external/GitBookParserService";
import { NodeFileSystem, type FileSystem } from "./shared/fileSystem";
import { normalizePathSeparators } from "./shared/objectUtils";
import { normalizeUseChildrenCollapsed } from "./structure/useChildrenCollapsed";
import {
    SIDEBAR_CONFIG_FILE_CANDIDATES,
    resolveSidebarConfigFilePath,
} from "./shared/sidebarFileConventions";

/**
 * Filters out grouped content from sidebar items
 * @param items - Sidebar items to filter
 * @param groupPaths - Set of group paths to remove
 * @returns Filtered sidebar items
 */
function filterGroupedContent(items: any[], groupPaths: Set<string>): any[] {
    return items.map(item => {
        const newItem = { ...item };
        
        if (newItem._isDirectory && newItem._relativePathKey && !newItem._isGeneratedGroup) {
            const itemRelativePath = newItem._relativePathKey.replace(/\/$/, '');
            const itemRelativePathWithSlash = itemRelativePath + '/';
            
            const shouldRemove = Array.from(groupPaths).some(groupPath => {
                const normalizedGroupPath = groupPath.replace(/\/$/, '');
                return itemRelativePath === normalizedGroupPath || itemRelativePathWithSlash === groupPath;
            });
            
            if (shouldRemove) {
                return null;
            }
        }
        
        if (newItem.items) {
            newItem.items = filterGroupedContent(newItem.items, groupPaths);
        }
        
        return newItem
    }).filter(item => item !== null);
}


/**
 * @fileoverview Top-level orchestrator for the entire sidebar generation process.
 * 
 * This module serves as the primary entry point for generating VitePress sidebars
 * from directory structures. It coordinates between various services to:
 * - Discover and parse markdown files and directories
 * - Apply configuration from index.md frontmatter and global configs
 * - Generate hierarchical sidebar structures
 * - Handle grouping and external content integration
 * - Output final sidebar configurations in VitePress-compatible format
 * 
 * @module SidebarMain
 * @version 1.0.0
 * @author VitePress Sidebar Generator
 * @since 1.0.0
 */

/**
 * Options for the main sidebar generation process.
 * @interface GenerateSidebarsOptions
 */
interface GenerateSidebarsOptions {
    /** Absolute path to the root of the `/docs` directory. */
    docsPath: string;
    /** Boolean flag indicating if running in development mode (e.g., `vitepress dev`). */
    isDevMode: boolean;
    /** The specific language code (e.g., 'en', 'zh') to generate the sidebar for. */
    lang: string;
}

/**
 * Finds all sidebar config markdown files within a given language path that are marked with `root: true`.
 * These define independent sidebar roots.
 * Filters out paths that are part of the GitBook exclusion list.
 * Nested roots are preserved so each authored root can generate its own sidebar scope.
 * @param {string} langPath Absolute path to the language directory (e.g., `/path/to/docs/en`).
 * @param {FileSystem} fs FileSystem instance.
 * @param {string[]} gitbookExclusionList Array of absolute paths to globally excluded GitBook directories.
 * @returns {Promise<string[]>} A promise resolving to an array of absolute paths to `index.md` files that are roots.
 * @private
 */
async function findAllRootIndexMdPaths(
    currentLanguagePath: string,
    fs: FileSystem,
    gitbookExclusionList: string[]
): Promise<string[]> {
    const normalizedLangPath = normalizePathSeparators(currentLanguagePath);
    const patterns = SIDEBAR_CONFIG_FILE_CANDIDATES.map((fileName) =>
        normalizePathSeparators(path.join(normalizedLangPath, "**", fileName)),
    );

    const ignorePatterns = gitbookExclusionList
        .map((p) => {
            const relativeP = normalizePathSeparators(
                path.relative(normalizedLangPath, p)
            );
            return relativeP === ""
                ? "**"
                : relativeP.startsWith("..")
                ? undefined
                : `${relativeP}/**`;
        })
        .filter((p) => p !== undefined) as string[];

    const indexFiles = await glob(patterns, {
        cwd: normalizedLangPath,
        ignore: ignorePatterns,
        onlyFiles: true,
        absolute: true,
    });

    const potentialRootIndexPaths: string[] = [];
    for (const filePath of indexFiles) {
        const normalizedFilePath = normalizePathSeparators(filePath);
        
        if (
            gitbookExclusionList.some((exPath) =>
                normalizedFilePath.startsWith(exPath)
            )
        ) {
            continue;
        }
        try {
            const content = await fs.readFile(normalizedFilePath);
            const frontmatter = matter(content).data;
            
            if (frontmatter && frontmatter.root === true) {
                potentialRootIndexPaths.push(normalizedFilePath);
            }
        } catch (e: any) {
        }
    }

    return [...new Set(potentialRootIndexPaths)].sort((a, b) => a.localeCompare(b));
}

/**
 * Main orchestration function to generate all sidebars for all configured languages and roots.
 * It reads declarative markdown configurations, generates the sidebar structure,
 * and writes the final `sidebars.json` file in `SidebarMulti` format.
 *
 * @param {GenerateSidebarsOptions} options Configuration options for the generation process.
 * @param {string} options.docsPath Absolute path to the root of the `/docs` directory.
 * @param {boolean} options.isDevMode Boolean flag indicating if running in development mode.
 * @returns {Promise<SidebarMulti | null>} A promise resolving to the generated `SidebarMulti` object,
 *                                        or `null` if a critical error occurs.
 */
export async function generateSidebars(
    options: GenerateSidebarsOptions
): Promise<SidebarMulti | null> {
    const { docsPath, isDevMode, lang } = options;
    const absDocsPath = normalizePathSeparators(path.resolve(docsPath));

    const currentLanguagePath = normalizePathSeparators(path.join(absDocsPath, lang));

    const nodeFs = new NodeFileSystem();
    const configReader = new ConfigReaderService(absDocsPath);
    const gitbookService = new GitBookService(nodeFs);
    const gitbookParserService = new GitBookParserService(nodeFs, absDocsPath);

    const generatedSidebarsDir = normalizePathSeparators(
        path.join(absDocsPath, "..", ".vitepress", "config", "generated")
    );
    const generatedSidebarsPath = normalizePathSeparators(
        path.join(generatedSidebarsDir, "sidebars.json")
    );

    let outputLangSidebar: SidebarMulti = {};

    try {
        configReader.clearCache();

        if (!await nodeFs.exists(currentLanguagePath) || ! (await nodeFs.stat(currentLanguagePath)).isDirectory()) {
            return {};
        }

        const langGitbookPaths = await gitbookService.findGitBookDirectoriesInPath(currentLanguagePath);
        
        const structuralGenerator = new StructuralGeneratorService(
            absDocsPath,
            configReader,
            nodeFs,
            langGitbookPaths 
        );

        const normalRootIndexMdPaths = await findAllRootIndexMdPaths(
            currentLanguagePath,
            nodeFs,
            langGitbookPaths
        );
        


        for (const rootIndexMdPath of normalRootIndexMdPaths) {
            const rootContentPath = normalizePathSeparators(
                path.dirname(rootIndexMdPath)
            );

            let rootKeyInSidebarMulti: string;
            const relativePathFromDocsRoot = normalizePathSeparators(
                path.relative(absDocsPath, rootContentPath) 
            );

            if (relativePathFromDocsRoot === "" || relativePathFromDocsRoot === ".") {
                rootKeyInSidebarMulti = "/";
            } else {
                rootKeyInSidebarMulti = `/${relativePathFromDocsRoot}/`;
            }

            rootKeyInSidebarMulti = rootKeyInSidebarMulti.replace(/\/\/+/g, "/");
            if (rootKeyInSidebarMulti !== "/" && !rootKeyInSidebarMulti.endsWith("/")) {
                    rootKeyInSidebarMulti += "/";
            }
            if (!rootKeyInSidebarMulti.startsWith("/")) {
                rootKeyInSidebarMulti = "/" + rootKeyInSidebarMulti;
            }

            let effectiveConfig = await configReader.getEffectiveConfig(
                rootIndexMdPath,
                lang,
                isDevMode
            );
            effectiveConfig = {
                ...effectiveConfig,
                _baseRelativePathForChildren: "",
                _disableRootFlatten: false,
                _activeMaxDepth: effectiveConfig.maxDepth,
            };
            


            const structuralItems =
                await structuralGenerator.generateSidebarView(
                    rootContentPath,
                    effectiveConfig,
                    lang,
                    0,
                    isDevMode
                );

            const synchronizedItems = structuralItems;

            const groupItems: any[] = [];
            const groupPaths = new Set<string>();
            
            if (effectiveConfig.groups && effectiveConfig.groups.length > 0) {
                for (const groupConfig of effectiveConfig.groups) {
                    const groupTitle = groupConfig.title;
                    const groupPath = groupConfig.path;
                    
                    const groupContentAbsPath = normalizePathSeparators(
                        path.resolve(rootContentPath, groupPath)
                    );
                    
                    const groupRelativePath = normalizePathSeparators(
                        path.relative(absDocsPath, groupContentAbsPath)
                    );
                    const groupConfigKey = `/${groupRelativePath}/`.replace(/\/\/+/g, "/");
                    
                    let groupEffectiveConfig: EffectiveDirConfig;
                    const groupIndexPath = await resolveSidebarConfigFilePath(
                        nodeFs,
                        groupContentAbsPath,
                    );
                    
                    try {
                        const groupFrontmatter = await configReader.getLocalFrontmatter(groupIndexPath);
                        
                        const baseConfig = {
                            ...effectiveConfig,
                            externalLinks: [],
                            groups: []
                        };
                        
                        groupEffectiveConfig = {
                            ...baseConfig,
                            ...groupFrontmatter,
                            title: groupTitle,
                            root: false,
                            priority: groupConfig.priority ?? (groupFrontmatter.priority || 0),
                            maxDepth: groupConfig.maxDepth ?? (groupFrontmatter.maxDepth || effectiveConfig.maxDepth),
                            useChildrenCollapsed: normalizeUseChildrenCollapsed(
                                groupFrontmatter.useChildrenCollapsed ?? baseConfig.useChildrenCollapsed
                            ),
                            _baseRelativePathForChildren: '',
                            _disableRootFlatten: false,
                            _activeMaxDepth: groupConfig.maxDepth ?? (groupFrontmatter.maxDepth || effectiveConfig.maxDepth)
                        };
                    } catch (error) {
                        groupEffectiveConfig = {
                            ...effectiveConfig,
                            title: groupTitle,
                            root: false,
                            priority: groupConfig.priority ?? 0,
                            maxDepth: groupConfig.maxDepth ?? effectiveConfig.maxDepth,
                            useChildrenCollapsed: effectiveConfig.useChildrenCollapsed,
                            _baseRelativePathForChildren: '',
                            _disableRootFlatten: false,
                            _activeMaxDepth: groupConfig.maxDepth ?? effectiveConfig.maxDepth,
                            externalLinks: [],
                            groups: []
                        };
                    }
                    
                    const groupStructuralItems = await structuralGenerator.generateSidebarView(
                        groupContentAbsPath,
                        groupEffectiveConfig,
                        lang,
                        0,
                        isDevMode
                    );
                    
                    const groupSynchronizedItems = groupStructuralItems;
                    
                    if (groupSynchronizedItems && groupSynchronizedItems.length > 0) {
                        const groupWrapper = {
                            text: groupTitle,
                            items: groupSynchronizedItems,
                            collapsed: groupConfig.collapsed ?? groupEffectiveConfig.collapsed,
                            _priority: groupConfig.priority ?? 0,
                            _relativePathKey: groupPath,
                            _isDirectory: true,
                            _isRoot: false,
                            _hidden: groupConfig.hidden ?? false,
                            _isGeneratedGroup: true
                        };
                        
                        groupItems.push(groupWrapper);
                        groupPaths.add(groupPath);
                    }
                }
            }
            
            if (synchronizedItems && synchronizedItems.length > 0) {
                let finalItems = synchronizedItems;
                
                if (groupPaths.size > 0) {
                    finalItems = filterGroupedContent(synchronizedItems, groupPaths);
                }
                
                if (groupItems.length > 0) {
                    finalItems = [...finalItems, ...groupItems];
                }
                
                if (finalItems.length > 0) {
                    outputLangSidebar[rootKeyInSidebarMulti] = finalItems;
                }
            }
        }
        
        for (const gitbookDirAbsPath of langGitbookPaths) {
            const gitbookItems = await gitbookParserService.generateSidebarView(
                gitbookDirAbsPath,
                lang
            );

            if (gitbookItems.length > 0) {
                const gitbookKeyInSidebarMulti = `/${normalizePathSeparators(
                    path.relative(absDocsPath, gitbookDirAbsPath)
                )}/`;

                outputLangSidebar[gitbookKeyInSidebarMulti] = gitbookItems;
            }
        }

        return outputLangSidebar;
    } catch (error: any) {
        return null;
    }
}
