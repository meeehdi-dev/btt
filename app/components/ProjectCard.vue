<script setup lang="ts">
import type { Project } from '../../server/db/schema'

type ProjectCardItem = {
  project: Omit<
    Pick<Project, 'id' | 'clientId' | 'name' | 'color' | 'archivedAt'>,
    'archivedAt'
  > & {
    archivedAt: Date | string | null
  }
  clientName: string
  clientArchivedAt: Date | string | null
  releaseCount: number
  ticketCount: number
}

defineProps<{ item: ProjectCardItem }>()
</script>

<template>
  <EntityCard :data-project-card-id="item.project.id">
    <template #navigation>
      <NuxtLink
        :to="`/projects/${item.project.id}${item.project.archivedAt ? '?archived=true' : ''}`"
        :aria-label="`Open project ${item.project.name}`"
        class="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
      />
    </template>
    <template #heading>
      <div data-project-card-title class="flex min-w-0 items-center gap-2">
        <span
          class="size-3 shrink-0 rounded-full"
          :style="{ backgroundColor: item.project.color }"
        />
        <h2
          class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted"
          :title="item.project.name"
        >
          <EntityIcon kind="projects" /><span class="truncate">{{ item.project.name }}</span>
        </h2>
      </div>
      <UBadge v-if="item.project.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
    </template>
    <template #context>
      <div data-project-card-summary class="flex min-w-0 flex-wrap items-center gap-2">
        <TicketHierarchyBadges
          mode="links"
          truncate-labels
          class="pointer-events-auto relative z-10 max-w-full"
          :items="[
            {
              kind: 'client',
              id: item.project.clientId,
              name: item.clientName,
              to: `/clients/${item.project.clientId}${item.clientArchivedAt ? '?archived=true' : ''}`,
            },
          ]"
          aria-label="Project client"
        />
        <HierarchyCounts
          v-if="!item.project.archivedAt && !item.clientArchivedAt"
          :counts="{ releases: item.releaseCount, tickets: item.ticketCount }"
          aria-label="Active project contents"
        />
      </div>
    </template>
  </EntityCard>
</template>
