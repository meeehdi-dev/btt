import { expect, test, type Page } from '@playwright/test'
import type { ReportsResponse } from '../../shared/reports'
import { createTestOwner } from './helpers/test-owner'
import {
  cleanupReportFixture,
  selectReportRelease,
  chooseReportWeekStart,
  clearReportClientFilter,
  createReportEntry,
  createReportFixture,
  createReportTicket,
  navigateReportsShell,
} from './helpers/reports'
import { waitForClientMount } from './wait-for-client-mount'
import { formatReportPeriodLabel } from '../../app/utils/reports'

test.use({ locale: 'en-US', timezoneId: 'Europe/Paris', viewport: { width: 1280, height: 900 } })

function nextReport(page: Page) {
  return page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/reports' && response.ok(),
  )
}
async function expectReport(page: Page, response: ReportsResponse, minutes: number) {
  const label = formatReportPeriodLabel(
    response.period,
    response.range.startDate,
    response.range.endDate,
    'en-US',
  )
  await expect(page.getByText(label, { exact: true })).toHaveCount(2)
  await expect(page.getByLabel('Period totals')).toContainText(
    minutes === 60 ? '1hr' : minutes === 30 ? '30m' : '0m',
  )
  await expect(
    page.getByRole('alert').filter({ hasText: 'Could not load the report' }),
  ).toHaveCount(0)
}

for (const date of ['2026-10-15', '2026-10-11']) {
  test(`Reports uses Sunday response boundaries with independently failed Settings on ${date}`, async ({
    page,
    context,
  }) => {
    const { helpers, user } = await createTestOwner(
      context,
      'Response period owner',
      'reports-range',
    )
    const fixture = await createReportFixture(page, 'Sunday range')
    let settingsReads = 0
    try {
      expect(
        (
          await page.request.patch('/api/settings', {
            data: {
              visibleStartMinute: 480,
              visibleEndMinute: 1200,
              workDayDurationMinutes: 480,
              startOfWeekDay: 0,
            },
          })
        ).ok(),
      ).toBe(true)
      const ticket = await createReportTicket(fixture, { title: 'Sunday only', status: 'Idea' })
      await createReportEntry(fixture, ticket, '2026-10-11')
      await page.clock.install({ time: new Date(`${date}T12:00:00Z`) })
      await page.goto('/clients')
      await waitForClientMount(page)
      const origin = await page.evaluate(() => performance.timeOrigin)
      await page.route('**/api/settings', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        settingsReads++
        await route.fulfill({
          status: 503,
          json: { statusMessage: 'private independent settings failure' },
        })
      })
      await page.getByRole('button', { name: 'Settings', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: 'Workspace settings' })
      await expect(
        dialog.getByRole('alert').filter({ hasText: 'Could not load settings' }),
      ).toBeVisible()
      expect(settingsReads).toBeGreaterThan(0)
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      const beforeEntry = settingsReads
      const loaded = nextReport(page)
      await navigateReportsShell(page, 'Reports')
      const report = (await (await loaded).json()) as ReportsResponse
      expect(report.range).toEqual({
        startDate: '2026-10-11',
        endDate: '2026-10-17',
        previousStartDate: '2026-10-04',
        previousEndDate: '2026-10-10',
      })
      expect(report.summary.currentMinutes).toBe(30)
      await expectReport(page, report, 30)
      expect(settingsReads).toBe(beforeEntry)
      await expect(page.getByRole('button', { name: /Sunday range Client/ })).toContainText('30m')
      await expect(page.getByRole('button', { name: 'Current week', exact: true })).toBeDisabled()
      for (const [action, start, minutes, prior] of [
        ['Next week', '2026-10-18', 0, 30],
        ['Previous week', '2026-10-11', 30, 0],
        ['Previous week', '2026-10-04', 0, 0],
        ['Current week', '2026-10-11', 30, 0],
      ] as const) {
        const read = nextReport(page)
        await page.getByRole('button', { name: action, exact: true }).click()
        const adjacent = (await (await read).json()) as ReportsResponse
        expect(adjacent.range.startDate).toBe(start)
        expect(adjacent.summary).toEqual({ currentMinutes: minutes, previousMinutes: prior })
        await expectReport(page, adjacent, minutes)
      }
      expect(settingsReads).toBe(beforeEntry)
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin)
      await expect(page.getByText('private independent settings failure')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280)
    } finally {
      await cleanupReportFixture(fixture)
      await helpers.deleteUser(user.id)
    }
  })
}

