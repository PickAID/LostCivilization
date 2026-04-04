---
layout: home
title: 失落文明
hero:
  name: 失落文明
  text: 遗址主循环、运行时架构与整合协作技术文档。<br/>从前期发现到回收，覆盖设计定稿与实现边界。
  tagline: 面向当前工作区，收口正式记录、运行态、共鸣、回收与整合边界。
  actions:
    - theme: brand
      text: 开发
      link: /zh-CN/Developing/Catalogue
    - theme: alt
      text: 模组开发
      link: /zh-CN/ModdingDeveloping/Catalogue
    - theme: outline
      text: 设计
      link: /zh-CN/Design/Catalogue
  background:
    type: color
    color:
      gradient:
        enabled: true
        type: radial
        center: "22% 14%"
        animation:
          enabled: true
          type: pulse
          duration: 18
        stops:
          - color:
              light: "rgba(244, 229, 196, 0.99)"
              dark: "rgba(111, 79, 47, 0.92)"
            position: "0%"
          - color:
              light: "rgba(201, 143, 63, 0.88)"
              dark: "rgba(39, 86, 108, 0.92)"
            position: "38%"
          - color:
              light: "rgba(63, 94, 110, 0.98)"
              dark: "rgba(8, 13, 21, 0.99)"
            position: "100%"
    readability:
      mode: auto
      preset: editorial
      strength: 0.78
      mobileBoost: 0.08
  waves:
    enabled: true
    height: 188
    animated: true
    opacity: 0.38
  typography:
    type: grouped-float
    motion:
      intensity: 0.82
      transitionDuration: 920
      transitionDelayStep: 150
  colors:
    title:
      light: "#13212c"
      dark: "#f6e7c6"
    text:
      light: "#274050"
      dark: "#d6e6ec"
    tagline:
      light: "#4a2f15"
      dark: "#dfc08e"
    navText:
      light: "#183142"
      dark: "#f0dfbc"
    navTextHover:
      light: "#5a3615"
      dark: "#ffd79b"
    searchBackground:
      light: "rgba(255, 247, 232, 0.82)"
      dark: "rgba(20, 31, 41, 0.72)"
features:
  - title: 遗址主循环
    details: 汇总阶段定义、定位记录、账本结构与群系和结构的优先级规则。
    link: /zh-CN/Design/ArchaeologyLoop
    linkText: 查看主循环
  - title: 前期发现
    details: 定义可考古节点、早期交互、材料投放路径与反自动化限制。
    link: /zh-CN/ModdingDeveloping/Design/Survey#early-discovery-nodes
    linkText: 查看前期发现
  - title: 正式勘探
    details: 定义遗址类型、实例记录、注册要求与正式勘探的固定优先级。
    link: /zh-CN/ModdingDeveloping/Design/Survey#formal-survey
    linkText: 查看正式勘探
  - title: 激活服务
    details: "围绕 `ActivationService`、适配器与实例引用，统一道具、装置和机器入口。"
    link: /zh-CN/ModdingDeveloping/Design/Activation
    linkText: 查看激活
  - title: 现场运行态
    details: 说明世界账本、chunk 辅助数据、同步分层与运行态对象边界。
    link: /zh-CN/ModdingDeveloping/Design/SiteRuntime
    linkText: 查看运行态
  - title: 共鸣
    details: 规定 doctrine 差异、纯判定层约束与设计到代码的映射关系。
    link: /zh-CN/ModdingDeveloping/Design/Resonance
    linkText: 查看共鸣
  - title: 回收
    details: 定义结果类型、回收快照、tooltip 读取与长期知识迁移规则。
    link: /zh-CN/ModdingDeveloping/Design/Recovery
    linkText: 查看回收
  - title: 文明外壳
    details: 整理群系痕迹、外围据点、壁画、残片与研究资料的接入位置。
    link: /zh-CN/Design/CivilizationShell
    linkText: 查看文明外壳
  - title: 工作区架构
    details: 说明 docs、pack 内容与未来 Java 运行时源码树的责任划分。
    link: /zh-CN/Developing/Architecture
    linkText: 查看架构
  - title: 推进顺序
    details: 固定第一版预算、竖切片顺序与哪些扩张项必须后置。
    link: /zh-CN/Developing/Workflow
    linkText: 查看流程
---

## 当前范围 {#current-scope}

- 第一条正式竖切片固定为 `前期发现 -> 正式勘探 -> 激活 -> 运行态 -> 共鸣 -> 回收`。正式实例、运行态和回收结果分别落在不同权威层，不混写到玩家数据、chunk 缓存或 tooltip。
- `ModdingDeveloping` 只覆盖 Forge 侧 Java 运行时；脚本、配置、数据包和模组装配统一写在 `Modpacking` 与 `Developing`。
- 前期考古维持环境节点、刷扫揭露、提取耗尽和反自动化约束；正式遗址只在正式勘探后入账，不在早期节点阶段创建。
- TaCZ 继续作为共享枪械底座；文明差异落在前期信号、激活条件、现场压力、共鸣结果与回收结果。
