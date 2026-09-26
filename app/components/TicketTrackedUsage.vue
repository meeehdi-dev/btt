<script setup lang="ts">
import { usageColor } from '#shared/time-entry'
import { formatTicketEstimate } from '~/utils/ticket-estimate'

const props = defineProps<{ minutes: number; estimateMinutes: number | null }>()
const percentage = computed(() =>
  props.estimateMinutes ? Math.floor((props.minutes / props.estimateMinutes) * 100) : null,
)
</script>

<template>
  <span class="inline-flex items-center gap-2 text-sm text-muted">
    <span
      :aria-label="`Tracked: ${formatTicketEstimate(minutes)}${estimateMinutes ? ` of ${formatTicketEstimate(estimateMinutes)}` : ''}`"
      class="inline-flex items-center gap-1"
      ><UIcon name="lucide:clock-3" class="size-4" aria-hidden="true" /><span
        class="text-primary"
        >{{ formatTicketEstimate(minutes) }}</span
      ><span v-if="estimateMinutes" class="text-muted"
        >/ {{ formatTicketEstimate(estimateMinutes) }}</span
      ></span
    >
    <UBadge
      v-if="percentage !== null"
      :color="usageColor(minutes, estimateMinutes!)"
      variant="subtle"
      :aria-label="`Estimate usage: ${percentage}%`"
      >{{ percentage }}%</UBadge
    >
  </span>
</template>
