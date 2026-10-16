import { expect, test, type Route } from '@playwright/test'
import type { ReportsResponse } from '../../shared/reports'
import { localCurrentDate } from './helpers/current-date'
import { createTestOwner } from './helpers/test-owner'
import {
  cleanupReportFixture,
  selectReportRelease,
  chooseReportWeekStart,
  clearReportClientFilter,
  createReportEntry,
  createReportFixture,
  createReportTicket,
} from './helpers/reports'
import { waitForClientMount } from './wait-for-client-mount'

test.use({ timezoneId: 'Europe/Paris', viewport: { width: 1280, height: 900 } })

test('Reports preserves layout while a selected-filter response and its superseding read are pending', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(context, 'Reports layout owner', 'reports-layout')
  const selected = await createReportFixture(page, 'Layout target')
  const outside = await createReportFixture(page, 'Layout outside')
  let holdClient = false
  let holdProject = false
  let releaseClient: (() => void) | undefined
  let releaseProject: (() => void) | undefined
  let clientStarted = false
  let projectStarted = false
  let cleanupReleasing = false
  let clientResponse: ReportsResponse | null = null
  let projectResponse: ReportsResponse | null = null
  const sequence: string[] = []
  let finishClient!: () => void
  let finishProject!: () => void
  const clientFinished = new Promise<void>((resolve) => {
    finishClient = resolve
  })
  const projectFinished = new Promise<void>((resolve) => {
    finishProject = resolve
  })

  async function holdResponse(route: Route, grouping: 'client' | 'project') {
    try {
      const response = await route.fetch()
      const data = (await response.json()) as ReportsResponse
      if (!response.ok()) throw new Error(`Reports ${grouping} read failed: ${response.status()}`)
      if (grouping === 'client') {
        clientResponse = data
        sequence.push('client response generated')
      } else {
        projectResponse = data
        sequence.push('project response generated')
      }
      await new Promise<void>((resolve) => {
        if (cleanupReleasing) resolve()
        else if (grouping === 'client') releaseClient = resolve
        else releaseProject = resolve
      })
      await route.fulfill({ response })
    } finally {
      if (grouping === 'client') {
        sequence.push('client response settled')
        finishClient()
      } else {
        sequence.push('project response settled')
        finishProject()
      }
    }
  }

  try {
    const date = await localCurrentDate(page)
    const selectedTicket = await createReportTicket(selected, {
      title: 'Selected estimate context',
      status: 'Done',
      estimateMinutes: 90,
    })
    const outsideTicket = await createReportTicket(outside, {
      title: 'Outside report work',
      status: 'Idea',
    })
    await createReportEntry(selected, selectedTicket, date, 60, 9 * 60)
    await createReportEntry(outside, outsideTicket, date, 30, 10 * 60)
    await page.route('**/api/reports?**', async (route) => {
      const query = new URL(route.request().url()).searchParams
      if (
        holdClient &&
        query.get('grouping') === 'client' &&
        query.get('clientId') === selected.hierarchy.clientId
      ) {
        holdClient = false
        clientStarted = true
        return holdResponse(route, 'client')
      }
      if (
        holdProject &&
        query.get('grouping') === 'project' &&
        query.get('clientId') === selected.hierarchy.clientId
      ) {
        holdProject = false
        projectStarted = true
        return holdResponse(route, 'project')
      }
      return route.continue()
    })
    await page.goto('/reports')
    await waitForClientMount(page)

    const summary = page.getByTestId('report-summary-region')
    const results = page.getByRole('region', { name: 'Report results', exact: true })
    const clientFilter = page.getByRole('button', { name: 'Filter client', exact: true })
    const clientClear = page.getByLabel('Clear client filter', { exact: true })
    const projectsTab = page.getByRole('tab', { name: 'Projects', exact: true })
    const captureLayout = async () =>
      page.evaluate(() => {
        const regions = [
          ['summary', '[data-testid="report-summary-region"]'],
          ['results', '[aria-label="Report results"]'],
          ['grouping', '[aria-label="Breakdown grouping"]'],
          ['filters', '[aria-label="Reports filters"]'],
          ['toolbar', '[aria-label="Report controls"]'],
        ] as const
        const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {}
        for (const [name, selector] of regions) {
          const element = document.querySelector(selector)
          if (!element) throw new Error(`Missing layout region: ${selector}`)
          const { x, y, width, height } = element.getBoundingClientRect()
          boxes[name] = { x, y, width, height }
        }
        return boxes
      })
    const expectStableLayout = (
      before: Awaited<ReturnType<typeof captureLayout>>,
      during: Awaited<ReturnType<typeof captureLayout>>,
    ) => {
      for (const region of ['summary', 'results', 'grouping', 'filters', 'toolbar'] as const) {
        for (const dimension of ['x', 'y', 'width', 'height'] as const) {
          expect(
            Math.abs(before[region][dimension] - during[region][dimension]),
            `${region} ${dimension} moved during pending read`,
          ).toBeLessThanOrEqual(1)
        }
      }
    }

    await expect(page.getByLabel('Period totals')).toContainText('1hr 30m')
    const initialRows = page.getByRole('list', { name: /Time allocation by/ })
    await expect(initialRows.getByRole('button')).toHaveCount(2)
    await expect(initialRows).toContainText('Layout outside Client')
    await expect(initialRows).toContainText('66.7%')
    await expect(initialRows).toContainText('33.3%')
    await expect(initialRows).toContainText('New this period')
    await expect(page.getByText('Done estimates: 1')).toBeVisible()
    await expect(results).toHaveAttribute('aria-busy', 'false')
    const before = await captureLayout()

    const expectReservedLayout = async () => {
      expectStableLayout(before, await captureLayout())
      expect(await summary.evaluate((element) => (element as HTMLElement).style.minHeight)).toBe(
        `${before.summary.height}px`,
      )
      expect(await results.evaluate((element) => (element as HTMLElement).style.minHeight)).toBe(
        `${before.results.height}px`,
      )
    }

    holdClient = true
    const filteredRequest = page.waitForRequest((request) => {
      const url = new URL(request.url())
      return (
        url.pathname === '/api/reports' &&
        url.searchParams.get('grouping') === 'client' &&
        url.searchParams.get('clientId') === selected.hierarchy.clientId
      )
    })
    await page
      .getByRole('list', { name: /Time allocation by/ })
      .getByRole('button', { name: /Layout target Client/ })
      .click()
    await filteredRequest
    await expect.poll(() => Boolean(releaseClient)).toBe(true)
    expect(clientResponse?.summary.currentMinutes).toBe(60)
    expect(clientResponse?.rows.map((row) => row.id)).toEqual([selected.hierarchy.clientId])

    await expect(results).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByText('Loading report…', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Period totals')).toHaveCount(0)
    await expect(results).toBeEmpty()
    await expect(page.getByRole('list', { name: /Time allocation by/ })).toHaveCount(0)
    await expect(page.getByText('Layout outside Client', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Done estimates: 1')).toHaveCount(0)
    await expect(page.getByText('66.7%', { exact: true })).toHaveCount(0)
    await expect(page.getByText('33.3%', { exact: true })).toHaveCount(0)
    await expect(page.getByText('New this period', { exact: true })).toHaveCount(0)
    await expect(clientFilter).toBeEnabled()
    await expect(clientFilter).toContainText(selected.hierarchy.clientName)
    await expect(clientClear).toBeVisible()
    await expectReservedLayout()

    const filterSearch = page.getByPlaceholder('Search clients…')
    await clientFilter.click()
    await filterSearch.fill('Layout target')
    await expect(
      page.getByRole('option', { name: selected.hierarchy.clientName, exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    holdProject = true
    const projectRequest = page.waitForRequest((request) => {
      const url = new URL(request.url())
      return (
        url.pathname === '/api/reports' &&
        url.searchParams.get('grouping') === 'project' &&
        url.searchParams.get('clientId') === selected.hierarchy.clientId
      )
    })
    await projectsTab.click()
    await projectRequest
    await expect.poll(() => Boolean(releaseProject)).toBe(true)
    expect(projectResponse?.summary.currentMinutes).toBe(60)
    expect(projectResponse?.rows.map((row) => row.id)).toEqual([selected.hierarchy.projectId])
    expect(sequence).toEqual(['client response generated', 'project response generated'])
    await expect(projectsTab).toHaveAttribute('aria-selected', 'true')

    releaseClient?.()
    await clientFinished
    expect(sequence).toEqual([
      'client response generated',
      'project response generated',
      'client response settled',
    ])
    await expect(results).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByLabel('Period totals')).toHaveCount(0)
    await expectReservedLayout()

    const activeResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/reports' &&
        url.searchParams.get('grouping') === 'project' &&
        url.searchParams.get('clientId') === selected.hierarchy.clientId &&
        response.ok()
      )
    })
    releaseProject?.()
    await projectFinished
    const delivered = (await (await activeResponse).json()) as ReportsResponse
    expect(delivered.summary.currentMinutes).toBe(60)
    expect(delivered.rows.map((row) => row.id)).toEqual([selected.hierarchy.projectId])
    await expect(results).toHaveAttribute('aria-busy', 'false')
    await expect(page.getByLabel('Period totals')).toContainText('1hr')
    const rows = page.getByRole('list', { name: 'Time allocation by projects', exact: true })
    await expect(rows.getByRole('button')).toHaveCount(1)
    await expect(rows).toContainText(selected.hierarchy.projectName)
    await expect(rows).not.toContainText(outside.hierarchy.projectName)
    await expect(rows).not.toContainText(outside.hierarchy.clientName)
    await expect(rows).toContainText('Done estimates: 1')
    await expect(clientFilter).toContainText(selected.hierarchy.clientName)
    expect(await summary.evaluate((element) => (element as HTMLElement).style.minHeight)).toBe('')
    expect(await results.evaluate((element) => (element as HTMLElement).style.minHeight)).toBe('')
    const after = await captureLayout()
    expect(after.results.height).toBeLessThan(before.results.height)
    expect(sequence).toEqual([
      'client response generated',
      'project response generated',
      'client response settled',
      'project response settled',
    ])
  } finally {
    cleanupReleasing = true
    releaseClient?.()
    releaseProject?.()
    if (clientStarted) await clientFinished
    if (projectStarted) await projectFinished
    await cleanupReportFixture(outside)
    await cleanupReportFixture(selected)
    await helpers.deleteUser(user.id)
  }
})

test('Reports keeps consecutive keyboard grouping changes focused through pending, error, and empty states', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Reports keyboard owner',
    'reports-keyboard',
  )
  let resume: (() => void) | undefined
  let holdNext = false
  let fail = false
  try {
    await page.route('**/api/reports?**', async (route) => {
      if (holdNext) {
        holdNext = false
        await new Promise<void>((resolve) => {
          resume = resolve
        })
      }
      if (fail)
        await route.fulfill({ status: 503, json: { statusMessage: 'private report failure' } })
      else await route.continue()
    })
    await page.goto('/reports')
    await waitForClientMount(page)
    await expect(
      page.getByText('No tracked time or completed estimates in this period.'),
    ).toBeVisible()
    const clients = page.getByRole('tab', { name: 'Clients', exact: true })
    const projects = page.getByRole('tab', { name: 'Projects', exact: true })
    const releases = page.getByRole('tab', { name: 'Releases', exact: true })
    await clients.focus()
    holdNext = true
    const requested = page.waitForRequest(
      (request) =>
        request.url().includes('/api/reports?') && request.url().includes('grouping=project'),
    )
    await page.keyboard.press('ArrowRight')
    await requested
    await expect(projects).toBeFocused()
    await expect(page.getByRole('region', { name: 'Report results', exact: true })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    resume?.()
    await expect(page.getByRole('region', { name: 'Report results', exact: true })).toHaveAttribute(
      'aria-busy',
      'false',
    )
    await expect(projects).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(releases).toHaveAttribute('aria-selected', 'true')
    await expect(releases).toBeFocused()
    await expect(
      page.getByText('No tracked time or completed estimates in this period.'),
    ).toBeVisible()
    fail = true
    await page.keyboard.press('Home')
    await expect(
      page.getByRole('alert').filter({ hasText: 'Could not load the report' }),
    ).toBeVisible()
    await expect(clients).toBeFocused()
    await expect(page.getByText('private report failure')).toHaveCount(0)
    fail = false
    await page.getByRole('button', { name: 'Retry loading report', exact: true }).click()
    await expect(
      page.getByText('No tracked time or completed estimates in this period.'),
    ).toBeVisible()
    await expect(clients).toBeVisible()
  } finally {
    resume?.()
    await helpers.deleteUser(user.id)
  }
})

