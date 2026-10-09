<script setup lang="ts">
import { useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { ticketStatusIcon, type TicketStatus } from '#shared/ticket-status'
import { entityIcons } from '~/utils/entity-icons'

type SearchResponse = {
  clients: { id: string; label: string }[]
  projects: { id: string; label: string; clientName: string }[]
  releases: { id: string; label: string; projectName: string }[]
  tickets: {
    id: string
    label: string
    status: TicketStatus
    releaseName: string
  }[]
  timeEntries: {
    id: string
    label: string | null
    date: string
    startMinute: number
    ticketTitle: string
  }[]
}

const emit = defineEmits<{ select: [] }>()
const input = ref<HTMLInputElement | null>(null)
const resultsId = useId()
const query = ref('')
const loading = ref(false)
const failed = ref(false)
const open = ref(false)
const selected = ref(0)
type Hit = {
  id: string
  label: string
  detail: string
  to: string
  icon: string
  category: string
  status?: TicketStatus
}
const hits = ref<Hit[]>([])
let request = 0
let timer: ReturnType<typeof setTimeout> | undefined
let activeController: AbortController | undefined
let stale = false
const items = computed(() => hits.value)
const { onInvalidated } = useAppDataInvalidation()

function search(value: string, delay = 250) {
  clearTimeout(timer)
  activeController?.abort()
  activeController = undefined
  const current = ++request
  hits.value = []
  selected.value = 0
  failed.value = false
  loading.value = false
  const normalized = value.trim()
  if (normalized.length < 2) return
  loading.value = true
  timer = setTimeout(async () => {
    const controller = new AbortController()
    activeController = controller
    const searchEndpoint: string = '/api/search'
    const result = await runClientRequest<SearchResponse>(() =>
      $fetch<SearchResponse>(searchEndpoint, {
        query: { q: normalized },
        signal: controller.signal,
      }),
    )
    if (current !== request) return
    if (result._tag === 'Failure') {
      failed.value = true
      loading.value = false
      return
    }
    const results = result.value
    hits.value = [
      ...results.clients.map((item) => ({
        id: item.id,
        label: item.label,
        detail: '',
        to: `/clients/${item.id}`,
        icon: entityIcons.clients,
        category: 'Clients',
      })),
      ...results.projects.map((item) => ({
        id: item.id,
        label: item.label,
        detail: item.clientName,
        to: `/projects/${item.id}`,
        icon: entityIcons.projects,
        category: 'Projects',
      })),
      ...results.releases.map((item) => ({
        id: item.id,
        label: item.label,
        detail: item.projectName,
        to: `/releases/${item.id}`,
        icon: entityIcons.releases,
        category: 'Releases',
      })),
      ...results.tickets.map((item) => ({
        id: item.id,
        label: item.label,
        detail: item.releaseName,
        to: `/tickets/${item.id}`,
        icon: ticketStatusIcon(item.status),
        category: 'Tickets',
        status: item.status,
      })),
      ...results.timeEntries.map((item) => ({
        id: item.id,
        label: item.label || item.ticketTitle,
        detail: `${item.ticketTitle} · ${item.date} ${String(Math.floor(item.startMinute / 60)).padStart(2, '0')}:${String(item.startMinute % 60).padStart(2, '0')}`,
        to: `/agenda?date=${item.date}`,
        icon: 'lucide:clock-3',
        category: 'Time entries',
      })),
    ]
    open.value = true
    loading.value = false
  }, delay)
}

watch(query, (value) => {
  stale = false
  search(value)
})
onInvalidated(['search'], () => {
  stale = true
  searchStateOnInvalidation()
})

function searchStateOnInvalidation() {
  clearTimeout(timer)
  activeController?.abort()
  activeController = undefined
  request++
  hits.value = []
  selected.value = 0
  failed.value = false
  loading.value = false
  if (open.value && query.value.trim().length >= 2) {
    stale = false
    search(query.value, 0)
  }
}
onBeforeUnmount(() => {
  clearTimeout(timer)
  activeController?.abort()
  request++
})
function openSearch() {
  open.value = true
  if (stale) {
    stale = false
    search(query.value, 0)
  }
}
function focus() {
  input.value?.focus()
  openSearch()
}
defineExpose({ focus })
function choose(hit: Hit) {
  open.value = false
  query.value = ''
  emit('select')
  void navigateTo(hit.to)
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    input.value?.blur()
    event.stopPropagation()
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!items.value.length) return
    event.preventDefault()
    open.value = true
    selected.value =
      (selected.value + (event.key === 'ArrowDown' ? 1 : -1) + items.value.length) %
      items.value.length
  }
  if (event.key === 'Enter' && open.value && items.value[selected.value]) {
    event.preventDefault()
    choose(items.value[selected.value]!)
  }
}
</script>

<template>
  <div
    class="relative w-full max-w-xl"
    @focusout="
      (event) => {
        if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node))
          open = false
      }
    "
  >
    <div
      class="flex items-center gap-2 rounded-md border border-default bg-default px-3 focus-within:ring-2 focus-within:ring-primary"
    >
      <UIcon name="lucide:search" class="size-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        ref="input"
        v-model="query"
        type="search"
        aria-label="Search workspace"
        :aria-controls="resultsId"
        :aria-expanded="open && query.trim().length >= 2"
        :aria-activedescendant="open && items[selected] ? `${resultsId}-${selected}` : undefined"
        class="min-w-0 flex-1 bg-transparent py-2 text-sm text-default outline-none placeholder:text-muted"
        placeholder="Search workspace…"
        @focus="openSearch"
        @keydown="keydown"
      />
      <span class="text-xs text-muted" aria-hidden="true">/ or ⌘K</span>
    </div>
    <div
      v-if="open && query.trim().length >= 2"
      :id="resultsId"
      class="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-default bg-elevated p-1 shadow-lg"
      role="listbox"
      aria-label="Search results"
    >
      <p v-if="loading" role="status" class="p-1 text-sm text-muted">Searching…</p>
      <p v-else-if="failed" role="alert" class="p-1 text-sm text-error">
        Search failed. Try another query.
      </p>
      <p v-else-if="!items.length" class="p-1 text-sm text-muted">No matches.</p>
      <template v-else>
        <div v-for="(item, index) in items" :key="`${item.category}-${item.id}`">
          <p
            v-if="index === 0 || items[index - 1]?.category !== item.category"
            class="px-2 pt-2 text-xs font-semibold text-muted"
          >
            {{ item.category }}
          </p>
          <button
            :id="`${resultsId}-${index}`"
            type="button"
            role="option"
            :aria-selected="selected === index"
            class="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accented focus:bg-accented"
            :class="selected === index ? 'bg-accented' : ''"
            @mouseenter="selected = index"
            @click="choose(item)"
          >
            <UIcon
              :name="item.icon"
              class="size-4 shrink-0"
              :data-ticket-status-icon="item.status"
              aria-hidden="true"
            /><span class="min-w-0 flex-1 truncate">{{ item.label }}</span
            ><span class="max-w-40 truncate text-xs text-muted">{{ item.detail }}</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