test('Settings refresh failure leaves mounted Reports response authoritative and retry read-only', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Mounted range owner',
    'reports-mounted-range',
  )
  const fixture = await createReportFixture(page, 'Mounted range')
  let failSettings = false
  let reads = 0
  let writes = 0
  try {
    const ticket = await createReportTicket(fixture, { title: 'Boundary work', status: 'Idea' })
    await createReportEntry(fixture, ticket, '2026-10-11')
    await createReportEntry(fixture, ticket, '2026-10-12')
    await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') })
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'PATCH') writes++
      if (route.request().method() === 'GET') {
        reads++
        if (failSettings)
          return route.fulfill({ status: 503, json: { statusMessage: 'private refresh detail' } })
      }
      return route.continue()
    })
    await page.goto('/reports')
    await waitForClientMount(page)
    await expect(page.getByLabel('Period totals')).toContainText('30m')
    await selectReportRelease(page, 'Mounted range Release')
    const tab = await page.getByRole('tab', { name: 'Releases', exact: true }).elementHandle()
    const origin = await page.evaluate(() => performance.timeOrigin)
    const dialog = await chooseReportWeekStart(page, 'Sunday')
    failSettings = true
    const refreshed = nextReport(page)
    await dialog.getByRole('button', { name: 'Save settings', exact: true }).click()
    await expect(
      dialog.getByRole('alert').filter({ hasText: 'Settings saved; refresh failed' }),
    ).toBeVisible()
    const report = (await (await refreshed).json()) as ReportsResponse
    expect(report.range.startDate).toBe('2026-10-11')
    expect(report.range.endDate).toBe('2026-10-17')
    expect(report.summary.currentMinutes).toBe(60)
    expect(reads).toBeGreaterThan(1)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expectReport(page, report, 60)
    for (const kind of ['client', 'project', 'release'])
      await expect(page.getByRole('button', { name: `Filter ${kind}`, exact: true })).toContainText(
        'Mounted range',
      )
    await expect(page.getByRole('tab', { name: 'Releases', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(await tab?.evaluate((element) => element.isConnected)).toBe(true)
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    failSettings = false
    const recovered = nextReport(page)
    await dialog.getByRole('button', { name: 'Retry loading settings', exact: true }).click()
    await expect(dialog.getByRole('status').filter({ hasText: 'Settings saved.' })).toBeVisible()
    await recovered
    expect(writes).toBe(1)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expectReport(page, report, 60)
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin)
    await expect(page.getByText('private refresh detail')).toHaveCount(0)
  } finally {
    await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})

test('Reports hides inherited values through superseded reads and recovers report errors without settings reads', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Report transition owner',
    'reports-transition',
  )
  const fixture = await createReportFixture(page, 'Transition')
  let release: (() => void) | undefined
  let held = false
  let delivered = false
  let fail = false
  let settingsReads = 0
  let writes = 0
  try {
    const ticket = await createReportTicket(fixture, {
      title: 'Distinct period totals',
      status: 'Idea',
    })
    for (const date of ['2026-10-15', '2026-10-01', '2026-01-01'])
      await createReportEntry(fixture, ticket, date)
    expect(
      (
        await page.request.patch(`/api/tickets/${ticket}`, {
          data: { status: 'Done', estimateMinutes: 60 },
        })
      ).ok(),
    ).toBe(true)
    await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') })
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/settings' && request.method() === 'GET')
        settingsReads++
      if (request.method() === 'PATCH') writes++
    })
    await page.route('**/api/reports?**', async (route) => {
      const query = new URL(route.request().url()).searchParams
      if (held && query.get('period') === 'month') {
        held = false
        // Fetch the real response now; deliver it only after the newer read succeeds.
        const response = await route.fetch()
        await new Promise<void>((resolve) => {
          release = resolve
        })
        await route.fulfill({ response })
        delivered = true
      } else if (fail) {
        await route.fulfill({
          status: 503,
          json: { statusMessage: 'private report transition failure' },
        })
      } else await route.continue()
    })
    await page.goto('/reports')
    await waitForClientMount(page)
    await expect(page.getByLabel('Period totals')).toContainText('30m')
    await selectReportRelease(page, 'Transition Release')
    await expect(page.getByLabel('Period totals')).toBeVisible()
    const tab = await page.getByRole('tab', { name: 'Releases', exact: true }).elementHandle()
    held = true
    const requested = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === '/api/reports' &&
        new URL(request.url()).searchParams.get('period') === 'month',
    )
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    await requested
    await expect(page.getByText('Loading report period…', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Period totals')).toHaveCount(0)
    await expect(page.getByRole('list', { name: /Time allocation by/ })).toHaveCount(0)
    await expect(page.getByText(/Estimate comparison uses/)).toHaveCount(0)
    for (const name of ['Previous month', 'Next month'])
      await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Filter release', exact: true })).toContainText(
      'Transition Release',
    )
    const active = nextReport(page)
    await page.getByRole('button', { name: 'Year', exact: true }).click()
    const year = (await (await active).json()) as ReportsResponse
    expect(year.period).toBe('year')
    expect(year.summary.currentMinutes).toBe(90)
    await expect(page.getByLabel('Period totals')).toContainText('1hr 30m')
    await expect.poll(() => Boolean(release)).toBe(true)
    release?.()
    await expect.poll(() => delivered).toBe(true)
    await expect(page.getByText('2026', { exact: true })).toHaveCount(2)
    await expect(page.getByLabel('Period totals')).toContainText('1hr 30m')
    const grouped = nextReport(page)
    await page.getByRole('tab', { name: 'Projects', exact: true }).click()
    const current = (await (await grouped).json()) as ReportsResponse
    expect(current.period).toBe('year')
    await expect(page.getByText('2026', { exact: true })).toHaveCount(2)
    await expect(page.getByLabel('Period totals')).toContainText('1hr 30m')
    fail = true
    await page.getByRole('button', { name: 'Previous year', exact: true }).click()
    await expect(page.getByText('Report period unavailable', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Could not load the report' }),
    ).toBeVisible()
    await expect(page.getByLabel('Period totals')).toHaveCount(0)
    await expect(page.getByRole('list', { name: /Time allocation by/ })).toHaveCount(0)
    await expect(page.getByText('No work matches these filters.')).toHaveCount(0)
    await expect(page.getByText('private report transition failure')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Previous year', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Next year', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Filter release', exact: true })).toContainText(
      'Transition Release',
    )
    fail = false
    const retried = nextReport(page)
    await page.getByRole('button', { name: 'Retry loading report', exact: true }).click()
    const recovered = (await (await retried).json()) as ReportsResponse
    expect(recovered.range.startDate).toBe('2025-01-01')
    await expectReport(page, recovered, 0)
    expect(settingsReads).toBe(0)
    expect(writes).toBe(0)
    expect(await tab?.evaluate((element) => element.isConnected)).toBe(true)
    await clearReportClientFilter(page)
  } finally {
    release?.()
    await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})
