<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import type { ReportPeriod } from '#shared/report-period'
import {
  reportGroupings,
  type ReportGrouping,
  type ReportHierarchyPath,
  type ReportsResponse,
} from '#shared/reports'
import {
  useHierarchyFilters,
  type HierarchyFilterSource,
  type HierarchyFilterState,
} from '~/composables/useHierarchyFilters'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import { formatTicketEstimate } from '~/utils/ticket-estimate'
import {
  formatReportChange,
  formatReportDuration,
  formatReportPeriodLabel,
  formatReportShare,
  mergeReportFilterOptions,
  getAdjacentReportDate,
  reportReadResources,
} from '~/utils/reports'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Reports' })

const periodOptions: { label: string; value: ReportPeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
]
const groupingOptions = [
  { label: 'Clients', value: 'client' },
  { label: 'Projects', value: 'project' },
  { label: 'Releases', value: 'release' },
] satisfies { label: string; value: ReportGrouping }[]
const period = ref<ReportPeriod>('week')
const selectedDate = ref('')
const timeZone = ref('')
const grouping = ref<ReportGrouping>('client')
const locale = ref('en')
const filters = reactive<HierarchyFilterState>({
  client: '',
  project: '',
  release: '',
  ticket: '',
})

const hasHierarchyFilters = computed(() =>
  Boolean(filters.client || filters.project || filters.release),
)
const reportKey = computed(
  () =>
    `app-api:reports:${period.value}:${selectedDate.value || 'unselected'}:${timeZone.value || 'unselected'}:${grouping.value}:${filters.client || '-'}:${filters.project || '-'}:${filters.release || '-'}`,
)
const reportQuery = computed(() => ({
  period: period.value,
  date: selectedDate.value,
  timeZone: timeZone.value,
  grouping: grouping.value,
  clientId: filters.client || undefined,
  projectId: filters.project || undefined,
  releaseId: filters.release || undefined,
}))
const {
  data: report,
  pending,
  status: reportStatus,
  error: reportFetchError,
  refresh: refreshReport,
} = await trackAppApiFetch(
  useApiFetch<ReportsResponse>('/api/reports', {
    key: reportKey,
    query: reportQuery,
    immediate: false,
    watch: false,
  }),
  { key: reportKey, resources: reportReadResources },
)
watch(
  reportKey,
  () => {
    if (selectedDate.value && timeZone.value) void refreshReport()
  },
  { immediate: true },
)

const initialized = computed(() => Boolean(selectedDate.value && timeZone.value))
// Nuxt can inherit the previous key's data while the new reader is idle.
const displayedReport = computed(() =>
  initialized.value && reportStatus.value === 'success' && !pending.value && !reportFetchError.value
    ? report.value
    : null,
)
const summaryRegion = ref<HTMLElement | null>(null)
const resultsRegion = ref<HTMLElement | null>(null)
const summaryReservedHeight = ref<number | null>(null)
const resultsReservedHeight = ref<number | null>(null)
function reserveDisplayedLayout() {
  if (!displayedReport.value) return
  summaryReservedHeight.value = summaryRegion.value?.getBoundingClientRect().height ?? null
  resultsReservedHeight.value = resultsRegion.value?.getBoundingClientRect().height ?? null
}
function releaseLayoutReservation() {
  summaryReservedHeight.value = null
  resultsReservedHeight.value = null
}
watch(
  [pending, reportStatus],
  ([isPending, status]) => {
    if (isPending || (status !== 'success' && status !== 'error')) return
    releaseLayoutReservation()
  },
  { flush: 'sync' },
)
const isCurrentPeriod = computed(() => {
  if (!displayedReport.value || !timeZone.value) return false
  const current = today(timeZone.value).toString()
  return (
    current >= displayedReport.value.range.startDate &&
    current <= displayedReport.value.range.endDate
  )
})
const periodLabel = computed(() => {
  const value = displayedReport.value
  if (value)
    return formatReportPeriodLabel(
      value.period,
      value.range.startDate,
      value.range.endDate,
      locale.value,
    )
  if (!initialized.value) return 'Preparing current period…'
  return reportFetchError.value ? 'Report period unavailable' : 'Loading report period…'
})

