import type { EnhanceAppContext } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import vitepressNprogress from "vitepress-plugin-nprogress";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import TresPlugin from "@tresjs/core";
import { NolebaseInlineLinkPreviewPlugin } from "@nolebase/vitepress-plugin-inline-link-preview/client";
declare const __GIT_CHANGELOG_ENABLED__: boolean;
import vuetify from "./vuetify";
import { registerComponents } from "@utils/vitepress/components";

const FONT_AWESOME_STYLESHEET_ID = "theme-font-awesome";
const FONT_AWESOME_STYLESHEET_HREF =
    "//cdn.bootcss.com/font-awesome/4.3.0/css/font-awesome.min.css";

function ensureClientStylesheet() {
    if (document.getElementById(FONT_AWESOME_STYLESHEET_ID)) {
        return;
    }

    const link = document.createElement("link");
    link.id = FONT_AWESOME_STYLESHEET_ID;
    link.rel = "stylesheet";
    link.href = FONT_AWESOME_STYLESHEET_HREF;
    document.head.appendChild(link);
}

export function enhanceThemeApp(ctx: EnhanceAppContext) {
    if (!import.meta.env.SSR) {
        ensureClientStylesheet();
        ctx.app.use(vuetify);
        ctx.app.use(NolebaseInlineLinkPreviewPlugin);
        if (__GIT_CHANGELOG_ENABLED__) {
            const mod = "@nolebase/vitepress-plugin-git-changelog";
            Promise.all([
                import(/* @vite-ignore */ `${mod}/client`),
                import(/* @vite-ignore */ `${mod}/client/style.css`),
            ]).then(([{ NolebaseGitChangelogPlugin }]) => {
                ctx.app.use(NolebaseGitChangelogPlugin);
            });
        }
    }

    ctx.app.use(TresPlugin);
    DefaultTheme.enhanceApp(ctx);
    vitepressNprogress(ctx);
    enhanceAppWithTabs(ctx.app);
    registerComponents(ctx.app);
}
