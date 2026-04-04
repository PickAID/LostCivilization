import fs from "node:fs/promises";
import path from "node:path";
import { Dirent, Stats } from "node:fs";
import type { FileSystem } from "./FileSystem";
import { normalizePathSeparators } from "../../sidebar/shared/objectUtils";

export class NodeFileSystem implements FileSystem {
    async readFile(filePath: string): Promise<string> {
        return fs.readFile(normalizePathSeparators(filePath), "utf-8");
    }

    async readDir(dirPath: string): Promise<Dirent[]> {
        return fs.readdir(normalizePathSeparators(dirPath), { withFileTypes: true });
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(normalizePathSeparators(filePath));
            return true;
        } catch {
            return false;
        }
    }

    async stat(filePath: string): Promise<Stats> {
        return fs.stat(normalizePathSeparators(filePath));
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const normalized = normalizePathSeparators(filePath);
        await fs.mkdir(path.dirname(normalized), { recursive: true });
        await fs.writeFile(normalized, content, "utf-8");
    }

    async ensureDir(dirPath: string): Promise<void> {
        await fs.mkdir(normalizePathSeparators(dirPath), { recursive: true });
    }

    async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(normalizePathSeparators(filePath));
        } catch (error: any) {
            if (error.code !== "ENOENT") throw error;
        }
    }

    async deleteDir(dirPath: string): Promise<void> {
        try {
            await fs.rm(normalizePathSeparators(dirPath), { recursive: true, force: true });
        } catch (error: any) {
            if (error.code !== "ENOENT") throw error;
        }
    }
}

