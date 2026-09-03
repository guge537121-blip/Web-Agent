import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'web-agent'
export const inject = ['tools', 'browser']

export interface Config {
  readonly deepseekUrl?: string
}

/** M0: expose one explicit tool that opens the real DeepSeek Web browser. */
export function apply(ctx: Context, config: Config = {}): void {
  const deepseekUrl = config.deepseekUrl ?? 'https://chat.deepseek.com/'

  ctx.tools.register(defineTool({
    name: 'web_agent_open_deepseek',
    description: 'Open the real DeepSeek Web site in the persistent browser window. Use this before interacting with DeepSeek Web.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          url: { type: 'string', required: true },
          title: { type: 'string' },
        },
      },
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(_args, exec) {
      const browser = ctx.get('browser')
      if (browser === undefined) {
        throw new Error('web-agent: browser service unavailable; check that dsh-builtin-browser is mounted')
      }
      const session = await browser.open(exec?.agent?.id ?? 'web-agent')
      await browser.openUrl(session, { url: deepseekUrl }, exec.signal)
      const snapshot = await browser.snapshot(session, exec.signal)
      return {
        url: snapshot.url,
        ...(snapshot.title !== undefined ? { title: snapshot.title } : {}),
      }
    },
  }))
}
