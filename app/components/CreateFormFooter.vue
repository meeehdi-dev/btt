<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    entity: 'client' | 'project' | 'release'
    errorMessage: string
    pending: boolean
    canSubmit?: boolean
    cancelLabel?: string
  }>(),
  { canSubmit: true, cancelLabel: 'Cancel' },
)
const emit = defineEmits<{ cancel: [] }>()
</script>

<template>
  <UAlert
    v-if="props.errorMessage"
    role="alert"
    color="error"
    :title="`Could not create ${props.entity}`"
  >
    {{ props.errorMessage }}
  </UAlert>
  <div class="flex justify-end gap-2">
    <UButton
      type="button"
      color="neutral"
      variant="ghost"
      icon="lucide:x"
      :label="props.cancelLabel"
      :disabled="props.pending"
      @click="emit('cancel')"
    />
    <UButton
      type="submit"
      :disabled="!props.canSubmit || props.pending"
      :loading="props.pending"
      aria-keyshortcuts="Meta+Enter Control+Enter"
      icon="lucide:plus"
      :label="`Create ${props.entity}`"
    />
  </div>
</template>
