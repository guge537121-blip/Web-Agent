window.__ModuleLoader__.load({ id: "dsh-web-agent", factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
  const { createElement } = require('react');
  const { Button } = require('@deepseek-ai/dsh-client-ui-primitives');
  const inject = ['slots'];
  let opening = false;
  function getHostOrigin() { return window.location.origin; }
  async function openWorkspace() {
    if (opening) return;
    opening = true;
    const url = `${getHostOrigin()}/web-agent/workspace/open`;
    try {
      const response = await fetch(url, { method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const body = await response.text();
      let result = null;
      try { result = JSON.parse(body); } catch {}
      if (!response.ok || result?.ok !== true) throw new Error(result?.error ?? `workspace route returned HTTP ${response.status}`);
      console.info('[dsh-web-agent] shared browser workspace opened', result);
    } catch (error) {
      console.error('[dsh-web-agent] workspace request failed', { url, error });
      try {
        const frame = document.createElement('iframe');
        frame.hidden = true;
        frame.src = `${url}?source=sidebar&t=${Date.now()}`;
        document.body.appendChild(frame);
        window.setTimeout(() => frame.remove(), 4000);
      } catch (fallbackError) { console.error('[dsh-web-agent] workspace fallback failed', fallbackError); }
    } finally { window.setTimeout(() => { opening = false; }, 500); }
  }
  function WebAgentAction({ wide }) {
    return createElement(Button, { variant: 'ghost', type: 'button', title: 'Web-Agent / DeepSeek', 'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区', 'aria-haspopup': 'window', 'data-wide': wide, icon: '🌐', onClick: () => { void openWorkspace(); } }, wide ? 'Web-Agent' : null);
  }
  function apply(ctx) {
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: 'web-agent', order: 40 }, WebAgentAction));
  }
  exports.apply = apply;
  exports.inject = inject;
  return module.exports;
} });
