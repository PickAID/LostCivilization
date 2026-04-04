import { projectConfig } from "../../../config/project-config";
import type {
    CopyLinkConfig,
    GiscusConfig,
    PathConfig,
    SocialButton,
    SpecialBackPath,
} from "../project-types";
import { getProjectSearchConfig } from "./search";

export function getDefaultCurrency(): string {
    return projectConfig.defaultCurrency;
}

export function getPaths(): PathConfig {
    return projectConfig.paths;
}

export function isFeatureEnabled(
    feature: keyof typeof projectConfig.features,
): boolean {
    return projectConfig.features[feature];
}

export function getProjectInfo() {
    const resolvedSearch = getProjectSearchConfig();

    return {
        name: projectConfig.name,
        base: projectConfig.base,
        version: projectConfig.version,
        author: projectConfig.author,
        license: projectConfig.license,
        favicon: projectConfig.favicon,
        logo: projectConfig.logo,
        repository: projectConfig.repository,
        homepage: projectConfig.homepage,
        headerSocialLinks: projectConfig.headerSocialLinks,
        editLink: projectConfig.editLink,
        footerOptions: projectConfig.footerOptions,
        drawio: projectConfig.drawio,
        mdVar: projectConfig.mdVar,
        algolia: {
            appId: resolvedSearch.algolia?.appId || "",
            apiKey: resolvedSearch.algolia?.apiKey || "",
            indexName: resolvedSearch.algolia?.indexName || "",
        },
        search: resolvedSearch,
    };
}

export function getCopyLinkConfig(): CopyLinkConfig {
    return projectConfig.copyLinkConfig || { removeLanguage: true };
}

export function getSocialButtons(): SocialButton[] {
    return projectConfig.socialButtons || [];
}

export function getSpecialBackPaths(): SpecialBackPath[] {
    return projectConfig.specialBackPaths || [];
}

export function getGiscusConfig(): GiscusConfig {
    return projectConfig.giscus;
}
