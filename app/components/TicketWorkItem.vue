<script setup lang="ts">
import { ticketStatusIcon, type TicketStatus } from '#shared/ticket-status'

type Mode = 'entry' | 'ticket-summary'

withDefaults(
  defineProps<{
    mode: Mode
    title: string
    status: TicketStatus
    to?: string
    timeLabel?: string
    trackedMinutes?: number
    estimateMinutes?: number | null
    showPercentage?: boolean
    usageTextSize?: 'xs' | 'sm'
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
    <div v-if="$slots['status-icon-action']" class="inline-flex min-w-0 shrink items-center gap-1">
      <slot name="status-icon-action" />
      <NuxtLink
        :to="to"
        :title="titleHint"
        :class="
          titleClass ??
          'inline-flex min-w-0 shrink items-center gap-1 font-medium text-highlighted hover:text-primary'
        "
        data-ticket-title-link
      >
        <span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
      </NuxtLink>
    </div>
    <NuxtLink
      v-else
      :to="to"
      :title="titleHint"
      :class="
        titleClass ??
        'inline-flex min-w-0 shrink items-center gap-1 font-medium text-highlighted hover:text-primary'
      "
      data-ticket-title-link
    >
      <UIcon
        :name="ticketStatusIcon(status)"
        class="size-4 shrink-0"
        :data-ticket-status-icon="status"
        aria-hidden="true"
      /><span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
    </NuxtLink>
    <slot name="entry-title-action" />
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
      <div
        v-if="to && $slots['status-icon-action']"
        class="inline-flex min-w-0 shrink items-center gap-1"
      >
        <slot name="status-icon-action" />
        <NuxtLink
          :to="to"
          :title="titleHint"
          :class="
            titleClass ??
            'inline-flex shrink-0 items-center gap-1 font-medium text-highlighted hover:text-primary'
          "
          data-ticket-title-link
        >
          <span :class="titleTextClass ?? 'max-w-36 truncate'">{{ title }}</span>
        </NuxtLink>
      </div>
      <NuxtLink
        v-else-if="to"
        :to="to"
        :title="titleHint"
        :class="
          titleClass ??
          'inline-flex shrink-0 items-center gap-1 font-medium text-highlighted hover:text-primary'
        "
        data-ticket-title-link
      >
        <UIcon
          :name="ticketStatusIcon(status)"
          class="size-4 shrink-0"
          :data-ticket-status-icon="status"
          aria-hidden="true"
        /><span :class="titleTextClass ?? 'max-w-36 truncate'">{{ title }}</span>
      </NuxtLink>
      <h2
        v-else-if="headingTag === 'h2'"
        :class="titleClass ?? 'inline-flex min-w-0 items-center gap-1 font-medium text-highlighted'"
      >
        <UIcon
          :name="ticketStatusIcon(status)"
          class="size-4 shrink-0"
          :data-ticket-status-icon="status"
          aria-hidden="true"
        /><span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
      </h2>
      <span
        v-else
        :class="titleClass ?? 'inline-flex min-w-0 items-center gap-1 font-medium text-highlighted'"
      >
        <UIcon
          :name="ticketStatusIcon(status)"
          class="size-4 shrink-0"
          :data-ticket-status-icon="status"
          aria-hidden="true"
        /><span :class="titleTextClass ?? 'truncate'">{{ title }}</span>
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
          :text-size="usageTextSize"
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
        :text-size="usageTextSize"
      />
    </div>
  </div>
</template>
