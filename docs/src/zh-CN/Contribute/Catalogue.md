---
title: 目录
description: 贡献入口，说明当前工作区下的环境规则、文档工作流和写作标准。
priority: -100
---

# 贡献 {#contribution}

这个子树不负责讲玩法设计，而是负责讲“在当前工作区里，怎么改内容才不会把项目真相写乱”。这里的对象不是玩家，而是贡献者。

```mermaid
flowchart LR
    Setup["环境准备"] --> Standards["规范"]
    Standards --> Workflow["文档工作流"]
    Workflow --> Pages["对应永久页面"]
```

## 贡献前先确认三件事 {#three-things-to-confirm}

| 问题 | 必须先确认什么 |
| --- | --- |
| 这次改动改的是哪一层 | `Design`、`ModdingDeveloping`、`Modpacking`、`Developing`、`Contribute`、`Changelog` 里的哪一层 |
| 当前事实是什么 | 先看当前实例目录里的真实文件和当前永久页面 |
| 改完后谁要同步 | 是否需要同时更新设计页、实现页、流程页或 changelog |

只要这三件事有一件没答清，就不应该直接下笔。

## 这个子树回答什么 {#what-this-subtree-answers}

| 页面 | 主要回答什么 |
| --- | --- |
| `Setup` | 当前工作区是什么、命令怎么跑、哪些路径算当前真相 |
| `Standards` | 标题、命名、写法、锚点和 Mermaid 的基本规范 |
| `DocsWorkflow` | 一项改动从判断到同步应该按什么顺序落地 |

## 贡献时的最小闭环 {#minimum-contribution-loop}

1. 先判断改动属于哪个子树。
2. 再核对当前实例里的真实文件和当前永久页面。
3. 修改对应永久页面。
4. 必要时同步其他受影响页面。
5. 最后跑文档构建，确认站点仍然能生成。

我们现在不接受“先在聊天里说清楚，页面以后再补”的工作方式。

## 当前最常见的错误 {#common-failures}

1. 只改局部实现描述，不回写对应入口页。
2. 把 pack 侧内容写进 `ModdingDeveloping`。
3. 把未来可能存在的目录写成当前已经存在的目录。
4. 改了项目边界，却不更新 `Changelog`。
