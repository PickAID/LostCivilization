---
title: Catalogue
description: Contribution entry point for workspace rules, documentation workflow, and writing standards.
priority: -100
---

# Contribution {#contribution}

This subtree does not explain gameplay design. It explains how to change content in the current workspace without corrupting project truth. The audience here is contributors, not players.

```mermaid
flowchart LR
    Setup["Setup"] --> Standards["Standards"]
    Standards --> Workflow["Docs workflow"]
    Workflow --> Pages["Permanent pages"]
```

## Three Things To Confirm {#three-things-to-confirm}

| Question | What must be clear first |
| --- | --- |
| which layer this change belongs to | which subtree owns it: `Design`, `ModdingDeveloping`, `Modpacking`, `Developing`, `Contribute`, or `Changelog` |
| what the current truth is | the real files in the current instance and the current permanent pages |
| what else must be synchronized | whether design, implementation, workflow, or changelog pages also need updates |

If any one of these stays unclear, the change should not be written yet.

## What This Subtree Answers {#what-this-subtree-answers}

| Page | Main question |
| --- | --- |
| `Setup` | what the current workspace is, which commands to run, and which paths count as current truth |
| `Standards` | heading, naming, wording, anchor, and Mermaid rules |
| `DocsWorkflow` | the order in which one change should be judged, written, and synchronized |

## Minimum Contribution Loop {#minimum-contribution-loop}

1. Decide which subtree owns the change.
2. Check the real files in the current instance and the current permanent pages.
3. Update the owning permanent page.
4. Synchronize any other affected pages.
5. Run a docs build and confirm the site still generates.

The project no longer accepts "the decision lives in chat, the page can be updated later" as a working method.

## Common Failures {#common-failures}

1. Updating a local implementation note without writing the change back to the owning entry page.
2. Putting pack-side content into `ModdingDeveloping`.
3. Writing a future repository layout as if it already exists in the current workspace.
4. Changing project boundaries without updating `Changelog`.
