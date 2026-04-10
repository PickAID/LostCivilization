---
title: Catalogue
description: >-
  Design and implementation entry point for the Forge-side ruin system, focused
  on lifecycle, data placement, and runtime structure.
priority: 0
hidden: false
---

# Modding development {#modding-development}

This subtree covers the Forge-side Java runtime only: ruin types, ruin instances, the world ledger, live runtime state, resonance results, recovery snapshots, and client read boundaries. Integration scripts, datapacks, and config overrides are out of scope. The current instance ships `EventJS`, but this subtree does not treat the KubeJS event stack as the starting point for implementation.

```mermaid
flowchart LR
    Design["Design track"] --> Runtime["Runtime model"]
    Implementation["Implementation track"] --> Runtime
    Runtime --> Loop["Early discovery -> formal survey -> activation -> runtime -> resonance -> recovery"]
```

## Verified current state {#verified-current-baseline}

| Item | Current state |
| --- | --- |
| game version | `Minecraft 1.20.1` |
| loader | `Forge` |
| vanilla archaeology chain | `BrushItem.useOn(...)`, `BrushItem.onUseTick(...)`, `BrushableBlockEntity.brush(...)` |
| world-level persistence | `ServerLevel.getDataStorage()` + `DimensionDataStorage.computeIfAbsent(...)` |
| world save checkpoint | `LevelEvent.Save` |
| chunk-side persistence | `ChunkDataEvent.Load` / `ChunkDataEvent.Save` |
| active chunk lifecycle | `ChunkEvent.Load` / `ChunkEvent.Unload` |
| player interaction entry points | brush chain + `PlayerInteractEvent.RightClickItem` / `RightClickBlock` |
| long-term player data migration | `PlayerEvent.Clone` |
| client tooltip | `ItemTooltipEvent` |
| chunk sync supplement | `ChunkWatchEvent.Watch` / `UnWatch` |

## Main objects {#core-object-chain}

This subtree can be read through the following object groups:

| Layer | Objects | Role |
| --- | --- | --- |
| early discovery definitions | `CivilizationShellDefinition`, `EarlyExcavationNodeDefinition` | organize environmental traces, early nodes, and exhaustion rules |
| formal ruin type | `SiteTypeDefinition` | defines host rules, anchor rules, activation, and runtime parameters for one ruin type |
| formal instance reference | `SiteRef`, `DiscoveredSiteRecord` | points to one ledger-backed ruin, not to a type |
| level-saved records | `SiteLedgerSavedData` | stores ruin instances, lifecycle, and covered chunks |
| live state | `SiteRuntimeRegistry`, `ActiveSiteRuntime` | stores short-lived active site state |
| resolved results | `ResonanceResult`, `RecoveredRelicSnapshot` | folds one site event into stable outputs |

The order matters. Type is not instance, instance is not runtime, and runtime is not the recovery result.

## Four state groups {#four-authoritative-state-layers}

This implementation has four state groups:

| State group | Owning object | Lifecycle |
| --- | --- | --- |
| level-saved records | `SiteLedgerSavedData` | tied to the level save |
| live site state | `SiteRuntimeRegistry`, `ActiveSiteRuntime` | exists only while the site is running |
| long-term player knowledge | player long-term data | tied to player progression |
| item-side recovery snapshot | `RecoveredRelicSnapshot` | tied to item flow |

Every implementation question should start by identifying which state group owns the data. Without that answer, the code will eventually mix the ledger, chunk cache, tooltip, and player state together.

## What this subtree answers {#what-this-subtree-answers}

| Topic | Main objects | Key pages |
| --- | --- | --- |
| how early discovery and formal survey split apart | `CivilizationShellDefinition`, `EarlyExcavationNodeDefinition`, `SiteTypeDefinition` | `Design/Survey`, `Implementation/Survey` |
| how ruin instances are located and written into the ledger | `SiteLedgerSavedData`, `SiteRef` | `Design/Survey`, `Implementation/Survey` |
| how activation takes ownership | `ActivationService`, `ActivationAdapter`, `SiteRuntimeBridge`, `SiteRuntimeRegistry` | `Design/Activation`, `Implementation/Activation` |
| how level-saved records, chunk cache, and player short markers are layered | `SavedData`, chunk data, player persistent data | `Implementation/Catalogue`, `Implementation/SiteRuntime` |
| how resonance results are consumed | `ResonanceResolver`, `ResonanceResult` | `Design/Resonance`, `Implementation/Resonance` |
| how recovery results are stored and read | `RecoveredRelicSnapshot`, `RelicTooltipView` | `Design/Recovery`, `Implementation/Recovery` |

## Reading order {#reading-order}

| If you need to solve... | Read first |
| --- | --- |
| early discovery nodes, formal survey boundaries, and location logic | `Design/Survey`, then `Implementation/Survey` |
| activation services, adapters, and runtime handoff | `Design/Activation`, then `Implementation/Activation` |
| world ledger, chunk cache, and tick responsibilities | `Design/SiteRuntime`, then `Implementation/SiteRuntime` |
| resonance evaluation and result consumption | `Design/Resonance`, then `Implementation/Resonance` |
| recovery, tooltip, and long-term knowledge | `Design/Recovery`, then `Implementation/Recovery` |

If the question is "should this field live in the world, the player, or the item," start with `Implementation/Catalogue`, then move to the stage page.

## Writing standard for this subtree {#subtree-writing-standards}

1. Write only Forge lifecycle hooks and method signatures that have been verified.
2. Design pages define objects and rules. They do not perform "thinking out loud."
3. Implementation pages separate `verified`, `recommended`, and `not built yet`.
4. If a topic belongs mainly to the pack side, it does not go here.
5. Any page that talks about state writes must say which of the four state groups owns that state.
