<script setup lang="ts">
    import { computed, ref, watchEffect } from "vue";
    import { withBase, useData } from "vitepress";
    import { slugify } from "@mdit-vue/shared";
    import MarkdownIt from "markdown-it";
    import {
        resolveThemeValueByMode,
        getThemeRuntime,
    } from "@utils/vitepress/runtime/theme";
    import {
        decodeEscapedText,
        resolveDynamicText,
    } from "@utils/vitepress/runtime/text/dynamicText";

    import MNavLink from "./MNavLink.vue";
    import type { NavData, NavIcon, NavLink, NavThemeIcon } from "@utils/content/navLinkType";

    const { isDark } = useData();
    const { effectiveDark } = getThemeRuntime(isDark);
    const md = new MarkdownIt({ html: true, linkify: true });

    const props = defineProps<{
        groups?: NavData[];
        title?: string;
        noIcon?: boolean;
        items?: NavLink[];
        description?: string;
        columns?: number;
        icon?: NavLink["icon"];
        eyebrow?: string;
    }>();

    const themeIcon = (icon: NavIcon | NavThemeIcon): NavIcon => {
        if (typeof icon === "object" && !Array.isArray(icon)) {
            const record = icon as {
                dark?: NavIcon;
                light?: NavIcon;
                value?: NavIcon;
            };
            if ("dark" in record || "light" in record || "value" in record) {
                return resolveThemeValueByMode(record, effectiveDark.value) ?? icon;
            }
        }
        return icon;
    };

    const isRawSvg = (value: string) => /^\s*<svg[\s>]/i.test(value);
    const isExternalUrl = (value: string) =>
        /^(?:https?:)?\/\//.test(value) ||
        value.startsWith("data:") ||
        value.startsWith("blob:");
    const resolveAssetUrl = (value: string) =>
        isExternalUrl(value) ? value : withBase(value);

    const normalizeIconValue = (icon?: NavIcon | NavThemeIcon): string => {
        if (!icon) return "";
        const resolved = themeIcon(icon);
        if (typeof resolved === "object" && "svg" in resolved) {
            return resolved.svg || "";
        }
        return typeof resolved === "string" ? resolved : "";
    };

    const normalizedGroups = computed<NavData[]>(() => {
        if (Array.isArray(props.groups) && props.groups.length > 0) {
            return props.groups;
        }
        if (props.title && Array.isArray(props.items)) {
            return [
                {
                    title: props.title,
                    description: props.description,
                    columns: props.columns,
                    icon: props.icon,
                    eyebrow: props.eyebrow,
                    items: props.items,
                },
            ];
        }
        return [];
    });
    const hasPageHeader = computed(
        () => Array.isArray(props.groups) && props.groups.length > 0 && Boolean(props.title),
    );

    const renderInline = (value?: string) =>
        value ? md.renderInline(decodeEscapedText(value).replace(/\n/g, "<br />")).trim() : "";

    const getHeadingId = (title: string) => slugify(title || "");
    const resolvedPageHeader = ref({
        title: renderInline(props.title),
        description: renderInline(props.description),
        eyebrow: renderInline(props.eyebrow),
    });
    const resolvedGroups = ref<Array<NavData & {
        headingText?: string;
        renderedTitle?: string;
        renderedDescription?: string;
        renderedEyebrow?: string;
    }>>([]);

    watchEffect((onCleanup) => {
        let cancelled = false;
        Promise.all([
            resolveDynamicText(props.title),
            resolveDynamicText(props.description),
            resolveDynamicText(props.eyebrow),
        ]).then(([title, description, eyebrow]) => {
            if (cancelled) return;
            resolvedPageHeader.value = {
                title: renderInline(title),
                description: renderInline(description),
                eyebrow: renderInline(eyebrow),
            };
        });
        onCleanup(() => {
            cancelled = true;
        });
    });

    watchEffect((onCleanup) => {
        let cancelled = false;
        const groups = normalizedGroups.value;
        Promise.all(groups.map(async (group) => ({
            ...group,
            headingText: await resolveDynamicText(group.title),
            renderedTitle: renderInline(await resolveDynamicText(group.title)),
            renderedDescription: renderInline(await resolveDynamicText(group.description)),
            renderedEyebrow: renderInline(await resolveDynamicText(group.eyebrow)),
        }))).then((next) => {
            if (!cancelled) {
                resolvedGroups.value = next;
            }
        });
        onCleanup(() => {
            cancelled = true;
        });
    });

    const getGroupSvg = (group: NavData) => {
        const value = normalizeIconValue(group.icon);
        return value && isRawSvg(value) ? value : "";
    };
    const getGroupUrl = (group: NavData) => {
        const value = normalizeIconValue(group.icon);
        return value && !isRawSvg(value) ? resolveAssetUrl(value) : "";
    };
    const getGridStyle = (group: NavData) => {
        if (!group.columns) return undefined;
        return {
            "grid-template-columns": `repeat(${group.columns}, minmax(0, 1fr))`,
        };
    };
</script>

<template>
    <div class="m-nav-links-page">
        <header v-if="hasPageHeader" class="m-nav-page-heading">
            <div class="m-nav-page-copy">
                <span
                    v-if="resolvedPageHeader.eyebrow"
                    class="m-nav-page-eyebrow"
                    v-html="resolvedPageHeader.eyebrow"
                ></span>
                <h1 v-if="title" class="m-nav-page-title">
                    <span v-if="resolvedPageHeader.title" v-html="resolvedPageHeader.title"></span>
                    <span v-else>{{ title }}</span>
                </h1>
                <p
                    v-if="resolvedPageHeader.description"
                    class="m-nav-page-desc"
                    v-html="resolvedPageHeader.description"
                ></p>
            </div>
        </header>
        <section v-for="(group, index) in resolvedGroups" :key="index" class="m-nav-group">
            <div class="m-nav-group-heading">
                <span v-if="getGroupSvg(group) || getGroupUrl(group)" class="m-nav-group-icon">
                    <span v-if="getGroupSvg(group)" v-html="getGroupSvg(group)"></span>
                    <img
                        v-else-if="getGroupUrl(group)"
                        :src="getGroupUrl(group)"
                        :alt="group.title"
                        onerror="this.parentElement.style.display='none'"
                    />
                </span>
                <div class="m-nav-group-copy">
                    <span
                        v-if="group.renderedEyebrow"
                        class="m-nav-group-eyebrow"
                        v-html="group.renderedEyebrow"
                    ></span>
                    <h2 v-if="group.title" :id="getHeadingId(group.headingText || group.title)" tabindex="-1">
                        <span v-if="group.renderedTitle" v-html="group.renderedTitle"></span>
                        <span v-else>{{ group.title }}</span>
                        <a
                            class="header-anchor"
                            :href="`#${getHeadingId(group.headingText || group.title)}`"
                            aria-hidden="true"
                        ></a>
                    </h2>
                    <p
                        v-if="group.renderedDescription"
                        class="m-nav-group-desc"
                        v-html="group.renderedDescription"
                    ></p>
                </div>
            </div>
            <div class="m-nav-links" :style="getGridStyle(group)">
                <MNavLink
                    v-for="(item, itemIndex) in group.items"
                    :key="itemIndex"
                    :noIcon="noIcon"
                    v-bind="item"
                />
            </div>
        </section>
    </div>
</template>
