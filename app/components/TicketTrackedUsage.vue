<script setup lang="ts">
import { formatTicketEstimate } from '~/utils/ticket-estimate'

withDefaults(
  defineProps<{
    minutes: number
    textSize?: 'xs' | 'sm'
  }>(),
  { textSize: 'sm' },
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1 text-muted"
    :class="textSize === 'xs' ? 'text-xs' : 'text-sm'"
    :aria-label="`Tracked: ${formatTicketEstimate(minutes)}`"
  >
    <UIcon name="lucide:clock-3" class="size-4" aria-hidden="true" />
    <span>{{ formatTicketEstimate(minutes) }}</span>
  </span>
</template>
