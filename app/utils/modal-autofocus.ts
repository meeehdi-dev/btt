import type { ObjectDirective } from 'vue'

const frames = new WeakMap<HTMLElement, number>()
const focusable =
  'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [tabindex="0"]:not([aria-disabled="true"])'

function cancelFocus(form: HTMLElement) {
  const frame = frames.get(form)
  if (frame !== undefined) cancelAnimationFrame(frame)
  frames.delete(form)
}

function focusPrimaryField(form: HTMLElement) {
  cancelFocus(form)
  // Wait for the dialog's own initial focus before choosing the primary field.
  frames.set(
    form,
    requestAnimationFrame(() => {
      frames.delete(form)
      if (!form.isConnected || !form.getClientRects().length) return
      const dialogs = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"][data-state="open"]'),
      ).filter((dialog) => dialog.getClientRects().length)
      if (form.closest('[role="dialog"]') !== dialogs.at(-1)) return
      const primary = form.querySelector<HTMLElement>('[data-modal-autofocus]')
      const target = primary?.matches(focusable)
        ? primary
        : primary?.querySelector<HTMLElement>(focusable)
      if (target?.getClientRects().length) target.focus({ preventScroll: true })
    }),
  )
}

export const vModalAutofocus: ObjectDirective<HTMLElement, boolean | undefined> = {
  mounted(form, { value }) {
    if (value !== false) focusPrimaryField(form)
  },
  updated(form, { value, oldValue }) {
    if (value === oldValue) return
    if (value === false) cancelFocus(form)
    else focusPrimaryField(form)
  },
  unmounted: cancelFocus,
}
