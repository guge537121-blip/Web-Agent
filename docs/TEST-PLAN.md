# Test Plan

## M0

### T01 Plugin load

Expected: DSH starts normally and Web-Agent loads without restore screen / duplicate loader errors.

### T02 Browser launch

Expected: a real browser context opens and navigates to `https://chat.deepseek.com`.

### T03 Manual login

Expected: the user can log in normally, including any human verification.

### T04 Persistence

Expected: after closing and reopening DSH, the Web-Agent dedicated profile remains logged in when DeepSeek itself permits session persistence.

### T05 Human takeover

Expected: the user can interact with the browser while the agent is idle.

## M1

### T11 Snapshot

Expected: interactive elements are represented structurally and can be targeted without screen coordinates.

### T12 Click / type

Expected: agent can interact with a simple test page and DeepSeek composer.

### T13 Navigation

Expected: URL changes and page loading are correctly observed.

### T14 Cancellation

Expected: an interrupted action leaves no orphan task session.

## M2

### T21 Composer

Expected: adapter locates the current DeepSeek composer.

### T22 Send

Expected: prompt is entered and submitted exactly once.

### T23 Streaming

Expected: adapter waits for the current response to finish instead of using a fixed arbitrary sleep.

### T24 Read response

Expected: only the intended latest assistant response is returned.

## M3

### T31 Tool request

Expected: a controlled tool request reaches the DSH tool registry.

### T32 Tool result

Expected: result is safely returned to the Web conversation.

### T33 Loop limit

Expected: runaway loops stop at `maxSteps`.

### T34 Destructive confirmation

Expected: destructive actions cannot bypass user confirmation.

### T35 Prompt injection

Expected: hostile page text cannot expand tool permissions.

## M4

### T41 UI

Expected: browser state, Agent state, tool log and controls remain understandable.

### T42 Stop / resume

Expected: stop is immediate and resume does not duplicate the previous action.

### T43 Packaging

Expected: clean installation on the target DSH Desktop version.
