import { createElement } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

export const inject = ['slots']
type WebAgentActionProps = PropsRuntime<'sidebar.footer.action'>

function openWorkspace(): void {
  const url = `${window.location.origin}/web-agent/workspace/open?source=sidebar&t=${Date.now()}`
  const popup = window.open(url, 'dsh-web-agent-launcher', 'noopener,noreferrer,width=8,height=8,left=-10000,top=-10000')
  if (!popup) window.location.assign(url)
}

export function WebAgentAction({ wide }: WebAgentActionProps) {
  return createElement(Button, {
    variant: 'ghost', type: 'button', title: 'Web-Agent / DeepSeek',
    'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区', 'aria-haspopup': 'window',
    'data-wide': wide, icon: '🌐', onClick: openWorkspace,
  }, wide ? 'Web-Agent' : null)
}

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'web-agent', order: 40,
  }, WebAgentAction))
}
