/**
 * VitePress utilities for CryChicDoc
 */

import * as metadata from "./services/metadataService";
import * as navigation from "./api/navigation/NavigationApi";
import * as config from "./config";

export * from "./api/navigation";
export * from "./config";
export * from "./api/frontmatter/hero";
export * from "./runtime/hero";
export * from "./runtime/navigation";
export * from "./runtime/theme";
export * from "./api/assetApi";
export * from "./services/homeLinkService";
export * from "./services/metadataService";
export * from "./system";

export const vitepressUtils = {
    ...metadata,
    ...navigation,
    ...config,
};

export default vitepressUtils;