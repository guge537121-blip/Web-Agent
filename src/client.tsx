import { createElement } from 'react'
import type { Context } from '@deepseek-ai/cordis'

export const inject = ['betterSidebar']

function WebAgentPanel() {
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
    createElement('div', { style: { fontSize: '18px', fontWeight: 700 } }, '🤖 Web-Agent'),
    createElement(
      'div',
      { style: { opacity: 0.72, lineHeight: 1.5 } },
      '真实 DeepSeek Web Agent',
    ),
    createElement(
      'div',
      {
        style: {
          padding: '12px',
          borderRadius: '10px',
          background: 'var(--dsh-bg-elevated, rgba(127,127,127,.10))',
          lineHeight: 1.6,
        },
      },
      createElement('div', { style: { fontWeight: 600, marginBottom: '6px' } }, '浏览器入口'),
      createElement(
        'div',
        { style: { opacity: 0.75, fontSize: '13px' } },
        '点击此侧边栏标签即可进入 Web-Agent 控制面板。Agent 会通过真实浏览器打开 chat.deepseek.com，不使用 iframe，也不使用 DeepSeek API。',
      ),
    ),
    createElement(
      'div',
      {
        style: {
          marginTop: 'auto',
          fontSize: '12px',
          opacity: 0.55,
        },
      },
      '下一步：连接真实浏览器视图与 DeepSeek Web Adapter。',
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
