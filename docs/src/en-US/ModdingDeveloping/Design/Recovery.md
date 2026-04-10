---
title: Recovery
description: 'Defines long-term knowledge, item snapshots, and tooltip read boundaries.'
priority: 50
hidden: false
---

# Recovery {#recovery}

Recovery is the serialization boundary. After the site ends, only snapshot data reaches tooltip, codex, and later systems.

```mermaid
flowchart LR
    Runtime["Runtime ends"] --> Snapshot["Relic snapshot"]
    Runtime --> Knowledge["Long-term player knowledge"]
    Snapshot --> Tooltip["Hover tooltip"]
    Snapshot --> Codex["Record system"]
    Knowledge --> Tooltip
    Knowledge --> Codex
```

## Three result types {#three-result-types}

| Layer | Stores |
| --- | --- |
| long-term player layer | identification level, unlocked knowledge, long-term progression |
| relic snapshot layer | `siteRef`, `siteTypeId`, `ResonanceState`, `patternKey` |
| record system layer | long-term records used by codex, history review, and statistics |

Relationship between them:

- the long-term player layer answers what we learned,
- the relic snapshot layer answers what result this item carries out of the site,
- the record layer answers what this expedition leaves in the archive.

The three can reference each other, but they cannot replace each other.

## Long-term player layer rules {#player-long-term-layer-rules}

If knowledge values live on player entity data, death and respawn must copy them through `PlayerEvent.Clone`. Otherwise cross-save persistence and cross-death migration become confused with one another.

## Item snapshot layer rules {#item-snapshot-layer-rules}

Recovered relic snapshots follow the item itself, not the player. Three reasons: relics move through inventories, containers, drops, and trades; tooltip rendering may not have a player object; and a relic's recovered result should not disappear when the holder changes.

Recovery therefore folds the minimum result into the `ItemStack`, not only into player data.

## Tooltip design rules {#tooltip-design-rules}

`ItemTooltipEvent` may build tooltips without a player object. Tooltip is therefore limited to:

- the saved snapshot already attached to the `ItemStack`,
- optional long-term player knowledge,
- fixed view-formatting rules.

Tooltip may not depend on live runtime.

The read order should also stay fixed:

1. read the saved snapshot from `ItemStack`,
2. read optional long-term player knowledge,
3. decide reveal depth using fixed view rules.

Tooltip does not participate in evaluation.

## Minimum snapshot object {#minimum-snapshot-object}

```java
public record RecoveredRelicSnapshot(
        String siteTypeId,
        String siteRef,
        ResonanceState state,
        String patternKey
) {}
```

This object carries only the result that leaves the site. Current stability, guardian counts, covered chunks, and other tick-level state do not belong in the recovered relic snapshot.

## Prohibited items {#prohibited-items}

1. routing every result back through player data,
2. letting tooltip recalculate resonance or site runtime,
3. leaving recovery as a reward screen with no durable technical result,
4. serializing per-tick site state directly into item results.
