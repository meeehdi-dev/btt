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
  compact?: boolean
  scroll?: boolean
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
    :class="[
      'flex min-w-0 items-center gap-1',
      scroll ? 'max-w-full flex-1 flex-nowrap overflow-x-auto overflow-y-hidden' : 'flex-wrap',
    ]"
    :aria-label="ariaLabel"
  >
    <template v-for="item in items" :key="item.kind">
      <UPopover v-if="mode === 'filter-actions'" :content="{ side: 'top', avoidCollisions: false }">
        <UButton
          size="xs"
          :color="compact ? 'secondary' : 'neutral'"
          variant="soft"
          :title="truncateLabels ? item.name : undefined"
          :class="[
            compact
              ? '!h-5 !min-h-5 !px-1 text-[10px]'
              : '!bg-default !px-2 !text-muted hover:!text-default',
            truncateLabels ? (compact ? 'max-w-24 shrink-0' : 'max-w-32 shrink-0') : 'shrink-0',
          ]"
          :aria-label="`${item.kind}: ${item.name}; actions`"
        >
          <EntityIcon
            :kind="icons[item.kind]"
            :class="compact ? '!size-3 text-secondary-700 dark:text-secondary-300' : ''"
          /><span
            :class="[
              truncateLabels ? 'min-w-0 truncate' : '',
              compact ? 'text-secondary-700 dark:text-secondary-300' : '',
            ]"
            >{{ item.name }}</span
          >
        </UButton>
        <template #content>
          <div class="flex min-w-36 flex-col gap-1 p-1">
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
        :color="compact ? 'secondary' : 'neutral'"
        variant="soft"
        :title="truncateLabels ? item.name : undefined"
        :class="[
          compact
            ? '!h-5 !min-h-5 !px-1 text-[10px]'
            : '!bg-default !px-2 !text-muted hover:!text-default',
          truncateLabels ? (compact ? 'max-w-24 shrink-0' : 'max-w-32 shrink-0') : 'shrink-0',
        ]"
      >
        <EntityIcon
          :kind="icons[item.kind]"
          :class="compact ? '!size-3 text-secondary-700 dark:text-secondary-300' : ''"
        /><span
          :class="[
            truncateLabels ? 'min-w-0 truncate' : '',
            compact ? 'text-secondary-700 dark:text-secondary-300' : '',
          ]"
          >{{ item.name }}</span
        >
      </UButton>
    </template>
    <slot name="trailing" />
  </div>
</template>
