---
title: 目录
description: 贡献入口，说明当前工作区下的环境规则和写作标准。
priority: -100
hidden: false
---

# 贡献 {#contribution}

这个子树只写当前工作区下的环境规则和写法约束，面向贡献者，不面向玩家。

```mermaid
flowchart LR
    Setup["环境准备"] --> Standards["规范"]
    Standards --> Pages["正式页面"]
```

## 改动前先确认 {#three-things-to-confirm}

| 问题 | 必须先确认什么 |
| --- | --- |
| 这次改动改的是哪一层 | `Design`、`ModdingDeveloping`、`Modpacking`、`Developing`、`Contribute`、`Changelog` 里的哪一层 |
| 当前文件和页面是否一致 | 先看当前实例目录里的真实文件，再看正式页面 |
| 改完后谁要同步 | 是否需要同时更新设计页、实现页、目录页或 `Changelog` |

这三件事有一件没答清，就不应该直接下笔。

## 页面 {#what-this-subtree-answers}

| 页面 | 主要回答什么 |
| --- | --- |
| `Setup` | 当前工作区、常用命令和目录边界 |
| `Standards` | 标题、命名、写法、锚点和 Mermaid 的基本规范 |

## 最小步骤 {#minimum-contribution-loop}

1. 先判断改动属于哪个子树。
2. 再核对当前实例里的真实文件，修改对应正式页面。
3. 必要时同步其他受影响页面。
4. 最后跑文档构建，确认站点仍然能生成。

不要把结论只留在聊天里，页面却不补。

## 当前最常见的错误 {#common-failures}

1. 只改局部实现描述，不回写对应入口页。
2. 把 pack 侧内容写进 `ModdingDeveloping`。
3. 把未来可能存在的目录写成当前已经存在的目录。
4. 改了项目边界，却不更新 `Changelog`。
