# M0 Acceptance Checklist

Run these checks against the installed Web-Agent package.

## M0.1 Plugin loading

- [ ] DSH starts normally.
- [ ] Web-Agent does not put DSH into recovery mode.
- [ ] The `Web-Agent` sidebar tab is visible when `dsh-better-sidebar` is installed.
- [ ] Removing/disabling Web-Agent does not break the profile.

## M0.2 Real browser provider

- [ ] `web_agent_open_deepseek` is registered.
- [ ] Calling it does not produce `no usable browser provider is registered`.
- [ ] A real browser surface/window is created.
- [ ] The browser reaches `https://chat.deepseek.com/`.

## M0.3 Session

- [ ] The user can log in manually.
- [ ] Closing/reopening the browser keeps the expected session.
- [ ] Web-Agent does not read or export authentication cookies.

## M0.4 Native in-app surface

This is **not** considered complete by the external-window test above.

- [ ] A compatible DSH Desktop host provides `desktopBrowser`.
- [ ] Web-Agent detects the host capability.
- [ ] DeepSeek is shown inside the DSH window as a native Chromium/WebContentsView surface.
- [ ] No iframe is used for the DeepSeek surface.
- [ ] Browser automation still targets the same browser session.

M0.4 is the gate before starting the full M1 interaction implementation.
