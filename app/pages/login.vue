<script setup lang="ts">
const { isAuthenticated, isDevelopment, signOut } = useMockSession()
const route = useRoute()

if (route.query.logout === '1') {
  signOut()
} else if (isAuthenticated.value) {
  await navigateTo('/dashboard')
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div>
        <p class="text-sm font-medium text-primary">nxmr</p>
        <h1 class="mt-2 text-2xl font-semibold text-highlighted">Welcome back</h1>
      </div>
    </template>
    <p class="text-muted">Authentication is being prepared for M1.</p>
    <UAlert v-if="isDevelopment" class="mt-6" color="warning" title="Development demo access">
      This temporary sign-in is not real authentication and protects no data.
    </UAlert>
    <a
      v-if="isDevelopment"
      class="mt-6 block w-full rounded-md bg-primary px-4 py-2 text-center font-medium text-inverted"
      href="/dashboard?demo=1"
      role="button"
    >
      Continue to demo dashboard
    </a>
  </UCard>
</template>
