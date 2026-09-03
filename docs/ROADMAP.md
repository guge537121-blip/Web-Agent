# Web-Agent M0 → M4 Roadmap

## M0 — Browser Runtime

**目标：证明真实浏览器运行链路。**

### 工作项

1. DSH 插件 loader / bundle 正确加载。
2. 注册 `ctx.browser` capability seam。
3. 接入真实 Chromium/Electron provider。
4. 为 Web-Agent 创建独立持久 browser profile。
5. 首次启动打开 `https://chat.deepseek.com`。
6. 用户完成正常网页登录。
7. 重启后验证 Cookie / local storage / session 是否保留。
8. 浏览器可以被用户接管。

### 不做

- 不做 DeepSeek 自动点击。
- 不做 Agent Loop。
- 不做 DSH 工具执行。
- 不修改 dsh-desktop 核心。

### 验收

```text
启动 DSH
  ↓
Web-Agent
  ↓
真实浏览器
  ↓
chat.deepseek.com
  ↓
用户登录
  ↓
退出 DSH
  ↓
重新启动
  ↓
仍保持登录
```

---

## M1 — Browser Control

**目标：让 Agent 能稳定操作真实浏览器。**

### 核心接口

```ts
interface BrowserRuntime {
  open(url?: string): Promise<BrowserSession>
  close(session: BrowserSession): Promise<void>
  snapshot(session: BrowserSession): Promise<BrowserSnapshot>
  screenshot(session: BrowserSession): Promise<BrowserScreenshot>
  click(session: BrowserSession, target: BrowserTarget): Promise<void>
  type(session: BrowserSession, text: string): Promise<void>
  key(session: BrowserSession, key: string): Promise<void>
  scroll(session: BrowserSession, deltaY: number): Promise<void>
  wait(session: BrowserSession, options?: BrowserWaitOptions): Promise<void>
  execute(session: BrowserSession, script: string, args?: unknown[]): Promise<unknown>
}
```

### 原则

- DOM / accessibility 优先。
- ref 优先于坐标。
- 坐标只作为视觉兜底。
- Browser provider 与 tool layer 分离。
- 一个 Agent task 不得意外控制另一个 task 的 browser session。

---

## M2 — DeepSeek Web Adapter

**目标：把浏览器能力变成 DeepSeek Web 能力。**

```text
DeepSeekWebAdapter
├── detectPage
├── getComposer
├── fillPrompt
├── submitPrompt
├── waitUntilComplete
├── readLatestAssistantMessage
└── isGenerating
```

### 重要原则

DeepSeek DOM selector 只能放在 Adapter 中，不能散落到 Browser Runtime、Agent Loop 或 UI。

页面更新时只替换 Adapter。

### 验收

用户输入：

```text
你好，请告诉我现在浏览器的页面标题。
```

Agent 能够：

1. 找到 DeepSeek 输入框。
2. 填入内容。
3. 发送。
4. 等待生成结束。
5. 读取回答。
6. 将结果返回 Agent Loop。

---

## M3 — Agent Loop + DSH Tool Bridge

**目标：形成真正的 Web Agent。**

### 闭环

```text
DeepSeek Web
      ↓
读取模型输出
      ↓
Agent Parser
      ↓
判断是否需要工具
   ↙       ↘
否          是
↓           ↓
结束       DSH Tool
            ↓
         Tool Result
            ↓
      DeepSeek Web
            ↓
         继续推理
```

### 工具层

优先复用 DSH 已有工具注册机制，不重新实现：

- filesystem
- terminal
- git
- browser
- 其他已经安装并授权的 DSH tools

### 必须有的保护

- `maxSteps`
- `timeoutMs`
- cancellation
- duplicate-submit guard
- tool allow-list
- destructive action confirmation
- action log

### 安全边界

Agent 不能因为 Web 页面中的普通文本就获得新的系统权限。工具权限必须来自 DSH 本身的工具注册和用户授权。

---

## M4 — DSH-native UX

**目标：产品化。**

### UI

```text
┌───────────────────────────────────────────────┐
│ Web-Agent                                     │
├───────────────────┬───────────────────────────┤
│ Agent              │ DeepSeek Web             │
│                    │                           │
│ ● Running          │ 真实浏览器画面            │
│                    │                           │
│ Current action     │ [用户可以接管]            │
│ browser_click      │                           │
│                    │                           │
│ Tool log           │                           │
│ terminal → result  │                           │
├───────────────────┴───────────────────────────┤
│ Stop   Pause   Resume   Login   Settings      │
└───────────────────────────────────────────────┘
```

### 设置

- Browser profile
- Default DeepSeek URL
- Agent max steps
- Tool permissions
- Confirmation policy
- Browser viewport
- Debug logging

---

## Milestone 顺序

```text
M0 真实浏览器
 ↓
M1 浏览器控制
 ↓
M2 DeepSeek Web 适配
 ↓
M3 Agent + DSH Tools
 ↓
M4 DSH 原生体验
```

不要跨 milestone 偷跑核心能力。这样每一步都能独立验证，出现问题时可以精确定位在 Browser、Adapter、Agent 或 Tool Bridge。
