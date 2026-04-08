---
title: Standards
description: Naming, anchors, writing rules, and boundary rules for contributors in the current docs workspace.
priority: 20
---

# Standards {#standards}

This page records the documentation standards this site must keep consistent.

## Files and headings {#files-and-headings}

| Item | Rule |
| --- | --- |
| page filenames | use `UpperCamelCase` |
| section entry pages | use supported landing names such as `Catalogue.md` and `root.md` |
| locale structure | keep `en-US` and `zh-CN` mirrored |
| heading anchors | every heading uses an explicit English anchor in the form `Heading {#english-slug}` |

## Navigation and Mermaid {#navigation-and-mermaid}

| Item | Rule |
| --- | --- |
| site navigation | rely on sidebar and top navigation instead of building page-local menus |
| section landing | use `Catalogue` pages as entry points |
| Mermaid text | write labels directly without `<div>` or HTML wrappers |
| hero text | HTML line breaks are acceptable there, but not inside Mermaid |

## Writing rules {#writing-rules}

1. Write in direct, concrete language.
2. Define objects, phases, data structures, and boundaries before examples.
3. Use active voice and do not perform "thinking out loud" in permanent pages.
4. Distinguish verified fact, current rule, and deferred work.
5. If a real object name or verified API exists, use it instead of vague topic words.

## Boundary rules {#boundary-rules}

| Content | Belongs in |
| --- | --- |
| design boundaries, object relations, main-loop rules | `Design` |
| Forge runtime, lifecycle, and state ownership | `ModdingDeveloping` |
| KubeJS, datapacks, config, and mod assembly | `Modpacking` |
| workspace structure, delivery order, and responsibility lines | `Developing` |
| contribution rules and writing rules | `Contribute` |

The most common failure is still putting pack-side work into `ModdingDeveloping`. That is not allowed.

## What counts as current source {#source-of-truth-rules}

1. Real files in the current instance come first.
2. Permanent pages under `docs/src/` record long-term rules and boundaries.
3. Chat, scratch notes, and temporary plans are not formal documentation.
4. When project rules change, the owning page must change with them.
