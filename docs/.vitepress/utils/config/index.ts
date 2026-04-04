import * as pathResolver from "./path-resolver";
import * as projectConfigModule from "./project-config";
import * as projectApi from "./project-api";

export * from "./path-resolver";
export * from "./project-config";
export * from "./project-types";
export * from "./project-api";

export const configUtils = {
    ...pathResolver,
    ...projectConfigModule,
    ...projectApi,
} as const;

export default configUtils;
