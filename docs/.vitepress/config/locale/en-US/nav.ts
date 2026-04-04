import type { NavItem, NavPanel } from "../../../utils/config/navTypes";

const moddingDevelopmentPanels: NavPanel[] = [
    {
        featured: {
            title: "Modding Development",
            desc: "Dedicated custom-mod work with separate design and implementation tracks.",
            link: "/ModdingDeveloping/Catalogue",
            media: {
                type: "screenshot",
                background:
                    "linear-gradient(135deg, rgba(38, 62, 76, 0.96) 0%, rgba(129, 85, 43, 0.90) 100%)",
                aspect: "21 / 9",
                alt: "Modding development hub",
            },
        },
        groups: [
            {
                label: "Overview",
                items: [
                    {
                        text: "Catalogue",
                        link: "/ModdingDeveloping/Catalogue",
                        desc: "Why this surface exists and how the work is split.",
                    },
                ],
            },
            {
                label: "Tracks",
                items: [
                    {
                        text: "Design",
                        link: "/ModdingDeveloping/Design/Catalogue",
                        desc: "System intent, behavior targets, and content boundaries.",
                    },
                    {
                        text: "Implementation",
                        link: "/ModdingDeveloping/Implementation/Catalogue",
                        desc: "Code ownership, runtime hooks, and proof slices.",
                    },
                ],
            },
        ],
    },
];

const homeItem: NavItem = {
    text: "Home",
    link: "/",
};

const developingItem: NavItem = {
    text: "Developing",
    link: "/Developing/Catalogue",
};

const groupingItem: NavItem = {
    text: "Grouping",
    link: "/Grouping/Catalogue",
};

const modpackingItem: NavItem = {
    text: "Modpacking",
    link: "/Modpacking/Catalogue",
};

const moddingDevelopmentItem: NavItem = {
    text: "Modding Development",
    dropdown: {
        layout: "spotlight",
        panels: moddingDevelopmentPanels,
    },
};

const designItem: NavItem = {
    text: "Design",
    link: "/Design/Catalogue",
};

const contributeItem: NavItem = {
    text: "Contribute",
    link: "/Contribute/Catalogue",
};

const changelogItem: NavItem = {
    text: "Changelog",
    link: "/Changelog/",
};

const nav: NavItem[] = [
    homeItem,
    developingItem,
    groupingItem,
    modpackingItem,
    moddingDevelopmentItem,
    designItem,
    contributeItem,
    changelogItem,
];

export default nav;
