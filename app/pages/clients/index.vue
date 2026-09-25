<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const showArchived = ref(false)
const { data, pending, error, refresh } = await useFetch('/api/clients', {
  query: computed(() => ({ archived: showArchived.value ? 'true' : undefined })),
})
const clients = computed(() => data.value?.clients ?? [])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-primary">Workspace</p>
        <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="clients" />Clients
        </h1>
        <p class="mt-3 max-w-2xl text-muted">Organize projects and releases by client.</p>
      </div>
      <div class="flex items-center gap-2">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton to="/clients/new" icon="lucide:plus" label="New client" />
      </div>
    </div>
    <UButton v-if="error" variant="ghost" color="error" label="Retry" @click="refresh()" />
    <UCard v-if="pending"><p class="text-muted">Loading clients…</p></UCard>
    <UCard v-else-if="!clients.length">
      <h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}clients yet
      </h2>
      <p class="mt-2 text-muted">Create a client to start organizing work.</p>
    </UCard>
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="client in clients"
        :key="client.id"
        :to="`/clients/${client.id}${client.archivedAt ? '?archived=true' : ''}`"
        class="rounded-lg border border-default bg-elevated p-5 transition hover:border-primary"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span
              class="size-3 rounded-full border border-default"
              :style="{ backgroundColor: client.color }"
            />
            <h2 class="inline-flex items-center gap-1 font-medium text-highlighted">
              <EntityIcon kind="clients" />{{ client.name }}
            </h2>
          </div>
          <UBadge v-if="client.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
        </div>
        <p class="mt-2 text-sm text-muted">View projects and releases</p>
      </NuxtLink>
    </div>
  </div>
</template>
