import { createElement } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Context } from '@deepseek-ai/cordis'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

export const inject = ['slots']

type WebAgentActionProps = PropsRuntime<'sidebar.footer.action'>

let opening = false

async function openWorkspace(): Promise<void> {
  if (opening) return
  opening = true
  try {
    const response = await fetch(`${window.location.origin}/web-agent/workspace/open`, {
      method: 'POST',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`[dsh-web-agent] workspace open failed (${response.status})`, body)
      return
    }
    const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
    if (!result?.ok) console.error('[dsh-web-agent] workspace open failed', result?.error ?? result)
  } catch (error) {
    console.error('[dsh-web-agent] workspace request failed', error)
  } finally {
    opening = false
  }
}

function WebAgentAction({ wide }: WebAgentActionProps) {
  return createElement(
    Button,
    {
      variant: 'ghost',
      type: 'button',
      title: 'Web-Agent / DeepSeek',
      'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区',
      'data-wide': wide,
      icon: '🌐',
      onClick: () => { void openWorkspace() },
    },
    wide ? 'Web-Agent' : null,
  )
}

export function apply(ctx: Context): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'web-agent',
    order: 40,
  }, WebAgentAction))
}
