# Web-Agent

DSH 的真实 DeepSeek Web Agent 插件。

> **核心目标：只安装 `dsh-web-agent`，用户和 Agent 共用同一个真实浏览器工作区。**

Web-Agent 不调用 DeepSeek API，也不模拟 DeepSeek Web。插件使用 DSH 官方 Sidebar Slot 作为入口，并把浏览器运行时、Electron Provider、CDP、Session 与 Agent 浏览器工具作为本插件内部能力组合起来。用户点击 Web-Agent 后创建或恢复一个可见的真实 Electron 浏览器工作区，并打开 `https://chat.deepseek.com/`；Agent 的浏览器工具与用户看到的浏览器使用同一个 Browser Session。

## 单插件架构

```text
DSH
└── dsh-web-agent                         ← 用户唯一安装
     │
     ├── Official DSH Sidebar Slot       ← 入口
     │
     ├── Internal Browser Runtime         ← 从 dsh-browser 拆解/组合
     │      ├── Electron Provider
     │      ├── Remote Electron View Host
     │      ├── Browser Session
     │      └── CDP control
     │
     ├── DeepSeek Web Adapter
     │
     └── Agent Browser Tools
            ├── workspace
            ├── snapshot
            ├── navigate
            ├── click
            ├── fill
            ├── key
            ├── scroll
            └── send_deepseek
```

### 用户看到的和 Agent 操作的是同一个页面

```text
                 workspaceSession
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       用户看到的浏览器       Agent browser tools
             │                   │
             └─────────┬─────────┘
                       ▼
               同一个 DeepSeek
```

Sidebar 只负责触发/恢复这个唯一 Session，不创建 iframe，也不创建第二个 DeepSeek。

## 第三方能力内置原则

本项目的目标是**单插件交付**。因此凡是 Web-Agent 自己用到的第三方实现能力，都作为本插件的内部依赖或源码模块使用，而不是要求用户额外安装对应插件。

### 已内置的浏览器能力

`dsh-browser` 的实现作为内部实现依赖使用，主要利用：

- `BrowserRuntime`
- Electron Browser Provider
- `RemoteElectronViewHost`
- Electron BrowserWindow/WebContentsView
- CDP DOM snapshot 与输入控制
- Browser Session 生命周期

它不再通过 `dsh-builtin-browser` 的独立 bundle 挂载到 DSH，因此不会和 Web-Agent 再产生一个 Browser Loader。

### Sidebar

不再依赖 `dsh-better-sidebar`。Web-Agent 使用 DSH 官方 `sidebar.footer.action` Slot 注册入口。DSH 官方 Sidebar 的 Slot Contract 明确提供这个第三方扩展位置；因此 Web-Agent 可以作为独立插件注册自己的入口，而不需要运行另一个 Sidebar 插件。fileciteturn251file3

### DSH 基础运行时

以下包不是需要用户另外安装的“功能插件”，而是 DSH 插件 API/运行时提供的基础能力，因此 Web-Agent 以 peer dependency 方式声明兼容版本：

- `@deepseek-ai/cordis`
- `@deepseek-ai/dsh-llm`
- `@deepseek-ai/dsh-tools`
- `@deepseek-ai/dsh-system-prompt`
- `@deepseek-ai/schemastery`

Web-Agent 不会把这些运行时复制一份进 DSH，也不会注册第二套 Cordis。

## 安装

只安装 Web-Agent：

```text
dsh plugin --profile desktop add github:guge537121-blip/Web-Agent
```

旧环境如果已经单独安装过以下插件，可以在测试单插件版本前卸载：

```text
dsh-builtin-browser
dsh-web-chat
dsh-better-sidebar
```

然后重启 DSH。

## 使用

1. 启动 DSH。
2. 在官方 Sidebar 中找到 **Web-Agent** 入口。
3. 点击后请求 `/web-agent/workspace/open`。
4. 第一次使用创建可见 Electron 浏览器工作区。
5. 工作区打开 `chat.deepseek.com`。
6. 用户可以直接登录和操作 DeepSeek。
7. Agent 调用 `web_agent_snapshot` / `web_agent_click` / `web_agent_fill` 等工具时，操作的就是这个窗口。

## 工具

| 工具 | 作用 |
|---|---|
| `web_agent_workspace` | 创建/恢复共享浏览器工作区 |
| `web_agent_navigate` | 导航当前工作区 |
| `web_agent_snapshot` | 获取当前页面语义快照 |
| `web_agent_click` | 点击页面元素 |
| `web_agent_fill` | 填写表单 |
| `web_agent_key` | 发送键盘按键 |
| `web_agent_scroll` | 滚动页面 |
| `web_agent_send_deepseek` | 向当前 DeepSeek Web 对话发送消息 |

## DeepSeek Web 发送策略

`web_agent_send_deepseek` 不把 Enter 当作唯一发送手段，而是：

```text
snapshot
  ↓
找到 textarea
  ↓
fill
  ↓
重新 snapshot
  ↓
找到真正的发送按钮
  ↓
click
  ↓
再次 snapshot
  ↓
确认消息离开输入框 / 出现在聊天记录
```

## 开发路线

### M0 — 单插件基础（当前）

- [x] 官方 Sidebar Slot 入口
- [x] 移除 dsh-better-sidebar runtime dependency
- [x] Web-Agent 内部组合 Browser Runtime
- [x] Electron provider 自托管
- [x] 唯一共享 Browser Session
- [x] Agent 工具使用同一 Session
- [x] dsh-browser 不再作为独立 DSH bundle

### M1 — 浏览器工作区

- [ ] 地址栏
- [ ] 后退 / 前进 / 刷新
- [ ] 多标签页
- [ ] 当前标签状态
- [ ] 浏览器工作区恢复

### M2 — 完整 Agent Browser Tools

- [ ] screenshot
- [ ] content
- [ ] execute
- [ ] list/switch/close tabs
- [ ] history/replay
- [ ] auth
- [ ] challenge detection
- [ ] download

### M3 — DeepSeek Web Adapter

- [ ] composer 自动识别
- [x] 发送按钮稳定识别的第一版
- [ ] 生成状态识别
- [ ] 回复提取
- [ ] stop generation
- [ ] 登录状态检测
- [ ] 页面变化兼容层

### M4 — 真正的 Web Agent

```text
DeepSeek Web
     ↓
Agent instruction
     ↓
Web-Agent browser observation
     ↓
Agent decision
     ↓
Browser / DSH tool
     ↓
result
     ↓
DeepSeek Web
```

加入任务循环、权限确认、超时、取消、日志和失败恢复。

## 重要边界

- 不修改 DSH Desktop 源码。
- 不依赖 DSH Desktop 私有 Electron API。
- 不把 iframe 当成真实 Agent 浏览器。
- 不同时创建两个 DeepSeek Session。
- 不要求用户另外安装 `dsh-builtin-browser`。
- 不要求用户另外安装 `dsh-better-sidebar`。
- Electron 子进程属于 Web-Agent 的共享浏览器工作区，不是 Agent 专用的第二个页面。
