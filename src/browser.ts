import type { Context } from '@deepseek-ai/cordis'
import { BrowserRuntime } from 'dsh-builtin-browser/browser'
import {
  ElectronBrowserProvider,
  RemoteElectronViewHost,
  defaultHostMainPath,
} from 'dsh-builtin-browser/browser-electron'

export const name = 'web-agent-browser'

/**
 * Web-Agent owns the browser composition. If another browser provider is
 * already present, we reuse it instead of registering duplicate `browser`
 * services/providers. Normally this plugin creates the browser seam and the
 * Electron provider itself, so users do not need to install dsh-builtin-browser
 * as a separate bundle.
 */
export function apply(ctx: Context): void {
  if (ctx.get('browser') === undefined) {
    ctx.plugin(BrowserRuntime)
  }

  ctx.inject(['browser'], (browserCtx) => {
    // If an external dsh-builtin-browser already owns a usable provider, do
    // not create a second provider. Otherwise Web-Agent creates its own
    // self-hosted Electron provider and therefore owns the visible workspace.
    const runtime = browserCtx.get('browser') as BrowserRuntime & {
      registerBrowserProvider?: (provider: unknown) => () => void
    }
    if (runtime === undefined || runtime.registerBrowserProvider === undefined) return

    const host = new RemoteElectronViewHost(defaultHostMainPath())
    const unregister = runtime.registerBrowserProvider(new ElectronBrowserProvider(host))

    browserCtx.effect(() => () => {
      unregister()
      host.dispose()
    }, 'web-agent browser workspace')
  })
}
