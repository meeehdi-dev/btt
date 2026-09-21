<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Today</p>
      <h1 class="mt-2 text-3xl font-semibold text-highlighted">Your workday starts here</h1>
      <p class="mt-3 max-w-2xl text-muted">Your agenda will appear here once you add work.</p>
    </div>
    <UCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="font-medium text-highlighted">No tracked work yet</h2>
          <p class="mt-2 text-muted">Time entries and the day agenda arrive in later milestones.</p>
        </div>
        <UIcon name="i-lucide-calendar-days" class="size-10 text-muted" aria-hidden="true" />
      </div>
    </UCard>
  </div>
</template>
