<script setup lang="ts">
    import { computed } from "vue";
    import { withBase } from "vitepress";
    import { resolveAssetWithBase } from "@utils/vitepress/api/assetApi";

    /**
     * Component props for Linkcard.
     */
    interface Props {
        /** The URL to link to */
        url: string;
        /** Card title text */
        title: string;
        /** Card description text */
        description: string;
        /** Logo image URL */
        logo: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        url: "",
        title: "",
        description: "",
        logo: "",
    });

    /**
     * Resolved logo URL with asset base path.
     */
    const resolvedLogo = computed(() => resolveAssetWithBase(props.logo));

    /**
     * Resolved URL - handles both external and internal links.
     */
    const resolvedUrl = computed(() => {
        if (!props.url) return "";
        if (/^(https?:)?\/\//.test(props.url)) return props.url;
        return withBase(props.url);
    });
</script>

<template>
    <div class="linkcard">
        <a :href="resolvedUrl" target="_blank">
            <p class="description">
                {{ props.title }}<br /><span>{{ props.description }}</span>
            </p>
            <div class="logo">
                <img alt="logo" width="70px" height="70px" :src="resolvedLogo" />
            </div>
        </a>
    </div>
</template>

<style>
    .linkcard {
        background-color: var(--linkcard-bg);
        border-radius: var(--linkcard-border-radius);
        padding: var(--linkcard-padding);
        transition: color 0.5s, background-color 0.5s;
        margin-top: 15px;
    }

    .linkcard:hover {
        background-color: var(--linkcard-hover-bg);
    }

    .linkcard a {
        display: flex;
        align-items: center;
    }

    .linkcard .description {
        flex: 1;
        font-weight: 500;
        font-size: 16px;
        line-height: 25px;
        color: var(--vp-c-text-1);
        margin: 0 0 0 16px;
        transition: color 0.5s;
    }

    .linkcard .description span {
        font-size: 14px;
    }

    .linkcard .logo img {
        width: 80px;
        object-fit: contain;
    }

    .vp-doc a {
        text-decoration: none;
    }
</style>
