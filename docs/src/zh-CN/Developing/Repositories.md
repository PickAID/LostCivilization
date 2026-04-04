---
title: 仓库
description: 当前单工作区的管理方式，以及后续拆分文档、整合和 Java 运行时的条件。
priority: 30
---

# 仓库 {#repositories}

当前不存在三个已经落地的仓库。现在只有一个联调工作区，也就是 Prism 实例目录本身。文档必须按这个事实写，而不是按未来理想结构写。

```mermaid
flowchart LR
    Workspace["当前单工作区"] --> Docs["文档 docs/"]
    Workspace --> Pack["整合内容 mods / config / kubejs / tacz"]
    Workspace --> Local["本地输出 saves / logs / crash-reports"]
    Workspace --> Future["未来 Java 运行时源码树"]
```

## 当前事实 {#current-facts}

| 事实 | 说明 |
| --- | --- |
| 当前根目录不是独立源码仓库 | 当前以实例目录作为协作根 |
| `docs/` 与 pack 内容共存 | 文档和整合层现在就在同一工作区 |
| Java 运行时还没有独立源码树 | 因此运行时对象只能先在文档里定义边界 |

## 当前管理方式 {#current-management}

| 工作面 | 当前承载位置 | 当前规则 |
| --- | --- | --- |
| 文档面 | `docs/` | 作为长期真相来源维护 |
| 整合面 | `mods/`、`config/`、`kubejs/`、`tacz/` 等 | 只写当前实例真实存在的内容 |
| Java 运行时 | 未来的独立源码树 | 现在先在 `ModdingDeveloping` 中定义对象和契约 |

这三面现在共享一个工作区，但不共享同一套事实描述。

## 何时值得拆分 {#when-to-split}

后续如果要拆，不是先起仓库名，而是先确认责任已经稳定。

| 拆分目标 | 触发条件 | 拆分后应拥有的内容 |
| --- | --- | --- |
| 文档仓库 | 文档需要独立发布、评审和版本线 | `docs/` 与其构建配置 |
| 整合仓库 | pack 需要独立打包、分发和回归 | 模组清单、配置、KubeJS、数据包、资源覆盖 |
| Java 模组仓库 | 运行时类、测试和发布节奏稳定 | `src/main/java`、`src/main/resources`、测试代码 |

## 现在不能提前写死的东西 {#things-not-to-freeze-early}

1. 不能先写三个仓库名，再让正文倒过来配合它们。
2. 不能把未来的 Java 源码目录写成当前目录事实。
3. 不能让 `ModdingDeveloping` 去解释当前 `kubejs/` 目录。

## 判断规则 {#decision-rules}

| 问题 | 先看哪里 |
| --- | --- |
| 这段内容现在落在哪 | 当前工作区中的真实路径 |
| 这段逻辑以后归谁拥有 | 文档面、pack 面或 runtime 面 |
