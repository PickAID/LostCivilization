# Lost Civilization docs workspace

This directory is the maintained docs workspace for Lost Civilization. It is where permanent project guidance lives after raw notes have been consolidated.

## What lives here

| Path | Role |
| --- | --- |
| `.vitepress/` | site config, theme overrides, locale nav, sidebar config, footer config, and build scripts |
| `src/en-US/` | English authored pages |
| `src/zh-CN/` | Simplified Chinese authored pages |
| `specs/` | approved design sources while they are still useful as implementation references |
| `plans/` | step-by-step execution plans |
| `notes/` | raw discussion, scratch findings, and temporary thinking |

The final reading path is `src/`. `specs/`, `plans/`, and `notes/` are source material, not the long-term public navigation path.

## Site structure

The current site is organized around seven working areas:

- `Developing`
- `ModdingDeveloping`
- `Design`
- `Modpacking`
- `Grouping`
- `Contribute`
- `Changelog`

`Developing` and `ModdingDeveloping` are the main developer surfaces. `Design` explains why the loop works. `Home` stays a showcase shell that routes readers into the real documentation body.

## Page naming

Authored docs pages use `UpperCamelCase`.

Examples:

- `Developing/Architecture.md`
- `ModdingDeveloping/Implementation/SiteRuntime.md`
- `Design/PseudoInstance.md`
- `Contribute/DocsWorkflow.md`

Directory entry pages use supported landing names such as `Catalogue.md` and `root.md` where the sidebar system needs them.

## Local development

This workspace uses `npm`.

```bash
cd docs
npm install
npm run dev
```

Core maintenance commands:

```bash
cd docs
npm run locale
npm run sidebar
npm run build
```

## Writing rules

- Keep `en-US` and `zh-CN` mirrored.
- Write in direct, concrete language.
- Distinguish `confirmed`, `current direction`, and `open question`.
- Do not leave critical strategy trapped in `notes/`, `specs/`, or `plans/` once it has been confirmed.
- Prefer sidebar and nav structure over in-page route dashboards.

## Current working loop

1. capture discussion in `notes/`
2. consolidate decisions in `specs/`
3. write executable work in `plans/`
4. implement in the correct project surface
5. update docs and changelog when the truth changes
