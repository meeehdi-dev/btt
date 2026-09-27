<script setup lang="ts">
import type { EntityKind } from '~/utils/entity-icons'

type CountKind = 'projects' | 'releases' | 'tickets'
type Counts = Partial<Record<CountKind, number>>
type CountItem = { kind: CountKind; count: number }

const props = defineProps<{ counts: Counts; ariaLabel?: string }>()
const countItems = computed(() => {
  const items: CountItem[] = []
  for (const kind of ['projects', 'releases', 'tickets'] as const) {
    const count = props.counts[kind]
    if (count !== undefined) items.push({ kind, count })
  }
  return items
})
const icons: Record<CountKind, EntityKind> = {
  projects: 'projects',
  releases: 'releases',
  tickets: 'tickets',
}
const labels: Record<CountKind, string> = {
  projects: 'project',
  releases: 'release',
  tickets: 'ticket',
}
</script>

<template>
  <ul
    class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted"
    :aria-label="ariaLabel ?? 'Active hierarchy counts'"
  >
    <li v-for="item in countItems" :key="item.kind" class="inline-flex items-center gap-1">
      <EntityIcon :kind="icons[item.kind]" />
      <span>{{ item.count }} {{ labels[item.kind] }}{{ item.count === 1 ? '' : 's' }}</span>
    </li>
  </ul>
</template>
