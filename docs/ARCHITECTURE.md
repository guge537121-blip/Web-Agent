# Web-Agent Architecture

## 1. Browser capability seam

Browser is an independent capability:

```text
Agent / Tools
     │
     ▼
ctx.browser
     │
     ▼
Browser Provider
     │
 ┌───┴────────────┐
 │                │
Electron/CDP    future provider
```

The seam owns session identity and lifecycle. A provider owns the actual browser implementation.

## 2. Tool layer

The model-facing layer exposes stable browser tools. It should not know whether the backend is Electron, Chromium, remote CDP, or another provider.

Recommended tools:

```text
browser_open
browser_snapshot
browser_a11y
browser_screenshot
browser_click
browser_type
browser_key
browser_scroll
browser_wait
browser_execute
browser_content
browser_list_tabs
browser_switch_tab
browser_close_tab
```

The current `dsh-browser` reference project follows this separation: a `ctx.browser` seam, an Electron provider, and a separate `tool-browser` package. Its bundle patch mounts these components independently.

## 3. DeepSeek Web Adapter

The Adapter is deliberately above Browser Runtime:

```text
Agent Loop
   │
   ▼
DeepSeekWebAdapter
   │
   ▼
ctx.browser
```

It knows DeepSeek-specific page structure. Browser Runtime does not.

## 4. Agent Loop

The Agent Loop is responsible for orchestration only:

```text
observe
  ↓
decide
  ↓
action
  ↓
observe
```

It should not contain Electron calls or DeepSeek selectors.

## 5. DSH Tool Bridge

The bridge resolves an Agent tool request against DSH's existing tool registry:

```text
Web Agent
   │
   ├── browser tool
   ├── filesystem tool
   ├── terminal tool
   └── git tool
```

The bridge must not silently invent or elevate permissions.

## 6. Browser session isolation

Each Agent task gets a browser session identity. A task's browser state must not accidentally leak into another task.

The browser profile should be dedicated to Web-Agent. Do not copy the user's main Chrome profile or password database.

## 7. Desktop integration

Preferred integration order:

1. Use a published DSH Desktop host capability if one is available and stable.
2. Otherwise run a real browser host separately and expose a DSH-compatible viewport/control channel.
3. Do not cast an Electron `Session` as `webContents`.
4. Do not modify dsh-desktop core merely to bypass plugin boundaries.

## 8. Data flow

```text
Human
  │
  ├───────────────┐
  │               │
  ▼               ▼
DSH UI         Real Browser
  │               │
  │          chat.deepseek.com
  │               │
  └──── Agent ────┘
          │
          ▼
      DSH Tools
```

The browser remains a normal web session. The Agent sees structured observations and performs explicit actions.
