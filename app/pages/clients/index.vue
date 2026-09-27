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
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-highlighted">Clients</h1>
      <div class="flex flex-col gap-2 sm:flex-row">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton to="/clients/new" icon="lucide:plus" label="New client" />
      </div>
    </div>
    <UButton
      v-if="error"
      variant="ghost"
      color="error"
      icon="lucide:refresh-cw"
      label="Retry"
      @click="refresh()"
    />
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
        :data-client-card-id="client.id"
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
        <HierarchyCounts
          v-if="!client.archivedAt"
          class="mt-3"
          :counts="{
            projects: client.projectCount,
            releases: client.releaseCount,
            tickets: client.ticketCount,
          }"
          aria-label="Active client contents"
        />
      </NuxtLink>
    </div>
  </div>
</template>
