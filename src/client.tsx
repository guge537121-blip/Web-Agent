import { createElement } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'

export const inject = ['slots']

let workspaceRequestStarted = false
let workspaceMessage = '点击入口后打开 Web-Agent 的共享 DeepSeek 浏览器工作区。'

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
  startWorkspaceRequest()
  return createElement(
    'div',
    { style: { height: '100%', boxSizing: 'border-box', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'system-ui, sans-serif' } },
    createElement('div', { style: { fontSize: '16px', fontWeight: 700 } }, '🌐 Web-Agent'),
    createElement('div', { style: { opacity: 0.72, lineHeight: 1.45, fontSize: '13px' } }, '用户与 Agent 共用同一个真实 DeepSeek 浏览器工作区。'),
    createElement('div', { style: { padding: '12px', borderRadius: '9px', background: 'var(--dsh-bg-elevated, rgba(127,127,127,.10))', lineHeight: 1.5, fontSize: '13px' } }, workspaceMessage),
    createElement('button', {
      type: 'button',
      onClick: () => { workspaceRequestStarted = false; startWorkspaceRequest() },
      style: { border: '1px solid var(--dsh-border, rgba(127,127,127,.28))', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', background: 'var(--dsh-bg-elevated, rgba(127,127,127,.08))', color: 'inherit' },
    }, '显示 / 恢复浏览器工作区'),
    createElement('div', { style: { marginTop: 'auto', fontSize: '11px', opacity: 0.55, lineHeight: 1.45 } }, '浏览器登录态和当前页面由共享 Browser Session 保存；Agent 工具直接操作这个 Session。'),
  )
}

/**
 * Register only the official DSH sidebar extension point. This removes the
 * runtime dependency on dsh-better-sidebar: Web-Agent is now a standalone
 * plugin from the user's point of view.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'web-agent',
    order: 40,
    inject: () => ({}),
  }, () => createElement(WebAgentPanel)))
}
