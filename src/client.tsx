import { createElement } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

export const inject = ['slots']

type WebAgentActionProps = PropsRuntime<'sidebar.footer.action'>

let opening = false

function getHostOrigin(): string {
  // DSH's renderer is normally served by the same local webServer that owns
  // the route. Keep this same-origin so no CORS or hard-coded port is needed.
  return window.location.origin
}

async function openWorkspace(): Promise<void> {
  if (opening) return
  opening = true
  const url = `${getHostOrigin()}/web-agent/workspace/open`
  try {
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
    const body = await response.text()
    let result: { ok?: boolean; error?: string } | null = null
    try { result = JSON.parse(body) as { ok?: boolean; error?: string } } catch {}
    if (!response.ok || result?.ok !== true) {
      throw new Error(result?.error ?? `workspace route returned HTTP ${response.status}`)
    }
    console.info('[dsh-web-agent] shared browser workspace opened', result)
  } catch (error) {
    console.error('[dsh-web-agent] workspace request failed', { url, error })
    // Some renderer configurations restrict fetch/XHR. A same-origin hidden
    // iframe still reaches the exact host route and is only a fallback.
    try {
      const frame = document.createElement('iframe')
      frame.hidden = true
      frame.src = `${url}?source=sidebar&t=${Date.now()}`
      document.body.appendChild(frame)
      window.setTimeout(() => frame.remove(), 4000)
    } catch (fallbackError) {
      console.error('[dsh-web-agent] workspace fallback failed', fallbackError)
    }
  } finally {
    window.setTimeout(() => { opening = false }, 500)
  }
}

export function WebAgentAction({ wide }: WebAgentActionProps) {
  return createElement(
    Button,
    {
      variant: 'ghost',
      type: 'button',
      title: 'Web-Agent / DeepSeek',
      'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区',
      'aria-haspopup': 'window',
      'data-wide': wide,
      icon: '🌐',
      onClick: () => { void openWorkspace() },
    },
    wide ? 'Web-Agent' : null,
  )
}

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'web-agent',
    order: 40,
  }, WebAgentAction))
}
