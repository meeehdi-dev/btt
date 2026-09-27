<script setup lang="ts">
import type { Client } from '../../server/db/schema'

type ClientCardItem = Omit<Pick<Client, 'id' | 'name' | 'color' | 'archivedAt'>, 'archivedAt'> & {
  archivedAt: Date | string | null
  projectCount: number
  releaseCount: number
  ticketCount: number
}

defineProps<{ item: ClientCardItem }>()
</script>

<template>
  <EntityCard :data-client-card-id="item.id">
    <template #navigation>
      <NuxtLink
        :to="`/clients/${item.id}${item.archivedAt ? '?archived=true' : ''}`"
        :aria-label="`Open client ${item.name}`"
        class="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
      />
    </template>
    <template #heading>
      <div data-client-card-title class="flex min-w-0 items-center gap-2">
        <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: item.color }" />
        <h2
          class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted"
          :title="item.name"
        >
          <EntityIcon kind="clients" /><span class="truncate">{{ item.name }}</span>
        </h2>
      </div>
      <UBadge v-if="item.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
    </template>
    <template v-if="!item.archivedAt" #context>
      <HierarchyCounts
        :counts="{
          projects: item.projectCount,
          releases: item.releaseCount,
          tickets: item.ticketCount,
        }"
        aria-label="Active client contents"
      />
    </template>
  </EntityCard>
</template>
