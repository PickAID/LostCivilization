# Cloud In A Bottle Double Jump Design

## Goal

Add a new Curios accessory for this `1.20.1 Forge` modpack with `KubeJS` and the `Curios` API. When the player equips the item in a `charm` slot, they gain one extra jump in midair. The behavior should feel close to a Terraria accessory: one normal jump, one air jump, then reset on landing.

## Scope

This design covers:

- a new KubeJS item: `kubejs:cloud_in_a_bottle`
- Curios integration through the existing `charm` slot
- client detection of a second jump input
- server validation and motion application
- reset logic for each airtime cycle
- basic user-facing name and tooltip

This design does not cover:

- crafting recipes
- particles, custom sounds, or advanced polish
- a custom Curios slot type
- localization beyond the default display text needed for the item

## User Experience

The player gets the item with commands or creative access, equips it in a Curios `charm` slot, and can then perform one extra jump while airborne.

Expected behavior:

- the first jump remains vanilla
- pressing jump again in midair triggers one extra upward boost
- the same airtime cannot trigger a third jump
- landing resets the effect
- the effect is disabled while swimming, in lava, using Elytra flight, riding another entity, or using flight abilities

The item should read clearly in game. The initial display name is `云中瓶`, and the tooltip should explain that it grants one midair jump when equipped in a Curios `charm` slot.

## Technical Context

The target environment is:

- Minecraft `1.20.1`
- Forge
- KubeJS `2001.6.5`
- Curios `5.14.1`

The existing KubeJS scripts are still close to defaults, and `kubejs/server_scripts/example.js` already has local user edits. The implementation must therefore use new dedicated files and must not rewrite the example scripts.

## Architecture

The feature is split into three layers.

### 1. Item Registration

Create the accessory in `startup_scripts`.

Responsibilities:

- register `kubejs:cloud_in_a_bottle`
- set it to stack size `1`
- assign a display name and tooltip
- point the generated item model to a dedicated item texture

This layer only defines the item and its presentation. It does not contain jump logic.

### 2. Curios Slot Integration

Use Curios' built-in `charm` slot instead of creating a new slot type.

Responsibilities:

- add the item to `data/curios/tags/items/charm.json`
- add player entity slot mapping in `data/kubejs/curios/entities/player.json`

This keeps the implementation aligned with Curios' standard validator path. The item becomes wearable in `charm`, and the player is guaranteed to have the slot mapping from datapack data rather than from ad hoc runtime mutation.

### 3. Jump Detection and Validation

Split jump behavior between client and server.

Client responsibilities:

- read the vanilla jump key from `Minecraft.getInstance().options.keyJump`
- detect the rising edge of the key press
- track whether the player has already requested a double jump during the current airtime
- send a KubeJS network packet only for the second jump attempt in midair

Server responsibilities:

- listen for the packet in `server_scripts`
- confirm that the player is still in a valid state
- confirm that the Curios item is equipped
- reject duplicate triggers for the same airtime
- apply the upward velocity and reset fall distance

This split keeps the input responsive while leaving authority on the server.

## Proposed File Layout

The implementation should add these files:

- `kubejs/startup_scripts/cloud_in_a_bottle.js`
- `kubejs/client_scripts/double_jump_client.js`
- `kubejs/server_scripts/double_jump_curio.js`
- `kubejs/data/curios/tags/items/charm.json`
- `kubejs/data/kubejs/curios/entities/player.json`
- `kubejs/assets/kubejs/textures/item/cloud_in_a_bottle.png`

No existing example script should be modified.

## Data Flow

The runtime flow is:

1. The player equips `kubejs:cloud_in_a_bottle` in a Curios `charm` slot.
2. The client watches the vanilla jump key each tick.
3. The player performs a normal jump.
4. While still airborne, the player presses jump again.
5. The client sends a packet on the dedicated channel `kubejs:double_jump`.
6. The server receives the packet and validates:
   - player exists and is alive
   - player is not on the ground
   - player is not in water or lava
   - player is not swimming
   - player is not riding
   - player is not fall flying
   - player is not using flight abilities
   - player has the Curios item equipped
   - player has not already used the double jump this airtime
7. If validation passes, the server applies a new vertical motion and clears fall distance.
8. The server marks the airtime as spent.
9. When the player returns to a reset state, the server and client both clear their per-airtime flags.

## State Model

### Client State

The client should keep lightweight local variables only. These values do not need to persist across relogs or world changes.

Suggested client state:

- whether jump was held on the previous tick
- whether the player has left the ground during the current airtime
- whether a double-jump request has already been sent during the current airtime

The client resets this state when the player:

- lands
- enters water or lava
- starts swimming
- rides another entity
- starts Elytra flight
- uses flight abilities

### Server State

The server should store a single authoritative flag in the player's `persistentData` for the current airtime:

- `kubejsDoubleJumpUsed`

The server clears this flag when the player enters a reset state, especially when grounded. This guarantees that a malicious client cannot chain requests in the same airtime.

## Motion Rules

The extra jump should feel stronger than a small hop but weaker than full creative flight.

The server should:

- preserve horizontal motion
- set the vertical component to `max(currentY, 0.65)`
- reset fall distance immediately after applying the jump

This gives the accessory a clear second-jump feel without launching the player excessively high or punishing an early key press during ascent.

## Curios Validation Strategy

The server should verify equipment through the Curios API instead of trusting client assumptions.

Recommended validation path:

- resolve the item instance for `kubejs:cloud_in_a_bottle`
- ask Curios for the player's equipped curios handler
- check whether the item is equipped, or use Curios helper lookup for the first equipped match

This keeps the gameplay rule server-authoritative and avoids edge cases where the client sends a jump request after the item was removed.

## Error Handling and Failure Modes

The implementation should fail quietly in normal invalid cases. A rejected double-jump packet should simply do nothing.

Cases that should no-op instead of error:

- packet received with no player
- player no longer valid
- item not equipped
- duplicate request for the same airtime
- jump request during water, lava, riding, Elytra, or flight states

Cases that should be logged only during development:

- Curios API lookup failure
- invalid item lookup for `kubejs:cloud_in_a_bottle`

The feature should not spam chat, action bar, or logs during regular play.

## Testing Strategy

This modpack does not currently have an automated KubeJS test harness, so validation will be manual plus syntax-safe implementation.

Required manual checks:

1. Give the item with `/give @p kubejs:cloud_in_a_bottle`.
2. Confirm the item can be placed in a Curios `charm` slot.
3. Confirm one second jump works while airborne.
4. Confirm a third jump in the same airtime does not work.
5. Confirm landing restores the extra jump.
6. Confirm the effect fails while swimming, in lava, riding, Elytra flying, or using flight.
7. Confirm removing the accessory disables the effect immediately.

Implementation should also be verified by:

- reloading KubeJS scripts cleanly
- checking for startup or reload errors in logs
- confirming no unrelated scripts were modified

## Non-Goals for This Iteration

The first version should stay narrow.

Do not add:

- recipes
- custom slot UI
- cooldown bars
- particles or sound effects
- multiple chained jumps
- configuration menus

If later tuning is needed, it should happen after the base version works.

## Implementation Readiness

This design is ready for an implementation plan. The work is small, but it still spans startup, client, server, datapack, and asset paths, so the next step should be a concrete file-by-file plan before code changes begin.
