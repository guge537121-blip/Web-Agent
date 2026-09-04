import type { Context } from '@deepseek-ai/cordis'
import { BrowserRuntime } from 'dsh-builtin-browser/browser'
import {
  ElectronBrowserProvider,
  RemoteElectronViewHost,
  defaultHostMainPath,
} from 'dsh-builtin-browser/browser-electron'

export const name = 'web-agent-browser'

/**
 * Compose the browser implementation inside Web-Agent. If another plugin has
 * already provided `browser`, Web-Agent reuses that service and does not add a
 * second Electron provider. In the normal installation this plugin creates
 * the BrowserRuntime and its self-hosted visible Electron provider itself.
 */
export function apply(ctx: Context): void {
  const alreadyProvided = ctx.get('browser') !== undefined
  if (alreadyProvided) return

  ctx.plugin(BrowserRuntime)
  ctx.inject(['browser'], (browserCtx) => {
    const runtime = browserCtx.get('browser') as BrowserRuntime
    const host = new RemoteElectronViewHost(defaultHostMainPath())
    const unregister = runtime.registerBrowserProvider(new ElectronBrowserProvider(host))

    browserCtx.effect(() => () => {
      unregister()
      host.dispose()
    }, 'web-agent browser workspace')
  })
}
