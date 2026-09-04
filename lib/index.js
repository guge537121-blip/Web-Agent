import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'web-agent';
export const inject = ['tools', 'browser', 'webServer'];

function schema(properties) {
  return { type: 'object', additionalProperties: false, properties };
}

export function apply(ctx, config = {}) {
  const deepseekUrl = config.deepseekUrl ?? 'https://chat.deepseek.com/';
  let workspaceSession;
  const browser = () => {
    const value = ctx.get('browser');
    if (value === undefined) throw new Error('web-agent: browser service unavailable');
    return value;
  };
  const ensureWorkspace = async () => {
    const b = browser();
    if (workspaceSession !== undefined) {
      try {
        const snapshot = await b.snapshot(workspaceSession);
        return { session: workspaceSession, snapshot };
      } catch {
        workspaceSession = undefined;
      }
    }
    workspaceSession = await b.open('web-agent-workspace');
    await b.openUrl(workspaceSession, { url: deepseekUrl });
    const snapshot = await b.snapshot(workspaceSession);
    return { session: workspaceSession, snapshot };
  };
  const currentSession = async (requested) => requested ?? (await ensureWorkspace()).session;

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/web-agent/workspace/open',
    handler: async (req, res) => {
      if (req.method !== 'POST' && req.method !== 'GET') {
        res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('method not allowed');
        return;
      }
      try {
        const result = await ensureWorkspace();
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ ok: true, session: result.session, url: result.snapshot.url, title: result.snapshot.title ?? '' }));
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      }
    },
  }), 'web-agent: open workspace route');

  ctx.effect(() => () => {
    if (workspaceSession !== undefined) {
      const id = workspaceSession;
      workspaceSession = undefined;
      void browser().close(id).catch(() => {});
    }
  }, 'web-agent: close workspace');

  ctx.tools.register(defineTool({
    name: 'web_agent_workspace',
    description: 'Open or inspect the single visible browser workspace shared by the human and Web-Agent. The first call opens DeepSeek Web; later calls reuse the same page/session.',
    parameters: {},
    output: { schema: schema({ session: { type: 'string', required: true }, url: { type: 'string', required: true }, title: { type: 'string' } }) },
    timeoutMs: 60000,
    isConcurrencySafe: () => false,
    async execute() {
      const result = await ensureWorkspace();
      return { session: result.session, url: result.snapshot.url, ...(result.snapshot.title !== undefined ? { title: result.snapshot.title } : {}) };
    },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_navigate',
    description: 'Navigate the shared Web-Agent browser workspace to an HTTP(S) URL.',
    parameters: { url: { type: 'string', required: true }, session: { type: 'string' } },
    output: { schema: schema({ url: { type: 'string', required: true } }) },
    timeoutMs: 60000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser(); const session = await currentSession(args.session);
      await b.navigate(session, { url: args.url }, exec.signal);
      return { url: (await b.snapshot(session, exec.signal)).url };
    },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_snapshot',
    description: 'Read the current shared browser workspace as an AI-friendly semantic snapshot.',
    parameters: { session: { type: 'string' } },
    output: { schema: schema({ url: { type: 'string', required: true }, title: { type: 'string' }, elements: { type: 'array', required: true } }) },
    timeoutMs: 30000,
    isConcurrencySafe: () => false,
    async execute(args, exec) { return browser().snapshot(await currentSession(args.session), exec.signal); },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_click',
    description: 'Click a visible element in the shared browser workspace by target or viewport coordinates.',
    parameters: { session: { type: 'string' }, target: { type: 'object', additionalProperties: true }, x: { type: 'number' }, y: { type: 'number' } },
    output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
    timeoutMs: 30000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser(); const session = await currentSession(args.session);
      if (args.target) await b.click(session, { target: args.target }, exec.signal);
      else if (typeof args.x === 'number' && typeof args.y === 'number') await b.click(session, { x: args.x, y: args.y }, exec.signal);
      else throw new Error('web-agent: click requires target or x/y');
      return { ok: true };
    },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_fill',
    description: 'Fill form fields in the shared browser workspace.',
    parameters: { session: { type: 'string' }, fields: { type: 'array', required: true }, submit: { type: 'boolean' } },
    output: { schema: schema({ fields: { type: 'array', required: true }, submitted: { type: 'boolean', required: true } }) },
    timeoutMs: 60000,
    isConcurrencySafe: () => false,
    async execute(args, exec) { return browser().fillForm(await currentSession(args.session), { fields: args.fields, submit: args.submit }, exec.signal); },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_key',
    description: 'Press a keyboard key in the shared browser workspace.',
    parameters: { session: { type: 'string' }, key: { type: 'string', required: true } },
    output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
    timeoutMs: 15000,
    isConcurrencySafe: () => false,
    async execute(args, exec) { await browser().key(await currentSession(args.session), { key: args.key }, exec.signal); return { ok: true }; },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_scroll',
    description: 'Scroll the shared browser workspace.',
    parameters: { session: { type: 'string' }, deltaX: { type: 'number' }, deltaY: { type: 'number' }, toTop: { type: 'boolean' }, toBottom: { type: 'boolean' } },
    output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
    timeoutMs: 15000,
    isConcurrencySafe: () => false,
    async execute(args, exec) { await browser().scroll(await currentSession(args.session), { deltaX: args.deltaX, deltaY: args.deltaY, toTop: args.toTop, toBottom: args.toBottom }, exec.signal); return { ok: true }; },
  }));

  ctx.tools.register(defineTool({
    name: 'web_agent_send_deepseek',
    description: 'Send a message to DeepSeek Web in the shared workspace. Prefer the real send button and verify that the message left the textarea.',
    parameters: { message: { type: 'string', required: true }, session: { type: 'string' } },
    output: { schema: schema({ success: { type: 'boolean', required: true }, status: { type: 'string', required: true }, details: { type: 'string' } }) },
    timeoutMs: 30000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const b = browser(); const session = await currentSession(args.session); const message = args.message;
      const snap1 = await b.snapshot(session, exec.signal);
      if (!snap1.elements.some(el => el.kind === 'textarea')) return { success: false, status: 'no_textarea', details: 'DeepSeek input textarea was not found.' };
      await b.fillForm(session, { fields: [{ selector: 'textarea', value: message }] }, exec.signal);
      const snap2 = await b.snapshot(session, exec.signal); const elements = snap2.elements;
      let sendButton;
      for (const el of elements) {
        if (el.kind !== 'button') continue;
        const text = `${el.name ?? ''} ${el.ariaLabel ?? ''} ${el.title ?? ''}`.toLowerCase();
        if (text.includes('发送') || text.includes('send')) { sendButton = el; break; }
      }
      if (!sendButton) {
        const i = elements.findIndex(el => el.kind === 'textarea');
        if (i >= 0) sendButton = elements.slice(Math.max(0, i - 3), i + 10).find(el => el.kind === 'button');
      }
      if (!sendButton) return { success: false, status: 'no_send_button', details: 'Message was filled but a send button could not be located.' };
      if (sendButton.ref !== undefined) await b.click(session, { target: { by: 'ref', value: String(sendButton.ref) } }, exec.signal);
      else if (sendButton.x !== undefined && sendButton.y !== undefined) await b.click(session, { x: Number(sendButton.x), y: Number(sendButton.y) }, exec.signal);
      else return { success: false, status: 'send_button_not_clickable', details: 'The send button has no usable ref or coordinates.' };
      await new Promise(resolve => setTimeout(resolve, 1200));
      const snap3 = await b.snapshot(session, exec.signal);
      const textarea = snap3.elements.find(el => el.kind === 'textarea');
      const value = String(textarea?.value ?? textarea?.text ?? '');
      const stillThere = value.includes(message.slice(0, 20));
      const inChat = snap3.elements.some(el => el.kind !== 'textarea' && el.kind !== 'input' && String(el.text ?? el.name ?? '').includes(message.slice(0, 20)));
      if (stillThere && !inChat) return { success: false, status: 'send_failed', details: 'The message remains in the input and was not detected in chat history.' };
      return { success: true, status: inChat ? 'submitted' : 'submitted_or_processing', details: 'The message was submitted to the shared DeepSeek workspace.' };
    },
  }));
}
