# Lost Civilization

Lost Civilization is an archaeology-first `Minecraft 1.20.1 Forge` modpack project. The first playable target is one clear loop: `survey -> activate -> local pseudo-instance -> resonance -> recovery`.

## Current confirmed direction

- Version one stays local. The first runtime does not need a separate dungeon dimension.
- `TaCZ` is the shared firearm foundation for both civilization directions.
- The two civilizations should separate through doctrine, resonance behavior, relic coupling, pacing, and presentation, not through two unrelated gun frameworks.
- The permanent project reading path lives in `docs/src/`. `docs/notes/`, `docs/specs/`, and `docs/plans/` are drafting surfaces that can be retired once their content has been merged into the site.

## What this workspace currently contains

This PrismLauncher instance is still a mixed development workspace. It holds the playable sandbox and the authored project guidance in one place while the project is still being split into cleaner repositories.

| Path | What it is now | Long-term home |
| --- | --- | --- |
| `docs/` | VitePress documentation workspace and permanent project guidance | `lost-civilization-docs` |
| `kubejs/`, `config/`, `resourcepacks/` | pack-side integration data, scripts, configs, and overrides | `lost-civilization-pack` |
| `mods/`, `tacz/`, `tacz_backup/` | current curated runtime and firearm-base integration surface | `lost-civilization-pack` |
| future Forge source tree | custom runtime logic such as active site state and resonance resolution | `lost-civilization-core` |
| `saves/`, `logs/`, `crash-reports/`, `screenshots/` | local test output only | local only |

## Verified live integration facts

- The instance already includes `mods/tacz-1.20.1-1.1.7-hotfix2.jar`.
- The workspace already has a live `tacz/` folder with `tacz/tacz-pre.toml` and `tacz/tacz_default_gun/gunpack.meta.json`.
- `tacz/tacz-pre.toml` currently sets `DefaultPackDebug = false`. That means edits to the default gun pack can be overwritten on startup unless the policy is changed before authoring.
- The current KubeJS surface has `2 startup scripts`, `0 server scripts`, and `1 client script`. The first slice still needs real server-side activation glue and datapack JSON.

## Documentation map

The docs live under `docs/`.

- `docs/src/en-US/` and `docs/src/zh-CN/` contain the mirrored permanent pages.
- `docs/specs/` holds approved design sources while they are still useful as references.
- `docs/plans/` holds executable plans.
- `docs/notes/` holds raw discussions and temporary thinking.

Main site sections:

- `Developing` for architecture, repositories, and workflow.
- `ModdingDeveloping` for custom runtime design and implementation.
- `Design` for the archaeology loop, pseudo-instance model, and civilization shell.
- `Modpacking` for pack assembly, TaCZ handling, KubeJS glue, and data work.
- `Grouping` for scope control and work grouping.
- `Contribute` for setup and writing rules.
- `Changelog` for meaningful project shifts.

## Current next implementation targets

The first slice is no longer waiting on concept naming. The next concrete pack and runtime artifacts are:

- `kubejs/server_scripts/lc_player_defaults.js`
- `kubejs/server_scripts/lc_site_activation.js`
- `kubejs/data/lost_civilization/lc_site_profiles/contaminated_ruin.json`
- `kubejs/data/lost_civilization/tags/worldgen/structure/ruin_hosts.json`
- `lost-civilization-core` classes such as `ActiveSiteRuntime`, `SiteRuntimeBridge`, `SitePressure`, `ResonanceResolver`, and `RelicTooltipView`

## Run the docs locally

This workspace already uses `npm` via `docs/package-lock.json`.

```bash
cd docs
npm install
npm run dev
```

Useful maintenance commands:

```bash
cd docs
npm run locale
npm run sidebar
npm run build
```

## Working method

Use the docs as part of the development loop:

1. capture raw discussion in `docs/notes/`
2. consolidate confirmed direction in `docs/specs/`
3. write executable work in `docs/plans/`
4. implement in the correct project surface
5. update docs and changelog when the working truth changes

## License

See [LICENSE](./LICENSE).