test('Reports retains readable archive-aware client, project, and release selections in empty periods', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Reports retained filters owner',
    'reports-retained',
  )
  const fixture = await createReportFixture(page, 'Retained')
  try {
    const id = await createReportTicket(fixture, { title: 'Retained period work', status: 'Idea' })
    await createReportEntry(fixture, id, '2026-10-15')
    expect(
      (
        await page.request.patch(`/api/clients/${fixture.hierarchy.clientId}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()
    await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') })
    await page.goto('/reports')
    await waitForClientMount(page)
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    for (const [kind, tab] of [
      ['client', 'Clients'],
      ['project', 'Projects'],
      ['release', 'Releases'],
    ] as const) {
      await page.getByRole('tab', { name: tab, exact: true }).click()
      await page
        .getByRole('list', { name: /Time allocation by/ })
        .getByRole('button', { name: new RegExp(`Retained ${kind}`, 'i') })
        .click()
      await page.getByRole('button', { name: 'Previous month', exact: true }).click()
      await expect(page.getByText('No work matches these filters.')).toBeVisible()
      const filter = page.getByRole('button', { name: `Filter ${kind}`, exact: true })
      await expect(filter).toBeEnabled()
      await expect(filter).toContainText(
        `Retained ${kind[0]!.toUpperCase()}${kind.slice(1)} (Archived)`,
      )
      await expect(filter).not.toContainText(fixture.hierarchy[`${kind}Id`])
      await page.getByRole('button', { name: 'Year', exact: true }).click()
      await expect(filter).toContainText('Retained')
      await page.getByRole('button', { name: 'Month', exact: true }).click()
      await expect(page.getByText('No work matches these filters.')).toBeVisible()
      await page.getByLabel(`Clear ${kind} filter`, { exact: true }).click()
      await expect(filter).toContainText(`All ${kind}s`)
      if (kind !== 'client')
        await expect(
          page.getByRole('button', { name: 'Filter client', exact: true }),
        ).toContainText('Retained Client')
      if (kind !== 'client')
        await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
      await page.getByRole('button', { name: 'Current month', exact: true }).click()
    }
    await selectReportRelease(page, 'Retained Release')
    await page.getByRole('button', { name: 'Previous month', exact: true }).click()
    await expect(page.getByText('No work matches these filters.')).toBeVisible()
    await page.screenshot({ path: '/tmp/btt-m45-fixes-filters-1280.png' })
    await clearReportClientFilter(page)
  } finally {
    await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})

test('Reports keeps selected labels on failure and reconciles renamed, archived, and unavailable metadata', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Reports label recovery owner',
    'reports-label-recovery',
  )
  const fixture = await createReportFixture(page, 'Recoverable')
  let fail = false
  let unavailable = false
  let holdSelection = false
  let releaseSelection: (() => void) | undefined
  let selectionSettled = false
  const sequence: string[] = []
  try {
    const id = await createReportTicket(fixture, { title: 'Recoverable work', status: 'Idea' })
    await createReportEntry(fixture, id, '2026-10-15')
    await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') })
    await page.route('**/api/reports?**', async (route) => {
      const shouldFail = fail
      const query = new URL(route.request().url()).searchParams
      if (
        holdSelection &&
        query.get('period') === 'month' &&
        query.get('clientId') === fixture.hierarchy.clientId
      ) {
        holdSelection = false
        sequence.push('month held')
        const response = await route.fetch()
        await new Promise<void>((resolve) => {
          releaseSelection = resolve
        })
        try {
          await route.fulfill({ response })
        } finally {
          selectionSettled = true
          sequence.push('month settled')
        }
        return
      }
      if (shouldFail) sequence.push(`failed ${query.get('period')}`)
      if (shouldFail)
        return route.fulfill({ status: 503, json: { statusMessage: 'private label failure' } })
      if (!unavailable) return route.continue()
      const response = await route.fetch()
      const report = await response.json()
      await route.fulfill({
        response,
        json: { ...report, selectedFilters: { client: null, project: null, release: null } },
      })
    })
    await page.goto('/reports')
    await waitForClientMount(page)
    await expect(page.getByLabel('Period totals')).toBeVisible()
    const monthLoaded = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/reports' &&
        url.searchParams.get('period') === 'month' &&
        response.ok()
      )
    })
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    expect((await (await monthLoaded).json()).range.startDate).toBe('2026-10-01')
    await expect(page.getByLabel('Period totals')).toContainText('30m')
    sequence.push('month loaded')
    holdSelection = true
    await page
      .getByRole('list', { name: /Time allocation by/ })
      .getByRole('button', { name: /Recoverable Client/ })
      .click()
    await expect.poll(() => Boolean(releaseSelection)).toBe(true)
    const filter = page.getByRole('button', { name: 'Filter client', exact: true })
    const clear = page.getByLabel('Clear client filter', { exact: true })
    const alert = page.getByRole('alert').filter({ hasText: 'Could not load the report' })
    async function expectRetainedClient() {
      await expect(filter).toContainText('Recoverable Client')
      await expect(filter).not.toContainText('Unavailable client')
      await expect(filter).not.toContainText(fixture.hierarchy.clientId)
      await expect(clear).toBeVisible()
    }
    await expectRetainedClient()
    await expect(page.getByText('Loading report period…', { exact: true })).toBeVisible()
    for (const name of ['Previous month', 'Next month'])
      await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
    fail = true
    const yearFailed = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === '/api/reports' &&
        url.searchParams.get('period') === 'year' &&
        url.searchParams.get('clientId') === fixture.hierarchy.clientId &&
        response.status() === 503
      )
    })
    const year = page.getByRole('button', { name: 'Year', exact: true })
    await expect(year).toBeEnabled()
    await year.click()
    await yearFailed
    expect(selectionSettled).toBe(false)
    await expect(alert).toBeVisible()
    await expect(page.getByText('Report period unavailable', { exact: true })).toBeVisible()
    await expect(year).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('Period totals')).toHaveCount(0)
    await expect(page.getByRole('list', { name: /Time allocation by/ })).toHaveCount(0)
    for (const name of ['Previous year', 'Next year'])
      await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
    await expectRetainedClient()
    await expect(page.getByText('private label failure')).toHaveCount(0)
    releaseSelection?.()
    await expect.poll(() => selectionSettled).toBe(true)
    expect(sequence.slice(0, 2)).toEqual(['month loaded', 'month held'])
    expect(sequence.slice(2, -1).length).toBeGreaterThan(0)
    expect(sequence.slice(2, -1).every((event) => event === 'failed year')).toBe(true)
    expect(sequence.at(-1)).toBe('month settled')
    console.log('Retained-label overlap:', sequence.join(' → '))
    await expect(alert).toBeVisible()
    await expect(year).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Report period unavailable', { exact: true })).toBeVisible()
    await expectRetainedClient()
    expect(
      (
        await page.request.patch(`/api/clients/${fixture.hierarchy.clientId}`, {
          data: { name: 'Renamed client' },
        })
      ).ok(),
    ).toBeTruthy()
    fail = false
    const recovered = page.waitForResponse(
      (response) => response.url().includes('/api/reports?') && response.ok(),
    )
    await page.getByRole('button', { name: 'Retry loading report', exact: true }).click()
    expect((await (await recovered).json()).range.startDate).toBe('2026-01-01')
    await expect(filter).toContainText('Renamed client')
    expect(
      (
        await page.request.patch(`/api/clients/${fixture.hierarchy.clientId}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()
    const archived = page.waitForResponse(
      (response) => response.url().includes('/api/reports?') && response.ok(),
    )
    await page.getByRole('button', { name: 'Previous year', exact: true }).click()
    expect((await (await archived).json()).range.startDate).toBe('2025-01-01')
    await expect(filter).toContainText('Renamed client (Archived)')
    unavailable = true
    const missing = page.waitForResponse(
      (response) => response.url().includes('/api/reports?') && response.ok(),
    )
    await page.getByRole('button', { name: 'Previous year', exact: true }).click()
    expect((await (await missing).json()).range.startDate).toBe('2024-01-01')
    await expect(filter).toContainText('Unavailable client')
    await expect(filter).not.toContainText(fixture.hierarchy.clientId)
    await page.getByLabel('Clear client filter', { exact: true }).click()
    await expect(filter).toContainText('All clients')
  } finally {
    releaseSelection?.()
    await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})

test('Settings refreshes a still-mounted Reports interval and retries a failed read without another write', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createTestOwner(
    context,
    'Reports settings owner',
    'reports-settings',
  )
  const fixture = await createReportFixture(page, 'Settings refresh')
  let fail = false
  let settingsWrites = 0
  try {
    const id = await createReportTicket(fixture, { title: 'Week boundary work', status: 'Idea' })
    await createReportEntry(fixture, id, '2026-10-11')
    await createReportEntry(fixture, id, '2026-10-12')
    await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') })
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/settings' && request.method() === 'PATCH')
        settingsWrites++
    })
    await page.route('**/api/reports?**', async (route) => {
      expect(new URL(route.request().url()).searchParams.get('timeZone')).toBe('Europe/Paris')
      if (fail)
        await route.fulfill({
          status: 503,
          json: { statusMessage: 'private report refresh error' },
        })
      else await route.continue()
    })
    await page.goto('/reports')
    await waitForClientMount(page)
    const timeOrigin = await page.evaluate(() => performance.timeOrigin)
    const row = page.getByRole('button', { name: /Settings refresh Client/ })
    await expect(row).toContainText('30m')
    const tab = await page.getByRole('tab', { name: 'Clients', exact: true }).elementHandle()
    const dialog = await chooseReportWeekStart(page, 'Sunday')
    fail = true
    await dialog.getByRole('button', { name: 'Save settings', exact: true }).click()
    await expect(
      dialog.getByRole('alert').filter({ hasText: 'Settings saved; refresh failed' }),
    ).toBeVisible()
    expect(settingsWrites).toBe(1)
    fail = false
    await dialog.getByRole('button', { name: 'Retry loading settings', exact: true }).click()
    await expect(dialog.getByRole('status').filter({ hasText: 'Settings saved.' })).toBeVisible()
    expect(settingsWrites).toBe(1)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(row).toContainText('1hr')
    expect(await tab?.evaluate((element) => element.isConnected)).toBe(true)
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
    await page.screenshot({ path: '/tmp/btt-m45-fixes-report-1280.png' })
  } finally {
    await cleanupReportFixture(fixture)
    await helpers.deleteUser(user.id)
  }
})
