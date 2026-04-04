/**
 * Footer configuration types and utility functions for VitePress theme
 */

export interface IconConfig {
    light: string;
    dark: string;
    color?: {
        light: string;
        dark: string;
    };
}

export interface LinkConfig {
    icon?: IconConfig;
    name: string;
    link: string;
    rel?: string;
    target?: string;
    noIcon?: boolean;
}

export interface GroupConfig {
    icon?: IconConfig;
    title: string;
    links: LinkConfig[];
}

export interface BeianConfig {
    showIcon: boolean;
    icp: {
        icon?: IconConfig;
        number: string;
        link?: string;
        rel?: string;
        target?: string;
    };
    police: {
        icon?: IconConfig;
        number: string;
        link?: string;
        rel?: string;
        target?: string;
    };
}

export interface AuthorConfig {
    icon?: IconConfig;
    name: string;
    link?: string;
    rel?: string;
    target?: string;
    text?: string;
    startYear?: number;
}

export interface FooterConfig {
    beian: BeianConfig;
    author: AuthorConfig;
    group: GroupConfig[];
}

export function createIconConfig(
    icon: string,
    lightColor?: string,
    darkColor?: string
): IconConfig {
    const config: IconConfig = {
        light: icon,
        dark: icon,
    };

    if (lightColor && darkColor) {
        config.color = {
            light: lightColor,
            dark: darkColor,
        };
    }

    return config;
}

export function createLinkConfig(
    name: string,
    link: string,
    icon?: string,
    options?: {
        rel?: string;
        target?: string;
        noIcon?: boolean;
        iconColors?: { light: string; dark: string };
    }
): LinkConfig {
    const linkConfig: LinkConfig = {
        name,
        link,
    };

    if (icon) {
        linkConfig.icon = createIconConfig(
            icon,
            options?.iconColors?.light,
            options?.iconColors?.dark
        );
    }

    if (options?.rel) linkConfig.rel = options.rel;
    if (options?.target) linkConfig.target = options.target;
    if (options?.noIcon) linkConfig.noIcon = options.noIcon;

    return linkConfig;
}

export function createGroupConfig(
    title: string,
    links: LinkConfig[],
    icon?: string,
    iconColors?: { light: string; dark: string }
): GroupConfig {
    const groupConfig: GroupConfig = {
        title,
        links,
    };

    if (icon) {
        groupConfig.icon = createIconConfig(icon, iconColors?.light, iconColors?.dark);
    }

    return groupConfig;
}