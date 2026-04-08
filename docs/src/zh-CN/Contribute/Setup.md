---
title: 环境准备
description: 当前 PrismLauncher 实例下的工作区规则、前置条件和文档命令。
priority: 10
---

# 环境准备 {#environment-setup}

当前开发环境就是这个 PrismLauncher 实例目录。文档、整合内容和本地运行输出放在一起，`docs/` 只是其中的文档工作区，不是独立仓库副本。

## 工作区规则 {#workspace-rules}

当前目录里，以这些内容为准：

| 类型 | 作用 | 备注 |
| --- | --- | --- |
| 当前实例中的真实文件 | 核对当前环境到底装了什么、启用了什么 | 包括 `mods/`、`config/`、`kubejs/`、`tacz/` |
| `docs/src/` 下的正式页面 | 记录项目规则、术语和实现边界 | 永久文档必须与真实工作区同步 |
| `logs/`、`saves/`、临时导出 | 联调证据 | 不作为正式规则来源 |

文件系统和页面内容冲突时，先查明当前实例为什么变了，再改永久页面，不要反过来拿旧文档覆盖现状。

## 本地前置条件 {#local-prerequisites}

已核对的文档工作区前置条件如下：

| 项目 | 当前要求或版本 |
| --- | --- |
| Node.js | `>= 20.19.0` |
| 包管理器 | `yarn@1.22.22` |
| 当前环境实测 | `node v25.8.1`、`npm 11.11.0`、`yarn 1.22.22` |

`docs/package.json` 把 `packageManager` 设成了 `yarn@1.22.22`，日常文档命令以 `yarn` 为准。

## 文档命令 {#docs-commands}

在 [docs/package.json](/Users/gedwen/Library%20/Application%20Support/PrismLauncher/instances/LostCivilization/minecraft/docs/package.json) 定义的命令基础上，当前常用命令如下。

首次安装依赖：

```bash
cd docs
yarn install
```

日常开发：

```bash
cd docs
yarn dev
```

常用维护命令：

```bash
cd docs
yarn locale
yarn sidebar
yarn tags
yarn build
```

## 建议阅读顺序 {#reading-order}

第一次进入这个工作区，建议按下面顺序读：

1. `Developing/Catalogue`
2. `ModdingDeveloping/Catalogue`
3. `Design/Catalogue`
4. `Modpacking/Catalogue`
5. `Contribute/Catalogue`

先确认项目边界，再看运行时、设计、整合和贡献规则，避免一开始就掉进局部页面。

## 子树边界 {#subtree-boundaries}

| 子树 | 负责什么 |
| --- | --- |
| `Design` | 主循环、现场模型和对象边界 |
| `ModdingDeveloping` | Forge 侧 Java 运行时、生命周期和数据归属 |
| `Modpacking` | 模组装配、KubeJS、数据包、配置和导出检查 |
| `Developing` | 推进顺序、阶段门槛和文档纪律 |
| `Contribute` | 当前工作区下的作者规则 |

`ModdingDeveloping` 不讨论 KubeJS 或 pack 侧脚本；那部分应该写回 `Modpacking`。这条边界已经锁定，不再混写。
