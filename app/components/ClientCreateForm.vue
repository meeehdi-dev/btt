<script setup lang="ts">
import CreateFormFooter from './CreateFormFooter.vue'
import { submitModalFormOnShortcut } from '~/composables/modal-form-shortcuts'
import { useEntityCreate } from '~/composables/useEntityCreate'

const props = withDefaults(defineProps<{ cancelLabel?: string }>(), { cancelLabel: 'Cancel' })
const emit = defineEmits<{
  created: [id: string]
  cancel: []
  pendingChange: [pending: boolean]
}>()

const name = ref('')
const color = ref('#64748b')
const { pending, errorMessage, submit } = useEntityCreate({
  endpoint: '/api/clients',
  body: () => ({ name: name.value.trim(), color: color.value }),
  onCreated: (id) => emit('created', id),
})
watch(pending, (value) => emit('pendingChange', value))
</script>

<template>
  <form class="space-y-3" @keydown.capture="submitModalFormOnShortcut" @submit.prevent="submit">
    <UFormField label="Name" required hint="Up to 200 characters">
      <UInput
        v-model="name"
        class="w-full"
        maxlength="200"
        autofocus
        placeholder="Acme Inc."
        required
      />
    </UFormField>
    <UFormField label="Color" required>
      <ColorSelector v-model="color" :disabled="pending" />
    </UFormField>
    <CreateFormFooter
      entity="client"
      :error-message="errorMessage"
      :pending="pending"
      :cancel-label="props.cancelLabel"
      @cancel="emit('cancel')"
    />
  </form>
</template>
