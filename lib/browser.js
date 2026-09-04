import { BrowserRuntime } from 'dsh-builtin-browser/browser';
import { ElectronBrowserProvider, RemoteElectronViewHost, defaultHostMainPath } from 'dsh-builtin-browser/browser-electron';

export const name = 'web-agent-browser';

export function apply(ctx) {
  if (ctx.get('browser') !== undefined) return;
  ctx.plugin(BrowserRuntime);
  ctx.inject(['browser'], browserCtx => {
    const runtime = browserCtx.get('browser');
    if (runtime === undefined) return;
    const host = new RemoteElectronViewHost(defaultHostMainPath());
    const unregister = runtime.registerBrowserProvider(new ElectronBrowserProvider(host));
    browserCtx.effect(() => () => {
      unregister();
      host.dispose();
    }, 'web-agent browser workspace');
  });
}
