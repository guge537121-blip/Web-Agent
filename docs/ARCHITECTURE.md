# Web-Agent Architecture

## 1. Product contract

Web-Agent provides one **shared real-browser workspace**. The user and the Agent never get separate DeepSeek pages.

```text
Sidebar entry
    ↓
Web-Agent workspace
    ↓
one Browser Session
    ↓
visible Electron browser
    ↓
chat.deepseek.com
    ↑
Agent browser actions
```

The sidebar is the entry/control surface. The browser workspace is the actual page surface that both sides share.

## 2. Browser capability seam

Web-Agent uses the `dsh-browser` implementation as an internal dependency:

```text
Web-Agent
    │
    ▼
BrowserRuntime / ctx.browser
    │
    ▼
ElectronBrowserProvider
    │
    ▼
RemoteElectronViewHost
    │
    ▼
Electron BrowserWindow / WebContentsView
```

The implementation is composed by `src/browser.ts`, so users do not need to install the `dsh-builtin-browser` bundle separately.

## 3. Shared session

The host keeps one `workspaceSession` for the lifetime of the Web-Agent plugin fiber.

All of these tools default to that session:

```text
web_agent_workspace
web_agent_navigate
web_agent_snapshot
web_agent_click
web_agent_fill
web_agent_key
web_agent_scroll
web_agent_send_deepseek
```

An explicit session can still be supplied for diagnostic/advanced use, but the normal Web-Agent workflow is intentionally one shared workspace.

## 4. Sidebar integration

The client registers one Better Sidebar tab:

```text
Web-Agent
    ↓
mount tab
    ↓
POST /web-agent/workspace/open
    ↓
create/recover workspace session
```

The tab does not render a second DeepSeek iframe. This is deliberate: the iframe browser supplied by `DSH-better-sidebar` would be a different browser context from the Electron Session used by the Agent.

## 5. DeepSeek Web adapter

DeepSeek-specific behavior remains above the browser layer:

```text
DeepSeek Web behavior
        ↓
Web-Agent tools / adapter
        ↓
ctx.browser
```

The browser provider does not contain DeepSeek selectors. `web_agent_send_deepseek` performs the DeepSeek-specific composer/send-button verification.

## 6. Agent loop

The Agent observes and acts on the same session:

```text
snapshot
   ↓
decide
   ↓
click / fill / key / scroll
   ↓
snapshot
   ↓
continue
```

The human can intervene directly in the visible browser between any two Agent actions.

## 7. Desktop integration boundary

Web-Agent does **not** modify DSH Desktop and does not consume private Electron APIs. It uses the public DSH plugin surface and the self-hosted Electron browser path already provided by `dsh-browser`.

If a compatible external browser service already provides `ctx.browser`, Web-Agent reuses it instead of registering a second browser service.

## 8. Security

- Only HTTP(S) navigation is expected from the browser provider.
- DeepSeek login state stays inside the browser provider's session/profile.
- The plugin does not read the user's normal Chrome/Edge password store.
- The browser window is visible so the user can observe and take over Agent actions.
- Browser provider restrictions remain the authority for navigation and browser actions.

## 9. Roadmap

### M0 — shared workspace

- [x] Sidebar entry
- [x] Internal BrowserRuntime composition
- [x] Self-hosted Electron provider
- [x] One persistent workspace session
- [x] Sidebar opens/reuses the workspace
- [x] Agent tools use the same session

### M1 — full browser workspace

- [ ] Browser toolbar
- [ ] Back / forward / reload
- [ ] Tabs
- [ ] Session restoration

### M2 — full browser tool set

- [ ] screenshot
- [ ] content
- [ ] execute
- [ ] tab management
- [ ] history/replay
- [ ] auth
- [ ] challenge detection
- [ ] download

### M3 — DeepSeek Web adapter

- [ ] composer detection
- [ ] stable submit detection
- [ ] generation-state detection
- [ ] assistant reply extraction
- [ ] stop generation

### M4 — Web Agent loop

```text
DeepSeek Web
     ↓
Agent instruction
     ↓
observe
     ↓
decide
     ↓
act
     ↓
DSH tool / browser
     ↓
result
     ↓
DeepSeek Web
```
