import { Effect } from 'effect'
import { and, asc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm'
import {
  reportGroupings,
  type ReportGrouping,
  type ReportSelectedFilters,
  type ReportsResponse,
} from '../../shared/reports'
import type {
  ReportCompletionBounds,
  ReportPeriod,
  ReportPeriodRange,
} from '../../shared/report-period'
import { client, project, release, ticket, timeEntry } from '../db/schema'
import { db } from '../db'
import { promiseEffect } from '../utils/effect'

type ReportFilters = {
  clientId?: string
  projectId?: string
  releaseId?: string
}

export type ReportRequest = ReportFilters & {
  period: ReportPeriod
  grouping: ReportGrouping
  range: ReportPeriodRange
  timeZone: string
  completionBounds: ReportCompletionBounds
}

type ReportGroupBase = {
  id: string
  name: string
  clientId: string
  clientName: string
  projectId: string | null
  projectName: string | null
  releaseId: string | null
  releaseName: string | null
  clientArchivedAt: Date | null
  projectArchivedAt: Date | null
  releaseArchivedAt: Date | null
}

function trackedInRange(startDate: string, endDate: string) {
  return sql<number>`coalesce(sum(case when ${timeEntry.date} >= ${startDate} and ${timeEntry.date} <= ${endDate} then ${timeEntry.durationMinutes} else 0 end), 0)::integer`
}

function emptyReportRow(row: ReportGroupBase): ReportsResponse['rows'][number] {
  return {
    id: row.id,
    name: row.name,
    clientId: row.clientId,
    clientName: row.clientName,
    projectId: row.projectId,
    projectName: row.projectName,
    releaseId: row.releaseId,
    releaseName: row.releaseName,
    archived: Boolean(row.clientArchivedAt || row.projectArchivedAt || row.releaseArchivedAt),
    currentMinutes: 0,
    previousMinutes: 0,
    estimate: null,
  }
}

function orderedPathMap(
  rows: {
    clientId: string
    clientName: string
    clientArchivedAt: Date | null
    projectId: string | null
    projectName: string | null
    projectArchivedAt: Date | null
    releaseId: string | null
    releaseName: string | null
    releaseArchivedAt: Date | null
  }[],
) {
  const paths = new Map<string, ReportsResponse['paths'][number]>()
  for (const row of rows) {
    if (!row.projectId || !row.projectName || !row.releaseId || !row.releaseName) continue
    paths.set(row.releaseId, {
      clientId: row.clientId,
      clientName: row.clientName,
      clientArchived: Boolean(row.clientArchivedAt),
      projectId: row.projectId,
      projectName: row.projectName,
      projectArchived: Boolean(row.projectArchivedAt),
      releaseId: row.releaseId,
      releaseName: row.releaseName,
      releaseArchived: Boolean(row.releaseArchivedAt),
    })
  }
  return [...paths.values()].toSorted(
    (left, right) =>
      left.clientName.localeCompare(right.clientName) ||
      left.clientId.localeCompare(right.clientId) ||
      left.projectName.localeCompare(right.projectName) ||
      left.projectId.localeCompare(right.projectId) ||
      left.releaseName.localeCompare(right.releaseName) ||
      left.releaseId.localeCompare(right.releaseId),
  )
}

export function loadReports(userId: string, request: ReportRequest) {
  const { period, grouping, range, timeZone, completionBounds, clientId, projectId, releaseId } =
    request
  const hierarchy = db.$with('report_hierarchy').as(
    db
      .select({
        clientId: sql<string>`${client.id}`.as('client_id'),
        clientName: sql<string>`${client.name}`.as('client_name'),
        clientArchivedAt: sql<Date | null>`${client.archivedAt}`.as('client_archived_at'),
        projectId: sql<string | null>`${project.id}`.as('project_id'),
        projectName: sql<string | null>`${project.name}`.as('project_name'),
        projectArchivedAt: sql<Date | null>`${project.archivedAt}`.as('project_archived_at'),
        releaseId: sql<string | null>`${release.id}`.as('release_id'),
        releaseName: sql<string | null>`${release.name}`.as('release_name'),
        releaseArchivedAt: sql<Date | null>`${release.archivedAt}`.as('release_archived_at'),
        ticketId: sql<string | null>`${ticket.id}`.as('report_ticket_id'),
        ticketStatus: sql<string | null>`${ticket.status}`.as('ticket_status'),
        estimateMinutes: sql<number | null>`${ticket.estimateMinutes}`.as('estimate_minutes'),
        updatedAt: sql<Date | null>`${ticket.updatedAt}`.as('ticket_updated_at'),
      })
      .from(client)
      .leftJoin(project, eq(project.clientId, client.id))
      .leftJoin(release, eq(release.projectId, project.id))
      .leftJoin(ticket, eq(ticket.releaseId, release.id))
      .where(eq(client.userId, userId)),
  )
  const group = {
    id:
      grouping === 'client'
        ? hierarchy.clientId
        : grouping === 'project'
          ? sql<string>`${hierarchy.projectId}`
          : sql<string>`${hierarchy.releaseId}`,
    name:
      grouping === 'client'
        ? hierarchy.clientName
        : grouping === 'project'
          ? sql<string>`${hierarchy.projectName}`
          : sql<string>`${hierarchy.releaseName}`,
    clientId: hierarchy.clientId,
    clientName: hierarchy.clientName,
    projectId: grouping === 'client' ? sql<string | null>`null` : hierarchy.projectId,
    projectName: grouping === 'client' ? sql<string | null>`null` : hierarchy.projectName,
    releaseId: grouping === 'release' ? hierarchy.releaseId : sql<string | null>`null`,
    releaseName: grouping === 'release' ? hierarchy.releaseName : sql<string | null>`null`,
    clientArchivedAt: hierarchy.clientArchivedAt,
    projectArchivedAt: grouping === 'client' ? sql<Date | null>`null` : hierarchy.projectArchivedAt,
    releaseArchivedAt:
      grouping === 'release' ? hierarchy.releaseArchivedAt : sql<Date | null>`null`,
  }
  const groupBy = [
    group.id,
    group.name,
    group.clientId,
    group.clientName,
    group.clientArchivedAt,
    ...(grouping === 'client' ? [] : [group.projectId, group.projectName, group.projectArchivedAt]),
    ...(grouping === 'release'
      ? [group.releaseId, group.releaseName, group.releaseArchivedAt]
      : []),
  ]
  const filterConditions = [
    ...(clientId ? [eq(hierarchy.clientId, clientId)] : []),
    ...(projectId ? [eq(hierarchy.projectId, projectId)] : []),
    ...(releaseId ? [eq(hierarchy.releaseId, releaseId)] : []),
  ]
  const queryRange = [
    gte(timeEntry.date, range.previousStartDate),
    lte(timeEntry.date, range.endDate),
  ]
  const pathSelection = {
    clientId: hierarchy.clientId,
    clientName: hierarchy.clientName,
    clientArchivedAt: hierarchy.clientArchivedAt,
    projectId: hierarchy.projectId,
    projectName: hierarchy.projectName,
    projectArchivedAt: hierarchy.projectArchivedAt,
    releaseId: hierarchy.releaseId,
    releaseName: hierarchy.releaseName,
    releaseArchivedAt: hierarchy.releaseArchivedAt,
  }
  const pathGroupBy = [
    hierarchy.clientId,
    hierarchy.clientName,
    hierarchy.clientArchivedAt,
    hierarchy.projectId,
    hierarchy.projectName,
    hierarchy.projectArchivedAt,
    hierarchy.releaseId,
    hierarchy.releaseName,
    hierarchy.releaseArchivedAt,
  ]
  // Stored timestamps are UTC-valued without a SQL time zone. Normalize the
  // explicit boundary instants to that representation, not the session's zone.
  const selectedCohort = sql`
    ${hierarchy.updatedAt} >= (${completionBounds.startInstant}::timestamptz at time zone 'UTC')
    and ${hierarchy.updatedAt} < (${completionBounds.endInstant}::timestamptz at time zone 'UTC')
  `
  const selectedFields = {
    client: {
      id: hierarchy.clientId,
      name: hierarchy.clientName,
      archived: sql<boolean>`${hierarchy.clientArchivedAt} is not null`,
    },
    project: {
      id: hierarchy.projectId,
      name: hierarchy.projectName,
      archived: sql<boolean>`${hierarchy.clientArchivedAt} is not null or ${hierarchy.projectArchivedAt} is not null`,
    },
    release: {
      id: hierarchy.releaseId,
      name: hierarchy.releaseName,
      archived: sql<boolean>`${hierarchy.clientArchivedAt} is not null or ${hierarchy.projectArchivedAt} is not null or ${hierarchy.releaseArchivedAt} is not null`,
    },
  }
  const usageByTicket = db
    .select({
      ticketId: timeEntry.ticketId,
      trackedMinutes: sql<number>`coalesce(sum(${timeEntry.durationMinutes}), 0)::integer`.as(
        'tracked_minutes',
      ),
    })
    .from(timeEntry)
    .groupBy(timeEntry.ticketId)
    .as('report_ticket_usage')

  return Effect.gen(function* () {
    const [periodRows, estimateRows, pathRows, selectedRows] = yield* promiseEffect(
      'load report aggregates',
      () =>
        Promise.all([
          db
            .with(hierarchy)
            .select({
              ...group,
              currentMinutes: trackedInRange(range.startDate, range.endDate),
              previousMinutes: trackedInRange(range.previousStartDate, range.previousEndDate),
            })
            .from(timeEntry)
            .innerJoin(hierarchy, eq(timeEntry.ticketId, hierarchy.ticketId))
            .where(and(...filterConditions, ...queryRange))
            .groupBy(...groupBy)
            .orderBy(asc(group.name), asc(group.id)),
          db
            .with(hierarchy)
            .select({
              ...group,
              estimatedMinutes: sql<number>`coalesce(sum(${hierarchy.estimateMinutes}), 0)::integer`,
              trackedMinutes: sql<number>`coalesce(sum(${usageByTicket.trackedMinutes}), 0)::integer`,
              ticketCount: sql<number>`count(*)::integer`,
            })
            .from(hierarchy)
            .leftJoin(usageByTicket, eq(usageByTicket.ticketId, hierarchy.ticketId))
            .where(
              and(
                ...filterConditions,
                eq(hierarchy.ticketStatus, 'Done'),
                isNotNull(hierarchy.estimateMinutes),
                selectedCohort,
              ),
            )
            .groupBy(...groupBy)
            .orderBy(asc(group.name), asc(group.id)),
          db
            .with(hierarchy)
            .select(pathSelection)
            .from(timeEntry)
            .innerJoin(hierarchy, eq(timeEntry.ticketId, hierarchy.ticketId))
            .where(and(...queryRange))
            .groupBy(...pathGroupBy)
            .union(
              db
                .with(hierarchy)
                .select(pathSelection)
                .from(hierarchy)
                .where(
                  and(
                    eq(hierarchy.ticketStatus, 'Done'),
                    isNotNull(hierarchy.estimateMinutes),
                    selectedCohort,
                  ),
                )
                .groupBy(...pathGroupBy),
            ),
          Promise.all(
            reportGroupings.map(async (kind) => {
              const id = request[`${kind}Id`]
              if (!id) return [kind, null] as const
              const fields = selectedFields[kind]
              const [selected] = await db
                .with(hierarchy)
                .select(fields)
                .from(hierarchy)
                .where(eq(fields.id, id))
                .limit(1)
              return [
                kind,
                selected?.id && selected.name
                  ? { id: selected.id, name: selected.name, archived: selected.archived }
                  : null,
              ] as const
            }),
          ),
        ]),
    )

    const groups = new Map<string, ReportsResponse['rows'][number]>()
    for (const row of periodRows) {
      const reportRow = emptyReportRow(row)
      reportRow.currentMinutes = row.currentMinutes
      reportRow.previousMinutes = row.previousMinutes
      groups.set(row.id, reportRow)
    }
    for (const row of estimateRows) {
      const reportRow = groups.get(row.id) ?? emptyReportRow(row)
      reportRow.estimate = {
        estimatedMinutes: row.estimatedMinutes,
        trackedMinutes: row.trackedMinutes,
        ticketCount: row.ticketCount,
      }
      groups.set(row.id, reportRow)
    }

    const rows = [...groups.values()].toSorted(
      (left, right) =>
        right.currentMinutes - left.currentMinutes ||
        left.name.localeCompare(right.name) ||
        left.id.localeCompare(right.id),
    )
    const selectedFilters: ReportSelectedFilters = { client: null, project: null, release: null }
    for (const [kind, selected] of selectedRows) selectedFilters[kind] = selected
    return {
      period,
      timeZone,
      range,
      selectedFilters,
      summary: {
        currentMinutes: rows.reduce((total, row) => total + row.currentMinutes, 0),
        previousMinutes: rows.reduce((total, row) => total + row.previousMinutes, 0),
      },
      paths: orderedPathMap(pathRows),
      rows,
    } satisfies ReportsResponse
  })
}
