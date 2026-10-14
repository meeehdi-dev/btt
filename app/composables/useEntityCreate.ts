export function useEntityCreate(options: {
  endpoint: string
  body: () => Record<string, unknown>
  onCreated: (id: string) => void
}) {
  const pending = ref(false)
  const errorMessage = ref('')

  async function submit() {
    pending.value = true
    errorMessage.value = ''
    try {
      const result = await runClientRequest((signal) =>
        $fetch<{ id: string }>(options.endpoint, {
          method: 'POST',
          body: options.body(),
          signal,
        }),
      )
      if (result._tag === 'Failure') {
        errorMessage.value = result.failure.userMessage
        return
      }
      options.onCreated(result.value.id)
    } finally {
      pending.value = false
    }
  }

  return { pending, errorMessage, submit }
}
