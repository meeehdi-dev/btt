<script setup lang="ts">
import CreateEntityPrerequisite from './CreateEntityPrerequisite.vue'
import CreateFormFooter from './CreateFormFooter.vue'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import { useEntityCreate } from '~/composables/useEntityCreate'
import { submitModalFormOnShortcut } from '~/composables/modal-form-shortcuts'

const props = withDefaults(defineProps<{ initialClientId?: string; cancelLabel?: string }>(), {
  initialClientId: '',
  cancelLabel: 'Cancel',
})
const emit = defineEmits<{
  created: [id: string]
  cancel: []
  createParent: []
  pendingChange: [pending: boolean]
}>()

const {
  data: clientData,
  pending: clientsPending,
  error: clientsError,
  refresh: refreshClients,
} = await trackAppApiFetch(useApiFetch('/api/clients', { key: 'app-api:clients:list:active' }), {
  key: 'app-api:clients:list:active',
  resources: ['clients', 'hierarchy', 'search'],
})
const clients = computed(() => clientData.value?.clients ?? [])
const clientSearchInput = useSelectSearchInput('Search clients…')
const clientPickerOpen = ref(false)
const clientId = ref(props.initialClientId)
const name = ref('')
const color = ref('#3b82f6')
watch(
  [clients, clientsPending, () => props.initialClientId],
  ([available, loading, initialId]) => {
    if (initialId && available.some((client) => client.id === initialId)) {
      clientId.value = initialId
      return
    }
    if (!loading && !available.some((client) => client.id === clientId.value)) clientId.value = ''
  },
  { immediate: true },
)

const canSubmit = computed(() => clients.value.some((client) => client.id === clientId.value))
function selectClient(id: string) {
  clientId.value = id
  clientPickerOpen.value = false
}

const { pending, errorMessage, submit } = useEntityCreate({
  endpoint: '/api/projects',
  body: () => ({ clientId: clientId.value, name: name.value.trim(), color: color.value }),
  onCreated: (id) => emit('created', id),
})
watch(pending, (value) => emit('pendingChange', value))
</script>

<template>
  <div v-if="clientsError" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      title="Could not load clients"
      :description="clientFailureMessage(clientsError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading clients"
      @click="refreshClients()"
    />
  </div>
  <UCard v-else-if="clientsPending"><p class="text-muted">Loading available clients…</p></UCard>
  <CreateEntityPrerequisite
    v-else-if="!clients.length"
    entity="Project"
    parent="client"
    :cancel-label="props.cancelLabel"
    @cancel="emit('cancel')"
    @create-parent="emit('createParent')"
  />
  <form
    v-else
    class="space-y-3"
    @keydown.capture="submitModalFormOnShortcut"
    @submit.prevent="submit"
  >
    <UFormField label="Client" required>
      <USelectMenu
        :model-value="clientId"
        v-model:open="clientPickerOpen"
        value-key="value"
        :items="clients.map((client) => ({ label: client.name, value: client.id }))"
        :search-input="clientSearchInput"
        aria-label="Client"
        class="w-full"
        placeholder="Choose a client"
        :disabled="pending"
        @update:model-value="selectClient"
      />
    </UFormField>
    <UFormField label="Name" required>
      <UInput
        v-model="name"
        class="w-full"
        maxlength="200"
        placeholder="Website redesign"
        required
      />
    </UFormField>
    <UFormField label="Color" required>
      <ColorSelector v-model="color" :disabled="pending" />
    </UFormField>
    <CreateFormFooter
      entity="project"
      :error-message="errorMessage"
      :pending="pending"
      :can-submit="canSubmit"
      :cancel-label="props.cancelLabel"
      @cancel="emit('cancel')"
    />
  </form>
</template>
