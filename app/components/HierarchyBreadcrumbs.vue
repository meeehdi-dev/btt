<script setup lang="ts">
import type { EntityKind } from '~/utils/entity-icons'

type HierarchyEntityKind = Extract<EntityKind, 'clients' | 'projects' | 'releases' | 'tickets'>

type BreadcrumbAncestor = {
  kind: HierarchyEntityKind
  label: string
  to: string
}

type BreadcrumbCurrent = {
  kind: HierarchyEntityKind
  label: string
}

defineProps<{
  ancestors: BreadcrumbAncestor[]
  current: BreadcrumbCurrent
}>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <li
        v-for="(item, index) in ancestors"
        :key="`${item.kind}-${item.to}`"
        class="flex min-w-0 max-w-full items-center gap-2"
      >
        <NuxtLink
          :to="item.to"
          class="inline-flex min-w-0 max-w-full items-center gap-1 text-sm text-muted hover:text-primary"
        >
          <EntityIcon :kind="item.kind" />
          <span class="max-w-48 truncate sm:max-w-64" :title="item.label">{{ item.label }}</span>
        </NuxtLink>
        <UIcon name="lucide:chevron-right" class="size-4 shrink-0 text-muted" aria-hidden="true" />
      </li>
      <li class="min-w-0 max-w-full">
        <h1
          aria-current="page"
          class="flex min-w-0 max-w-full items-center gap-2 text-3xl font-semibold text-highlighted"
        >
          <slot name="current-prefix" />
          <EntityIcon :kind="current.kind" />
          <span class="min-w-0 break-words">{{ current.label }}</span>
          <slot name="current-suffix" />
        </h1>
      </li>
    </ol>
  </nav>
</template>
