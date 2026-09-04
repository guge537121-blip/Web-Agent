# Desktop Browser Host — obsolete route

This document describes the earlier plan that required modifying DSH Desktop to expose a new `desktopBrowser` capability.

**That is no longer the Web-Agent roadmap.** Web-Agent deliberately does not modify DSH Desktop.

## Current design

Web-Agent owns one visible browser workspace using the self-hosted Electron path already implemented by `dsh-browser`:

```text
Web-Agent Sidebar entry
        ↓
/web-agent/workspace/open
        ↓
Web-Agent Browser Session
        ↓
RemoteElectronViewHost
        ↓
Electron BrowserWindow / WebContentsView
        ↓
chat.deepseek.com
        ↑
Agent browser tools
```

The browser window is not a second Agent-only page. It is the **shared workspace**: the user sees it and the Agent operates the same Browser Session.

## Why the old plan was abandoned

The old plan required a new Desktop-native capability and therefore required changing the Desktop host. The existing `dsh-browser` implementation already has a supported self-hosted fallback, so Web-Agent can reach the product goal without modifying DSH Desktop.

## What Web-Agent does instead

- Uses `dsh-browser` as an internal implementation dependency.
- Mounts `BrowserRuntime` from `src/browser.ts`.
- Creates the Electron provider through `RemoteElectronViewHost`.
- Stores one `workspaceSession` in the Web-Agent Host fiber.
- Opens that session from the Sidebar through the ordinary DSH `webServer` route.
- Sends every Web-Agent browser action to that same session.

## Important distinction

`DSH-better-sidebar`'s iframe browser is intentionally not used as the Agent page. An iframe and the Electron Browser Session are different browser contexts; using both would recreate the original bug where the user sees one DeepSeek page while the Agent controls another.

No DSH Desktop source changes are required by the current roadmap.
