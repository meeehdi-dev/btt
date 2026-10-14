<script setup lang="ts">
const name = defineModel<string>('name', { required: true })
const color = defineModel<string>('color', { required: true })

const props = defineProps<{
  state: {
    entityLabel: 'Client' | 'Project'
    errors: Record<'name' | 'color', string>
    pendingField: string | null
    blocked: boolean
  }
}>()

const emit = defineEmits<{ saveName: [] }>()
</script>

<template>
  <HierarchyDetailSections>
    <template #fields>
      <UFormField
        :label="`${props.state.entityLabel} name`"
        required
        :error="props.state.errors.name || undefined"
      >
        <UInput
          v-model="name"
          class="w-full"
          maxlength="200"
          :disabled="!!props.state.pendingField || props.state.blocked"
          :aria-busy="props.state.pendingField === 'name' || undefined"
          @blur="emit('saveName')"
          @keydown.enter.prevent="emit('saveName')"
        />
      </UFormField>
      <UFormField
        :label="`${props.state.entityLabel} color`"
        required
        :error="props.state.errors.color || undefined"
      >
        <ColorSelector
          v-model="color"
          full-width
          :disabled="!!props.state.pendingField || props.state.blocked"
        />
      </UFormField>
    </template>
    <template #feedback>
      <slot name="feedback" />
    </template>
    <template #actions>
      <slot name="actions" />
    </template>
    <template #items>
      <slot name="items" />
    </template>
  </HierarchyDetailSections>
</template>
