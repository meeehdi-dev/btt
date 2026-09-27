<script setup lang="ts">
import { authClient } from '~/lib/auth-client'
import { toClientApiFailure } from '~/utils/client-effect'
import { entityIcons } from '~/utils/entity-icons'

const navigation = [
  { label: 'Today', to: '/today', icon: entityIcons.today, shortcut: 't' },
  { label: 'Clients', to: '/clients', icon: entityIcons.clients, shortcut: 'c' },
  { label: 'Projects', to: '/projects', icon: entityIcons.projects, shortcut: 'p' },
  { label: 'Tickets', to: '/tickets', icon: entityIcons.tickets, shortcut: 'b' },
]
const { data: session, error: sessionError } = await authClient.useSession(useApiFetch)
const sessionErrorMessage = computed(() =>
  sessionError.value ? toClientApiFailure(sessionError.value).userMessage : '',
)
const expanded = ref(false)
const menuOpen = ref(false)
const desktopSearch = ref<{ focus: () => void } | null>(null)
const mobileSearch = ref<{ focus: () => void } | null>(null)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
onMounted(() => {
  expanded.value = localStorage.getItem('nxmr-sidebar-expanded') === 'true'
})
watch(expanded, (value) => {
  if (import.meta.client) localStorage.setItem('nxmr-sidebar-expanded', String(value))
})
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
    if (window.matchMedia('(max-width: 767px)').matches) {
      menuOpen.value = true
      void nextTick(() => mobileSearch.value?.focus())
    } else desktopSearch.value?.focus()
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
  <div class="min-h-screen bg-default md:flex">
    <aside
      class="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-muted bg-elevated transition-[width] md:flex"
      :class="expanded ? 'w-52' : 'w-16'"
      aria-label="Sidebar"
    >
      <div
        class="flex items-center gap-1 p-2"
        :class="expanded ? 'justify-between' : 'justify-center'"
      >
        <NuxtLink v-if="expanded" to="/today" class="truncate px-2 font-semibold text-highlighted"
          >nxmr</NuxtLink
        >
        <UTooltip :text="expanded ? 'Collapse sidebar' : 'Expand sidebar'">
          <UButton
            color="neutral"
            variant="ghost"
            :icon="expanded ? 'lucide:panel-left-close' : 'lucide:panel-left-open'"
            :aria-label="expanded ? 'Collapse sidebar' : 'Expand sidebar'"
            @click="expanded = !expanded"
          />
        </UTooltip>
      </div>
      <nav class="flex flex-col gap-1 p-2" aria-label="Main navigation">
        <UTooltip
          v-for="item in navigation"
          :key="item.to"
          :text="`${item.label} (g then ${item.shortcut})`"
        >
          <NuxtLink
            :to="item.to"
            :aria-label="item.label"
            class="flex items-center gap-3 rounded-md p-2 text-sm text-muted hover:bg-accented hover:text-highlighted"
            :class="expanded ? '' : 'justify-center'"
            active-class="bg-primary/10 text-primary"
          >
            <UIcon :name="item.icon" class="size-5 shrink-0" aria-hidden="true" /><span
              v-if="expanded"
              class="truncate"
              >{{ item.label }}</span
            >
          </NuxtLink>
        </UTooltip>
      </nav>
      <div class="mt-auto border-t border-muted p-2">
        <AccountMenu :name="session?.user.name" :image="session?.user.image" :expanded="expanded" />
      </div>
    </aside>
    <div class="min-w-0 flex-1">
      <header class="sticky top-0 z-30 border-b border-muted bg-elevated px-4 py-2 sm:px-6">
        <div class="hidden md:flex md:justify-center"><GlobalSearch ref="desktopSearch" /></div>
        <div class="flex items-center justify-between md:hidden">
          <NuxtLink to="/today" class="font-semibold text-highlighted">nxmr</NuxtLink>
          <UTooltip text="Open menu">
            <UButton
              color="neutral"
              variant="ghost"
              icon="lucide:menu"
              aria-label="Open menu"
              @click="menuOpen = true"
            />
          </UTooltip>
        </div>
      </header>
      <main class="w-full px-4 py-4 sm:px-6">
        <div v-if="sessionError" class="mx-auto max-w-xl space-y-3">
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
    <UModal v-model:open="menuOpen" fullscreen title="Menu" :ui="{ body: 'flex flex-col gap-4' }">
      <template #body>
        <GlobalSearch ref="mobileSearch" @select="menuOpen = false" />
        <nav class="flex flex-col gap-2" aria-label="Mobile navigation">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-md p-3 text-default hover:bg-accented"
            active-class="bg-primary/10 text-primary"
            @click="menuOpen = false"
            ><UIcon :name="item.icon" class="size-5" aria-hidden="true" />{{ item.label }}</NuxtLink
          >
        </nav>
        <div class="mt-auto border-t border-muted pt-4">
          <AccountMenu
            :name="session?.user.name"
            :image="session?.user.image"
            mobile
            @navigate="menuOpen = false"
          />
        </div>
        <p class="text-xs text-muted">Shortcuts: / or ⌘K search · g then t/c/p/b navigate</p>
      </template>
    </UModal>
  </div>
</template>
