---
title: Setup
description: Workspace rules, prerequisites, and documentation commands for the current PrismLauncher instance.
priority: 10
---

# Setup {#environment-setup}

The current development environment is this PrismLauncher instance directory. Documentation, pack content, and local runtime output live together here. `docs/` is the documentation workspace inside that instance, not a separate repository checkout.

## Workspace Rules {#workspace-rules}

Current truth in this workspace follows this order:

| Type | Role | Notes |
| --- | --- | --- |
| real files in the current instance | confirm what is installed, enabled, or missing right now | includes `mods/`, `config/`, `kubejs/`, `tacz/` |
| permanent pages under `docs/src/` | record project rules, terminology, and implementation boundaries | permanent docs must stay synchronized with the live workspace |
| `logs/`, `saves/`, temporary exports | integration evidence | not long-term project truth |

If filesystem state and page content disagree, first find out why the current instance changed, then update the permanent page. Do not overwrite the current state with stale documentation.

The current root is also not a git repository. Treat it as a live integration workspace, not as a source-control boundary.

## Local Prerequisites {#local-prerequisites}

The documentation workspace currently resolves to the following baseline:

| Item | Current requirement or verified version |
| --- | --- |
| Node.js | `>= 20.19.0` |
| package manager | `yarn@1.22.22` |
| current local environment | `node v25.8.1`, `npm 11.11.0`, `yarn 1.22.22` |

`docs/package.json` pins the package manager to `yarn@1.22.22`, so regular documentation commands should use `yarn`.

## Docs Commands {#docs-commands}

Based on the scripts defined in `docs/package.json`, the common commands are:

Install dependencies:

```bash
cd docs
yarn install
```

Daily development:

```bash
cd docs
yarn dev
```

Common maintenance commands:

```bash
cd docs
yarn locale
yarn sidebar
yarn tags
yarn build
```

## Reading Order {#reading-order}

When entering this workspace for the first time, read in this order:

1. `Developing/Catalogue`
2. `ModdingDeveloping/Catalogue`
3. `Design/Catalogue`
4. `Modpacking/Catalogue`
5. `Contribute/Catalogue`

That order fixes boundaries first, then runtime, design, pack integration, and contributor rules. It avoids dropping straight into a leaf page without the project frame.

## Subtree Boundaries {#subtree-boundaries}

| Subtree | Owns |
| --- | --- |
| `Design` | main loop, site model, and object boundaries |
| `ModdingDeveloping` | Forge-side Java runtime, lifecycle, and state ownership |
| `Modpacking` | mod assembly, KubeJS, datapacks, config, and export checks |
| `Developing` | delivery order, stage gates, and documentation discipline |
| `Contribute` | author rules for the current workspace |

`ModdingDeveloping` does not cover KubeJS or pack-side scripting. That work belongs in `Modpacking`. This boundary is fixed.
