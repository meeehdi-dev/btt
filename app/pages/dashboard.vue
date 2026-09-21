<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-primary">Protected shell</p>
        <h1 class="mt-2 text-3xl font-semibold text-highlighted">Your workday starts here</h1>
        <p class="mt-3 max-w-xl text-muted">
          The empty dashboard is ready for the M1 authenticated application shell.
        </p>
      </div>
      <a
        class="rounded-md border border-muted px-3 py-2 text-sm font-medium text-default"
        href="/login?logout=1"
        >Sign out</a
      >
    </div>
    <UCard>
      <p class="font-medium text-highlighted">No work yet</p>
      <p class="mt-2 text-muted">
        Clients, projects, tickets, and Today will arrive in later milestones.
      </p>
    </UCard>
  </div>
</template>
