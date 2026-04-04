import { Dirent, Stats } from "node:fs";

export interface FileSystem {
    readFile(path: string): Promise<string>;
    readDir(path: string): Promise<Dirent[]>;
    exists(path: string): Promise<boolean>;
    stat(path: string): Promise<Stats>;
    writeFile(path: string, content: string): Promise<void>;
    ensureDir(path: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    deleteDir(path: string): Promise<void>;
}