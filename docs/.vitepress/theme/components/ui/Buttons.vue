<template>
    <template v-if="showButtons">
        <button
            v-if="showMobileHint"
            class="floating-button floating-hint-button"
            :title="t.showTools"
            @click="expandMobileButtons"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <polyline points="15 18 9 12 15 6" />
            </svg>
        </button>

        <template v-if="showActionButtons">
            <Transition name="fade">
                <div
                    v-show="showBackTop"
                    class="floating-button top-button"
                    :title="t.backToTop"
                    @click="scrollToTop"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="#ffffff"
                            d="M15.78 15.84S18.64 13 19.61 12c3.07-3 1.54-9.18 1.54-9.18S15 1.29 12 4.36C9.66 6.64 8.14 8.22 8.14 8.22S4.3 7.42 2 9.72L14.25 22c2.3-2.33 1.53-6.16 1.53-6.16m-1.5-9a2 2 0 0 1 2.83 0a2 2 0 1 1-2.83 0M3 21a7.8 7.8 0 0 0 5-2l-3-3c-2 1-2 5-2 5"
                        />
                    </svg>
                </div>
            </Transition>
            <button
                @click="refreshPage"
                class="floating-button refresh-button"
                :title="t.refresh"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="30"
                    height="30"
                    viewBox="0,0,250,250"
                >
                    <g
                        fill="#ffffff"
                        fill-rule="nonzero"
                        stroke="none"
                        stroke-width="1"
                        stroke-linecap="butt"
                        stroke-linejoin="miter"
                        stroke-miterlimit="10"
                        stroke-dasharray=""
                        stroke-dashoffset="0"
                        font-family="none"
                        font-weight="none"
                        font-size="none"
                        text-anchor="none"
                        style="mix-blend-mode: normal"
                    >
                        <g transform="scale(10.66667,10.66667)">
                            <path
                                d="M21,15v-5c0,-3.866 -3.134,-7 -7,-7h-3c-0.552,0 -1,0.448 -1,1v0c0,1.657 1.343,3 3,3h1c1.657,0 3,1.343 3,3v5h-1.294c-0.615,0 -0.924,0.742 -0.491,1.178l3.075,3.104c0.391,0.395 1.03,0.395 1.421,0l3.075,-3.104c0.432,-0.436 0.122,-1.178 -0.492,-1.178z"
                                opacity="0.35"
                            ></path>
                            <path
                                d="M3,9v5c0,3.866 3.134,7 7,7h3c0.552,0 1,-0.448 1,-1v0c0,-1.657 -1.343,-3 -3,-3h-1c-1.657,0 -3,-1.343 -3,-3v-5h1.294c0.615,0 0.924,-0.742 0.491,-1.178l-3.075,-3.105c-0.391,-0.395 -1.03,-0.395 -1.421,0l-3.074,3.105c-0.433,0.436 -0.123,1.178 0.491,1.178z"
                            ></path>
                        </g>
                    </g>
                </svg>
            </button>
            <button
                @click="copyLink"
                class="floating-button copy-button"
                :class="{ copied }"
                :title="t.copyLink"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 1025 1024"
                >
                    <path
                        fill="#ffffff"
                        d="M960.193 1024h-512q-27 0-45.5-18.5t-18.5-45.5V768h224q31 0 55.5-18t34.5-46h166q13 0 22.5-9.5t9.5-22.5t-9.5-22.5t-22.5-9.5h-160V512h160q13 0 22.5-9.5t9.5-22.5t-9.5-22.5t-22.5-9.5h-160V320h256q26 0 45 19t19 45v576q0 26-18.5 45t-45.5 19m-96-192h-320q-13 0-22.5 9.5t-9.5 22.5t9.5 22.5t22.5 9.5h320q13 0 22.5-9.5t9.5-22.5t-9.5-22.5t-22.5-9.5m-288-128h-512q-27 0-45.5-18.5T.193 640V64q0-26 18.5-45t45.5-19h512q27 0 45.5 19t18.5 45v576q0 27-19 45.5t-45 18.5m-96-576h-320q-13 0-22.5 9.5t-9.5 22.5t9.5 22.5t22.5 9.5h320q13 0 22.5-9.5t9.5-22.5t-9.5-22.5t-22.5-9.5m0 192h-320q-13 0-22.5 9.5t-9.5 22.5t9.5 22.5t22.5 9.5h320q13 0 22.5-9.5t9.5-22.5t-9.5-22.5t-22.5-9.5m0 192h-320q-13 0-22.5 9.5t-9.5 22.5t9.5 22.5t22.5 9.5h320q13 0 22.5-9.5t9.5-22.5t-9.5-22.5t-22.5-9.5"
                    />
                </svg>
            </button>
            <button
                v-for="(button, index) in socialButtons"
                :key="button.name"
                @click="openLink(button.link)"
                class="floating-button"
                :class="`${button.name}-button`"
                :title="button.title"
                :style="{
                    bottom: `${90 + index * 50}px`,
                    left: '10px',
                    right: 'auto',
                }"
                v-html="button.icon"
            ></button>
            <button
                @click="goBack"
                class="floating-button back-button"
                :title="t.back"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 48 48"
                >
                    <path
                        fill="#ffffff"
                        fill-rule="evenodd"
                        stroke="#ffffff"
                        stroke-linejoin="round"
                        stroke-width="4"
                        d="M44 40.836q-7.34-8.96-13.036-10.168t-10.846-.365V41L4 23.545L20.118 7v10.167q9.523.075 16.192 6.833q6.668 6.758 7.69 16.836Z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            <button
                @click="scrollToBottom"
                class="floating-button comment-button"
                :title="t.comment"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                >
                    <path
                        fill="#ffffff"
                        d="M6 14h12v-2H6zm0-3h12V9H6zm0-3h12V6H6zM4 18q-.825 0-1.412-.587T2 16V4q0-.825.588-1.412T4 2h16q.825 0 1.413.588T22 4v18l-4-4z"
                    />
                </svg>
            </button>
        </template>
    </template>
