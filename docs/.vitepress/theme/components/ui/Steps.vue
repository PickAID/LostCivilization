<script setup lang="ts">
defineProps<{
    titles: string[]
}>()
</script>

<template>
    <div class="vp-steps">
        <div
            v-for="(title, idx) in titles"
            :key="idx"
            class="vp-steps__item"
        >
            <!-- Left column: badge + connector line -->
            <div class="vp-steps__rail">
                <div class="vp-steps__badge">{{ idx + 1 }}</div>
                <div
                    class="vp-steps__connector"
                    v-if="idx < titles.length - 1"
                />
            </div>

            <!-- Right column: title + slot content -->
            <div class="vp-steps__body">
                <h3 v-if="title" class="vp-steps__title">{{ title }}</h3>
                <div class="vp-steps__content">
                    <slot :name="`step${idx}`" />
                </div>
            </div>
        </div>
    </div>
</template>
