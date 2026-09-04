# Web-Agent

DSH 的真实 DeepSeek Web Agent 插件。

> **核心目标：一个浏览器工作区，用户和 Agent 操作同一个页面。**

Web-Agent 不调用 DeepSeek API，也不模拟 DeepSeek Web。点击 DSH 侧边栏的 Web-Agent 后，插件创建或恢复一个可见的真实 Electron 浏览器工作区，并打开 `https://chat.deepseek.com/`。Agent 的浏览器工具与用户看到的浏览器使用同一个 Browser Session。

## 现在的架构

```text
DSH Sidebar
    │
    ▼
Web-Agent
    │
    ├── Web-Agent Browser Runtime
    │      └── dsh-browser implementation
    │             └── Electron + CDP
    │
    ├── Shared Browser Session
    │      └── chat.deepseek.com
    │
    └── Agent Tools
           ├── snapshot
           ├── navigate
           ├── click
           ├── fill
           ├── key
           ├── scroll
           └── send_deepseek
```

### 为什么不会再出现两个 DeepSeek

旧实现让 Sidebar 自己显示一个网页，同时 Agent 通过 `dsh-builtin-browser` 创建另一个 Electron 页面，因此用户看到的页面和 Agent 操作的页面不是同一个对象。

新实现只有一个 `workspaceSession`：

```text
                 workspaceSession
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       用户看到的窗口        Agent browser tools
             │                   │
             └─────────┬─────────┘
                       ▼
               同一个 DeepSeek
```

Sidebar 入口只负责创建/恢复这个 Session，不创建 iframe，也不创建第二个浏览器。

## 第三方能力整合

Web-Agent 将 `dsh-browser` 作为内部实现依赖，而不是要求用户单独安装 `dsh-builtin-browser` bundle。Web-Agent 自己的 `cordis.patch.yml` 只挂载 `web-agent-browser` 和 `web-agent` 两个 loader entry；浏览器能力由 `src/browser.ts` 组合到本插件中。

采用的 `dsh-browser` 技术路线包括：

- `BrowserRuntime` / `ctx.browser` capability seam
- Electron Browser Provider
- `RemoteElectronViewHost`
- Electron BrowserWindow / WebContentsView
- CDP DOM snapshot / input control
- 会话生命周期

`dsh-better-sidebar` 只作为 Sidebar 扩展点使用。它的 iframe BrowserView 没有被用作 Agent 页面，因为 iframe 与 Electron browser session 不是同一个页面。

## 安装

建议先移除旧的独立 `dsh-builtin-browser` bundle，再安装 Web-Agent：

```text
dsh plugin --profile desktop remove dsh-builtin-browser
dsh plugin --profile desktop add github:guge537121-blip/Web-Agent
```

然后重启 DSH。

如果旧 bundle 没有安装，直接添加 Web-Agent 即可。

> Web-Agent 的 `package.json` 已将 dsh-browser 固定到经过验证的 commit，而不是跟随 master 自动变化。

## 使用

1. 启动 DSH。
2. 点击侧边栏的 **Web-Agent**。
3. 插件自动请求 `/web-agent/workspace/open`。
4. 第一次使用会启动可见 Electron 浏览器工作区。
5. 工作区打开 `chat.deepseek.com`。
6. 你可以直接在这个窗口登录和操作 DeepSeek。
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

这样可以避免“文字已经填进输入框，但实际上没有发送”的问题。

## 开发路线

### M0 — 共享浏览器工作区（当前）

- [x] Web-Agent Sidebar 入口
- [x] Web-Agent 自己组合 Browser Runtime
- [x] Electron provider 自托管
- [x] 唯一共享 Browser Session
- [x] Sidebar 点击创建/恢复工作区
- [x] Agent 工具使用同一 Session

### M1 — 完整浏览器工作区

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
- [ ] 发送按钮稳定识别
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
- 不依赖 Desktop 私有 Electron API。
- 不把 iframe 当成真实 Agent 浏览器。
- 不同时创建两个 DeepSeek Session。
- 不要求用户另外安装 dsh-builtin-browser bundle。
- Electron 子进程属于 Web-Agent 的共享浏览器工作区，不是“Agent 专用的第二个页面”。

## 参考项目

- `wqty123/dsh-browser`：真实可见浏览器、BrowserRuntime、Electron/CDP provider 和人机共享页面的实现基础。
- `omdsh-dev/DSH-better-sidebar`：Sidebar 第三方扩展和 BrowserView UI 的参考。
- `anywhere-labs/dsh-desktop`：DSH Desktop 插件边界和客户端/Host contract 的参考。
