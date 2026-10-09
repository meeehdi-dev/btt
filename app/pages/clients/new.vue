<script setup lang="ts">
import { useAppDataInvalidation } from '~/composables/useAppDataInvalidation'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { invalidateMutation } = useAppDataInvalidation()

const name = ref('')
const color = ref('#64748b')
const pending = ref(false)
const errorMessage = ref('')

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<{ id: string }>('/api/clients', {
        method: 'POST',
        body: { name: name.value, color: color.value },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await invalidateMutation('client')
    await navigateTo(`/clients/${result.value.id}`)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-4">
    <div>
      <NuxtLink to="/clients" class="inline-flex items-center gap-1 text-sm text-primary"
        >← <EntityIcon kind="clients" />Clients</NuxtLink
      >
      <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="clients" />New client
      </h1>
    </div>
    <UCard>
      <form class="space-y-3" @submit.prevent="submit">
        <UFormField label="Name" required hint="Up to 200 characters">
          <UInput v-model="name" class="w-full" autofocus placeholder="Acme Inc." />
        </UFormField>
        <UFormField label="Color" required>
          <ColorSelector v-model="color" />
        </UFormField>
        <UAlert v-if="errorMessage" role="alert" color="error" title="Could not create client">{{
          errorMessage
        }}</UAlert>
        <div class="flex justify-end gap-2">
          <UButton to="/clients" color="neutral" variant="ghost" icon="lucide:x" label="Cancel" />
          <UButton type="submit" :loading="pending" icon="lucide:plus" label="Create client" />
        </div>
      </form>
    </UCard>
  </div>
</template>
