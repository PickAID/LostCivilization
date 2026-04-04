---
title: 文档工作流
description: 一项改动如何从当前事实进入永久页面，并完成必要的同步与验证。
priority: 30
---

# 文档工作流 {#docs-workflow}

文档工作流的目标只有一个：让项目真相稳定落到永久页面，而不是停留在聊天、草稿或一次性计划里。

```mermaid
flowchart LR
    Fact["当前事实变化"] --> Classify["判断归属"]
    Classify --> Update["更新永久页面"]
    Update --> Sync["同步受影响页面"]
    Sync --> Verify["构建验证"]
    Verify --> Changelog["必要时写更新日志"]
```

## 固定顺序 {#fixed-order}

任何一项稳定变化，都按下面顺序进入文档：

1. 先确认当前事实是否已经发生。
2. 判断这项变化主要属于哪个子树。
3. 修改对应永久页面。
4. 检查是否连带影响其他页面。
5. 跑文档构建。
6. 如果项目边界或长期规则变化，再写 `Changelog`。

这个顺序不能反过来。尤其不能先写 changelog，再去补正文。

## 改动归属表 {#change-routing}

| 变化主要是…… | 先更新哪里 |
| --- | --- |
| 循环意义、对象边界、系统规则 | `Design` |
| Forge 生命周期、数据结构、状态归属 | `ModdingDeveloping` |
| 当前工作区结构、推进顺序、责任划分 | `Developing` |
| KubeJS、数据包、配置、模组装配 | `Modpacking` |
| 环境、写作规则、贡献纪律 | `Contribute` |
| 项目级历史变化 | `Changelog` |

如果一项变化跨了两层，先改主归属页，再补次级页面。

## 同步规则 {#synchronization-rules}

以下情况必须连带同步：

| 主变化 | 至少还要检查什么 |
| --- | --- |
| 设计边界改变 | 对应实现页、入口目录页 |
| 实现对象或状态归属改变 | 对应设计页、入口目录页 |
| pack 侧职责改变 | `Developing` 或 `Contribute` 中的工作区规则 |
| 顶层阅读顺序或责任线改变 | 对应 `Catalogue` 页面和 `Changelog` |

## 不再接受的写法 {#disallowed-patterns}

1. 只更新局部页，不更新入口页。
2. 把稳定结论继续留在 notes、specs、plans 里。
3. 用“以后会拆”“以后会有”来代替当前事实。
4. 页面改完后不跑构建就宣布完成。
