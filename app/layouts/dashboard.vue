<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const navigation = [
  { label: 'Today', to: '/today' },
  { label: 'Projects', to: '/projects' },
  { label: 'Tickets', to: '/tickets' },
  { label: 'Settings', to: '/settings' },
]
const { data: session } = await authClient.useSession(useFetch)
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-muted bg-elevated">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex items-center justify-between gap-4">
          <NuxtLink class="text-lg font-semibold text-highlighted" to="/today">nxmr</NuxtLink>
        </div>
        <nav class="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:pb-0" aria-label="Main navigation">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-accented hover:text-highlighted"
            active-class="bg-primary/10 text-primary"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-3">
          <span class="max-w-48 truncate text-sm text-muted">{{ session?.user.name }}</span>
          <form action="/api/logout" method="post">
            <button
              type="submit"
              class="rounded-md border border-muted px-3 py-2 text-sm font-medium text-default transition hover:bg-accented"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <slot />
    </main>
  </div>
</template>
