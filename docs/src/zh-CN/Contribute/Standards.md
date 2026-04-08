---
title: 规范
description: 贡献者在当前文档工作区中应遵守的命名、锚点、写法和边界规则。
priority: 20
---

# 规范 {#standards}

这里只记录当前已经锁定的文档规范，只写这个站点必须保持一致的规则。

## 文件与标题 {#files-and-headings}

| 项目 | 规则 |
| --- | --- |
| 页面文件名 | 使用 `UpperCamelCase` |
| 分区入口页 | 使用 `Catalogue.md`、`root.md` 等已支持入口名 |
| 多语言结构 | `zh-CN` 与 `en-US` 保持镜像 |
| 标题锚点 | 所有标题使用显式英文锚点，格式为 `标题 {#english-slug}` |

## 导航与 Mermaid {#navigation-and-mermaid}

| 项目 | 规则 |
| --- | --- |
| 站内导航 | 交给 sidebar 和顶部导航，不在正文里再造一套菜单 |
| 分区入口 | 用 `Catalogue` 承担入口职责 |
| Mermaid 文本 | 直接写，不使用 `<div>` 或 HTML 包装 |
| hero 文本 | 可以用 `<br/>`，但 Mermaid 内不用 |

## 写作规则 {#writing-rules}

1. 用"我们"这一人称。
2. 先写对象、阶段、数据结构和边界，再写例子。
3. 用主动语态，不写演示思路或推导表演。
4. 需要区分"已验证事实""当前规则""延后内容"。
5. 如果能落到真实对象名或真实 API，就不要写空泛主题词。

## 边界规则 {#boundary-rules}

| 内容 | 应写到哪里 |
| --- | --- |
| 设计边界、对象关系、主循环规则 | `Design` |
| Forge 运行时、生命周期、数据归属 | `ModdingDeveloping` |
| KubeJS、数据包、配置和模组装配 | `Modpacking` |
| 工作区结构、开发推进和责任线 | `Developing` |
| 贡献规则与写作规则 | `Contribute` |

最常见的错误是把 pack 层内容写进 `ModdingDeveloping`。这条现在已经明确禁止。

## 以什么为准 {#source-of-truth-rules}

1. 当前实例里的真实文件优先。
2. `docs/src/` 下的正式页面记录长期规则和边界。
3. 聊天、草稿和临时计划不是正式文档。
4. 项目规则变了，对应页面就必须同步。
