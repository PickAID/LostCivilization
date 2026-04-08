---
title: Recovery
description: Forge-side implementation contract for long-term player knowledge, relic snapshots, and tooltip read rules.
priority: 50
---

# Recovery implementation {#recovery-implementation}

Recovery folds runtime results into long-lived readable data. Three things must stay separate: long-term player knowledge, relic snapshots, and client tooltip reads.

```mermaid
flowchart LR
    Runtime["Runtime ends"] --> Snapshot["Recovery snapshot RecoveredRelicSnapshot"]
    Runtime --> Knowledge["Long-term player knowledge"]
    Snapshot --> Tooltip["Item tooltip ItemTooltipEvent -> RelicTooltipView"]
    Snapshot --> Codex["Record system"]
```

## Verified key boundaries {#verified-key-boundaries}

| Topic | Verified API or event | Conclusion |
| --- | --- | --- |
| player respawn migration | `PlayerEvent.Clone.getOriginal()`, `PlayerEvent.Clone.isWasDeath()` | if knowledge lives on player entity data, it must be copied on death respawn |
| tooltip read | `ItemTooltipEvent.getItemStack()`, `getToolTip()`, `getFlags()` | tooltip should only read saved results |
| null-player tooltip path | `ItemTooltipEvent.getEntity()` may be `null` | rendering cannot depend on live player |
| item NBT read | `ItemStack.getTag()`, `getOrCreateTag()` | snapshots can live directly on item NBT |
| item NBT writeback | `ItemStack.setTag(@Nullable CompoundTag)` | full-tag replacement is possible when needed |
| player initialization | `PlayerEvent.PlayerLoggedInEvent` | missing keys may be initialized on login |

## Data layering {#data-layering}

| Data | Recommended home |
| --- | --- |
| `lc_identification_level` | long-term player data |
| `siteRef`, `siteTypeId`, `ResonanceState`, `patternKey` | relic snapshot |
| codex or statistics results | separate record layer |

## Item snapshot write boundary {#item-snapshot-write-boundary}

The recovery snapshot should live under one root tag on `ItemStack`, not as scattered top-level fields.

```java
public static final String RELIC_RESULT_KEY = "lost_civilization.recovered_relic";
```

Recommended write flow:

1. read `stack.getOrCreateTag()`,
2. write `RecoveredRelicSnapshot` fields under a single root key,
3. do not overwrite unrelated item tags.

That avoids collisions with enchantments, display names, and mod-added item fields.

## Recommended `RecoveredRelicSnapshot` shape {#recovered-relic-snapshot-structure}

```java
public record RecoveredRelicSnapshot(
        String siteRef,
        String siteTypeId,
        ResonanceState state,
        String patternKey
) {}
```

## Suggested snapshot codec shape {#snapshot-codec-shape}

```java
public final class RecoveredRelicSnapshotCodec {
    private RecoveredRelicSnapshotCodec() {
    }

    public static void write(ItemStack stack, RecoveredRelicSnapshot snapshot) {
        CompoundTag root = stack.getOrCreateTag();
        CompoundTag resultTag = new CompoundTag();
        resultTag.putString("site_ref", snapshot.siteRef());
        resultTag.putString("site_type_id", snapshot.siteTypeId());
        resultTag.putString("state", snapshot.state().name());
        resultTag.putString("pattern_key", snapshot.patternKey());
        root.put(RELIC_RESULT_KEY, resultTag);
    }
}
```

Field names don't matter much. What matters is that encoding has exactly one entry point. Otherwise tooltip, recovery, and debug commands will drift into separate formats.

## Long-term player knowledge migration {#player-long-term-knowledge-migration}

If `lc_identification_level` lives on player entity data, keep at least the following subscription:

```java
@SubscribeEvent
public static void onPlayerClone(PlayerEvent.Clone event) {
    if (!event.isWasDeath()) {
        return;
    }

    // copy long-term knowledge from event.getOriginal() to the new player
}
```

Copy long-term knowledge only. Pending short markers and live runtime state must not be copied.

## Tooltip read rules {#tooltip-read-rules}

`ItemTooltipEvent` does not derive results. It only presents them.

```java
@SubscribeEvent
public static void onTooltip(ItemTooltipEvent event) {
    // 1. read RecoveredRelicSnapshot from event.getItemStack()
    // 2. read long-term player knowledge; event.getEntity() may be null
    // 3. call RelicTooltipView.build(...)
    // 4. append lines to event.getToolTip()
}
```

Recommended read rules:

1. try `event.getItemStack().getTag()` first,
2. if the tag does not exist, degrade quietly to the minimum display,
3. if `event.getEntity()` is null, skip player-knowledge enhancement.

## `RelicTooltipView` responsibilities {#relic-tooltip-view-responsibilities}

| Should do | Must not do |
| --- | --- |
| format text from the snapshot and knowledge values | recalculate resonance |
| degrade gracefully when no player is present | access the runtime registry |
| return stable text lines | query the world ledger to decide results |

## Minimum test requirements {#minimum-test-requirements}

| Scenario | Expected result |
| --- | --- |
| tooltip with `player == null` | still shows the minimum information |
| item without result tag | degrades quietly without errors |
| low knowledge level | shows only coarse result information |
| high knowledge level | shows deeper state or pattern information |
| after death and respawn | long-term knowledge remains, short markers do not |

## Constraints {#implementation-red-lines}

1. Live runtime objects must not be serialized as relic results.
2. All recovery data must not be consolidated onto the player entity.
3. Tooltip must not be the only place that carries the result.
4. Multiple incompatible item-snapshot formats must not exist side by side.