</template>

<script setup lang="ts">
    import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
    import { useData, useRouter } from "vitepress";
    import { useSafeI18n } from "@utils/i18n/locale";
    import {
        getSocialButtons,
        getSpecialBackPaths,
        getCopyLinkConfig,
        getLanguageCodes,
    } from "@config/project-config";
    import { resolveBackNavigationTarget } from "@utils/sidebar/runtime";
    import { createViewportState } from "@utils/vitepress/runtime/viewport";
    const { t } = useSafeI18n("buttons-component", {
        backToTop: "Back to Top",
        copyLink: "Copy Link",
        refresh: "Refresh",
        back: "Back",
        comment: "Comment",
        showTools: "Show tools",
    });
    const { frontmatter } = useData();
    const router = useRouter();
    const viewport = createViewportState();
    const showBackTop = ref(false);
    const copied = ref(false);
    const isMobile = computed(() => viewport.isMobile.value);
    const isScrolling = ref(false);
    const mobileExpanded = ref(false);
    const socialButtons = getSocialButtons();
    const specialBackPaths = getSpecialBackPaths();
    const copyLinkConfig = getCopyLinkConfig();
    const langCodes = getLanguageCodes();
    let scrollIdleTimer: number | null = null;
    let mobileExpandTimer: number | null = null;

    function asRecord(value: unknown): Record<string, unknown> | undefined {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return undefined;
        }
        return value as Record<string, unknown>;
    }

    const buttonConfig = computed(() => asRecord(frontmatter.value.buttons));
    const showButtons = computed(() => {
        if (frontmatter.value.buttons === false) return false;
        const enabled = buttonConfig.value?.enabled;
        return enabled !== false;
    });
    const showActionButtons = computed(
        () =>
            showButtons.value &&
            (!isMobile.value || isScrolling.value || mobileExpanded.value),
    );
    const showMobileHint = computed(
        () =>
            showButtons.value &&
            isMobile.value &&
            !isScrolling.value &&
            !mobileExpanded.value,
    );

    const currentPath = computed(() => router.route.path);
    const scrollToTop = () => {
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    const handleScroll = (event?: Event) => {
        if (typeof window !== "undefined") {
            showBackTop.value = window.scrollY > 100;
            if (isMobile.value && Boolean(event)) {
                isScrolling.value = true;
                if (scrollIdleTimer !== null) {
                    window.clearTimeout(scrollIdleTimer);
                }
                scrollIdleTimer = window.setTimeout(() => {
                    isScrolling.value = false;
                }, 1000);
            }
        }
    };
    watch(isMobile, (val) => {
        if (!val) {
            isScrolling.value = false;
            mobileExpanded.value = false;
        }
    });
    const expandMobileButtons = () => {
        if (!isMobile.value || typeof window === "undefined") return;
        mobileExpanded.value = true;
        if (mobileExpandTimer !== null) {
            window.clearTimeout(mobileExpandTimer);
        }
        mobileExpandTimer = window.setTimeout(() => {
            mobileExpanded.value = false;
        }, 4200);
    };
    const copyLink = () => {
        if (typeof window !== "undefined") {
            let currentUrl = window.location.href;
            if (copyLinkConfig.removeLanguage) {
                const langRegex = new RegExp(`\\/(${langCodes.join("|")})\\/`);
                const url = new URL(currentUrl);
                url.pathname = url.pathname.replace(langRegex, "/");
                currentUrl = url.toString();
            }
            navigator.clipboard.writeText(currentUrl).then(() => {
                copied.value = true;
                setTimeout(() => (copied.value = false), 2000);
            });
        }
    };
    const scrollToBottom = () => {
        if (typeof window !== "undefined" && typeof document !== "undefined") {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
            });
        }
    };
    const openLink = (link: string) => {
        if (typeof window !== "undefined") {
            window.open(link, "_blank");
        }
    };
    onMounted(() => {
        if (typeof window !== "undefined") {
            window.addEventListener("scroll", handleScroll, { passive: true });
            handleScroll();
        }
    });
    const refreshPage = () => {
        if (typeof window !== "undefined") {
            window.location.reload();
        }
    };

    const goBack = () => {
        if (typeof window !== "undefined") {
            router.go(
                resolveBackNavigationTarget({
                    configuredBackPath: frontmatter.value.backPath,
                    currentHref: window.location.href,
                    currentPath: currentPath.value,
                    specialBackPaths,
                }),
            );
        }
    };
    onBeforeUnmount(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("scroll", handleScroll);
            if (scrollIdleTimer !== null) {
                window.clearTimeout(scrollIdleTimer);
            }
            if (mobileExpandTimer !== null) {
                window.clearTimeout(mobileExpandTimer);
            }
        }
    });
