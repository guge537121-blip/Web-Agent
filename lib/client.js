window.__ModuleLoader__.load({ id: "dsh-web-agent", factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
  const { createElement } = require('react');
  const { Button } = require('@deepseek-ai/dsh-client-ui-primitives');
  const inject = ['slots'];
  let opening = false;
  async function openWorkspace() {
    if (opening) return;
    opening = true;
    try {
      const response = await fetch(`${window.location.origin}/web-agent/workspace/open`, {
        method: 'POST', cache: 'no-store', headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error(`[dsh-web-agent] workspace open failed (${response.status})`, body);
        return;
      }
      const result = await response.json().catch(() => null);
      if (!result?.ok) console.error('[dsh-web-agent] workspace open failed', result?.error ?? result);
    } catch (error) {
      console.error('[dsh-web-agent] workspace request failed', error);
    } finally {
      opening = false;
    }
  }
  function WebAgentAction({ wide }) {
    return createElement(Button, {
      variant: 'ghost', type: 'button', title: 'Web-Agent / DeepSeek',
      'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区', 'data-wide': wide,
      icon: '🌐', onClick: () => { void openWorkspace(); }
    }, wide ? 'Web-Agent' : null);
  }
  function apply(ctx) {
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
      name: 'sidebar.footer.action', id: 'web-agent', order: 40
    }, WebAgentAction));
  }
  exports.apply = apply;
  exports.inject = inject;
  return module.exports;
} });
