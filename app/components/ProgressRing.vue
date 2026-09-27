<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  max: number
  label: string
  valueText: string
}>()

const safeMax = computed(() => (Number.isFinite(props.max) && props.max > 0 ? props.max : 1))
const safeValue = computed(() =>
  Math.max(0, Math.min(Number.isFinite(props.value) ? props.value : 0, safeMax.value)),
)
const circumference = 2 * Math.PI * 7.5
const dashOffset = computed(() => circumference * (1 - safeValue.value / safeMax.value))
</script>

<template>
  <span
    role="progressbar"
    class="inline-flex size-4 shrink-0 items-center justify-center"
    :aria-label="label"
    aria-valuemin="0"
    :aria-valuenow="safeValue"
    :aria-valuemax="safeMax"
    :aria-valuetext="valueText"
  >
    <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true" focusable="false">
      <circle
        cx="10"
        cy="10"
        r="7.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        class="text-muted"
        opacity="0.3"
      />
      <circle
        cx="10"
        cy="10"
        r="7.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90 10 10)"
        class="text-success"
      />
    </svg>
  </span>
</template>
