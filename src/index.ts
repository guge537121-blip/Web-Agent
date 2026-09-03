import type { Context } from '@deepseek-ai/cordis'

export const name = 'web-agent'
export const inject = ['browser']

export interface Config {
  readonly deepseekUrl?: string
}

/**
 * M0 intentionally does one thing: expose a small, verifiable entry point
 * that can use the shared `ctx.browser` capability. Browser implementation
 * and Electron hosting remain provider-owned; this plugin does not reach into
 * private Electron APIs.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const url = config.deepseekUrl ?? 'https://chat.deepseek.com'
  const browser = ctx.get('browser')

  if (browser === undefined) {
    throw new Error('web-agent: ctx.browser is unavailable; install a compatible browser provider first')
  }

  ctx.command('web-agent.open', 'Open DeepSeek Web in the real browser').action(async ({ options }: any) => {
    const session = await browser.open('web-agent')
    await browser.openUrl(session, { url: options?.url ?? url })
    return `DeepSeek Web opened: ${url}`
  })
}
