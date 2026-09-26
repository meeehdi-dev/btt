<script setup lang="ts">
type Row = {
  entry: { id: string; startMinute: number; durationMinutes: number; description: string }
  ticketId: string
  ticketTitle: string
  ticketArchivedAt: string | null
  releaseId: string
  releaseName: string
  releaseArchivedAt: string | null
  projectId: string
  projectName: string
  projectColor: string
  projectArchivedAt: string | null
  clientId: string
  clientName: string
  clientArchivedAt: string | null
  status: string
}
const props = defineProps<{ rows: Row[]; start: number; end: number }>()
const pixelsPerMinute = 2.25
const emit = defineEmits<{
  filter: [kind: 'client' | 'project' | 'release' | 'ticket' | 'status', id: string]
}>()
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
const hours = computed(() =>
  Array.from(
    { length: Math.ceil((props.end - props.start) / 60) + 1 },
    (_, index) => props.start + index * 60,
  ).filter((minute) => minute <= props.end),
)
const early = computed(() => props.rows.filter(({ entry }) => entry.startMinute < props.start))
const late = computed(() => props.rows.filter(({ entry }) => entry.startMinute >= props.end))
const within = computed(() =>
  props.rows.filter(
    ({ entry }) => entry.startMinute >= props.start && entry.startMinute < props.end,
  ),
)
</script>
<template>
  <div class="space-y-4">
    <section v-if="early.length" aria-label="Before visible hours" class="space-y-2">
      <h3 class="font-medium">Before visible hours</h3>
      <TodayAgendaEntry
        v-for="row in early"
        :key="row.entry.id"
        :row="row"
        @filter="(kind, id) => emit('filter', kind, id)"
      />
    </section>
    <div
      class="hidden md:grid md:grid-cols-[4rem_minmax(0,1fr)]"
      role="region"
      aria-label="Day timeline"
    >
      <div class="relative" :style="{ height: `${(end - start) * pixelsPerMinute}px` }">
        <span
          v-for="hour in hours"
          :key="hour"
          class="absolute right-2 text-xs text-muted"
          :style="{ top: `${(hour - start) * pixelsPerMinute}px` }"
          >{{ clock(hour) }}</span
        >
      </div>
      <div
        class="relative border-l border-default"
        :style="{ height: `${(end - start) * pixelsPerMinute}px` }"
      >
        <div
          v-for="hour in hours"
          :key="hour"
          class="absolute w-full border-t border-default"
          :style="{ top: `${(hour - start) * pixelsPerMinute}px` }"
        />
        <div
          v-for="row in within"
          :key="row.entry.id"
          class="absolute inset-x-2"
          :style="{
            top: `${(row.entry.startMinute - start) * pixelsPerMinute}px`,
            height: `${Math.min(row.entry.durationMinutes, end - row.entry.startMinute) * pixelsPerMinute}px`,
          }"
        >
          <TodayAgendaEntry :row="row" @filter="(kind, id) => emit('filter', kind, id)" />
        </div>
      </div>
    </div>
    <ol class="space-y-2 md:hidden" aria-label="Work in visible hours">
      <li v-for="row in within" :key="row.entry.id">
        <TodayAgendaEntry :row="row" @filter="(kind, id) => emit('filter', kind, id)" />
      </li>
    </ol>
    <section v-if="late.length" aria-label="After visible hours" class="space-y-2">
      <h3 class="font-medium">After visible hours</h3>
      <TodayAgendaEntry
        v-for="row in late"
        :key="row.entry.id"
        :row="row"
        @filter="(kind, id) => emit('filter', kind, id)"
      />
    </section>
  </div>
</template>
