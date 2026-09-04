# Native Desktop Browser Host

## Why this exists

M0 currently proves that Web-Agent can open the real DeepSeek Web site through `dsh-builtin-browser`, but the current fallback is a separate Electron window. A third-party DSH plugin must not reach into private Electron `BrowserWindow`/`WebContentsView` objects.

To make the browser a real in-app surface, the Desktop host must expose a small public capability to plugins. The capability owns the native `WebContentsView`; Web-Agent only requests navigation and visibility.

## Required host capability

Recommended service name: `desktopBrowser`.

The plugin-facing contract is intentionally structural:

```ts
interface DesktopBrowserService {
  create(input: {
    id: string
    url: string
    title?: string
  }): Promise<{ id: string }>
  navigate(id: string, url: string): Promise<void>
  show(id: string): Promise<void>
  hide(id: string): Promise<void>
  close(id: string): Promise<void>
  isAvailable(): boolean
}
```

The Desktop main process implements this service with `WebContentsView` (or the current supported native browser surface). The renderer/client never receives the raw Electron object.

## Delivery model

```text
Web-Agent plugin
      |
      | public service
      v
DesktopBrowserService
      |
      | IPC / host-owned bridge
      v
DSH Desktop main process
      |
      v
WebContentsView
      |
      v
chat.deepseek.com
```

The existing `ctx.browser` provider remains the automation layer. The native host service is only the visual delivery surface. This keeps browser automation and UI hosting separate.

## Required DSH Desktop changes

1. Register `desktopBrowser` before plugin activation.
2. Create one host-owned `WebContentsView` per browser surface.
3. Attach/detach the view to the main DSH window when `show`/`hide` is called.
4. Compute the browser view bounds from the DSH content/layout area.
5. Keep all Electron objects in the main process.
6. Expose only the narrow service above to plugins.
7. On plugin unload, destroy the WebContentsView and browser session.

## Compatibility behavior

Web-Agent must continue to work when `desktopBrowser` is absent. In that case it uses the existing real-browser provider, which may open a separate Electron window.

This means the plugin can be installed into ordinary DSH first and automatically gains the in-app surface when a compatible Desktop host is present.

## Security

- Never expose `BrowserWindow`, `WebContents`, `WebContentsView`, `session`, or Electron IPC primitives directly to a plugin.
- DeepSeek login cookies remain in the browser session/profile owned by the browser provider.
- Navigation must remain restricted to the browser provider's existing policy.
- Do not implement the native surface with an iframe and call it a Chromium browser; an iframe is a different capability and is insufficient for the target agent behavior.
