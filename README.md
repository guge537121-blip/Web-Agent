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

浏览器能力采用独立 capability seam，不把 Agent 逻辑绑死在 Electron 私有 API 上。当前设计参考并复用成熟的 `dsh-browser` 分层：`ctx.browser` 能力层、Electron/CDP provider、model-facing browser tools。

## M0 → M4 路线

### M0 — Browser Runtime

目标：先把“真实浏览器 + DeepSeek Web + 持久登录”跑通。

当前已验证：真实浏览器 provider 可以启动独立 Electron 浏览器并打开 DeepSeek Web。

验收标准：

- DSH 插件能够正常加载。
- 启动真实浏览器，而不是 iframe 假页面。
- 自动打开 `https://chat.deepseek.com`。
- 使用持久 profile 保存登录 Cookie。
- 用户可以手动登录 DeepSeek。
- 关闭 DSH 后重新启动，登录状态仍存在。
- 浏览器可以被用户直接接管。

### M0.7 — Native Desktop Browser Host

这是从“独立浏览器”进入“DSH 内嵌真实浏览器”的关键阶段。

Web-Agent 已经支持检测 Desktop 是否提供公开的 `electronViewHost` capability，并把它交给 `dsh-builtin-browser/browser-electron`。Web-Agent 本身不直接访问 Electron API。

```text
Desktop Host provides electronViewHost
              ↓
 dsh-builtin-browser/browser-electron
              ↓
       real Chromium view
              ↓
       DSH Desktop window
```

如果 Desktop 没有提供该 capability，浏览器会安全地退回独立 Electron 窗口；这就是当前 M0 已验证的模式。

`web_agent_browser_status` 可以诊断当前模式：

- `embedded`：目标模式，Desktop 已提供嵌入式 Browser Host。
- `standalone`：当前独立 Electron fallback。

**不要把 standalone 当成 embedded。** 要完成 M0.7，必须由 DSH Desktop Host 实际提供 `electronViewHost`，并通过可视验收确认网页确实位于 DSH 主窗口内。

详见 `docs/DESKTOP-HOST.md`。

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
- 登录状态
- 任务暂停 / 恢复
- 权限确认
- 错误恢复

## 当前原则

1. 不调用 DeepSeek API。
2. 不伪造 DeepSeek 页面。
3. 不用 iframe 冒充 Chromium。
4. 不从第三方插件直接访问 Electron 私有对象。
5. Desktop Host 负责 native browser surface；Web-Agent 负责 Agent、DeepSeek Web Adapter 和工具编排。
6. standalone fallback 保留，避免没有 Desktop Host 时破坏已经可用的浏览器能力。
