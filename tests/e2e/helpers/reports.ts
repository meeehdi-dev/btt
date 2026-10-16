import { expect, type Page } from '@playwright/test'
import { createApiHierarchy, createApiRecord, type ApiHierarchy } from './api-records'
import type { ReportsResponse } from '../../../shared/reports'

export type ReportFixture = {
  page: Page
  hierarchy: ApiHierarchy
  ticketIds: string[]
  entryIds: string[]
}

export async function createReportFixture(page: Page, name: string): Promise<ReportFixture> {
  const hierarchy = await createApiHierarchy(page, {
    clientName: `${name} Client`,
    projectName: `${name} Project`,
    releaseName: `${name} Release`,
  })
  return { page, hierarchy, ticketIds: [], entryIds: [] }
}

export async function createReportTicket(
  fixture: ReportFixture,
  input: { title: string; status: 'Idea' | 'Done'; estimateMinutes?: number | null },
) {
  const ticket = await createApiRecord<{ id: string }>(fixture.page, '/api/tickets', {
    releaseId: fixture.hierarchy.releaseId,
    ...input,
  })
  fixture.ticketIds.push(ticket.id)
  return ticket.id
}

export async function createReportEntry(
  fixture: ReportFixture,
  ticketId: string,
  date: string,
  durationMinutes = 30,
  startMinute = 9 * 60,
) {
  const entry = await createApiRecord<{ id: string }>(fixture.page, '/api/time-entries', {
    ticketId,
    date,
    startMinute,
    durationMinutes,
    description: 'Reports E2E time entry',
  })
  fixture.entryIds.push(entry.id)
}

async function cleanupRequest(page: Page, path: string, archive = false) {
  const response = archive
    ? await page.request.patch(path, { data: { archived: true } })
    : await page.request.delete(path)
  if (!response.ok()) throw new Error(`Cleanup ${path} failed: ${await response.text()}`)
}

export async function cleanupReportFixture({
  page,
  hierarchy,
  ticketIds,
  entryIds,
}: ReportFixture) {
  for (const id of entryIds) await cleanupRequest(page, `/api/time-entries/${id}`)
  for (const id of ticketIds) {
    await cleanupRequest(page, `/api/tickets/${id}`, true)
    await cleanupRequest(page, `/api/tickets/${id}`)
  }
  for (const [kind, id] of [
    ['releases', hierarchy.releaseId],
    ['projects', hierarchy.projectId],
    ['clients', hierarchy.clientId],
  ]) {
    await cleanupRequest(page, `/api/${kind}/${id}`, true)
    await cleanupRequest(page, `/api/${kind}/${id}`)
  }
}

export async function selectReportRelease(page: Page, name: string) {
  await page.getByRole('tab', { name: 'Releases', exact: true }).click()
  await page
    .getByRole('list', { name: /Time allocation by/ })
    .getByRole('button', { name: new RegExp(name) })
    .click()
  await expect(page.getByRole('button', { name: 'Filter release', exact: true })).toContainText(
    name,
  )
}

export async function chooseReportWeekStart(page: Page, weekday: string) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Workspace settings' })
  await dialog.getByRole('combobox', { name: 'Week starts on', exact: true }).click()
  await page.getByRole('option', { name: weekday, exact: true }).click()
  return dialog
}

export async function clearReportClientFilter(page: Page) {
  await page.getByLabel('Clear client filter', { exact: true }).click()
  for (const kind of ['client', 'project', 'release'])
    await expect(page.getByRole('button', { name: `Filter ${kind}`, exact: true })).toContainText(
      `All ${kind}s`,
    )
}

export async function navigateReportsShell(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name, exact: true })
    .click()
}

export async function readReport(
  page: Page,
  query: Record<string, string> = {},
): Promise<ReportsResponse> {
  const params = new URLSearchParams({
    period: 'month',
    date: '2026-10-15',
    grouping: 'client',
    timeZone: 'UTC',
    ...query,
  })
  const response = await page.request.get(`/api/reports?${params}`)
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}
