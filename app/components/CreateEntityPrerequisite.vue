<script setup lang="ts">
const props = defineProps<{
  entity: 'Project' | 'Release'
  parent: 'client' | 'project'
  cancelLabel: string
}>()
const emit = defineEmits<{ cancel: []; createParent: [] }>()
</script>

<template>
  <div class="space-y-3">
    <div>
      <h2 class="font-medium text-highlighted">Create a {{ props.parent }} first</h2>
      <p class="mt-1 text-muted">
        {{ props.entity }}s must belong to an active {{ props.parent }}.
      </p>
    </div>
    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        icon="lucide:x"
        :label="props.cancelLabel"
        @click="emit('cancel')"
      />
      <UButton icon="lucide:plus" :label="`Create ${props.parent}`" @click="emit('createParent')" />
    </div>
  </div>
</template>
