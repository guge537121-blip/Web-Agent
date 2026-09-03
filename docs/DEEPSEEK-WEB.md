# DeepSeek Web Adapter

## Purpose

This module is the only layer allowed to contain DeepSeek Web-specific DOM knowledge.

It converts generic browser operations into a small application contract.

## Contract

```ts
export interface DeepSeekWebAdapter {
  detectPage(session: BrowserSessionId): Promise<boolean>
  findComposer(session: BrowserSessionId): Promise<BrowserTarget>
  fillPrompt(session: BrowserSessionId, text: string): Promise<void>
  submit(session: BrowserSessionId): Promise<void>
  waitForResponse(session: BrowserSessionId, timeoutMs?: number): Promise<void>
  readAssistantMessage(session: BrowserSessionId): Promise<string>
  isGenerating(session: BrowserSessionId): Promise<boolean>
}
```

## Selector strategy

Selectors must be discovered against the live DeepSeek Web page during implementation rather than copied from stale examples.

Preferred order:

1. accessibility role/name
2. stable semantic attributes
3. CSS selectors
4. DOM text
5. visual coordinates as last resort

Do not depend on generated React class names unless there is no stable alternative.

## Response completion

Never assume a fixed sleep means generation has finished.

The adapter should observe a combination of:

- composer state
- send button state
- streaming message state
- DOM mutation / response growth
- stable assistant message text for a short settling interval

The exact strategy must be verified against the current DeepSeek Web UI when M2 is implemented.

## Login

Login is human-owned.

The plugin should:

- open the normal DeepSeek Web login page
- preserve the dedicated browser profile
- let the human complete login / verification
- detect that login is complete
- never request or store the user's DeepSeek password in DSH settings

CAPTCHA / human verification must pause automation instead of repeatedly retrying.

## Page changes

If DeepSeek changes its UI:

```text
Browser Runtime  ← unchanged
Agent Loop       ← unchanged
Tool Bridge      ← unchanged
DeepSeek Adapter ← update here
```
