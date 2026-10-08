<script setup lang="ts">
import { usageColor } from '#shared/time-entry'
import { formatTicketEstimate } from '~/utils/ticket-estimate'

const props = withDefaults(
  defineProps<{
    minutes: number
    estimateMinutes: number | null
    showPercentage?: boolean
    textSize?: 'xs' | 'sm'
  }>(),
  { showPercentage: true, textSize: 'sm' },
)
const percentage = computed(() =>
  props.estimateMinutes ? Math.floor((props.minutes / props.estimateMinutes) * 100) : null,
)
const textClasses = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
} as const
const trackedTextClass = computed(() =>
  props.estimateMinutes
    ? textClasses[usageColor(props.minutes, props.estimateMinutes)]
    : 'text-muted',
)
</script>

<template>
  <span
    class="inline-flex items-center gap-2 text-muted"
    :class="textSize === 'xs' ? 'text-xs' : 'text-sm'"
  >
    <span
      :aria-label="`Tracked: ${formatTicketEstimate(minutes)}${estimateMinutes ? ` of ${formatTicketEstimate(estimateMinutes)}` : ''}`"
      class="inline-flex items-center gap-1"
      ><UIcon name="lucide:clock-3" class="size-4" aria-hidden="true" /><span
        :class="trackedTextClass"
        >{{ formatTicketEstimate(minutes) }}</span
      ><span v-if="estimateMinutes" class="text-muted"
        >/ {{ formatTicketEstimate(estimateMinutes) }}</span
      ></span
    >
    <UBadge
      v-if="showPercentage !== false && percentage !== null"
      :color="usageColor(minutes, estimateMinutes!)"
      variant="subtle"
      :aria-label="`Estimate usage: ${percentage}%`"
      >{{ percentage }}%</UBadge
    >
  </span>
</template>
