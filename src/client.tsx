import { createElement, useEffect, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'

export const inject = ['betterSidebar']

function WebAgentPanel() {
  const [status, setStatus] = useState<'opening' | 'ready' | 'error'>('opening')
  const [detail, setDetail] = useState('正在启动共享浏览器工作区…')

  const openWorkspace = async () => {
    setStatus('opening')
    setDetail('正在启动共享浏览器工作区…')
    try {
      const response = await fetch('/web-agent/workspace/open', { method: 'POST', cache: 'no-store' })
      const data = await response.json() as { ok?: boolean; url?: string; title?: string; error?: string }
      if (!response.ok || data.ok !== true) throw new Error(data.error ?? `HTTP ${response.status}`)
      setStatus('ready')
      setDetail(`已连接：${data.title || data.url || 'DeepSeek Web'}。Agent 与你使用同一个浏览器工作区。`)
    } catch (error) {
      setStatus('error')
      setDetail(error instanceof Error ? error.message : String(error))
    }
  }

  useEffect(() => {
    void openWorkspace()
  }, [])

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
      createElement('div', { style: { fontWeight: 600, marginBottom: '6px' } }, status === 'ready' ? '● 工作区已连接' : status === 'error' ? '⚠ 工作区启动失败' : '○ 正在启动'),
      createElement('div', { style: { opacity: 0.78, fontSize: '13px' } }, detail),
    ),
    createElement(
      'button',
      {
        type: 'button',
        onClick: () => void openWorkspace(),
        style: {
          border: '1px solid var(--dsh-border, rgba(127,127,127,.28))',
          borderRadius: '8px',
          padding: '9px 12px',
          cursor: 'pointer',
          background: 'var(--dsh-bg-elevated, rgba(127,127,127,.08))',
          color: 'inherit',
        },
      },
      status === 'error' ? '重新打开浏览器工作区' : '显示 / 恢复浏览器工作区',
    ),
    createElement(
      'div',
      { style: { marginTop: 'auto', fontSize: '12px', opacity: 0.55, lineHeight: 1.5 } },
      '只有一个 Browser Session。你在浏览器窗口中的操作会立即成为 Agent 的下一次观察结果；Agent 的点击、输入和滚动也会直接发生在这个窗口。',
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
