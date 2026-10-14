import type { ModalProps } from '@nuxt/ui/runtime/components/Modal.vue'

type ModalContent = NonNullable<ModalProps['content']>
type ModalFormShortcutContent = ModalContent & {
  onKeydownCapture: (event: KeyboardEvent) => void
}

export function submitModalFormOnShortcut(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return
  if (event.altKey || event.shiftKey || event.isComposing) return

  const currentTarget = event.currentTarget
  if (!(currentTarget instanceof HTMLElement)) return

  event.preventDefault()
  event.stopPropagation()
  if (event.repeat) return

  const targetForm = event.target instanceof Element ? event.target.closest('form') : null
  let form: HTMLFormElement | undefined
  if (targetForm instanceof HTMLFormElement) {
    if (!currentTarget.contains(targetForm)) return
    form = targetForm
  } else if (currentTarget instanceof HTMLFormElement) {
    form = currentTarget
  } else {
    form = Array.from(currentTarget.querySelectorAll('form')).find(
      (candidate) => candidate.getClientRects().length > 0,
    )
  }
  if (!form) return

  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled)')
  if (!submitButton) return
  form.requestSubmit(submitButton)
}

export function modalFormShortcutContent(content: ModalContent = {}): ModalFormShortcutContent {
  return { ...content, onKeydownCapture: submitModalFormOnShortcut }
}
