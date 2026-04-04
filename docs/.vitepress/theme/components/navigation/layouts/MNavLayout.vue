<script setup lang="ts">
import { computed } from "vue";
import { useData, useRoute } from "vitepress";
import MNavLinksPage from "../MNavLinksPage.vue";
import { TagsPage } from "@utils/vitepress/componentRegistry/contentRegistry";

const { frontmatter } = useData();

const isTagPage = computed(() => frontmatter.value?.tagPage === true);
const pageTitle = computed(() => frontmatter.value?.title || "");
const pageDescription = computed(() => frontmatter.value?.description || "");
</script>

<template>
    <div class="m-nav-layout">
        <div class="m-nav-header" v-if="pageTitle || pageDescription">
            <div class="m-nav-header-inner">
                <h1 v-if="pageTitle" class="m-nav-header-title">{{ pageTitle }}</h1>
                <p v-if="pageDescription" class="m-nav-header-desc">{{ pageDescription }}</p>
            </div>
        </div>

        <div class="m-nav-body">
            <TagsPage v-if="isTagPage" />
            <MNavLinksPage />
        </div>
    </div>
</template>

<style scoped>
.m-nav-layout {
    width: 100%;
}

.m-nav-header {
    padding: clamp(48px, 8vw, 80px) clamp(24px, 5vw, 48px) clamp(24px, 4vw, 40px);
}

.m-nav-header-inner {
    max-width: 1400px;
    margin: 0 auto;
}

.m-nav-header-title {
    margin: 0;
    padding: 0;
    border: none;
    font-size: clamp(2rem, 1.6rem + 1.5vw, 3rem);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.035em;
    color: var(--vp-c-text-1);
}

.m-nav-header-desc {
    margin: 0.6em 0 0;
    max-width: 64ch;
    font-size: clamp(1rem, 0.92rem + 0.2vw, 1.12rem);
    line-height: 1.65;
    color: var(--vp-c-text-2);
}

.m-nav-body {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 clamp(24px, 5vw, 48px) clamp(64px, 8vw, 120px);
}
</style>
