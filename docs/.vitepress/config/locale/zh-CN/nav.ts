import type { NavItem, NavPanel } from "../../../utils/config/navTypes";

const moddingDevelopmentPanels: NavPanel[] = [
    {
        featured: {
            title: "模组开发",
            desc: "自定义模组工作面，内部继续拆成设计线与实现线。",
            link: "/ModdingDeveloping/Catalogue",
            media: {
                type: "screenshot",
                background:
                    "linear-gradient(135deg, rgba(38, 62, 76, 0.96) 0%, rgba(129, 85, 43, 0.90) 100%)",
                aspect: "21 / 9",
                alt: "模组开发主入口",
            },
        },
        groups: [
            {
                label: "入口",
                items: [
                    {
                        text: "目录",
                        link: "/ModdingDeveloping/Catalogue",
                        desc: "说明这个工作面为什么独立存在，以及内部怎样拆分。",
                    },
                ],
            },
            {
                label: "分线",
                items: [
                    {
                        text: "设计",
                        link: "/ModdingDeveloping/Design/Catalogue",
                        desc: "记录系统意图、行为目标与内容边界。",
                    },
                    {
                        text: "实现",
                        link: "/ModdingDeveloping/Implementation/Catalogue",
                        desc: "记录代码归属、运行态钩子与证明切片。",
                    },
                ],
            },
        ],
    },
];

const homeItem: NavItem = {
    text: "首页",
    link: "/",
};

const developingItem: NavItem = {
    text: "开发",
    link: "/Developing/Catalogue",
};

const groupingItem: NavItem = {
    text: "分组",
    link: "/Grouping/Catalogue",
};

const modpackingItem: NavItem = {
    text: "整合包构建",
    link: "/Modpacking/Catalogue",
};

const moddingDevelopmentItem: NavItem = {
    text: "模组开发",
    dropdown: {
        layout: "spotlight",
        panels: moddingDevelopmentPanels,
    },
};

const designItem: NavItem = {
    text: "设计",
    link: "/Design/Catalogue",
};

const contributeItem: NavItem = {
    text: "贡献",
    link: "/Contribute/Catalogue",
};

const changelogItem: NavItem = {
    text: "更新日志",
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
