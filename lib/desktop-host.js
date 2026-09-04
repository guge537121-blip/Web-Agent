/**
 * DSH Desktop owns Electron/WebContentsView. Web-Agent must never reach into
 * Electron directly. dsh-builtin-browser consumes the optional public
 * `electronViewHost` capability when the Desktop host provides it.
 */
export function getBrowserHostMode(ctx) {
    return ctx.get('electronViewHost') === undefined ? 'standalone' : 'embedded';
}
export function hasEmbeddedBrowserHost(ctx) {
    return getBrowserHostMode(ctx) === 'embedded';
}
//# sourceMappingURL=desktop-host.js.map