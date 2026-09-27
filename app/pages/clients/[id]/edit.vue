<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/clients/' + id
const {
  data: client,
  error: clientError,
  refresh: refreshClient,
} = await useApiFetch(`/api/clients/${id}`, { query: { archived: 'true' } })
if (clientError.value && clientFailureStatus(clientError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Client not found' })
if (!client.value && !clientError.value)
  throw createError({ statusCode: 404, statusMessage: 'Client not found' })
const name = ref(client.value?.name ?? '')
const color = ref(client.value?.color ?? '#64748b')
const archived = ref(Boolean(client.value?.archivedAt))
const pending = ref(false)
const errorMessage = ref('')

async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest<unknown>(
      (signal) =>
        $fetch<unknown>(endpoint, {
          method: 'PATCH',
          body: { name: name.value, color: color.value, archived: archived.value },
          signal,
        }) as Promise<unknown>,
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo(`/clients/${id}${archived.value ? '?archived=true' : ''}`)
  } finally {
    pending.value = false
  }
}

async function remove() {
  if (pending.value || !confirm('Permanently delete this archived client?')) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo('/clients')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div v-if="client" class="w-full space-y-6">
    <div>
      <NuxtLink
        :to="`/clients/${id}${archived ? '?archived=true' : ''}`"
        class="inline-flex items-center gap-1 text-sm text-primary"
        >← <EntityIcon kind="clients" />Client</NuxtLink
      >
      <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="clients" />Edit client
      </h1>
    </div>
    <div v-if="clientError" class="space-y-3">
      <UAlert
        role="alert"
        color="error"
        title="Could not refresh client"
        :description="clientFailureMessage(clientError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading client"
        @click="refreshClient()"
      />
    </div>
    <UCard>
      <form class="space-y-5" @submit.prevent="save">
        <UFormField label="Name" required
          ><UInput v-model="name" class="w-full" autofocus
        /></UFormField>
        <UFormField label="Color" required>
          <ColorSelector v-model="color" />
        </UFormField>
        <UCheckbox v-model="archived" label="Archived" />
        <UAlert v-if="errorMessage" role="alert" color="error" title="Could not save changes">{{
          errorMessage
        }}</UAlert>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UButton
            v-if="archived"
            color="error"
            variant="ghost"
            icon="lucide:trash-2"
            label="Permanently delete"
            class="w-full sm:w-auto"
            @click="remove"
          />
          <div class="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <UButton
              :to="`/clients/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
              class="w-full sm:w-auto"
            /><UButton
              type="submit"
              :loading="pending"
              icon="lucide:save"
              label="Save changes"
              class="w-full sm:w-auto"
            />
          </div>
        </div>
      </form>
    </UCard>
  </div>
  <UCard v-else-if="clientError" class="space-y-3">
    <UAlert
      role="alert"
      color="error"
      title="Could not load client"
      :description="clientFailureMessage(clientError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading client"
      @click="refreshClient()"
    />
  </UCard>
</template>
