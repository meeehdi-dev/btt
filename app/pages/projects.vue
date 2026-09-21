<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Projects</p>
      <h1 class="mt-2 text-3xl font-semibold text-highlighted">Your projects</h1>
      <p class="mt-3 max-w-2xl text-muted">Projects, clients, and releases will live here.</p>
    </div>
    <UCard>
      <h2 class="font-medium text-highlighted">No projects yet</h2>
      <p class="mt-2 text-muted">
        Create your first project when the next milestone adds workspace data.
      </p>
    </UCard>
  </div>
</template>
