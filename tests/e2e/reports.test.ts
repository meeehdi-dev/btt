import { expect, test, type BrowserContext } from '@playwright/test'
import { getReportPeriodRange } from '../../shared/report-period'
import {
  createReportFixture,
  createReportTicket as createTicket,
  createReportEntry as createEntry,
  cleanupReportFixture,
  navigateReportsShell as navigateMain,
  type ReportFixture,
} from './helpers/reports'
import { openAgendaAddDialog } from './helpers/agenda'
import { localCurrentDate } from './helpers/current-date'
import { createTestOwner } from './helpers/test-owner'
import { waitForClientMount } from './wait-for-client-mount'

test.use({ timezoneId: 'UTC' })

test('owner-scoped report aggregates time, archives, filters, estimate cohorts, and grouping', async ({
  page,
  context,
  browser,
}) => {
  const { helpers, user } = await createTestOwner(context, 'Reports owner', 'reports')
  const fixtures: ReportFixture[] = []
  let foreignContext: BrowserContext | undefined
  let foreignPage: Page | undefined
  let foreignOwner: Awaited<ReturnType<typeof createTestOwner>> | undefined

  try {
    foreignContext = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    })
    foreignOwner = await createTestOwner(foreignContext, 'Foreign reports owner', 'reports-foreign')
    foreignPage = await foreignContext.newPage()

    const today = await localCurrentDate(page)
    const month = getReportPeriodRange('month', today)
    if (!month) throw new Error('Current report month must have previous-period bounds')

    const archived = await createReportFixture(page, 'Archived')
    fixtures.push(archived)
    const zero = await createReportFixture(page, 'Zero')
    fixtures.push(zero)
    const foreign = await createReportFixture(foreignPage, 'Private')
    fixtures.push(foreign)

    const doneTicket = await createTicket(archived, {
      title: 'Done estimated ticket',
      status: 'Done',
      estimateMinutes: 60,
    })
    const activeTicket = await createTicket(archived, {
      title: 'Active estimated ticket',
      status: 'Idea',
      estimateMinutes: 45,
    })
    await createTicket(zero, {
      title: 'Done estimate without period entries',
      status: 'Done',
      estimateMinutes: 45,
    })
    const foreignTicket = await createTicket(foreign, {
      title: 'Foreign report ticket',
      status: 'Done',
      estimateMinutes: 120,
    })
    await createEntry(archived, doneTicket, today)
    await createEntry(archived, doneTicket, month.previousStartDate)
    await createEntry(archived, doneTicket, '2020-02-01')
    await createEntry(archived, activeTicket, today, 30, 9 * 60 + 30)
    await createEntry(foreign, foreignTicket, today, 60)

    const archiveResponse = await page.request.patch(
      `/api/clients/${archived.hierarchy.clientId}`,
      {
        data: { archived: true },
      },
    )
    expect(archiveResponse.ok(), await archiveResponse.text()).toBeTruthy()

    const apiResponse = await page.request.get(
      `/api/reports?period=month&date=${today}&grouping=client&timeZone=UTC`,
    )
    expect(apiResponse.ok(), await apiResponse.text()).toBeTruthy()
    const data = await apiResponse.json()
    expect(data.summary).toEqual({ currentMinutes: 60, previousMinutes: 30 })
    expect(data.paths.map((path: { clientId: string }) => path.clientId).toSorted()).toEqual(
      [archived.hierarchy.clientId, zero.hierarchy.clientId].toSorted(),
    )
    expect(
      data.paths.some((path: { clientId: string }) => path.clientId === foreign.hierarchy.clientId),
    ).toBe(false)

    const archivedRow = data.rows.find(
      (row: { id: string }) => row.id === archived.hierarchy.clientId,
    )
    expect(archivedRow).toMatchObject({
      name: 'Archived Client',
      archived: true,
      currentMinutes: 60,
      previousMinutes: 30,
      estimate: { estimatedMinutes: 60, trackedMinutes: 90, ticketCount: 1 },
    })
    const zeroRow = data.rows.find((row: { id: string }) => row.id === zero.hierarchy.clientId)
    expect(zeroRow).toMatchObject({
      currentMinutes: 0,
      previousMinutes: 0,
      estimate: { estimatedMinutes: 45, trackedMinutes: 0, ticketCount: 1 },
    })

    const historicalResponse = await page.request.get(
      '/api/reports?period=month&date=2020-02-10&grouping=client&timeZone=UTC',
    )
    expect(historicalResponse.ok(), await historicalResponse.text()).toBeTruthy()
    const historicalData = await historicalResponse.json()
    expect(historicalData.summary).toEqual({ currentMinutes: 30, previousMinutes: 0 })
    expect(
      historicalData.rows.find((row: { id: string }) => row.id === archived.hierarchy.clientId),
    ).toMatchObject({ currentMinutes: 30, estimate: null })

    const filteredResponse = await page.request.get(
      `/api/reports?period=month&date=${today}&grouping=client&clientId=${zero.hierarchy.clientId}&timeZone=UTC`,
    )
    expect(filteredResponse.ok(), await filteredResponse.text()).toBeTruthy()
    const filtered = await filteredResponse.json()
    expect(filtered.summary).toEqual({ currentMinutes: 0, previousMinutes: 0 })
    expect(filtered.rows.map((row: { id: string }) => row.id)).toEqual([zero.hierarchy.clientId])
    expect(filtered.paths).toHaveLength(2)

    const projectResponse = await page.request.get(
      `/api/reports?period=month&date=${today}&grouping=project&timeZone=UTC`,
    )
    expect(projectResponse.ok(), await projectResponse.text()).toBeTruthy()
    const projectData = await projectResponse.json()
    expect(projectData.rows.map((row: { id: string }) => row.id)).toContain(
      archived.hierarchy.projectId,
    )
    expect(projectData.rows.map((row: { id: string }) => row.id)).toContain(
      zero.hierarchy.projectId,
    )

    const invalidDate = await page.request.get(
      '/api/reports?period=month&date=2026-02-30&grouping=client&timeZone=UTC',
    )
    expect(invalidDate.status()).toBe(400)
    const invalidPeriod = await page.request.get(
      `/api/reports?period=decade&date=${today}&grouping=client&timeZone=UTC`,
    )
    expect(invalidPeriod.status()).toBe(400)

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/reports')
    await waitForClientMount(page)
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible()
    const reportRows = page.getByRole('list', { name: /Time allocation by/ })
    await expect(reportRows.getByRole('button', { name: /Archived Client/ })).toBeVisible()
    await expect(reportRows.getByRole('button', { name: /Zero Client/ })).toContainText('45m')

    await reportRows.getByRole('button', { name: /Archived Client/ }).click()
    await expect(page).toHaveURL('/reports')
    await expect(reportRows.getByRole('button', { name: /Zero Client/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText(
      'Archived Client (Archived)',
    )
    await page.getByRole('tab', { name: 'Projects' }).click()
    await expect(reportRows.getByRole('button', { name: /Archived Project/ })).toBeVisible()
    await reportRows.getByRole('button', { name: /Archived Project/ }).click()
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText(
      'Archived Project',
    )
    await expect(page).toHaveURL('/reports')

    await page.getByRole('button', { name: 'Clear filters' }).click()
    const clientsTab = page.getByRole('tab', { name: 'Clients' })
    await clientsTab.click()
    await clientsTab.press('ArrowRight')
    const projectsTab = page.getByRole('tab', { name: 'Projects' })
    await expect(projectsTab).toHaveAttribute('aria-selected', 'true')
    await expect(reportRows.getByRole('button', { name: /Zero Project/ })).toBeVisible()

    await page.getByRole('button', { name: 'Filter client' }).click()
    await page.getByPlaceholder('Search clients…').fill('Zero')
    await page.getByRole('option', { name: 'Zero Client', exact: true }).click()
    await expect(reportRows.getByRole('button', { name: /Archived Project/ })).toHaveCount(0)
    await expect(reportRows.getByRole('button', { name: /Zero Project/ })).toBeVisible()

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await page.getByRole('tab', { name: 'Clients' }).click()
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    await expect(page.getByText('Logged in selected month')).toBeVisible()
    await expect(reportRows.getByRole('button', { name: /Archived Client/ })).toBeVisible()
    await page.getByRole('button', { name: 'Previous month' }).click()
    await expect(reportRows.getByRole('button', { name: /Archived Client/ })).toContainText('30m')
    await page.getByRole('button', { name: 'Current month' }).click()
    await expect(reportRows.getByRole('button', { name: /Archived Client/ })).toContainText('1hr')
  } finally {
    for (const fixture of fixtures.toReversed()) await cleanupReportFixture(fixture)
    if (foreignOwner) await foreignOwner.helpers.deleteUser(foreignOwner.user.id)
    await helpers.deleteUser(user.id)
    await foreignContext?.close()
  }
})

for (const [kind, tab] of [
  ['project', 'Projects'],
  ['release', 'Releases'],
] as const) {
  test(`${kind} renames refresh Reports grouping and filter names through SPA navigation`, async ({
    page,
    context,
  }) => {
    const { helpers, user } = await createTestOwner(
      context,
      'Reports hierarchy refresh owner',
      'reports-hierarchy',
    )
    const fixture = await createReportFixture(page, 'Hierarchy refresh')
    try {
      const id = await createTicket(fixture, { title: 'Hierarchy refresh work', status: 'Idea' })
      await createEntry(fixture, id, await localCurrentDate(page))
      await page.goto('/reports')
      await waitForClientMount(page)
      await page.getByRole('tab', { name: tab, exact: true }).click()
      await expect(page.getByRole('list', { name: /Time allocation by/ })).toContainText(
        fixture.hierarchy[`${kind}Name`],
      )
      const timeOrigin = await page.evaluate(() => performance.timeOrigin)
      await navigateMain(page, 'Clients')
      await page
        .getByRole('link', { name: `Open client ${fixture.hierarchy.clientName}`, exact: true })
        .click()
      await page
        .getByRole('link', { name: `Open project ${fixture.hierarchy.projectName}`, exact: true })
        .click()
      if (kind === 'release')
        await page
          .getByRole('link', { name: `Open release ${fixture.hierarchy.releaseName}`, exact: true })
          .click()
      const label = `${kind[0]!.toUpperCase()}${kind.slice(1)}`
      const field = page.getByRole('textbox', { name: `${label} name` })
      await field.fill(`Renamed report ${kind}`)
      await field.press('Tab')
      await expect(
        page.getByRole('heading', { name: `Renamed report ${kind}`, exact: true }),
      ).toBeVisible()
      await navigateMain(page, 'Reports')
      await page.getByRole('tab', { name: tab, exact: true }).click()
      await expect(
        page.getByRole('button', { name: new RegExp(`Renamed report ${kind}`) }),
      ).toContainText('30m')
      await page.getByRole('button', { name: `Filter ${kind}`, exact: true }).click()
      await expect(
        page.getByRole('option', { name: `Renamed report ${kind}`, exact: true }),
      ).toBeVisible()
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
    } finally {
      await cleanupReportFixture(fixture)
      await helpers.deleteUser(user.id)
    }
  })
}

test('time-entry writes refresh the inactive Reports aggregate in the same tab', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(context, 'Reports invalidation owner', 'reports')
  let fixture: ReportFixture | undefined
  try {
    fixture = await createReportFixture(page, 'Refresh')
    await createTicket(fixture, {
      title: 'Refresh report ticket',
      status: 'Idea',
      estimateMinutes: 60,
    })
    await page.setViewportSize({ width: 1600, height: 1200 })
    await page.goto('/reports')
    await waitForClientMount(page)
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible()
    await expect(
      page.getByText('No tracked time or completed estimates in this period.'),
    ).toBeVisible()
    const date = await localCurrentDate(page)
    const timeOrigin = await page.evaluate(() => performance.timeOrigin)

    await navigateMain(page, 'Agenda')
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const dialog = await openAgendaAddDialog(page, date)
    await page.getByPlaceholder('Search tickets…').fill('Refresh report ticket')
    await page.getByRole('option', { name: /Refresh report ticket/ }).click()
    await dialog.getByRole('textbox', { name: 'Work description' }).fill('Refresh the report')
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/api/time-entries'),
    )
    await dialog.getByRole('button', { name: 'Save time entry' }).click()
    const entryResponse = await responsePromise
    expect(entryResponse.ok(), await entryResponse.text()).toBeTruthy()
    const entry = (await entryResponse.json()) as { id: string }
    fixture.entryIds.push(entry.id)
    await expect(dialog).toHaveCount(0)

    await navigateMain(page, 'Reports')
    const reportRow = page.getByRole('button', { name: /Refresh Client/ })
    await expect(reportRow).toContainText('30m')
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
    await expect(page.getByRole('button', { name: /Refresh report ticket/ })).toHaveCount(0)

    await navigateMain(page, 'Tickets')
    await page.getByRole('link', { name: 'Refresh report ticket', exact: true }).click()
    const ticketStatus = page.getByRole('combobox', {
      name: 'Ticket status for Refresh report ticket',
    })
    await ticketStatus.click()
    await page.getByRole('option', { name: 'Done', exact: true }).click()
    await expect(ticketStatus).toContainText('Done')
    await navigateMain(page, 'Reports')
    await expect(reportRow).toContainText('Done estimates: 1')
    await expect(reportRow).toContainText('30m / estimated 1hr')

    await navigateMain(page, 'Clients')
    await page.getByRole('link', { name: 'Open client Refresh Client' }).click()
    await page.getByRole('button', { name: 'Archive client' }).click()
    await expect(page.getByRole('button', { name: 'Restore client' })).toBeVisible()
    await navigateMain(page, 'Reports')
    await expect(reportRow).toContainText('Archived')
    await page.getByRole('button', { name: 'Filter client' }).click()
    await expect(
      page.getByRole('option', { name: 'Refresh Client (Archived)', exact: true }),
    ).toBeVisible()
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
  } finally {
    if (fixture) await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})
