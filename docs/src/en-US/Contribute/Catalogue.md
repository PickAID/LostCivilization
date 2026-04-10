---
title: Catalogue
description: Contribution entry point for workspace rules and writing standards.
priority: -100
hidden: false
---

# Contribution {#contribution}

This subtree covers workspace rules and writing standards for contributors. It is not a player-facing section.

```mermaid
flowchart LR
    Setup["Setup"] --> Standards["Standards"]
    Standards --> Pages["Permanent pages"]
```

## Check these first {#three-things-to-confirm}

| Question | What must be clear first |
| --- | --- |
| which layer this change belongs to | which subtree owns it: `Design`, `ModdingDeveloping`, `Modpacking`, `Developing`, `Contribute`, or `Changelog` |
| whether files and pages match | the real files in the current instance first, then the permanent pages |
| what else must be synchronized | whether design, implementation, catalogue, or changelog pages also need updates |

If any one of these stays unclear, the change should not be written yet.

## Pages {#what-this-subtree-answers}

| Page | Main question |
| --- | --- |
| `Setup` | the current workspace, common commands, and directory boundaries |
| `Standards` | heading, naming, wording, anchor, and Mermaid rules |

## Minimum steps {#minimum-contribution-loop}

1. Decide which subtree owns the change.
2. Check the real files in the current instance, then update the owning permanent page.
3. Synchronize any other affected pages.
4. Run a docs build and confirm the site still generates.

Do not leave the decision only in chat while postponing the page update.

## Common failures {#common-failures}

1. Updating a local implementation note without writing the change back to the owning entry page.
2. Putting pack-side content into `ModdingDeveloping`.
3. Writing a future repository layout as if it already exists in the current workspace.
4. Changing project boundaries without updating `Changelog`.
