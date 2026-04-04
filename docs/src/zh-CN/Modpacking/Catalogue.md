---
title: 目录
description: pack 侧总索引，说明当前实例快照、脚本与数据包边界、TaCZ 基线和第一切片缺口。
priority: -100
---

# 整合包构建 {#modpack-build}

本页定义 pack 侧职责。这里处理的是模组装配、配置塑形、脚本与数据包落点、掉落与进度组织，以及本地导出检查。它不负责遗址运行态本身。

```mermaid
flowchart LR
    Mods["模组栈"] --> Config["配置"]
    Config --> Glue["脚本与数据包胶水"]
    Glue --> Balance["掉落与进度"]
    Balance --> QA["导出与试玩检查"]
```

## 当前实例快照 {#workspace-snapshot}

以下事实已经在当前实例里核对过：

| 项目 | 已确认事实 |
| --- | --- |
| 版本与加载器 | 当前实例是 `1.20.1` `Forge` |
| KubeJS 根目录 | 存在 `kubejs` 与 `local/kubejs` 两个根，但当前主要内容在 `kubejs` |
| 当前脚本计数 | `startup_scripts = 2`，`server_scripts = 0`，`client_scripts = 1` |
| 当前数据资源计数 | `kubejs/data` 当前没有已索引资源，`assets` 有基础示例文件 |
| 事件栈 | `mods/` 中已存在 `EventJS-1.20.1-1.4.0.jar`，但当前索引里还没有 `NativeEvents`、`ServerEvents`、`StartupEvents` 的实际项目用法 |
| TaCZ 主栈 | 已安装 `tacz`、`tacz-tweaks`、`tacz_turrets`、`taczaddon`、`taczammoquery`、`taczjs` |

当前 pack 侧最明显的缺口不是“再挑一批模组”，而是把 `server_scripts` 和 `data` 侧真正补成项目内容。现在的目录结构已经具备入口，但正式遗址逻辑还没有落进去。

## pack 侧职责 {#pack-side-ownership}

pack 侧只接管以下内容：

| 层 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| 模组栈 | 选择依赖、确定可用系统面 | 不写遗址运行态规则 |
| 配置层 | 调整基础行为、手感和默认策略 | 不持有现场真相 |
| 脚本与数据包 | 组织标签、战利品、进度胶水和服务器事件入口 | 不取代正式 runtime 服务 |
| 导出与 QA | 验证实例可启动、可重载、可试玩 | 不替代设计验收 |

如果问题是在问“哪一层负责把内容装进实例”，那是 pack 侧；如果问题是在问“激活后现场如何推进”，那已经越过了这里的边界。

## KubeJS 与数据包边界 {#kubejs-and-datapack-boundaries}

当前实例自带的 `kubejs/README.txt` 已经把几个目录的职责写清楚了，第一切片也应按这个边界落地：

| 目录 | 运行时边界 | 当前状态 |
| --- | --- | --- |
| `kubejs/startup_scripts` | 只在启动时加载，适合启动期注册 | 已有 2 个脚本，但还不是正式遗址逻辑 |
| `kubejs/server_scripts` | 跟随服务端资源重载，适合服务器事件、战利品、标签和配方改动 | 当前为空 |
| `kubejs/data` | 作为 datapack 目录，适合 `loot_tables`、`tags`、`functions` 等服务器资源 | 当前为空 |
| `kubejs/client_scripts` | 跟随客户端资源重载，适合 tooltip 和客户端提示 | 当前只有示例级内容 |

这条边界决定了第一切片应该怎么落：

1. 需要长期进世界资源包的内容，先放进 `kubejs/data`。
2. 需要跟随 `/reload` 快速迭代的服务器胶水，放进 `kubejs/server_scripts`。
3. 客户端提示和视觉辅助只能建立在服务端真相已经存在的前提上，不能反过来当主逻辑。

## TaCZ 基线与作者护栏 {#tacz-baseline-and-guardrails}

当前枪械基线已经成型，不需要再把“是否使用 TaCZ”当成待定问题。

| 路径或模组 | 已确认事实 | 结论 |
| --- | --- | --- |
| `mods/tacz-1.20.1-1.1.7-hotfix2.jar` | 主枪械底座已存在 | 第一切片直接基于它工作 |
| `mods/tacz-tweaks-2.13.1-all.jar`、`mods/tacz_turrets-1.1.2-all.jar`、`mods/taczaddon-1.20.1-1.1.7.jar`、`mods/taczammoquery-1.20.1-1.0.0.jar`、`mods/taczjs-forge-1.4.0+mc1.20.1.jar` | 当前实例已经叠了多层 TaCZ 扩展 | 枪械面已经够宽，第一切片更该收范围，而不是继续加层 |
| `tacz/tacz-pre.toml` | `DefaultPackDebug = false` | 直接改默认包不应作为正式作者流程 |
| `tacz/tacz_default_gun/gunpack.meta.json` | 当前默认枪包 `namespace` 是 `tacz` | 项目自有枪包不应继续复用这个命名空间 |

对应规则如下：

1. 第一切片继续使用共享枪械底座，不拆成多套独立枪械系统。
2. 如果要做正式作者流，优先复制出项目自有 gunpack，而不是直接长期修改 `tacz_default_gun`。
3. 在 `DefaultPackDebug = false` 的前提下，直接改默认包只能视为临时试验，不应写进正式工作流。

## 第一切片的 pack 缺口 {#first-slice-gaps}

按当前实例状态，第一切片还缺以下 pack 侧内容：

| 缺口 | 当前状态 | 第一批落点 |
| --- | --- | --- |
| 宿主与分类标签 | `kubejs/data` 为空 | `kubejs/data/lost_civilization/tags/...` |
| 战利品与进度资源 | 还没有正式遗址资源 | `loot_tables`、`advancements`、必要的 `functions` |
| 服务端胶水 | `kubejs/server_scripts` 为空 | 激活提交、掉落修正、进度推进、服务器事件桥接 |
| 本地 smoke test | 还没有稳定检查清单 | 启动、`/reload`、进入实例、完成一次回收 |

这意味着第一条 pack 路线应当很短：

1. 先固定 TaCZ 作者流和命名空间策略。
2. 再把最小 `data` 资源补齐。
3. 再把最小 `server_scripts` 胶水补齐。
4. 最后再考虑客户端提示、额外武器面和更重的表现层。

## 本页不接管什么 {#non-goals}

- 不接管遗址 runtime 状态机。
- 不接管长期世界账本。
- 不接管现场阶段推进与结算规则。
- 不把客户端提示层写成服务端真相来源。

pack 页的工作，是把项目装配成一个真实可玩的实例，而不是替 runtime 文档做决定。
