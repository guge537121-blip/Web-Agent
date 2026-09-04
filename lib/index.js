import { defineTool } from '@deepseek-ai/dsh-tools';
import { getBrowserHostMode } from './desktop-host.js';
export const name = 'web-agent';
export const inject = ['tools', 'browser'];
function schema(properties) {
    return { type: 'object', additionalProperties: false, properties };
}
/** M0/M1: DeepSeek Web entry point plus explicit browser-control bridge. */
export function apply(ctx, config = {}) {
    const deepseekUrl = config.deepseekUrl ?? 'https://chat.deepseek.com/';
    const browser = () => {
        const value = ctx.get('browser');
        if (value === undefined) {
            throw new Error('web-agent: browser service unavailable; check that dsh-builtin-browser is mounted');
        }
        return value;
    };
    ctx.tools.register(defineTool({
        name: 'web_agent_browser_status',
        description: 'Report whether Web-Agent is using an embedded DSH Desktop browser host or the standalone Electron fallback.',
        parameters: {},
        output: { schema: schema({ mode: { type: 'string', required: true }, embedded: { type: 'boolean', required: true } }) },
        timeoutMs: 10_000,
        isConcurrencySafe: () => true,
        async execute() {
            const mode = getBrowserHostMode(ctx);
            return { mode, embedded: mode === 'embedded' };
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_open_deepseek',
        description: 'Open the real DeepSeek Web site in the persistent browser. Use this before interacting with DeepSeek Web.',
        parameters: {},
        output: { schema: schema({ url: { type: 'string', required: true }, title: { type: 'string' }, hostMode: { type: 'string', required: true } }) },
        timeoutMs: 60_000,
        isConcurrencySafe: () => false,
        async execute(_args, exec) {
            const b = browser();
            const session = await b.open(exec?.agent?.id ?? 'web-agent');
            await b.openUrl(session, { url: deepseekUrl }, exec.signal);
            const snapshot = await b.snapshot(session, exec.signal);
            return { url: snapshot.url, ...(snapshot.title !== undefined ? { title: snapshot.title } : {}), hostMode: getBrowserHostMode(ctx) };
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_navigate',
        description: 'Navigate the Web-Agent browser session to an HTTP(S) URL.',
        parameters: { url: { type: 'string', required: true }, session: { type: 'string' } },
        output: { schema: schema({ url: { type: 'string', required: true } }) },
        timeoutMs: 60_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            await b.navigate(session, { url: args.url }, exec.signal);
            const snapshot = await b.snapshot(session, exec.signal);
            return { url: snapshot.url };
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_snapshot',
        description: 'Read the current Web-Agent page as an AI-friendly semantic snapshot.',
        parameters: { session: { type: 'string' } },
        output: { schema: schema({ url: { type: 'string', required: true }, title: { type: 'string' }, elements: { type: 'array', required: true } }) },
        timeoutMs: 30_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            return b.snapshot(session, exec.signal);
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_click',
        description: 'Click a visible element in the Web-Agent browser by CSS/text/XPath target or viewport coordinates.',
        parameters: {
            session: { type: 'string' },
            target: { type: 'object', additionalProperties: true },
            x: { type: 'number' },
            y: { type: 'number' },
        },
        output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
        timeoutMs: 30_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            if (args.target)
                await b.click(session, { target: args.target }, exec.signal);
            else if (typeof args.x === 'number' && typeof args.y === 'number')
                await b.click(session, { x: args.x, y: args.y }, exec.signal);
            else
                throw new Error('web-agent: click requires target or x/y');
            return { ok: true };
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_fill',
        description: 'Fill one or more form fields in the Web-Agent browser.',
        parameters: { session: { type: 'string' }, fields: { type: 'array', required: true }, submit: { type: 'boolean' } },
        output: { schema: schema({ fields: { type: 'array', required: true }, submitted: { type: 'boolean', required: true } }) },
        timeoutMs: 60_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            return b.fill(session, { fields: args.fields, submit: args.submit }, exec.signal);
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_key',
        description: 'Press a keyboard key in the Web-Agent browser, such as Enter, Tab or Escape.',
        parameters: { session: { type: 'string' }, key: { type: 'string', required: true } },
        output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
        timeoutMs: 15_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            await b.key(session, { key: args.key }, exec.signal);
            return { ok: true };
        },
    }));
    ctx.tools.register(defineTool({
        name: 'web_agent_scroll',
        description: 'Scroll the Web-Agent browser page.',
        parameters: { session: { type: 'string' }, deltaX: { type: 'number' }, deltaY: { type: 'number' }, toTop: { type: 'boolean' }, toBottom: { type: 'boolean' } },
        output: { schema: schema({ ok: { type: 'boolean', required: true } }) },
        timeoutMs: 15_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            await b.scroll(session, { deltaX: args.deltaX, deltaY: args.deltaY, toTop: args.toTop, toBottom: args.toBottom }, exec.signal);
            return { ok: true };
        },
    }));
    /** Helper: find a send button in DeepSeek's snapshot elements. */
    function findDeepSeekSendButton(elements) {
        // Priority 1: button with aria-label containing "发送" or "Send"
        for (const el of elements) {
            if (el.kind === 'button') {
                const name = String(el.name ?? '').toLowerCase();
                const ariaLabel = String(el.ariaLabel ?? '').toLowerCase();
                const title = String(el.title ?? '').toLowerCase();
                if (name.includes('发送') || name.includes('send') ||
                    ariaLabel.includes('发送') || ariaLabel.includes('send') ||
                    title.includes('发送') || title.includes('send')) {
                    return el;
                }
            }
        }
        // Priority 2: button near textarea (last button before/after textarea)
        let lastTextareaIdx = -1;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].kind === 'textarea')
                lastTextareaIdx = i;
        }
        if (lastTextareaIdx >= 0) {
            // Search nearby buttons (within 10 elements of textarea)
            for (let i = Math.max(0, lastTextareaIdx - 3); i < Math.min(elements.length, lastTextareaIdx + 10); i++) {
                const el = elements[i];
                if (el.kind === 'button' && !String(el.name ?? '').includes('停止') && !String(el.name ?? '').includes('stop')) {
                    return el;
                }
            }
        }
        // Priority 3: any button with role=button that looks like a submit
        for (const el of elements) {
            if ((el.kind === 'button' || el.role === 'button') && el.ref !== undefined) {
                const name = String(el.name ?? '').toLowerCase();
                if (!name.includes('停止') && !name.includes('stop') && !name.includes('登录') && !name.includes('login')) {
                    return el;
                }
            }
        }
        return undefined;
    }
    /** Helper: check if message appears in chat (not just in textarea). */
    function findUserMessageInChat(elements, message) {
        const snippet = message.length > 20 ? message.slice(0, 20) : message;
        for (const el of elements) {
            const text = String(el.text ?? el.name ?? '');
            if (text.includes(snippet) && el.kind !== 'textarea' && el.kind !== 'input') {
                return true;
            }
        }
        return false;
    }
    /** Helper: check if DeepSeek is generating a response. */
    function isGeneratingResponse(elements) {
        for (const el of elements) {
            const text = String(el.text ?? el.name ?? '').toLowerCase();
            if (text.includes('深度思考') || text.includes('正在思考') || text.includes('thinking') ||
                text.includes('停止') || text.includes('stop')) {
                return true;
            }
        }
        return false;
    }
    ctx.tools.register(defineTool({
        name: 'web_agent_send_deepseek',
        description: 'Send a message on DeepSeek Web chat. Uses button click instead of Enter key for reliability. Verifies the message was actually submitted before returning success.',
        parameters: {
            message: { type: 'string', required: true },
            session: { type: 'string' },
        },
        output: {
            schema: schema({
                success: { type: 'boolean', required: true },
                status: { type: 'string', required: true },
                details: { type: 'string' },
            }),
        },
        timeoutMs: 30_000,
        isConcurrencySafe: () => false,
        async execute(args, exec) {
            const b = browser();
            const session = args.session ?? exec?.agent?.id ?? 'web-agent';
            const message = args.message;
            // Step 1: Snapshot to find textarea
            const snap1 = await b.snapshot(session, exec.signal);
            const textarea = snap1.elements.find((el) => el.kind === 'textarea');
            if (!textarea) {
                return { success: false, status: 'no_textarea', details: 'Could not find DeepSeek input textarea on the page.' };
            }
            // Step 2: Fill the message
            await b.fillForm(session, {
                fields: [{ selector: 'textarea', value: message }],
            }, exec.signal);
            // Step 3: Snapshot again to find send button
            const snap2 = await b.snapshot(session, exec.signal);
            const sendButton = findDeepSeekSendButton(snap2.elements);
            if (!sendButton) {
                return {
                    success: false,
                    status: 'no_send_button',
                    details: 'Message was entered but no send button was found. Try web_agent_snapshot to inspect the page.',
                };
            }
            // Step 4: Click send button
            if (sendButton.ref !== undefined) {
                await b.click(session, { target: { by: 'ref', value: String(sendButton.ref) } }, exec.signal);
            }
            else if (sendButton.x !== undefined && sendButton.y !== undefined) {
                await b.click(session, { x: Number(sendButton.x), y: Number(sendButton.y) }, exec.signal);
            }
            else {
                return {
                    success: false,
                    status: 'send_button_no_position',
                    details: 'Found send button but could not determine its position for clicking.',
                };
            }
            // Step 5: Wait briefly for the page to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Step 6: Verify message was sent
            const snap3 = await b.snapshot(session, exec.signal);
            // Check 1: textarea should be empty or no longer contain our message
            const textareaAfter = snap3.elements.find((el) => el.kind === 'textarea');
            const textareaValue = String(textareaAfter?.value ?? textareaAfter?.text ?? '');
            const messageStillInTextarea = textareaValue.includes(message.slice(0, 20));
            // Check 2: message appears in chat history
            const messageInChat = findUserMessageInChat(snap3.elements, message);
            // Check 3: DeepSeek is generating response
            const generating = isGeneratingResponse(snap3.elements);
            if (messageStillInTextarea && !messageInChat) {
                return {
                    success: false,
                    status: 'send_failed',
                    details: 'Message is still in the textarea and was not found in chat history. The send button click may not have worked.',
                };
            }
            if (messageInChat || generating || !messageStillInTextarea) {
                return {
                    success: true,
                    status: generating ? 'submitting_generating' : 'submitted',
                    details: generating
                        ? 'Message submitted successfully. DeepSeek is generating a response.'
                        : 'Message submitted successfully.',
                };
            }
            return {
                success: false,
                status: 'unknown',
                details: 'Could not determine if the message was sent. Please check manually.',
            };
        },
    }));
}
//# sourceMappingURL=index.js.map