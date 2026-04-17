import { normalizePathSeparators } from "./objectUtils";

type ExistingFileProbe = {
    exists(path: string): Promise<boolean>;
};

export const SIDEBAR_CONFIG_FILE_CANDIDATES = [
    "sidebarIndex.md",
    "root.md",
    "index.md",
    "Catalogue.md",
] as const;

export const SIDEBAR_ITEM_EXCLUDED_FILE_CANDIDATES = [
    "sidebarIndex.md",
    "root.md",
    "index.md",
] as const;

export const DIRECTORY_LANDING_FILE_CANDIDATES = [
    "index.md",
    "Catalogue.md",
    "README.md",
] as const;

const SIDEBAR_CONFIG_FILE_SET = new Set(
    SIDEBAR_CONFIG_FILE_CANDIDATES.map((name) => name.toLowerCase()),
);

const SIDEBAR_ITEM_EXCLUDED_FILE_SET = new Set(
    SIDEBAR_ITEM_EXCLUDED_FILE_CANDIDATES.map((name) => name.toLowerCase()),
);

function normalizeFileName(fileName: string) {
    return fileName.trim().toLowerCase();
}

function joinDirectoryFilePath(directoryAbsPath: string, fileName: string) {
    const normalizedDirectory = normalizePathSeparators(directoryAbsPath)
        .replace(/\/+$/g, "");
    const normalizedFileName = normalizePathSeparators(fileName)
        .replace(/^\/+/g, "");

    return `${normalizedDirectory}/${normalizedFileName}`;
}

export function isSidebarConfigFileName(fileName: string) {
    return SIDEBAR_CONFIG_FILE_SET.has(normalizeFileName(fileName));
}

export function isSidebarItemExcludedFileName(fileName: string) {
    return SIDEBAR_ITEM_EXCLUDED_FILE_SET.has(normalizeFileName(fileName));
}

async function resolveExistingFileInDirectory(
    fs: ExistingFileProbe,
    directoryAbsPath: string,
    candidates: readonly string[],
) {
    for (const fileName of candidates) {
        const fullPath = joinDirectoryFilePath(directoryAbsPath, fileName);
        if (await fs.exists(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

export async function resolveSidebarConfigFilePath(
    fs: ExistingFileProbe,
    directoryAbsPath: string,
) {
    const existing = await resolveExistingFileInDirectory(
        fs,
        directoryAbsPath,
        SIDEBAR_CONFIG_FILE_CANDIDATES,
    );
    if (existing) return existing;
    return joinDirectoryFilePath(
        directoryAbsPath,
        SIDEBAR_CONFIG_FILE_CANDIDATES[0],
    );
}

export async function resolveDirectoryLandingFilePath(
    fs: ExistingFileProbe,
    directoryAbsPath: string,
) {
    return resolveExistingFileInDirectory(
        fs,
        directoryAbsPath,
        DIRECTORY_LANDING_FILE_CANDIDATES,
    );
}