const filterSources = computed<HierarchyFilterSource[]>(() =>
  (report.value?.paths ?? []).map((path: ReportHierarchyPath) => ({
    clientId: path.clientId,
    clientName: `${path.clientName}${path.clientArchived ? ' (Archived)' : ''}`,
    projectId: path.projectId,
    projectName: `${path.projectName}${path.clientArchived || path.projectArchived ? ' (Archived)' : ''}`,
    releaseId: path.releaseId,
    releaseName: `${path.releaseName}${path.clientArchived || path.projectArchived || path.releaseArchived ? ' (Archived)' : ''}`,
  })),
)
const {
  options: hierarchyOptions,
  applyFilter: applyHierarchyFilter,
  clearFilters: clearHierarchyFilters,
  searchInputs: hierarchySearchInputs,
} = useHierarchyFilters(filterSources, filters)
const retainedFilters = reactive<Record<ReportGrouping, { value: string; label: string } | null>>({
  client: null,
  project: null,
  release: null,
})
function reportFilterOptions(kind: ReportGrouping) {
  return mergeReportFilterOptions(
    kind,
    filters[kind],
    hierarchyOptions(kind),
    retainedFilters[kind],
  )
}
function applyReportFilter(kind: ReportGrouping, id: string) {
  const key = reportKey.value
  const hadDisplayedReport = Boolean(displayedReport.value)
  reserveDisplayedLayout()
  applyHierarchyFilter(kind, id)
  if (hadDisplayedReport && reportKey.value === key) releaseLayoutReservation()
  for (const field of reportGroupings)
    retainedFilters[field] = filters[field]
      ? (reportFilterOptions(field).find((option) => option.value === filters[field]) ?? null)
      : null
}
function clearReportFilters() {
  if (!hasHierarchyFilters.value) return
  reserveDisplayedLayout()
  clearHierarchyFilters()
  for (const kind of reportGroupings) retainedFilters[kind] = null
}
watch(
  [report, reportStatus],
  ([value, status]) => {
    // Reactive-key changes can inherit old data while the new reader is idle.
    // Only a successful read can confirm that a selected entity is unavailable.
    if (!value || status !== 'success') return
    for (const kind of reportGroupings) {
      const selected = value.selectedFilters[kind]
      retainedFilters[kind] = !filters[kind]
        ? null
        : {
            value: filters[kind],
            label:
              selected?.id === filters[kind]
                ? `${selected.name}${selected.archived ? ' (Archived)' : ''}`
                : `Unavailable ${kind}`,
          }
    }
  },
  { immediate: true },
)
const rows = computed(() => displayedReport.value?.rows ?? [])
const hasEstimateCohort = computed(() => rows.value.some((row) => row.estimate !== null))
const pageError = computed(() => reportFetchError.value)
const reportErrorMessage = computed(() =>
  pageError.value ? clientFailureMessage(pageError.value) : '',
)

onMounted(() => {
  locale.value = navigator.language
  timeZone.value = getLocalTimeZone()
  selectedDate.value = today(timeZone.value).toString()
})

