import type { Ref } from 'vue'
import { useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { useAppToast } from '~/composables/useAppToast'

type InlineEntityField<T> = {
  draft: Ref<string>
  read: (entity: T) => string
  toPatch: (value: string) => Record<string, unknown>
  successTitle: string
  normalize?: (value: string) => string
  validate?: (value: string) => string | undefined
}

export function inlineNameField<T>(
  draft: Ref<string>,
  read: (entity: T) => string,
  successTitle: string,
): InlineEntityField<T> {
  return {
    draft,
    read,
    toPatch: (value) => ({ name: value }),
    successTitle,
    normalize: (value) => value.trim(),
    validate: (value) =>
      value.trim() && value.trim().length <= 200 ? undefined : 'Enter a name of 1–200 characters.',
  }
}

export function useInlineEntityFields<T, Field extends string>(options: {
  resource: 'client' | 'project' | 'release'
  entityName: string
  getEntity: () => T | undefined
  endpoint: () => string
  fields: Record<Field, InlineEntityField<T>>
  applyPatch: (patch: Record<string, unknown>) => void
  archivePath: (shouldArchive: boolean) => string
  afterArchive?: (shouldArchive: boolean) => void
}) {
  const { invalidateMutation } = useAppDataInvalidation()
  const { reportWrite } = useAppToast()
  const fieldErrors = ref(
    Object.fromEntries(Object.keys(options.fields).map((field) => [field, ''])) as Record<
      Field,
      string
    >,
  )
  const pendingField = ref<Field | 'archive' | 'delete' | 'refresh' | null>(null)
  const lifecycleError = ref('')
  const actionNeedsRefresh = ref(false)

  for (const [field, definition] of Object.entries(options.fields) as [
    Field,
    InlineEntityField<T>,
  ][]) {
    watch(definition.draft, () => (fieldErrors.value[field] = ''))
  }

  async function saveField(field: Field, value: string) {
    if (pendingField.value || actionNeedsRefresh.value) return
    const entity = options.getEntity()
    if (!entity) return
    const definition = options.fields[field]
    const validationError = definition.validate?.(value)
    if (validationError) {
      fieldErrors.value[field] = validationError
      return
    }
    const normalized = definition.normalize?.(value) ?? value
    if (normalized === definition.read(entity)) return

    pendingField.value = field
    lifecycleError.value = ''
    fieldErrors.value[field] = ''
    try {
      const patch = definition.toPatch(normalized)
      const result = await runClientRequest<unknown>((signal) =>
        $fetch<unknown>(options.endpoint(), { method: 'PATCH', body: patch, signal }),
      )
      if (result._tag === 'Failure') {
        fieldErrors.value[field] = result.failure.userMessage
        return
      }
      options.applyPatch(patch)
      const refreshed = await invalidateMutation(options.resource)
      reportWrite(refreshed, { title: definition.successTitle })
      if (refreshed._tag === 'Failure') {
        actionNeedsRefresh.value = true
        lifecycleError.value = `The ${options.entityName} change was saved, but affected data could not be refreshed. ${refreshed.failure.userMessage}`
      }
    } finally {
      pendingField.value = null
    }
  }

  async function changeArchive(shouldArchive: boolean) {
    if (!options.getEntity() || pendingField.value || actionNeedsRefresh.value) return
    pendingField.value = 'archive'
    lifecycleError.value = ''
    try {
      const result = await runClientRequest<unknown>((signal) =>
        $fetch<unknown>(options.endpoint(), {
          method: 'PATCH',
          body: { archived: shouldArchive },
          signal,
        }),
      )
      if (result._tag === 'Failure') {
        lifecycleError.value = result.failure.userMessage
        return
      }
      const refreshed = await invalidateMutation(options.resource, { refreshActive: false })
      const entityLabel = options.entityName[0]!.toUpperCase() + options.entityName.slice(1)
      reportWrite(refreshed, {
        title: `${entityLabel} ${shouldArchive ? 'archived' : 'restored'}.`,
      })
      if (refreshed._tag === 'Failure') {
        actionNeedsRefresh.value = true
        lifecycleError.value = `The ${options.entityName} was ${shouldArchive ? 'archived' : 'restored'}, but affected data could not be refreshed. ${refreshed.failure.userMessage}`
      }
      options.afterArchive?.(shouldArchive)
      await navigateTo(options.archivePath(shouldArchive))
    } finally {
      pendingField.value = null
    }
  }

  async function retryRefresh() {
    if (pendingField.value) return
    pendingField.value = 'refresh'
    try {
      const refreshed = await invalidateMutation(options.resource)
      if (refreshed._tag === 'Failure') {
        lifecycleError.value = `Affected ${options.entityName} data is still unavailable. ${refreshed.failure.userMessage}`
        return
      }
      actionNeedsRefresh.value = false
      lifecycleError.value = ''
      for (const field of Object.keys(fieldErrors.value) as Field[]) fieldErrors.value[field] = ''
    } finally {
      pendingField.value = null
    }
  }

  return {
    actionNeedsRefresh,
    changeArchive,
    fieldErrors,
    invalidateMutation,
    lifecycleError,
    pendingField,
    reportWrite,
    retryRefresh,
    saveField,
  }
}
