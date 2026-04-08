---
layout: home
title: Lost Civilization
hero:
  name: Lost Civilization
  text: Ruin loop, runtime architecture, and integration workflow docs.<br/>From early discovery to recovery, with design and implementation boundaries.
  tagline: Grounded in the current workspace, covering formal records, runtime state, resonance, recovery, and integration boundaries.
  actions:
    - theme: brand
      text: Developing
      link: /en-US/Developing/Catalogue
    - theme: alt
      text: Modding Development
      link: /en-US/ModdingDeveloping/Catalogue
    - theme: outline
      text: Design
      link: /en-US/Design/Catalogue
  background:
    type: color
    color:
      gradient:
        enabled: true
        type: radial
        center: "24% 16%"
        stops:
          - color:
              light: "rgba(239, 221, 184, 0.98)"
              dark: "rgba(92, 69, 44, 0.90)"
            position: "0%"
          - color:
              light: "rgba(180, 133, 70, 0.82)"
              dark: "rgba(52, 32, 12, 0.94)"
            position: "42%"
          - color:
              light: "rgba(49, 76, 91, 0.96)"
              dark: "rgba(9, 5, 2, 0.99)"
            position: "100%"
    readability:
      mode: auto
      preset: editorial
  waves:
    enabled: true
    height: 144
    animated: true
    opacity: 0.30
  typography:
    type: grouped-float
    motion:
      intensity: 0.46
  colors:
    title:
      light: "#182531"
      dark: "#f0e1c3"
    text:
      light: "#2d4554"
      dark: "#d3e4ea"
    tagline:
      light: "#4f3720"
      dark: "#d4b98d"
features:
  - title: Ruin Loop
    details: Stage contracts, location records, ledger structure, and the structure-versus-biome priority model.
    link: /en-US/Design/ArchaeologyLoop
    linkText: Open Loop
  - title: Early Discovery
    details: Archaeology nodes, early interaction, material pacing, and anti-automation rules.
    link: /en-US/ModdingDeveloping/Design/Survey#early-discovery-nodes
    linkText: Open Early Discovery
  - title: Formal Survey
    details: Site types, formal instance records, registration rules, and the fixed survey order.
    link: /en-US/ModdingDeveloping/Design/Survey#formal-survey
    linkText: Open Formal Survey
  - title: Activation Service
    details: "`ActivationService`, adapters, and the unified handoff from item, device, or machine entry points."
    link: /en-US/ModdingDeveloping/Design/Activation
    linkText: Open Activation
  - title: Site Runtime
    details: World ledger, chunk-side data, sync layers, and the runtime object boundary.
    link: /en-US/ModdingDeveloping/Design/SiteRuntime
    linkText: Open Site Runtime
  - title: Resonance
    details: Doctrine differences, pure evaluation rules, and the path from design to code.
    link: /en-US/ModdingDeveloping/Design/Resonance
    linkText: Open Resonance
  - title: Recovery
    details: Result types, recovery snapshots, tooltip reads, and long-term knowledge flow.
    link: /en-US/ModdingDeveloping/Design/Recovery
    linkText: Open Recovery
  - title: Civilization Shell
    details: Biome traces, outer outposts, murals, fragments, and research-facing signals.
    link: /en-US/Design/CivilizationShell
    linkText: Open Civilization Shell
  - title: Workspace Architecture
    details: Responsibility split across docs, pack content, and the future Java runtime source tree.
    link: /en-US/Developing/Architecture
    linkText: Open Architecture
---

## Current Scope {#current-scope}

- The first formal vertical slice is `early discovery -> formal survey -> activation -> runtime -> resonance -> recovery`. Formal instances, runtime state, and recovery results live in different state groups instead of collapsing into player data, chunk caches, or tooltips.
- `ModdingDeveloping` covers Forge-side Java runtime only. Scripts, configs, datapacks, and mod assembly belong in `Modpacking` and `Developing`.
- Early archaeology stays centered on environmental nodes, brush reveal, extraction, exhaustion, and anti-automation rules. Formal ruins are only recorded after formal survey.
- The project keeps using TaCZ as its gun system. Civilization difference comes through early signals, activation rules, site pressure, resonance results, and recovery results.
