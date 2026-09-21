<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Tickets</p>
      <h1 class="mt-2 text-3xl font-semibold text-highlighted">Your ticket flow</h1>
      <p class="mt-3 max-w-2xl text-muted">Tickets and their workflow statuses will appear here.</p>
    </div>
    <UCard>
      <h2 class="font-medium text-highlighted">No tickets yet</h2>
      <p class="mt-2 text-muted">
        Tickets will be connected to releases and tracked time in later milestones.
      </p>
    </UCard>
  </div>
</template>
