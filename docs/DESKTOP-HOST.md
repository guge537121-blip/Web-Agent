# DSH Desktop Browser Host

## Why this exists

`dsh-builtin-browser/browser-electron` supports an optional host capability named `electronViewHost`. When that capability is present, the provider can place a real Electron browser view into the host. When it is absent, the provider uses its `RemoteElectronViewHost` fallback and opens a separate Electron window.

Web-Agent intentionally does not import Electron, `BrowserWindow`, `WebContentsView`, or private DSH Desktop modules. The Desktop host owns those objects.

## Required host contract

The DSH Desktop host needs to expose the public capability under the exact service key:

```ts
ctx.provide('electronViewHost', host)
```

where `host` implements the `ElectronBrowserViewHost` contract exported by `dsh-builtin-browser/browser-electron`.

The existing Web-Agent bundle already passes this capability to the browser provider:

```yaml
- id: browser-electron
  name: dsh-builtin-browser/browser-electron
  config:
    viewHost: !!js ctx.get('electronViewHost')
```

No Electron object should cross the plugin boundary directly. The host should translate the provider's view operations into the Desktop window's `WebContentsView` (or the equivalent supported Electron view primitive), manage bounds/visibility, and dispose views with the session.

## Runtime modes

`web_agent_browser_status` reports:

- `embedded`: Desktop supplied `electronViewHost`; the real Chromium view can be hosted by DSH Desktop.
- `standalone`: no host capability is available; the browser provider uses the separate Electron fallback.

The current DSH Desktop 2.0.4 test result from this project is the `standalone` mode. Do not claim embedded mode until `web_agent_browser_status` returns `embedded` and the view is visibly inside the DSH window.

## Acceptance test

1. Start DSH Desktop.
2. Load Web-Agent.
3. Run `web_agent_browser_status`.
4. The target result is `{ "mode": "embedded", "embedded": true }`.
5. Run `web_agent_open_deepseek`.
6. `chat.deepseek.com` must render inside the DSH Desktop browser surface.
7. Closing the Web-Agent surface must dispose the browser view without closing DSH.
8. Reopening the surface must reuse the persistent browser profile/session.
