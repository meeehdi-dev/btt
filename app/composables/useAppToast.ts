import type { ClientEffectResult } from '~/utils/client-effect'

type AppToastOptions = {
  title: string
  duration?: number
  open?: { label: string; to: string }
}

export function useAppToast() {
  const toast = useToast()

  function reportWrite(refresh: ClientEffectResult<unknown>, options: AppToastOptions) {
    const partial = refresh._tag === 'Failure'
    toast.add({
      title: partial ? `${options.title.replace(/[.!?]+$/, '')}; refresh failed.` : options.title,
      description: partial
        ? `The change was saved, but affected data could not be refreshed. Use the page's retry control to refresh. ${refresh.failure.userMessage}`
        : undefined,
      color: partial ? 'warning' : 'success',
      icon: partial ? 'lucide:triangle-alert' : 'lucide:check',
      duration: options.duration ?? (options.open ? 10_000 : 5_000),
      actions: options.open
        ? [{ label: options.open.label, to: options.open.to, color: 'primary', variant: 'link' }]
        : undefined,
    })
  }

  return { reportWrite }
}
