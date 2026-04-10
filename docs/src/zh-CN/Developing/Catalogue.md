---
title: 目录
description: 当前工作区结构、责任划分和开发入口的总索引。
priority: 10
hidden: false
---

# 开发 {#development}

这个条目主要帮你判断两件事：当前工作区怎么组织，以及不同类型的问题该先去哪里。具体玩法规则不在这里展开，这里只处理责任线。

```mermaid
flowchart LR
    Architecture["架构"] --> Repositories["工作区与抽离"]
    Architecture --> Modpacking["整合面"]
    Architecture --> Modding["运行时面"]
    Architecture --> Contribute["贡献规则"]
```

## 这个条目能帮你什么 {#scope}

| 问题 | 先读哪里 |
| --- | --- |
| 当前实例里哪些目录代表什么 | `Architecture` |
| 为什么现在还是单工作区 | `Repositories` |
| 文档、pack、runtime 该怎么分线 | `Architecture`，然后去对应条目 |

## 当前责任线 {#current-responsibility-lines}

当前只有一个联调工作区，但责任线现在分成三条：

| 责任线 | 主要内容 |
| --- | --- |
| 文档线 | 设计规则、实现契约和变更记录 |
| pack 线 | 模组装配、配置、KubeJS、数据包和资源覆盖 |
| runtime 线 | Forge 侧存档持久化数据、活跃运行态、同步、共鸣和回收 |

目录可以暂时共存，责任线不能混。

## 判断顺序 {#decision-order}

遇到一个问题时，按下面顺序判断：

1. 它现在真实落在哪个目录。
2. 它长期应该由哪条责任线拥有。
3. 它应该写进哪个条目。
4. 这次改动是否会影响入口页或 changelog。

第二步和第三步没答清之前，不要写具体页面。
