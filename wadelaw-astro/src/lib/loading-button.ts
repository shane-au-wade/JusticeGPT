/**
 * Loading button lifecycle — single source of truth.
 *
 * The button stashes its own content/state in `dataset` so enter/exit are
 * symmetric and stateless. `withLoading` closes the full lifecycle so callers
 * don't hand-write try/catch/finally + reset.
 */

const SPINNER_BY_BTN_SIZE: Record<string, string> = {
  "btn-xs": "loading-xs",
  "btn-sm": "loading-sm",
  "btn-lg": "loading-md",
}

function spinnerSizeFor(btn: HTMLButtonElement): string {
  for (const cls of btn.classList) {
    const match = SPINNER_BY_BTN_SIZE[cls]
    if (match) return match
  }
  return "loading-sm"
}

/** Enter loading: lock width, stash content, disable, swap to spinner + label. */
export function enterLoading(btn: HTMLButtonElement): void {
  if (btn.disabled) return
  const label = btn.dataset.loadingLabel ?? "Loading…"
  btn.style.minWidth = `${btn.offsetWidth}px`
  btn.dataset.originalLabel = btn.innerHTML
  btn.disabled = true
  btn.setAttribute("aria-busy", "true")
  btn.innerHTML = `<span class="loading loading-spinner ${spinnerSizeFor(btn)}"></span> ${label}`
}

/** Exit loading: restore original content, re-enable, unlock width. */
export function exitLoading(btn: HTMLButtonElement): void {
  btn.disabled = false
  btn.removeAttribute("aria-busy")
  btn.innerHTML = btn.dataset.originalLabel ?? btn.innerHTML
  btn.style.minWidth = ""
}

interface WithLoadingOptions {
  /** Keep the button loading after success (e.g. you're navigating away). */
  stayLoadingOnSuccess?: boolean
}

/**
 * Run an async action with the button in its loading state for the duration.
 * Auto-resets on error (so the user can retry). On success, resets unless
 * `stayLoadingOnSuccess` is set (the navigate-away case).
 */
export async function withLoading<T>(
  btn: HTMLButtonElement,
  action: () => Promise<T>,
  opts: WithLoadingOptions = {},
): Promise<T> {
  enterLoading(btn)
  try {
    const result = await action()
    if (!opts.stayLoadingOnSuccess) exitLoading(btn)
    return result
  } catch (err) {
    exitLoading(btn)
    throw err
  }
}
