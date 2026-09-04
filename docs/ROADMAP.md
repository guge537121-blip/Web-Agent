# Web-Agent 新路线（v0.2）

## 最终产品定义

Web-Agent 不是一个“自己画 DeepSeek 聊天 UI”的插件，也不是让 Agent 和用户分别打开两个浏览器。

它提供一个**共享真实浏览器工作区**：点击 DSH 侧边栏的 Web-Agent 入口后，插件创建（或恢复）唯一的 Browser Session，并在可见的 Electron 浏览器工作区中打开 `https://chat.deepseek.com/`。用户和 Agent 永远操作同一个 Session。

```text
DSH Sidebar
    │
    │ 点击 Web-Agent
    ▼
Web-Agent
    │
    └── /web-agent/workspace/open
                │
                ▼
       Browser Session（唯一）
                │
                ▼
        可见 Electron Browser
                │
                ▼
        chat.deepseek.com
                ▲
                │
          Agent browser tools
```

## 为什么重新调整路线

旧路线试图让 Agent 使用 `dsh-builtin-browser`，同时让 `dsh-better-sidebar` 自己显示一个 iframe 浏览器。这会天然形成两个页面：Agent 操作 Electron 页面 A，而用户看到 iframe 页面 B。

现在改为：

1. Web-Agent 自己挂载 Browser Runtime。
2. Web-Agent 自己挂载 Electron Provider。
3. Web-Agent 自己管理唯一的 workspace session。
4. Sidebar 入口只负责触发 workspace 打开/恢复。
5. 所有 `web_agent_*` 工具默认操作这个 workspace session。
6. 不修改 DSH Desktop 源码。
7. 不要求用户额外把 `dsh-builtin-browser` 加入 profile bundle；它作为 Web-Agent 的实现依赖安装，由 Web-Agent 自己组合所需能力。

## 第三方代码/架构采用原则

### dsh-browser

采用其已经验证的 Browser seam + Electron Provider + Remote Electron host 技术路线。该项目的官方结构是：`browser` 提供 `ctx.browser`，`browser-electron` 提供 Electron CDP provider；没有宿主 `electronViewHost` 时，自托管实现启动自己的 Electron 子进程和 BrowserWindow。

Web-Agent 不重复实现 CDP、DOM snapshot、WebContents 调试协议等底层能力，而是将该包作为**内部实现依赖**，通过本仓库自己的 `src/browser.ts` 组合它。

### DSH-better-sidebar

只复用它的“侧边栏入口”思路。Web-Agent 不复制其 iframe BrowserView，因为 iframe 与 `dsh-browser` 的 Electron Session 不是同一个页面，不能满足“用户和 Agent 同页”。

## 当前实现

### Host

`src/browser.ts`

- 如果当前 profile 没有 `browser`，创建 `BrowserRuntime`。
- 注册 `ElectronBrowserProvider`。
- 使用 `RemoteElectronViewHost(defaultHostMainPath())` 自托管真实浏览器。
- 生命周期跟随 Web-Agent plugin fiber。

`src/index.ts`

- `workspaceSession` 是唯一共享 Session。
- `/web-agent/workspace/open` 创建/恢复 Session。
- `web_agent_workspace` 打开或检查共享工作区。
- `web_agent_navigate`、`snapshot`、`click`、`fill`、`key`、`scroll` 默认全部操作共享工作区。
- `web_agent_send_deepseek` 在共享工作区内填写并点击真实发送按钮。

### Client

`src/client.tsx`

- Web-Agent 注册为 Better Sidebar 的一个 tab。
- tab 挂载时 POST `/web-agent/workspace/open`。
- 因此用户点击 Web-Agent 入口后，浏览器工作区立即创建/恢复。
- 不创建 iframe，不创建第二个 DeepSeek 页面。

## 安装要求

Web-Agent 的包依赖中固定 `dsh-builtin-browser` 到经过验证的 commit：

`b26bab0f732ab6300447345a17e6cc42739fa9cc`

这样可以避免上游 master 变化造成不可预测的插件行为。

Electron 由 dsh-browser 自托管 provider 使用。Windows 环境需要确保 Electron runtime 可用；你已经验证过 Electron 44.2.0 可以正常下载并运行。

## 重要的旧配置清理

如果之前单独安装过 `dsh-builtin-browser`，建议从 `desktop` profile 中移除旧的独立 bundle，再只安装 Web-Agent。

不要同时保留两套 `browser` runtime/provider。否则可能出现：

- duplicate loader entry id `browser`
- duplicate provider `electron`
- Agent 被路由到错误的 Browser Session

Web-Agent 自己的 loader entry 使用 `web-agent-browser`，不会再注册名为 `browser` 的 Loader row；`browser` service 由内部 BrowserRuntime 提供。

## 验收顺序

### M0：插件启动

- DSH 正常启动。
- Web-Agent 出现在侧边栏。
- 没有 duplicate loader entry。
- 没有 renderer boot timeout。

### M1：工作区

1. 点击 Web-Agent。
2. 出现可见的 Electron 浏览器工作区。
3. 地址为 `https://chat.deepseek.com/`。
4. 不出现第二个 DeepSeek 页面。
5. 再点击“显示 / 恢复”不会创建新的 Session。

### M2：共享操作

1. 用户在浏览器中登录 DeepSeek。
2. Agent 调用 `web_agent_snapshot` 能看到当前页面。
3. Agent 调用 `web_agent_fill`，用户能在同一个窗口看到输入。
4. Agent 调用 `web_agent_click`，用户能看到同一个按钮被点击。
5. 用户手工输入内容后，Agent 的下一次 snapshot 能看到变化。

### M3：DeepSeek 对话

1. 用户保持登录。
2. Agent 调用 `web_agent_send_deepseek`。
3. 消息必须进入聊天记录，而不是停留在 textarea。
4. Agent 能继续 snapshot/read 当前页面。
5. 用户可以随时接管，不需要重新登录。

## 当前明确不做

- 不修改 DSH Desktop。
- 不实现 DeepSeek API。
- 不模拟 DeepSeek Web UI。
- 不创建第二个 iframe DeepSeek。
- 不同时维护两个 Browser Session。
- 不把整个 DSH-better-sidebar 仓库复制进插件。
- 不把 dsh-browser 的独立 BrowserWindow 当成“Agent 专用窗口”；它就是 Web-Agent 的共享浏览器工作区。

## 后续路线

### M4

补齐共享工作区的浏览器导航栏/标签管理，让用户可以直接操作 URL、后退、前进、刷新和标签。

### M5

补齐 `browser_content`、`browser_screenshot`、`browser_auth`、`browser_challenge`、`browser_history` 等需要的能力，并统一命名为 Web-Agent 工作区工具。

### M6

针对 DeepSeek Web 的动态 UI 做专用 adapter：发送按钮检测、生成状态检测、回复提取、停止生成、附件/图片等。

### M7

增加自动化测试和 Windows 实机验收，确保 Electron runtime、登录态、工作区恢复和插件卸载都不会留下孤儿进程。
