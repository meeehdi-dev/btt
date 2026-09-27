<script setup lang="ts">
import type { EntityKind } from '~/utils/entity-icons'

type HierarchyKind = 'client' | 'project' | 'release'
type HierarchyItem = {
  kind: HierarchyKind
  id: string
  name: string
  to: string
}

defineProps<{
  items: HierarchyItem[]
  mode: 'links' | 'filter-actions'
  truncateLabels?: boolean
  ariaLabel?: string
}>()
const emit = defineEmits<{
  filter: [kind: HierarchyKind, id: string]
}>()

const icons: Record<HierarchyKind, EntityKind> = {
  client: 'clients',
  project: 'projects',
  release: 'releases',
}
</script>

<template>
  <div
    :class="
      mode === 'filter-actions'
        ? 'flex min-w-0 shrink-0 items-center gap-1 overflow-x-auto'
        : 'flex flex-wrap items-center gap-1'
    "
    :aria-label="ariaLabel"
  >
    <template v-for="item in items" :key="item.kind">
      <UPopover v-if="mode === 'filter-actions'" :content="{ side: 'top', avoidCollisions: false }">
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          class="!bg-default !px-1.5 !text-muted hover:!text-default"
          :aria-label="`${item.kind}: ${item.name}; actions`"
        >
          <EntityIcon :kind="icons[item.kind]" />{{ item.name }}
        </UButton>
        <template #content>
          <div class="flex min-w-36 flex-col gap-1 p-2">
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="lucide:filter"
              :label="`Filter by ${item.name}`"
              @click="emit('filter', item.kind, item.id)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              :to="item.to"
              icon="lucide:external-link"
              :label="`Open ${item.name}`"
            />
          </div>
        </template>
      </UPopover>
      <UButton
        v-else
        :to="item.to"
        size="xs"
        color="neutral"
        variant="soft"
        :title="truncateLabels ? item.name : undefined"
        :class="[
          '!bg-default !px-1.5 !text-muted hover:!text-default',
          truncateLabels ? 'max-w-32 shrink-0' : 'shrink-0',
        ]"
      >
        <EntityIcon :kind="icons[item.kind]" /><span
          :class="truncateLabels ? 'min-w-0 truncate' : ''"
          >{{ item.name }}</span
        >
      </UButton>
    </template>
  </div>
</template>
