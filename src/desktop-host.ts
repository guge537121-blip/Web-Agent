import type { Context } from '@deepseek-ai/cordis'

/**
 * Web-Agent intentionally uses a separate visible browser workspace.
 * It does not attempt to embed a WebContentsView into DSH Desktop.
 * The browser provider owns one visible workspace shared by the human and agent.
 */
export type BrowserHostMode = 'workspace'

export function getBrowserHostMode(_ctx: Context): BrowserHostMode {
  return 'workspace'
}

export function hasEmbeddedBrowserHost(_ctx: Context): boolean {
  return false
}
