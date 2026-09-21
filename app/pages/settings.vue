<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Settings</p>
      <h1 class="mt-2 text-3xl font-semibold text-highlighted">Workspace settings</h1>
      <p class="mt-3 max-w-2xl text-muted">Personalize your workday when settings arrive.</p>
    </div>
    <UCard>
      <h2 class="font-medium text-highlighted">Settings are coming soon</h2>
      <p class="mt-2 text-muted">Agenda hours and workday preferences will be configured here.</p>
    </UCard>
  </div>
</template>
