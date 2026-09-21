<script setup lang="ts">
import { releaseDateInfo } from '~/utils/release-date'

const props = defineProps<{ targetDate: string | null }>()
const info = computed(() => (props.targetDate ? releaseDateInfo(props.targetDate) : null))
</script>

<template>
  <UTooltip v-if="info" :text="info.full">
    <span
      class="inline-flex items-center gap-1 text-sm"
      :class="info.overdue ? 'text-error' : 'text-muted'"
      :aria-label="`Target date: ${info.full}, ${info.relative}`"
    >
      <UIcon name="lucide:calendar-days" class="size-4" aria-hidden="true" />
      <span>{{ info.relative }}</span>
    </span>
  </UTooltip>
</template>
