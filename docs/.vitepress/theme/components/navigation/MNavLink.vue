<script setup lang="ts">
import { slugify } from "@mdit-vue/shared";
import type {
	NavBadge,
	NavIcon,
	NavLink,
	NavThemeIcon,
} from "@utils/content/navLinkType";
import {
	getThemeRuntime,
	resolveThemeValueByMode,
} from "@utils/vitepress/runtime/theme";
import {
	useResolvedInlineMarkdown,
	useResolvedText,
} from "@utils/vitepress/runtime/text/dynamicText";
import MarkdownIt from "markdown-it";
import { useData, withBase } from "vitepress";
import { computed, ref, watch } from "vue";

const { isDark } = useData();
const { effectiveDark } = getThemeRuntime(isDark);
const md = new MarkdownIt({ html: true, linkify: true });

const props = defineProps<{
	noIcon?: boolean;
	icon?: NavLink["icon"];
	logo?: NavLink["logo"];
	badge?: NavLink["badge"];
	badges?: NavLink["badges"];
	title?: NavLink["title"];
	desc?: NavLink["desc"];
	link: NavLink["link"];
	tag?: NavLink["tag"];
	color?: NavLink["color"];
	target?: NavLink["target"];
	eyebrow?: NavLink["eyebrow"];
	note?: NavLink["note"];
	featured?: NavLink["featured"];
	style?: NavLink["style"];
	iconBackground?: NavLink["iconBackground"];
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
const isClaudeFavicon = (value: string) =>
	/^https:\/\/claude\.ai\/favicon\.ico(?:[?#].*)?$/i.test(value);
const resolveAssetUrl = (value: string) =>
	isExternalUrl(value) ? value : withBase(value);
const claudeFallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" role="img">
  <g fill="#d97757">
    <circle cx="32" cy="11.5" r="7.5"/>
    <circle cx="45.25" cy="16.75" r="7.5"/>
    <circle cx="52.5" cy="29.5" r="7.5"/>
    <circle cx="49.5" cy="43.5" r="7.5"/>
    <circle cx="38.5" cy="52.25" r="7.5"/>
    <circle cx="24.5" cy="52.25" r="7.5"/>
    <circle cx="13.5" cy="43.5" r="7.5"/>
    <circle cx="10.5" cy="29.5" r="7.5"/>
    <circle cx="17.75" cy="16.75" r="7.5"/>
  </g>
  <circle cx="32" cy="32" r="10.5" fill="var(--vp-c-bg, #fff)"/>
</svg>`.trim();

const normalizeIconValue = (icon?: NavIcon | NavThemeIcon): string => {
	if (!icon) return "";
	const resolved = themeIcon(icon);
	if (typeof resolved === "object" && "svg" in resolved) {
		return resolved.svg || "";
	}
	if (typeof resolved === "string") {
		return isClaudeFavicon(resolved) ? claudeFallbackSvg : resolved;
	}
	return "";
};

const iconSource = computed(() => props.logo ?? props.icon);

const resolvedLinkText = useResolvedText(() => props.link);
const resolvedTitleText = useResolvedText(() => props.title);
const resolvedNoteText = useResolvedText(() => props.note);
const renderedEyebrow = useResolvedInlineMarkdown(() => props.eyebrow, md);
const renderedTitle = useResolvedInlineMarkdown(() => props.title, md);
const renderedDesc = useResolvedInlineMarkdown(() => props.desc, md);
const renderedTag = useResolvedInlineMarkdown(() => props.tag, md);

const formatTitle = computed(() => {
	if (!resolvedTitleText.value) {
		return "";
	}
	return slugify(resolvedTitleText.value);
});

const rawIcon = computed(() => normalizeIconValue(iconSource.value));
const imageFailed = ref(false);

watch(rawIcon, () => {
	imageFailed.value = false;
});

const svg = computed(() =>
	rawIcon.value && isRawSvg(rawIcon.value) ? rawIcon.value : "",
);
const url = computed(() =>
	rawIcon.value && !isRawSvg(rawIcon.value)
		? resolveAssetUrl(rawIcon.value)
		: "",
);
const showImage = computed(() => Boolean(url.value) && !imageFailed.value);
const fallbackLabel = computed(
	() => resolvedTitleText.value.trim().charAt(0).toUpperCase() || "?",
);

const badgeList = computed<NavBadge[]>(() => {
	const list: NavBadge[] = [];

	if (props.badge) {
		const badge = props.badge;
		list.push(
			typeof badge === "string"
				? { text: badge, type: "info" }
				: { text: badge.text ?? "", type: badge.type ?? "info" },
		);
	}

	if (props.badges) {
		for (const badge of props.badges) {
			list.push(
				typeof badge === "string"
					? { text: badge, type: "info" }
					: {
							text: badge.text ?? "",
							type: badge.type ?? "info",
						},
			);
		}
	}

	return list.filter((badge) => badge.text);
});

const isExternalLink = computed(
	() =>
		/^(?:https?:)?\/\//.test(resolvedLinkText.value) ||
		resolvedLinkText.value.startsWith("mailto:") ||
		resolvedLinkText.value.startsWith("tel:"),
);
const resolvedHref = computed(() =>
	isExternalLink.value ? resolvedLinkText.value : withBase(resolvedLinkText.value),
);
const linkTarget = computed(
	() => props.target ?? (isExternalLink.value ? "_blank" : "_self"),
);
const linkRel = computed(() =>
	linkTarget.value === "_blank" ? "noreferrer" : undefined,
);
const linkStyle = computed(() => props.style ?? "default");
const cardStyle = computed(() => ({
	...(props.color ? { "--nav-link-accent": props.color } : undefined),
	...(props.iconBackground
		? { "--nav-link-icon-bg": props.iconBackground }
		: undefined),
}));

const tooltipContent = computed(() => resolvedNoteText.value || "");
function handleImageError() {
	imageFailed.value = true;
}
</script>

<template>
    <v-tooltip
        v-if="link"
        :text="tooltipContent"
        :disabled="!tooltipContent"
        location="top"
        :max-width="300"
        transition="fade-transition"
        content-class="m-nav-tooltip__content"
    >
        <template #activator="{ props: tp }">
            <a
                class="m-nav-link"
                :class="[
                    linkStyle !== 'default' ? `m-nav-link--${linkStyle}` : '',
                    { 'm-nav-link--featured': featured },
                ]"
                :href="resolvedHref"
                :target="linkTarget"
                :rel="linkRel"
                :style="cardStyle"
                v-bind="tp"
            >
                <div class="m-nav-link-box">
                    <template v-if="!noIcon && (svg || url)">
                        <div
                            v-if="svg"
                            class="m-nav-link-icon"
                            v-html="svg"
                        ></div>
                        <div v-else-if="showImage" class="m-nav-link-icon">
                            <img
                                :src="url"
                                :alt="title"
                                @error="handleImageError"
                            />
                        </div>
                        <div v-else class="m-nav-link-icon m-nav-link-icon--fallback">
                            <span>{{ fallbackLabel }}</span>
                        </div>
                    </template>

                    <div class="m-nav-link-content">
                        <div class="m-nav-link-header">
                            <span
                                v-if="renderedEyebrow"
                                class="m-nav-link-eyebrow"
                                v-html="renderedEyebrow"
                            ></span>
                            <h5
                                v-if="title"
                                :id="formatTitle"
                                class="m-nav-link-title"
                            >
                                <span
                                    v-if="renderedTitle"
                                    v-html="renderedTitle"
                                ></span>
                                <span v-else>{{ title }}</span>
                            </h5>
                            <div v-if="badgeList.length" class="m-nav-link-badges">
                                <span
                                    v-for="(b, i) in badgeList"
                                    :key="i"
                                    class="m-nav-badge"
                                    :data-type="b.type || 'info'"
                                >{{ b.text }}</span>
                            </div>
                        </div>

                        <p
                            v-if="renderedDesc"
                            class="m-nav-link-desc"
                            v-html="renderedDesc"
                        ></p>

                        <div v-if="renderedTag" class="m-nav-link-meta">
                            <span class="m-nav-tag" v-html="renderedTag"></span>
                        </div>
                    </div>
                </div>
            </a>
        </template>
    </v-tooltip>
</template>

<style scoped>
    :deep(.m-nav-tooltip__content) {
        background: color-mix(in srgb, var(--vp-c-bg-elv) 92%, var(--vp-c-bg) 8%) !important;
        color: var(--vp-c-text-1) !important;
        border-radius: 14px !important;
        padding: 0.72rem 0.86rem !important;
        font-size: 0.78rem !important;
        font-weight: 520 !important;
        line-height: 1.68 !important;
        letter-spacing: 0.01em !important;
        backdrop-filter: blur(16px) !important;
        border: 1px solid color-mix(in srgb, var(--vp-c-divider) 74%, transparent) !important;
        max-width: 26rem;
    }
</style>
