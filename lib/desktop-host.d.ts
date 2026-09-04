import type { Context } from '@deepseek-ai/cordis';
export type BrowserHostMode = 'embedded' | 'standalone';
/**
 * DSH Desktop owns Electron/WebContentsView. Web-Agent must never reach into
 * Electron directly. dsh-builtin-browser consumes the optional public
 * `electronViewHost` capability when the Desktop host provides it.
 */
export declare function getBrowserHostMode(ctx: Context): BrowserHostMode;
export declare function hasEmbeddedBrowserHost(ctx: Context): boolean;
