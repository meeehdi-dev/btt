<script setup lang="ts">
import { formatTicketEstimate } from '~/utils/ticket-estimate'

defineProps<{ minutes: number | null }>()
</script>

<template>
  <span
    v-if="minutes"
    class="inline-flex items-center gap-1 text-sm text-muted"
    :aria-label="`Estimated: ${formatTicketEstimate(minutes)}`"
  >
    <UIcon name="lucide:clock" class="size-4" aria-hidden="true" />
    <span>{{ formatTicketEstimate(minutes) }}</span>
  </span>
</template>
