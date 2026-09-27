<script setup lang="ts">
type Mode = 'entry' | 'ticket-summary'

withDefaults(
  defineProps<{
    mode: Mode
    title: string
    to?: string
    timeLabel?: string
    trackedMinutes?: number
    estimateMinutes?: number | null
    showPercentage?: boolean
    headingTag?: 'span' | 'h2'
    headerClass?: string
    titleClass?: string
    titleTextClass?: string
    titleHint?: string
    usageClass?: string
    usagePlacement?: 'header' | 'below'
    headerUsageClass?: string
  }>(),
  { showPercentage: true },
)
</script>

<template>
  <div v-if="mode === 'entry'" class="flex min-w-0 items-center gap-2 whitespace-nowrap">
    <NuxtLink
      :to="to"
      :title="titleHint"
      :class="
        titleClass ??
        'inline-flex min-w-0 shrink items-center gap-1 font-medium text-highlighted hover:text-primary'
      "
      data-ticket-title-link
    >
      <EntityIcon kind="tickets" /><span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
    </NuxtLink>
    <span class="inline-flex shrink-0 items-center gap-1 text-muted">
      <UIcon name="lucide:clock-3" class="size-4" aria-hidden="true" />{{ timeLabel }}
    </span>
    <slot name="entry-trailing" />
  </div>
  <div v-else class="min-w-0">
    <div
      :class="headerClass ?? 'flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap'"
      aria-label="Ticket main information"
    >
      <NuxtLink
        v-if="to"
        :to="to"
        :title="titleHint"
        :class="
          titleClass ??
          'inline-flex shrink-0 items-center gap-1 font-medium text-highlighted hover:text-primary'
        "
        data-ticket-title-link
      >
        <EntityIcon kind="tickets" /><span :class="titleTextClass ?? 'max-w-36 truncate'">{{
          title
        }}</span>
      </NuxtLink>
      <h2
        v-else-if="headingTag === 'h2'"
        :class="titleClass ?? 'inline-flex min-w-0 items-center gap-1 font-medium text-highlighted'"
      >
        <EntityIcon kind="tickets" /><span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
      </h2>
      <span
        v-else
        :class="titleClass ?? 'inline-flex min-w-0 items-center gap-1 font-medium text-highlighted'"
      >
        <EntityIcon kind="tickets" /><span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
      </span>
      <div
        v-if="usagePlacement === 'header'"
        :class="headerUsageClass ?? 'shrink-0'"
        aria-label="Ticket usage"
      >
        <TicketTrackedUsage
          :minutes="trackedMinutes ?? 0"
          :estimate-minutes="estimateMinutes ?? null"
          :show-percentage="showPercentage"
        />
      </div>
      <slot name="title-trailing" />
    </div>
    <slot name="description" />
    <div
      v-if="usagePlacement !== 'header'"
      :class="usageClass ?? 'mt-1 flex min-w-0 items-center'"
      aria-label="Ticket usage"
    >
      <TicketTrackedUsage
        :minutes="trackedMinutes ?? 0"
        :estimate-minutes="estimateMinutes ?? null"
        :show-percentage="showPercentage"
      />
    </div>
  </div>
</template>
