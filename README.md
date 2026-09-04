# DSH Web-Agent

DSH 的真实 DeepSeek Web Agent 插件。

> **目标：用户只安装 `dsh-web-agent`，点击入口后打开一个独立的可见 Web-Agent 浏览器工作区；用户与 Agent 共用同一个浏览器 Session。**

Web-Agent 不调用 DeepSeek API，也不模拟 DeepSeek Web。浏览器工作区由插件侧的浏览器运行时创建，打开 `https://chat.deepseek.com/`。Agent 的浏览器工具直接操作这个工作区，因此用户看到的页面就是 Agent 正在操作的页面。

## 工作方式

```text
DSH
 │
 └── dsh-web-agent
       │
       ├── Sidebar 入口
       │
       └── Web-Agent Browser Workspace
              │
              ├── 可见 Electron 浏览器
              ├── DeepSeek Web
              └── Shared Browser Session
                     ├── 用户操作
                     └── Agent browser tools
```

这里的“工作区”是一个由 Web-Agent 管理的独立可见浏览器窗口，不是 DSH Desktop 左侧 Sidebar 内的 iframe，也不创建第二个 Agent 专用浏览器。

## 依赖原则

用户侧只需要安装 `dsh-web-agent`。浏览器实现作为 Web-Agent 的运行时依赖使用；不会要求用户再手动安装 `dsh-builtin-browser`、`dsh-better-sidebar`、`dsh-web-chat`。

DSH 的基础运行时（Cordis、Tools 等）由 DSH Profile 提供，Web-Agent 以 peer dependency 声明兼容版本，不复制一套 DSH 运行时。

## 安装

```text
dsh plugin --profile desktop add github:guge537121-blip/Web-Agent
```

如果旧环境已经单独安装了 `dsh-builtin-browser`、`dsh-web-chat` 或 `dsh-better-sidebar`，建议先停用/卸载这些旧插件，再测试 Web-Agent，避免旧 bundle 与 Web-Agent 同时提供浏览器能力。

## 使用

1. 启动 DSH。
2. 点击 **Web-Agent** 入口。
3. Web-Agent 创建或恢复唯一的浏览器工作区。
4. 浏览器打开 `chat.deepseek.com`。
5. 用户可以直接登录、输入和操作。
6. Agent 使用 `web_agent_*` 工具时操作同一个 Session。
7. 再次点击 Web-Agent 不会创建第二个 DeepSeek 工作区。

## Agent 工具

- `web_agent_workspace`：创建/恢复共享工作区
- `web_agent_navigate`：导航当前工作区
- `web_agent_snapshot`：获取页面语义快照
- `web_agent_click`：点击页面元素
- `web_agent_fill`：填写表单
- `web_agent_key`：发送键盘按键
- `web_agent_scroll`：滚动页面
- `web_agent_send_deepseek`：向当前 DeepSeek Web 对话发送消息并验证提交结果

## DeepSeek 发送

`web_agent_send_deepseek` 不把 Enter 当作唯一发送方式，而是优先识别真实发送按钮并点击，然后重新快照验证输入框/聊天记录状态。

## 开发路线

### M0 — 共享浏览器工作区

- [x] Web-Agent Sidebar 入口
- [x] 独立可见浏览器工作区
- [x] 单一共享 Browser Session
- [x] 用户与 Agent 操作同一页面
- [x] DeepSeek Web 默认入口
- [x] 基础 browser 工具
- [x] DeepSeek 发送工具

### M1 — 工作区增强

- [ ] 地址栏
- [ ] 后退 / 前进 / 刷新
- [ ] 多标签
- [ ] 窗口状态恢复
- [ ] 工作区标题与状态指示

### M2 — Agent 能力增强

- [ ] screenshot / content / execute
- [ ] 标签管理
- [ ] 下载
- [ ] 登录态管理
- [ ] challenge 检测
- [ ] 动作回放与失败恢复

### M3 — DeepSeek Web Adapter

- [x] 输入框识别
- [x] 发送按钮识别
- [ ] 生成状态识别
- [ ] 回复提取
- [ ] 停止生成
- [ ] 登录状态检测
- [ ] 页面 DOM 变化兼容

### M4 — Web Agent Loop

```text
DeepSeek Web
     ↓
Agent instruction
     ↓
Workspace snapshot
     ↓
Agent decision
     ↓
Browser action
     ↓
Workspace result
     ↓
DeepSeek Web
```

加入任务循环、权限确认、超时、取消、日志和失败恢复。

## 边界

- 不修改 DSH Desktop。
- 不要求 dsh-better-sidebar。
- 不要求 dsh-web-chat。
- 不要求用户另外安装 dsh-builtin-browser。
- 不创建 Agent 专用的第二个 DeepSeek 页面。
- 不使用 iframe 作为 Agent 的真实浏览器。
- 用户看到的浏览器工作区与 Agent 使用的 Browser Session 必须保持一致。

## 参考实现

浏览器工作区的共享真实浏览器思路参考 `wqty123/dsh-browser`；右侧工作区/Tab 的交互设计参考 `omdsh-dev/DSH-better-sidebar`。两者不是 Web-Agent 的运行时必装插件。
