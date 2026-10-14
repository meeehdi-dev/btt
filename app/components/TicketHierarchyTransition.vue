<script setup lang="ts">
const props = defineProps<{
  kind: 'loading' | 'refresh'
  error: string
  pending: boolean
}>()
const emit = defineEmits<{ cancel: []; retry: [] }>()
const errorTitle = computed(() =>
  props.kind === 'loading' ? 'Could not prepare ticket setup' : 'Item saved; refresh failed',
)
const message = computed(() =>
  props.kind === 'loading'
    ? 'Checking your active clients and projects…'
    : 'Refreshing active hierarchy choices…',
)
const errorDescription = computed(() =>
  props.kind === 'refresh'
    ? `${props.error} The item is already saved; retry this refresh before continuing.`
    : props.error,
)
</script>

<template>
  <div class="space-y-3">
    <UAlert
      v-if="props.error"
      role="alert"
      :color="props.kind === 'refresh' ? 'warning' : 'error'"
      :title="errorTitle"
      :description="errorDescription"
    />
    <p v-else class="text-muted">{{ message }}</p>
    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        icon="lucide:x"
        label="Back to ticket"
        :disabled="props.pending"
        @click="emit('cancel')"
      />
      <UButton
        v-if="props.error"
        icon="lucide:refresh-cw"
        :label="props.kind === 'loading' ? 'Retry' : 'Retry refresh'"
        :loading="props.pending"
        @click="emit('retry')"
      />
    </div>
  </div>
</template>
