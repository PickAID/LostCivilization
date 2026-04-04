import type { App, Component } from "vue";
import {
    comment,
    ArticleMetadata,
    Linkcard,
    ResponsibleEditor,
    MdDialog,
    MdMultiPageDialog,
    CustomAlert,
    ChatPanel,
    ChatMessage,
    Bills,
    MarkMapView,
    VChart,
    ShaderEffectBlock,
} from "@utils/vitepress/componentRegistry/contentRegistry";
import {
    YoutubeVideo,
    BilibiliVideo,
    PdfViewer,
} from "@utils/vitepress/componentRegistry/mediaRegistry";
import { VPTeamMembers, VPTeamPage, VPTeamPageTitle, VPTeamPageSection } from 'vitepress/theme'
import {
    Buttons,
    Carousels,
    Steps,
    Animation,
    Preview,
    NotFound,
} from "@utils/vitepress/componentRegistry/uiRegistry";
import MagicMoveContainer from "@components/ui/MagicMoveContainer.vue";
import { defineAsyncComponent } from "vue";
import { LiteTree } from "@lite-tree/vue";
import { TagsPage } from "@utils/vitepress/componentRegistry/contentRegistry";
import MNavLinks from "@components/navigation/MNavLinks.vue";

type ComponentRegistry = Record<string, Component>;
type LocalRegistryModule = {
    components?: ComponentRegistry;
    default?: ComponentRegistry;
};

const CommitsCounter = defineAsyncComponent(
    () => import("@components/content/CommitsCounter.vue"),
);
const Contributors = defineAsyncComponent(
    () => import("@components/content/Contributors.vue"),
);

const baseComponents: ComponentRegistry = {
    MdCarousel: Carousels,
    VPSteps: Steps,
    YoutubeVideo,
    BilibiliVideo,
    ArticleMetadata,
    Linkcard,
    commitsCounter: CommitsCounter,
    PdfViewer,
    LiteTree,
    MagicMoveContainer,
    Contributors,
    Buttons,
    comment,
    ResponsibleEditor,
    Animation,
    Preview,
    NotFound,
    MdDialog,
    MdMultiPageDialog,
    CustomAlert,
    TagsPage,
    MNavLinks,
    ChatPanel,
    ChatMessage,
    Bills,
    MarkMapView,
    VChart,
    ShaderEffectBlock,
    VPTeamMembers,
    VPTeamPage,
    VPTeamPageTitle,
    VPTeamPageSection
};

const localRegistryModules = import.meta.glob(
    [
        "./componentRegistry/local*.{ts,js}",
        "./componentRegistry/**/*.local.{ts,js}",
        "../../theme/components/**/componentRegistry.local.{ts,js}",
        "../../theme/components/**/components.local.{ts,js}",
    ],
    {
        eager: true,
    },
) as Record<string, LocalRegistryModule>;

function collectRegisteredComponents(): ComponentRegistry {
    const components: ComponentRegistry = { ...baseComponents };
    const componentSources = new Map<string, string>(
        Object.keys(baseComponents).map((name) => [name, "baseComponents"]),
    );

    Object.entries(localRegistryModules)
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([modulePath, module]) => {
            const localComponents = {
                ...(module.default ?? {}),
                ...(module.components ?? {}),
            };

            Object.entries(localComponents).forEach(([name, component]) => {
                if (!component) {
                    return;
                }

                const previousSource = componentSources.get(name);
                if (previousSource) {
                    console.warn(
                        `[components] "${name}" from "${modulePath}" overrides "${previousSource}".`,
                    );
                }

                components[name] = component;
                componentSources.set(name, modulePath);
            });
        });

    return components;
}

/**
 * Registers global components and aliases for VitePress.
 */
export const registerComponents = (app: App) => {
    const components = collectRegisteredComponents();

    Object.entries(components).forEach(([name, component]) => {
        if (component) {
            app.component(name, component);
        }
    });
};
