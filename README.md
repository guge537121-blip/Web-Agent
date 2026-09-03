# Web-Agent

DSH 的真实 DeepSeek Web Agent 插件项目。

## 最终目标

在 DSH Desktop 中运行真实的 `chat.deepseek.com`，用户可以正常登录并继续使用自己的 Web 会话；Agent 同时能够通过真实浏览器进行导航、读取页面、点击、输入、滚动等操作，并逐步接入 DSH 的工具系统。

**不使用 DeepSeek API。**

## 总体架构

```text
DSH Desktop
└── Web-Agent Plugin
    ├── Browser Runtime / Provider
    │      └── Real Chromium / Electron + CDP
    ├── DeepSeek Web Adapter
    │      └── chat.deepseek.com
    ├── Agent Loop
    │      └── observe → decide → act → observe
    └── DSH Tool Bridge
           └── filesystem / terminal / git / other DSH tools
```

浏览器能力采用独立 capability seam，不把 Agent 逻辑绑死在 Electron 私有 API 上。当前设计参考并复用成熟的 `dsh-browser` 分层：`ctx.browser` 能力层、Electron/CDP provider、model-facing browser tools。该项目当前明确提供 Electron provider 与 `browser_*` 工具层。 

## M0 → M4 路线

### M0 — Browser Runtime

目标：先把“真实浏览器 + DeepSeek Web + 持久登录”跑通。

验收标准：

- DSH 插件能够正常加载。
- 启动真实浏览器，而不是 iframe 假页面。
- 自动打开 `https://chat.deepseek.com`。
- 使用独立持久 profile 保存登录 Cookie。
- 用户可以手动登录 DeepSeek。
- 关闭 DSH 后重新启动，登录状态仍存在。
- 浏览器可以被用户直接接管。
- 不修改 dsh-desktop 核心代码。

### M1 — Browser Control

建立稳定的 Agent 浏览器控制接口：

- `browser_open`
- `browser_snapshot`
- `browser_screenshot`
- `browser_click`
- `browser_type`
- `browser_key`
- `browser_scroll`
- `browser_wait`
- 页面内容读取 / DOM 执行
- tab 生命周期

交互优先采用 DOM / accessibility / ref，而不是依赖屏幕坐标。

### M2 — DeepSeek Web Adapter

只针对 DeepSeek Web 做适配，不把 DeepSeek 页面选择器散落在浏览器底层：

```text
DeepSeekWebAdapter
├── detectPage()
├── findComposer()
├── fillPrompt(text)
├── submit()
├── waitForResponse()
├── readAssistantMessage()
└── isGenerating()
```

页面结构变化时只修改 Adapter。

### M3 — Agent Loop + DSH Tool Bridge

实现真正的 Web Agent 闭环：

```text
DeepSeek Web
    ↓ assistant instruction / tool intent
Agent Parser
    ↓
DSH Tool Bridge
    ↓
filesystem / terminal / git / ...
    ↓ result
DeepSeek Web Adapter
    ↓
submit tool result
    ↓
DeepSeek Web
```

必须加入：

- 最大循环次数
- 单次任务超时
- 工具权限边界
- 危险操作确认
- 浏览器与工具调用日志
- stop / cancel
- 防止重复提交

### M4 — DSH-native UX

最终产品化：

- DSH Sidebar / Panel
- 浏览器实时视图
- Agent 状态
- 当前动作
- 工具调用日志
- 暂停 / 继续 / 停止
- 登录状态
- Browser profile 管理
- 权限设置
- 安装包 / 发布配置

## 为什么不用 iframe

DeepSeek Web 的登录态和复杂 Web 应用行为不应该依赖普通 iframe。iframe 会遇到 CSP / X-Frame-Options、第三方 Cookie、跨站存储以及页面弹窗等问题。

本项目核心浏览器必须是真实浏览器上下文，并通过 CDP / WebContents 能力控制页面。

## 为什么不直接修改 dsh-desktop

DSH Desktop 的普通插件边界应该使用公开的 DSH/Cordis 能力。浏览器运行时作为独立 provider 存在，未来如果 Desktop 提供稳定的 `electronViewHost`，可以直接接入；如果没有，则使用独立 Electron/Chromium host + DSH viewport，不把私有 Electron 对象泄漏到普通插件 renderer。

## 开发环境

- Node.js 22+
- pnpm
- DSH Desktop 2.x / 对应 DSH runtime

## 文档

- `docs/ROADMAP.md`：M0 → M4 详细实施计划
- `docs/ARCHITECTURE.md`：模块边界与数据流
- `docs/DEEPSEEK-WEB.md`：DeepSeek Web Adapter 设计
- `docs/SECURITY.md`：浏览器、Cookie、工具权限安全原则
- `docs/TEST-PLAN.md`：每个 milestone 的验收标准

## 当前状态

**项目基线：M0 开工。**

不要把“代码已写”当成“功能已验证”。每个 milestone 都必须在目标 DSH Desktop 环境实际运行后再标记完成。
