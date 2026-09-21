<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const name = ref('')
const color = ref('#64748b')
const pending = ref(false)
const errorMessage = ref('')

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const client = await $fetch<{ id: string }>('/api/clients', {
      method: 'POST',
      body: { name: name.value, color: color.value },
    })
    await navigateTo(`/clients/${client.id}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to create client.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <NuxtLink to="/clients" class="text-sm text-primary">← Clients</NuxtLink>
      <h1 class="mt-3 text-3xl font-semibold text-highlighted">New client</h1>
    </div>
    <UCard>
      <form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Name" required hint="Up to 200 characters">
          <UInput v-model="name" class="w-full" autofocus placeholder="Acme Inc." />
        </UFormField>
        <UFormField label="Color" required>
          <ColorSelector v-model="color" />
        </UFormField>
        <UAlert v-if="errorMessage" color="error" title="Could not create client">{{
          errorMessage
        }}</UAlert>
        <div class="flex justify-end gap-3">
          <UButton to="/clients" color="neutral" variant="ghost" label="Cancel" />
          <UButton type="submit" :loading="pending" label="Create client" />
        </div>
      </form>
    </UCard>
  </div>
</template>