function selectPeriod(value: ReportPeriod) {
  if (period.value === value) return
  reserveDisplayedLayout()
  period.value = value
}
function selectGrouping(value: string | number) {
  const next = groupingOptions.find((option) => option.value === value)?.value
  if (!next || grouping.value === next) return
  reserveDisplayedLayout()
  grouping.value = next
}
function movePeriod(amount: number) {
  const value = displayedReport.value
  if (!value) return
  const next = getAdjacentReportDate(value.period, value.range, amount)
  if (next && next !== selectedDate.value) {
    reserveDisplayedLayout()
    selectedDate.value = next
  }
}
function goToCurrentPeriod() {
  if (!initialized.value) return
  const current = today(timeZone.value).toString()
  if (current !== selectedDate.value) {
    reserveDisplayedLayout()
    selectedDate.value = current
  }
}
function selectRow(id: string) {
  applyReportFilter(grouping.value, id)
}
function rowContext(row: ReportsResponse['rows'][number]) {
  if (grouping.value === 'project') return row.clientName
  if (grouping.value === 'release') return `${row.clientName} · ${row.projectName ?? ''}`
  return ''
}
async function retryReport() {
  await refreshReport()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">Reports</h1>
    </div>

    <div class="flex flex-wrap items-center gap-2" aria-label="Report controls">
      <div class="flex items-center gap-1" role="group" aria-label="Report period">
        <UButton
          v-for="option in periodOptions"
          :key="option.value"
          size="sm"
          :color="period === option.value ? 'primary' : 'neutral'"
          :variant="period === option.value ? 'soft' : 'ghost'"
          :aria-pressed="period === option.value"
          :label="option.label"
          @click="selectPeriod(option.value)"
        />
      </div>

      <USeparator orientation="vertical" decorative class="h-6" />

      <div class="flex items-center gap-1" role="group" aria-label="Period navigation">
        <UButton
          color="neutral"
          variant="ghost"
          icon="lucide:chevron-left"
          :aria-label="`Previous ${period}`"
          :disabled="!displayedReport"
          @click="movePeriod(-1)"
        />
        <span class="min-w-44 text-center text-sm font-medium text-highlighted" aria-live="polite">
          {{ periodLabel }}
        </span>
        <UButton
          color="neutral"
          variant="ghost"
          icon="lucide:chevron-right"
          :aria-label="`Next ${period}`"
          :disabled="!displayedReport"
          @click="movePeriod(1)"
        />
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="!initialized || isCurrentPeriod"
          :label="`Current ${period}`"
          @click="goToCurrentPeriod"
        />
      </div>

      <div
        class="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-md px-0.5"
        role="group"
        aria-label="Reports filters"
      >
        <div class="grid h-full min-w-0 flex-1 grid-cols-3 gap-1">
          <div v-for="kind in ['client', 'project', 'release'] as const" :key="kind">
            <USelectMenu
              :model-value="filters[kind] || null"
              size="md"
              value-key="value"
              :items="reportFilterOptions(kind)"
              :disabled="!filters[kind] && !reportFilterOptions(kind).length"
              :search-input="hierarchySearchInputs[kind]"
              :clear="{ 'aria-label': `Clear ${kind} filter` }"
              :placeholder="`All ${kind}s`"
              class="w-full"
              :aria-label="`Filter ${kind}`"
              @update:model-value="applyReportFilter(kind, $event ?? '')"
            >
              <template #leading>
                <UIcon
                  :name="
                    kind === 'client'
                      ? 'lucide:building-2'
                      : kind === 'project'
                        ? 'lucide:folder-kanban'
                        : 'lucide:flag'
                  "
                  class="size-4"
                  aria-hidden="true"
                />
              </template>
            </USelectMenu>
          </div>
        </div>
        <UTooltip text="Clear all filters">
          <UButton
            size="md"
            color="neutral"
            variant="ghost"
            icon="lucide:filter-x"
            aria-label="Clear filters"
            :disabled="!hasHierarchyFilters"
            @click="clearReportFilters"
          />
        </UTooltip>
      </div>
    </div>

    <UAlert
      v-if="pageError"
      role="alert"
      color="error"
      title="Could not load the report"
      :description="reportErrorMessage"
    />
    <UButton
      v-if="pageError"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading report"
      @click="retryReport"
    />

    <div
      ref="summaryRegion"
      data-testid="report-summary-region"
      :style="{
        minHeight: summaryReservedHeight === null ? undefined : `${summaryReservedHeight}px`,
      }"
    >
      <div v-if="displayedReport" class="grid grid-cols-2 gap-2" aria-label="Period totals">
        <UCard>
          <p class="text-sm text-muted">Logged in selected {{ period }}</p>
          <p class="mt-1 text-2xl font-semibold tabular-nums text-highlighted">
            {{ formatReportDuration(displayedReport.summary.currentMinutes) }}
          </p>
          <p class="mt-1 text-sm text-muted">{{ periodLabel }}</p>
        </UCard>
        <UCard>
          <p class="text-sm text-muted">Change from previous {{ period }}</p>
          <p class="mt-1 text-2xl font-semibold tabular-nums text-highlighted">
            {{
              formatReportChange(
                displayedReport.summary.currentMinutes,
                displayedReport.summary.previousMinutes,
                locale,
              ).duration
            }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{
              formatReportChange(
                displayedReport.summary.currentMinutes,
                displayedReport.summary.previousMinutes,
                locale,
              ).percentage
            }}
            · Previous: {{ formatReportDuration(displayedReport.summary.previousMinutes) }}
          </p>
        </UCard>
      </div>
      <UCard v-else-if="!pageError" aria-live="polite">
        <p class="text-sm text-muted">
          {{ selectedDate ? 'Loading report…' : 'Preparing current period…' }}
        </p>
      </UCard>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-medium text-highlighted">Time allocation</h2>
      <div role="group" aria-label="Breakdown grouping">
        <UTabs
          :model-value="grouping"
          :items="groupingOptions"
          :content="false"
          size="sm"
          data-testid="report-breakdown-tabs"
          @update:model-value="selectGrouping"
        />
      </div>
    </div>

    <section
      ref="resultsRegion"
      role="region"
      aria-label="Report results"
      :aria-busy="pending"
      :style="{
        minHeight: resultsReservedHeight === null ? undefined : `${resultsReservedHeight}px`,
      }"
    >
      <div v-if="displayedReport" class="flex flex-col gap-2">
        <p v-if="hasHierarchyFilters" class="text-sm text-muted">
          Showing work matching the selected hierarchy filters.
        </p>
        <p v-if="hasEstimateCohort" class="text-sm text-muted">
          Estimate comparison uses all-time tracked time for currently Done estimated tickets
          updated during this period in {{ displayedReport.timeZone }}. Later ticket edits or
          archive changes can move the inferred period.
        </p>

        <UCard v-if="!rows.length && !pending">
          <p class="font-medium text-highlighted">
            {{
              hasHierarchyFilters
                ? 'No work matches these filters.'
                : 'No tracked time or completed estimates in this period.'
            }}
          </p>
          <p class="mt-1 text-sm text-muted">
            Try another period or clear the hierarchy filters to see other work.
          </p>
        </UCard>

        <ul
          v-else
          class="flex flex-col gap-1"
          :aria-label="`Time allocation by ${groupingOptions.find((item) => item.value === grouping)?.label.toLowerCase()}`"
        >
          <li v-for="row in rows" :key="row.id">
            <button
              type="button"
              class="grid w-full grid-cols-[minmax(14rem,1.2fr)_minmax(12rem,2fr)_minmax(9rem,auto)_minmax(12rem,auto)] items-center gap-3 rounded-md border border-muted bg-default px-3 py-2 text-left hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
              @click="selectRow(row.id)"
            >
              <span class="min-w-0">
                <span class="block truncate font-medium text-highlighted">{{ row.name }}</span>
                <span v-if="row.archived" class="mt-0.5 block text-xs font-medium text-warning">
                  Archived
                </span>
                <span v-if="rowContext(row)" class="mt-0.5 block truncate text-xs text-muted">
                  {{ rowContext(row) }}
                </span>
                <span v-if="row.estimate" class="mt-1 block text-xs text-muted">
                  Done estimates: {{ row.estimate.ticketCount }} · all-time tracked
                  {{ formatTicketEstimate(row.estimate.trackedMinutes) }} / estimated
                  {{ formatTicketEstimate(row.estimate.estimatedMinutes) }}
                </span>
              </span>
              <span
                class="h-2 overflow-hidden rounded-full bg-elevated"
                role="img"
                :aria-label="`${formatReportShare(row.currentMinutes, displayedReport.summary.currentMinutes, locale)} of selected-period time`"
              >
                <span
                  class="block h-full rounded-full bg-primary"
                  :style="{
                    width: `${displayedReport.summary.currentMinutes ? (row.currentMinutes / displayedReport.summary.currentMinutes) * 100 : 0}%`,
                  }"
                />
              </span>
              <span class="text-right tabular-nums">
                <span class="block font-medium text-highlighted">{{
                  formatReportDuration(row.currentMinutes)
                }}</span>
                <span class="block text-xs text-muted">{{
                  formatReportShare(
                    row.currentMinutes,
                    displayedReport.summary.currentMinutes,
                    locale,
                  )
                }}</span>
              </span>
              <span class="text-right tabular-nums">
                <span class="block font-medium text-highlighted">{{
                  formatReportChange(row.currentMinutes, row.previousMinutes, locale).duration
                }}</span>
                <span class="block text-xs text-muted">{{
                  formatReportChange(row.currentMinutes, row.previousMinutes, locale).percentage
                }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-if="!displayedReport.paths.length" class="text-sm text-muted">
          No client, project, or release history is available for filtering in this period.
        </p>
      </div>
    </section>
  </div>
</template>
