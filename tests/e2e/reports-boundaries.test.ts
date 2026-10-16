import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { ticket } from '../../server/db/schema'
import { createTestOwner } from './helpers/test-owner'
import {
  cleanupReportFixture,
  createReportEntry,
  createReportFixture,
  createReportTicket,
  readReport,
} from './helpers/reports'

test('Reports uses inclusive local completion starts and exclusive local ends, not UTC dates', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Completion bounds owner',
    'report-bounds',
  )
  const fixture = await createReportFixture(page, 'Boundary')
  try {
    const samples = [
      {
        title: 'Local start',
        instant: '2026-09-30T22:00:00.000Z',
        status: 'Done',
        estimateMinutes: 60,
      },
      {
        title: 'Before local start',
        instant: '2026-09-30T21:59:59.999Z',
        status: 'Done',
        estimateMinutes: 60,
      },
      {
        title: 'Before local end',
        instant: '2026-10-31T22:59:59.999Z',
        status: 'Done',
        estimateMinutes: 60,
      },
      {
        title: 'At local end',
        instant: '2026-10-31T23:00:00.000Z',
        status: 'Done',
        estimateMinutes: 60,
      },
      {
        title: 'Active estimate',
        instant: '2026-10-15T12:00:00.000Z',
        status: 'Idea',
        estimateMinutes: 60,
      },
      {
        title: 'Unestimated Done',
        instant: '2026-10-15T12:00:00.000Z',
        status: 'Done',
        estimateMinutes: null,
      },
    ] as const
    for (const sample of samples) {
      const { instant, ...input } = sample
      const id = await createReportTicket(fixture, input)
      if (sample.title === 'Local start') await createReportEntry(fixture, id, '2020-02-01')
      if (sample.status === 'Idea') await createReportEntry(fixture, id, '2026-10-01')
      await db
        .update(ticket)
        .set({ updatedAt: new Date(instant) })
        .where(eq(ticket.id, id))
    }
    const report = await readReport(page, { timeZone: 'Europe/Paris' })
    expect(report.timeZone).toBe('Europe/Paris')
    expect(report.summary).toEqual({ currentMinutes: 30, previousMinutes: 0 })
    expect(report.rows[0]?.estimate).toEqual({
      estimatedMinutes: 120,
      trackedMinutes: 30,
      ticketCount: 2,
    })
    expect(report.range.startDate).toBe('2026-10-01')
    expect(report.paths).toHaveLength(1)

    for (const timeZone of ['', 'not/a-zone']) {
      const invalid = await page.request.get(
        `/api/reports?period=month&date=2026-10-15&grouping=client&timeZone=${encodeURIComponent(timeZone)}`,
      )
      expect(invalid.status()).toBe(400)
    }
    const missing = await page.request.get(
      '/api/reports?period=month&date=2026-10-15&grouping=client',
    )
    expect(missing.status()).toBe(400)
    const unrepresentable = await page.request.get(
      '/api/reports?period=month&date=9999-12-15&grouping=client&timeZone=UTC',
    )
    expect(unrepresentable.status()).toBe(400)
  } finally {
    await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})

for (const sample of [
  { period: 'week', instant: '2026-10-11T22:00:00Z' },
  { period: 'year', instant: '2025-12-31T23:00:00Z' },
]) {
  test(`Reports retains a ${sample.period} completion-only row and filter path across the UTC boundary`, async ({
    page,
    context,
  }) => {
    const { helpers, user } = await createTestOwner(context, 'Completion path owner', 'report-path')
    const fixture = await createReportFixture(page, 'Completion only')
    try {
      const id = await createReportTicket(fixture, {
        title: 'No logged entries',
        status: 'Done',
        estimateMinutes: 45,
      })
      await db
        .update(ticket)
        .set({ updatedAt: new Date(sample.instant) })
        .where(eq(ticket.id, id))
      const report = await readReport(page, { period: sample.period, timeZone: 'Europe/Paris' })
      expect(report.summary).toEqual({ currentMinutes: 0, previousMinutes: 0 })
      expect(report.rows).toHaveLength(1)
      expect(report.rows[0]?.estimate?.ticketCount).toBe(1)
      expect(report.paths[0]?.releaseId).toBe(fixture.hierarchy.releaseId)
    } finally {
      await cleanupReportFixture(fixture)
      await helpers.deleteUser(user.id)
    }
  })
}

test('selected Reports metadata is owned, archive-aware, and independent of period activity', async ({
  page,
  context,
  browser,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Selection metadata owner',
    'report-selection',
  )
  const fixture = await createReportFixture(page, 'Selection')
  const foreignContext = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
  })
  const foreign = await createTestOwner(
    foreignContext,
    'Private selection owner',
    'report-selection-foreign',
  )
  const foreignPage = await foreignContext.newPage()
  const privateFixture = await createReportFixture(foreignPage, 'Private selection')
  try {
    expect(
      (
        await page.request.patch(`/api/projects/${fixture.hierarchy.projectId}`, {
          data: { name: 'Renamed project' },
        })
      ).ok(),
    ).toBeTruthy()
    expect(
      (
        await page.request.patch(`/api/clients/${fixture.hierarchy.clientId}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()
    const query = {
      clientId: fixture.hierarchy.clientId,
      projectId: fixture.hierarchy.projectId,
      releaseId: fixture.hierarchy.releaseId,
    }
    const report = await readReport(page, query)
    expect(report.rows).toEqual([])
    expect(report.paths).toEqual([])
    expect(report.selectedFilters).toEqual({
      client: { id: query.clientId, name: 'Selection Client', archived: true },
      project: { id: query.projectId, name: 'Renamed project', archived: true },
      release: { id: query.releaseId, name: 'Selection Release', archived: true },
    })
    const denied = await readReport(page, {
      clientId: privateFixture.hierarchy.clientId,
      projectId: privateFixture.hierarchy.projectId,
      releaseId: privateFixture.hierarchy.releaseId,
    })
    expect(denied.selectedFilters).toEqual({ client: null, project: null, release: null })
    expect(JSON.stringify(denied)).not.toContain('Private selection')
  } finally {
    await cleanupReportFixture(privateFixture)
    await cleanupReportFixture(fixture)
    await foreign.helpers.deleteUser(foreign.user.id)
    await helpers.deleteUser(user.id)
    await foreignContext.close()
  }
})
