import type { ReportPeriod, ReportPeriodRange } from './report-period'

export const reportGroupings = ['client', 'project', 'release'] as const
export type ReportGrouping = (typeof reportGroupings)[number]

type ReportSelectedFilter = { id: string; name: string; archived: boolean }
export type ReportSelectedFilters = Record<ReportGrouping, ReportSelectedFilter | null>

export type ReportHierarchyPath = {
  clientId: string
  clientName: string
  clientArchived: boolean
  projectId: string
  projectName: string
  projectArchived: boolean
  releaseId: string
  releaseName: string
  releaseArchived: boolean
}

type ReportEstimateSummary = {
  estimatedMinutes: number
  trackedMinutes: number
  ticketCount: number
}

type ReportBreakdownRow = {
  id: string
  name: string
  clientId: string
  clientName: string
  projectId: string | null
  projectName: string | null
  releaseId: string | null
  releaseName: string | null
  archived: boolean
  currentMinutes: number
  previousMinutes: number
  estimate: ReportEstimateSummary | null
}

export type ReportsResponse = {
  period: ReportPeriod
  timeZone: string
  range: ReportPeriodRange
  selectedFilters: ReportSelectedFilters
  summary: {
    currentMinutes: number
    previousMinutes: number
  }
  paths: ReportHierarchyPath[]
  rows: ReportBreakdownRow[]
}
