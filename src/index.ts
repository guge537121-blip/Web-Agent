import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { getBrowserHostMode } from './desktop-host.js'

export const name = 'web-agent'
export const inject = ['tools', 'browser']

export interface Config {
  readonly deepseekUrl?: string
}

/** M0: expose explicit tools for opening DeepSeek Web and diagnosing the browser host. */
export function apply(ctx: Context, config: Config = {}): void {
  const deepseekUrl = config.deepseekUrl ?? 'https://chat.deepseek.com/'

  ctx.tools.register(defineTool({
    name: 'web_agent_browser_status',
    description: 'Report whether Web-Agent is using an embedded DSH Desktop browser host or the standalone Electron fallback.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          mode: { type: 'string', required: true },
          embedded: { type: 'boolean', required: true },
        },
      },
    },
    timeoutMs: 10_000,
    isConcurrencySafe: () => true,
    async execute() {
      const mode = getBrowserHostMode(ctx)
      return { mode, embedded: mode === 'embedded' }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_open_deepseek',
    description: 'Open the real DeepSeek Web site in the persistent browser. Use this before interacting with DeepSeek Web.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          url: { type: 'string', required: true },
          title: { type: 'string' },
          hostMode: { type: 'string', required: true },
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
        hostMode: getBrowserHostMode(ctx),
      }
    },
  }))
}
