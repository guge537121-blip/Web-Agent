import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { getBrowserHostMode } from './desktop-host.js'

export const name = 'web-agent'
export const inject = ['tools', 'browser']

export interface Config {
  readonly deepseekUrl?: string
}

function schema(properties: Record<string, unknown>) {
  return { type: 'object', additionalProperties: false, properties }
}

/** M0/M1: DeepSeek Web entry point plus explicit browser-control bridge. */
export function apply(ctx: Context, config: Config = {}): void {
  const deepseekUrl = config.deepseekUrl ?? 'https://chat.deepseek.com/'

  const browser = () => {
    const value = ctx.get('browser')
    if (value === undefined) {
      throw new Error('web-agent: browser service unavailable; check that dsh-builtin-browser is mounted')
    }
    return value
  }

  ctx.tools.register(defineTool({
    name: 'web_agent_browser_status',
    description: 'Report whether Web-Agent is using an embedded DSH Desktop browser host or the standalone Electron fallback.',
    parameters: {},
    output: { schema: schema({ mode: { type: 'string', required: true }, embedded: { type: 'boolean', required: true } }) },
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
    output: { schema: schema({ url: { type: 'string', required: true }, title: { type: 'string' }, hostMode: { type: 'string', required: true } }) },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(_args, exec) {
      const b = browser()
      const session = await b.open(exec?.agent?.id ?? 'web-agent')
      await b.openUrl(session, { url: deepseekUrl }, exec.signal)
      const snapshot = await b.snapshot(session, exec.signal)
      return { url: snapshot.url, ...(snapshot.title !== undefined ? { title: snapshot.title } : {}), hostMode: getBrowserHostMode(ctx) }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_navigate',
    description: 'Navigate the Web-Agent browser session to an HTTP(S) URL.',
    parameters: { url: { type: 'string', required: true }, session: { type: 'string' } },
    output: { schema: schema({ url: { type: 'string', required: true } }) },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser()
      const session = args.session ?? exec?.agent?.id ?? 'web-agent'
      await b.navigate(session, { url: args.url }, exec.signal)
      const snapshot = await b.snapshot(session, exec.signal)
      return { url: snapshot.url }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_snapshot',
    description: 'Read the current Web-Agent page as an AI-friendly semantic snapshot.',
    parameters: { session: { type: 'string' } },
    output: { schema: schema({ url: { type: 'string', required: true }, title: { type: 'string' }, elements: { type: 'array', required: true } }) },
    timeoutMs: 30_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser()
      const session = args.session ?? exec?.agent?.id ?? 'web-agent'
      return b.snapshot(session, exec.signal)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_click',
    description: 'Click a visible element in the Web-Agent browser by CSS/text/XPath target or viewport coordinates.',
    parameters: {
      session: { type: 'string' },
      target: { type: 'object' },
      x: { type: 'number' },
      y: { type: 'number' },
    },
    output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
    timeoutMs: 30_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser()
      const session = args.session ?? exec?.agent?.id ?? 'web-agent'
      if (args.target) await b.click(session, { target: args.target }, exec.signal)
      else if (typeof args.x === 'number' && typeof args.y === 'number') await b.click(session, { x: args.x, y: args.y }, exec.signal)
      else throw new Error('web-agent: click requires target or x/y')
      return { ok: true }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_fill',
    description: 'Fill one or more form fields in the Web-Agent browser.',
    parameters: { session: { type: 'string' }, fields: { type: 'array', required: true }, submit: { type: 'boolean' } },
    output: { schema: schema({ fields: { type: 'array', required: true }, submitted: { type: 'boolean', required: true } }) },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser()
      const session = args.session ?? exec?.agent?.id ?? 'web-agent'
      return b.fill(session, { fields: args.fields, submit: args.submit }, exec.signal)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_key',
    description: 'Press a keyboard key in the Web-Agent browser, such as Enter, Tab or Escape.',
    parameters: { session: { type: 'string' }, key: { type: 'string', required: true } },
    output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
    timeoutMs: 15_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser()
      const session = args.session ?? exec?.agent?.id ?? 'web-agent'
      await b.key(session, { key: args.key }, exec.signal)
      return { ok: true }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'web_agent_scroll',
    description: 'Scroll the Web-Agent browser page.',
    parameters: { session: { type: 'string' }, deltaX: { type: 'number' }, deltaY: { type: 'number' }, toTop: { type: 'boolean' }, toBottom: { type: 'boolean' } },
    output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
    timeoutMs: 15_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser()
      const session = args.session ?? exec?.agent?.id ?? 'web-agent'
      await b.scroll(session, { deltaX: args.deltaX, deltaY: args.deltaY, toTop: args.toTop, toBottom: args.toBottom }, exec.signal)
      return { ok: true }
    },
  }))
}
