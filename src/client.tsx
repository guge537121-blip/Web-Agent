import { createElement } from 'react'
import type { Context } from '@deepseek-ai/cordis'

export const inject = ['betterSidebar']

let workspaceRequestStarted = false
let workspaceMessage = '点击此入口会打开 Web-Agent 的共享浏览器工作区。'

function startWorkspaceRequest(): void {
  if (workspaceRequestStarted) return
  workspaceRequestStarted = true
  void fetch('/web-agent/workspace/open', { method: 'POST', cache: 'no-store' })
    .then(async response => {
      const data = await response.json() as { ok?: boolean; url?: string; title?: string; error?: string }
      if (!response.ok || data.ok !== true) throw new Error(data.error ?? `HTTP ${response.status}`)
      workspaceMessage = `浏览器工作区已打开：${data.title || data.url || 'DeepSeek Web'}`
    })
    .catch(error => {
      workspaceRequestStarted = false
      workspaceMessage = `打开失败：${error instanceof Error ? error.message : String(error)}`
    })
}

function WebAgentPanel() {
  // The tab itself is the entry point: mounting it starts the host-side
  // session. The browser window is the same session later used by every tool.
  startWorkspaceRequest()

  return createElement(
    'div',
    {
      style: {
        height: '100%',
        boxSizing: 'border-box',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'system-ui, sans-serif',
      },
    },
    createElement('div', { style: { fontSize: '18px', fontWeight: 700 } }, '🌐 Web-Agent'),
    createElement('div', { style: { opacity: 0.72, lineHeight: 1.5 } }, 'DeepSeek Web 共享浏览器工作区'),
    createElement(
      'div',
      {
        style: {
          padding: '14px',
          borderRadius: '10px',
          background: 'var(--dsh-bg-elevated, rgba(127,127,127,.10))',
          lineHeight: 1.6,
        },
      },
      createElement('div', { style: { fontWeight: 600, marginBottom: '6px' } }, '浏览器工作区'),
      createElement('div', { style: { opacity: 0.78, fontSize: '13px' } }, workspaceMessage),
    ),
    createElement(
      'button',
      {
        type: 'button',
        onClick: () => {
          workspaceRequestStarted = false
          startWorkspaceRequest()
        },
        style: {
          border: '1px solid var(--dsh-border, rgba(127,127,127,.28))',
          borderRadius: '8px',
          padding: '9px 12px',
          cursor: 'pointer',
          background: 'var(--dsh-bg-elevated, rgba(127,127,127,.08))',
          color: 'inherit',
        },
      },
      '显示 / 恢复浏览器工作区',
    ),
    createElement(
      'div',
      { style: { marginTop: 'auto', fontSize: '12px', opacity: 0.55, lineHeight: 1.5 } },
      'Agent 与你共用同一个 Browser Session。你在浏览器中的登录、点击和输入都会成为 Agent 可以观察到的当前页面状态；Agent 的操作也直接发生在这个浏览器工作区。',
    ),
  )
}

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const sidebar = ctx.get('betterSidebar') as {
      registerTab: (descriptor: {
        id: string
        title: string
        order?: number
        single?: boolean
        component: (props: unknown) => unknown
      }) => () => void
    }
    if (!sidebar) return
    return sidebar.registerTab({
      id: 'web-agent:deepseek',
      title: 'Web-Agent',
      order: 40,
      single: true,
      component: () => createElement(WebAgentPanel),
    })
  }, 'web-agent: sidebar tab')
}