</script>

<style scoped>
    .floating-button {
        z-index: 999;
        position: fixed;
        right: 20px;
        cursor: pointer;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background-color: var(--button-bg-color);
        border: none;
        padding: 10px;
        box-shadow: 2px 2px 10px 4px rgba(0, 0, 0, 0.15);
        transition:
            background-color 0.25s ease,
            box-shadow 0.25s ease,
            opacity 0.25s ease;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .floating-button:hover {
        background-color: var(--button-hover-color);
        box-shadow: 2px 6px 14px 4px rgba(0, 0, 0, 0.2);
    }
    .floating-button:deep(svg) {
        width: 30px;
        height: 30px;
    }
    .floating-button:focus {
        outline: none;
        background-color: var(--button-hover-color);
    }
    .top-button {
        bottom: 170px;
    }
    .copy-button {
        bottom: 120px;
    }
    .refresh-button {
        bottom: 70px;
    }
    .floating-hint-button {
        bottom: 84px;
        right: 16px;
        width: 42px;
        height: 42px;
        padding: 9px;
        color: #ffffff;
        background: color-mix(in srgb, var(--button-bg-color) 86%, #ffffff 14%);
        border: 1px solid rgba(255, 255, 255, 0.22);
        animation: mobile-hint-pulse 1.8s ease-in-out infinite;
    }
    .floating-hint-button :deep(svg) {
        width: 22px;
        height: 22px;
    }
    .floating-hint-button:hover {
        animation-play-state: paused;
    }
    .comment-button {
        bottom: 20px;
    }
    .back-button {
        bottom: 40px;
        left: 10px !important;
        right: auto !important;
    }
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.5s;
    }
    .fade-enter,
    .fade-leave-to {
        opacity: 0;
    }
    @media (max-width: 768px) {
        .floating-button {
            width: 44px;
            height: 44px;
            right: 16px;
        }
        .floating-hint-button {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    @keyframes mobile-hint-pulse {
        0%,
        100% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(-4px);
        }
    }
</style>
