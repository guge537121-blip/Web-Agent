window.__ModuleLoader__.load({ id: "dsh-web-agent", factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
  const { createElement } = require('react');
  const inject = ['slots'];
  let workspaceRequestStarted = false;
  function startWorkspaceRequest() {
    if (workspaceRequestStarted) return;
    workspaceRequestStarted = true;
    void fetch('/web-agent/workspace/open', { method: 'POST', cache: 'no-store' })
      .catch(() => { workspaceRequestStarted = false; });
  }
  function WebAgentAction(props) {
    return createElement('button', {
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
        textAlign: 'left'
      }
    }, props.wide === false ? '🌐' : '🌐 Web-Agent');
  }
  function apply(ctx) {
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
      name: 'sidebar.footer.action',
      id: 'web-agent',
      order: 40
    }, WebAgentAction));
  }
  exports.apply = apply;
  exports.inject = inject;
  return module.exports;
} });
