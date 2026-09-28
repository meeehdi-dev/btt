<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const {
  data: clientData,
  pending: clientsPending,
  error: clientsError,
  refresh: refreshClients,
} = await useApiFetch('/api/clients')
const clients = computed(() => clientData.value?.clients ?? [])
const clientId = ref(typeof route.query.client === 'string' ? route.query.client : '')
const name = ref('')
const color = ref('#3b82f6')
const pending = ref(false)
const errorMessage = ref('')

watch(
  clients,
  (available) => {
    if (!available.some((client) => client.id === clientId.value)) clientId.value = ''
  },
  { immediate: true },
)

const selectedClient = computed(() => clients.value.find((client) => client.id === clientId.value))
const canSubmit = computed(() => clients.value.some((client) => client.id === clientId.value))

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<{ id: string }>('/api/projects', {
        method: 'POST',
        body: { clientId: clientId.value, name: name.value, color: color.value },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo(`/projects/${result.value.id}`)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-6">
    <div>
      <HierarchyBreadcrumbs
        v-if="selectedClient"
        :ancestors="[
          {
            kind: 'clients',
            label: selectedClient.name,
            to: `/clients/${selectedClient.id}`,
          },
        ]"
        :current="{ kind: 'projects', label: 'New project' }"
      />
      <template v-else>
        <NuxtLink to="/projects" class="inline-flex items-center gap-1 text-sm text-primary"
          >← <EntityIcon kind="projects" />Projects</NuxtLink
        >
        <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="projects" />New project
        </h1>
      </template>
    </div>
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
    <UCard v-else-if="clientsPending">
      <p class="text-muted">Loading available clients…</p>
    </UCard>
    <UCard v-else-if="!clients.length">
      <h2 class="font-medium text-highlighted">Create a client first</h2>
      <p class="mt-2 text-muted">Projects must belong to an active client.</p>
      <UButton class="mt-4" to="/clients/new" icon="lucide:plus" label="Create client" />
    </UCard>
    <UCard v-else>
      <form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Client" required>
          <USelect
            v-model="clientId"
            :items="clients.map((client) => ({ label: client.name, value: client.id }))"
            class="w-full"
            placeholder="Choose a client"
          />
        </UFormField>
        <UFormField label="Name" required>
          <UInput v-model="name" class="w-full" placeholder="Website redesign" />
        </UFormField>
        <UFormField label="Color" required>
          <ColorSelector v-model="color" />
        </UFormField>
        <UAlert v-if="errorMessage" role="alert" color="error" title="Could not create project">{{
          errorMessage
        }}</UAlert>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <UButton to="/projects" color="neutral" variant="ghost" icon="lucide:x" label="Cancel" />
          <UButton
            type="submit"
            :disabled="!canSubmit"
            :loading="pending"
            icon="lucide:plus"
            label="Create project"
          />
        </div>
      </form>
    </UCard>
  </div>
</template>
