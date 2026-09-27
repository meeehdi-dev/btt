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
  <div
    :data-project-card-id="item.project.id"
    class="group relative rounded-lg border border-default bg-elevated p-5 transition hover:border-primary focus-within:border-primary"
  >
    <NuxtLink
      :to="`/projects/${item.project.id}${item.project.archivedAt ? '?archived=true' : ''}`"
      :aria-label="`Open project ${item.project.name}`"
      class="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
    />
    <div class="pointer-events-none relative z-10 space-y-3">
      <div data-project-card-title class="flex min-w-0 items-start justify-between gap-3">
        <span
          class="inline-flex min-w-0 items-center gap-2 font-medium text-highlighted group-hover:text-primary"
          :title="item.project.name"
        >
          <span
            class="size-3 shrink-0 rounded-full"
            :style="{ backgroundColor: item.project.color }"
          />
          <EntityIcon kind="projects" /><span class="truncate">{{ item.project.name }}</span>
        </span>
        <UBadge v-if="item.project.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
      </div>
      <div data-project-card-summary class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
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
          class="max-w-full shrink-0"
          :counts="{ releases: item.releaseCount, tickets: item.ticketCount }"
          aria-label="Active project contents"
        />
      </div>
    </div>
  </div>
</template>
