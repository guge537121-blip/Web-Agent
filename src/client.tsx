import { createElement } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'

export const inject = ['slots']

let workspaceRequestStarted = false

function startWorkspaceRequest(): void {
  if (workspaceRequestStarted) return
  workspaceRequestStarted = true
  void fetch('/web-agent/workspace/open', { method: 'POST', cache: 'no-store' })
    .catch(() => { workspaceRequestStarted = false })
}

/** Small official-sidebar action. The browser itself is the Web-Agent workspace. */
function WebAgentAction(props: { wide?: boolean }) {
  return createElement(
    'button',
    {
      type: 'button',
      title: 'Web-Agent / DeepSeek',
      'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区',
      onClick: () => startWorkspaceRequest(),
      style: {
        width: props.wide === false ? '40px' : '100%',
        minHeight: '36px',
        boxSizing: 'border-box',
        border: '1px solid var(--dsh-border, rgba(127,127,127,.22))',
        borderRadius: '8px',
        padding: '7px 10px',
        cursor: 'pointer',
        background: 'var(--dsh-bg-elevated, rgba(127,127,127,.08))',
        color: 'inherit',
        fontSize: '13px',
        textAlign: 'left',
      },
    },
    props.wide === false ? '🌐' : '🌐 Web-Agent',
  )
}

/**
 * Web-Agent uses only the official DSH slot contract. No dsh-better-sidebar
 * runtime is required. The browser implementation remains host-side and is
 * shared by the user and every Web-Agent browser tool.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'web-agent',
    order: 40,
  }, WebAgentAction))
}
