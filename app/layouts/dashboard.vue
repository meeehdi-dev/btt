<script setup lang="ts">
import { authClient } from '~/lib/auth-client'
import { toClientApiFailure } from '~/utils/client-effect'
import { entityIcons } from '~/utils/entity-icons'

const navigation = [
  { label: 'Agenda', to: '/agenda', icon: entityIcons.agenda, shortcut: 'a' },
  { label: 'Tickets', to: '/tickets', icon: entityIcons.tickets, shortcut: 'b' },
  { label: 'Clients', to: '/clients', icon: entityIcons.clients, shortcut: 'c' },
]
const { data: session, error: sessionError } = await authClient.useSession(useApiFetch)
const sessionErrorMessage = computed(() =>
  sessionError.value ? toClientApiFailure(sessionError.value).userMessage : '',
)
const search = ref<{ focus: () => void } | null>(null)
let navigationPrefix = false
let prefixTimeout: ReturnType<typeof setTimeout> | undefined
function shortcuts(event: KeyboardEvent) {
  const target = event.target
  if (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable="true"], [role="combobox"]')
  )
    return
  if (
    ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') ||
    (!event.metaKey && !event.ctrlKey && event.key === '/')
  ) {
    event.preventDefault()
    search.value?.focus()
    return
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (navigationPrefix) {
    navigationPrefix = false
    clearTimeout(prefixTimeout)
    const item = navigation.find((entry) => entry.shortcut === event.key.toLowerCase())
    if (item) {
      event.preventDefault()
      void navigateTo(item.to)
    }
  } else if (event.key.toLowerCase() === 'g') {
    navigationPrefix = true
    clearTimeout(prefixTimeout)
    prefixTimeout = setTimeout(() => {
      navigationPrefix = false
    }, 1000)
  }
}
onMounted(() => window.addEventListener('keydown', shortcuts))
onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('keydown', shortcuts)
  clearTimeout(prefixTimeout)
})
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="sticky top-0 z-30 border-b border-muted bg-elevated px-4 py-2">
      <div
        class="mx-auto grid w-full grid-cols-[minmax(0,1fr)_minmax(18rem,32rem)_minmax(0,1fr)] items-center gap-2"
      >
        <div data-header-block="left" class="flex min-w-0 items-center gap-2">
          <NuxtLink to="/agenda" class="shrink-0 font-semibold text-highlighted">nxmr</NuxtLink>
          <nav class="flex min-w-0 items-center gap-1" aria-label="Main navigation">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted hover:bg-accented hover:text-highlighted"
              active-class="bg-primary/10 text-primary"
            >
              <UIcon :name="item.icon" class="size-4 shrink-0" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>
        <div data-header-block="search" class="w-full min-w-0 justify-self-center">
          <GlobalSearch ref="search" />
        </div>
        <div data-header-block="account" class="min-w-0">
          <AccountControls :name="session?.user.name" :image="session?.user.image" />
        </div>
      </div>
    </header>
    <main class="w-full p-4">
      <div v-if="sessionError" class="mx-auto max-w-xl space-y-2">
        <UAlert
          role="alert"
          color="error"
          title="Could not verify your session"
          :description="sessionErrorMessage"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="lucide:refresh-cw"
          label="Retry session verification"
          @click="refreshNuxtData()"
        />
        <UButton to="/login" color="neutral" variant="ghost" label="Return to sign in" />
      </div>
      <slot v-else />
    </main>
  </div>
</template>
