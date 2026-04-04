---
title: 激活
description: 从设计角度定义 ActivationService、适配器层和正式遗址引用到运行态的所有权移交。
priority: 20
---

# 激活 {#activation}

激活阶段的主对象不再是“玩家右键了什么”，而是 `ActivationService`。输入是正式勘探留下的 `SiteRef`，输出是进入 registry 的 `ActiveSiteRuntime`。

```mermaid
flowchart LR
    Adapter["道具 / 方块装置 / 机器适配器"] --> Context["激活上下文 ActivationContext"]
    Context --> Service["激活服务 ActivationService"]
    Service --> Lookup["查找 DiscoveredSiteRecord"]
    Lookup --> Validate["校验 ActivationRule"]
    Validate --> Bridge["运行态桥接 SiteRuntimeBridge"]
    Bridge --> Registry["运行态注册表 SiteRuntimeRegistry"]
    Registry --> Clear["清理待处理引用"]
```

## 激活层回答什么 {#what-the-activation-layer-solves}

| 问题 | 由谁回答 |
| --- | --- |
| 这次提交对应哪一座具体遗址 | `SiteRef` + 世界账本 |
| 这次提交来自什么交互面 | `ActivationContext` + `ActivationSource` |
| 当前是否允许进入运行态 | `ActivationService` |
| 运行态如何创建并登记 | `SiteRuntimeBridge` + `SiteRuntimeRegistry` |

## 激活输入必须是实例引用 {#activation-input-must-be-instance-reference}

如果激活层只拿到 `lost_civilization:contaminated_ruin` 这种类型 id，它无法区分：

- 玩家要开的到底是哪一座遗址；
- 这座遗址是否已经被别人激活；
- 这座遗址是否还处于允许激活的生命周期状态。

因此，激活层消费的是 `SiteRef`，不是类型名。

## 主对象 {#core-object}

```java
public record ActivationContext(
        ServerPlayer player,
        ServerLevel level,
        SiteRef ref,
        ActivationSource source,
        @Nullable BlockPos triggerPos
) {}

public enum ActivationSource {
    ITEM,
    BLOCK_DEVICE,
    MACHINE,
    SCRIPTED
}

public record ActivationResult(
        boolean accepted,
        @Nullable ActiveSiteRuntime runtime,
        @Nullable String rejectReason
) {}
```

这个定义的重点不是字段名，而是职责边界：

- `ActivationContext` 统一携带本次提交所需上下文。
- `ActivationSource` 只说明提交来自哪一类交互面。
- `ActivationResult` 把“成功打开”和“为何拒绝”放在同一个结果对象里。

## 适配器层 {#adapter-layer}

适配器层负责把不同交互面收束成统一上下文。它不是激活逻辑本身。

| 适配器 | 作用 |
| --- | --- |
| 方块装置适配器 | 处理遗址控制台、装置、宿主触发点等提交面 |
| 道具适配器 | 处理探测器、激活器、密钥类道具提交面 |
| 机器适配器 | 处理后续机器化激活或机器考古提交面 |
| 脚本适配器 | 处理特殊事件或剧本触发 |

`RightClickBlock` 和 `RightClickItem` 现在都只是一类适配器入口，不再代表整个激活架构。

## 激活的最小流程 {#minimum-activation-flow}

1. 适配器构造 `ActivationContext`。
2. `ActivationService` 从账本读取 `DiscoveredSiteRecord`。
3. 激活层校验当前来源、触发点和生命周期状态是否满足 `ActivationRule`。
4. 通过后，`SiteRuntimeBridge` 创建并移交 `ActiveSiteRuntime`。
5. `SiteRuntimeRegistry` 接管活状态，并清理待处理引用。

## 状态与清理 {#state-and-cleanup}

| 情况 | 处理方式 |
| --- | --- |
| 引用不存在 | 拒绝激活并清理待处理引用 |
| 引用在别的维度 | 拒绝激活并清理待处理引用 |
| 引用已经有活跃 runtime | 不重复创建 |
| 引用已回收或已中止 | 拒绝激活并清理待处理引用 |
| 玩家换维度或现场所在 level 卸载 | 走运行态收尾，不把活状态留在玩家身上 |

## 设计到代码的映射 {#design-to-code-mapping}

| 设计决定 | 对应对象 |
| --- | --- |
| 统一处理不同提交面 | `ActivationAdapter` |
| 激活主干是服务层 | `ActivationService` |
| 激活输入必须携带实例引用 | `ActivationContext` |
| 运行态打开和登记分开 | `SiteRuntimeBridge`、`SiteRuntimeRegistry` |
| 激活前重验账本状态 | `SiteLedgerSavedData` |
| 玩家离场和维度卸载只做收尾 | `PlayerEvent.PlayerChangedDimensionEvent`、`LevelEvent.Unload` |

## 禁止项 {#prohibited-items}

1. 让激活层重新做勘探判定。
2. 让 `RightClickBlock` 或 `RightClickItem` 代表整个激活架构。
3. 让玩家短标记替代世界账本。
4. 让交互事件自己维护 runtime 主表。
