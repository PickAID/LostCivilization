// VitePress bundles the config before `resolve.alias` is available, so
// config-time sidebar modules must use relative imports instead of `@utils/*`.
export type { FileSystem } from "../../vitepress/system/FileSystem";
export { NodeFileSystem } from "../../vitepress/system/NodeFileSystem";
