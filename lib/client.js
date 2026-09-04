window.__ModuleLoader__.load({ id: "dsh-web-agent", factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
  const { createElement } = require('react');
  const { Button } = require('@deepseek-ai/dsh-client-ui-primitives');
  const inject = ['slots'];
  let opening = false;
  function openWorkspace() {
    if (opening) return;
    opening = true;
    try {
      // Use a same-origin GET through an invisible iframe. This avoids relying on
      // fetch/XHR being permitted by the renderer while still reaching DSH's
      // webServer route, which creates the native Electron BrowserWindow.
      const frame = document.createElement('iframe');
      frame.style.display = 'none';
      frame.src = `${window.location.origin}/web-agent/workspace/open?source=sidebar&t=${Date.now()}`;
      frame.onload = () => setTimeout(() => frame.remove(), 1000);
      frame.onerror = () => { frame.remove(); opening = false; };
      document.body.appendChild(frame);
      setTimeout(() => { try { frame.remove(); } catch {} opening = false; }, 3000);
    } catch (error) {
      console.error('[dsh-web-agent] workspace launch failed', error);
      opening = false;
    }
  }
  function WebAgentAction({ wide }) {
    return createElement(Button, {
      variant: 'ghost', type: 'button', title: 'Web-Agent / DeepSeek',
      'aria-label': '打开 Web-Agent DeepSeek 浏览器工作区', 'data-wide': wide,
      icon: '🌐', onClick: () => openWorkspace()
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
