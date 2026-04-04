<script lang="ts" setup>
    import { createBreadcrumbState } from "@utils/vitepress/runtime/navigation/breadcrumbState";
    import { resolveBaseAwareHref } from "@utils/vitepress/runtime/navigation/linkResolution";
    import { useData, withBase } from "vitepress";
    import { computed } from "vue";

    const { breadcrumbs } = createBreadcrumbState();
    const { frontmatter } = useData();

    const resolveHref = (link?: string) => resolveBaseAwareHref(link, withBase);

    // Only show breadcrumbs if there is a real trail and it's not disabled in frontmatter
    const hasBreadcrumbs = computed(() => {
        return (
            breadcrumbs.value.length > 1 &&
            frontmatter.value.breadcrumbs !== false
        );
    });
</script>

<template>
    <nav v-if="hasBreadcrumbs" class="VPBreadcrumb" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
            <li
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
                class="breadcrumb-item"
            >
                <a
                    v-if="crumb.link && index !== breadcrumbs.length - 1"
                    :href="resolveHref(crumb.link)"
                    class="breadcrumb-link"
                >
                    {{ crumb.text }}
                </a>
                <span
                    v-else
                    class="breadcrumb-text"
                    :aria-current="
                        index === breadcrumbs.length - 1 ? 'page' : undefined
                    "
                >
                    {{ crumb.text }}
                </span>

                <span v-if="index !== breadcrumbs.length - 1" class="separator">
                    <span class="vpi-chevron-right icon" />
                </span>
            </li>
        </ol>
    </nav>
</template>

<style scoped>
    .VPBreadcrumb {
        margin-bottom: 24px;
    }

    .breadcrumb-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .breadcrumb-item {
        display: flex;
        align-items: center;
        font-size: 13px;
        line-height: 1.5;
    }

    .breadcrumb-link {
        color: var(--vp-c-text-2);
        transition: color 0.25s;
        text-decoration: none;
    }

    .breadcrumb-link:hover {
        color: var(--vp-c-brand-1);
    }

    .breadcrumb-text {
        color: var(--vp-c-text-1);
        font-weight: 500;
    }

    /* Make current page slightly muted but stronger than links to indicate active state */
    .breadcrumb-item:last-child .breadcrumb-text {
        color: var(--vp-c-text-1);
    }

    .separator {
        display: flex;
        align-items: center;
        color: var(--vp-c-text-3);
        margin: 0 8px;
    }

    .icon {
        font-size: 12px;
    }

    @media (min-width: 768px) {
        .VPBreadcrumb {
            margin-bottom: 32px;
        }
    }
</style>
