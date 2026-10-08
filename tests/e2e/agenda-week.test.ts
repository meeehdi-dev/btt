import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { getWeekDates } from '../../shared/agenda-week'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry, userSettings } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

async function createHierarchy(page: import('@playwright/test').Page, name: string) {
  const clientRecord = await (
    await page.request.post('/api/clients', { data: { name: `${name} client` } })
  ).json()
  const projectRecord = await (
    await page.request.post('/api/projects', {
      data: { clientId: clientRecord.id, name: `${name} project`, color: '#abcdef' },
    })
  ).json()
  const releaseRecord = await (
    await page.request.post('/api/releases', {
      data: { projectId: projectRecord.id, name: `${name} release` },
    })
  ).json()
  return {
    clientId: clientRecord.id as string,
    projectId: projectRecord.id as string,
    releaseId: releaseRecord.id as string,
  }
}

async function createTicket(
  page: import('@playwright/test').Page,
  releaseId: string,
  title: string,
) {
  const response = await page.request.post('/api/tickets', { data: { releaseId, title } })
  expect(response.ok(), await response.text()).toBe(true)
  return (await response.json()).id as string
}

async function createEntry(
  page: import('@playwright/test').Page,
  ticketId: string,
  date: string,
  startMinute: number,
  durationMinutes: number,
  description: string,
) {
  const response = await page.request.post('/api/time-entries', {
    data: { ticketId, date, startMinute, durationMinutes, description },
  })
  expect(response.ok(), await response.text()).toBe(true)
  return (await response.json()).id as string
}

async function pageDateLabels(page: import('@playwright/test').Page, dates: string[]) {
  return page.evaluate((weekDates) => {
    const formatter = new Intl.DateTimeFormat(navigator.language, {
      weekday: 'long',
      month: 'numeric',
      day: 'numeric',
    })
    return weekDates.map((date) => formatter.format(new Date(`${date}T12:00:00`)))
  }, dates)
}

async function expectEndHourLabelInsideCard(page: import('@playwright/test').Page) {
  const label = page.getByText('20:00', { exact: true })
  const cardBody = page.locator('main [data-slot="body"]').last()
  const gutter = label.locator('..')
  const [labelBox, bodyBox, gutterBox] = await Promise.all([
    label.boundingBox(),
    cardBody.boundingBox(),
    gutter.boundingBox(),
  ])
  if (!labelBox || !bodyBox || !gutterBox) throw new Error('End-of-day label must be visible')
  expect(labelBox.x).toBeGreaterThanOrEqual(gutterBox.x)
  expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(gutterBox.x + gutterBox.width)
  expect(labelBox.y).toBeGreaterThanOrEqual(bodyBox.y)
  expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(bodyBox.y + bodyBox.height)
}

function dateKey(value: { year: number; month: number; day: number }) {
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}

function clockLabel(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function normalizeIntlWhitespace(value: string | null) {
  return value?.replace(/\s+/gu, ' ').trim() ?? ''
}

async function browserCurrentDateTimeLabel(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const now = new Date()
    const date = new Intl.DateTimeFormat(navigator.language, {
      month: 'numeric',
      day: 'numeric',
    }).format(now)
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return `${date}, ${time}`
  })
}

test('Agenda marks the current local date and time in its week-only view', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Current time owner',
    email: `agenda-now-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    await page.clock.install({ time: new Date(2024, 8, 18, 10, 29, 30) })
    const currentParts = await page.evaluate(() => {
      const now = new Date()
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minuteOfHour: now.getMinutes(),
      }
    })
    const current = {
      date: dateKey(currentParts),
      minute: currentParts.hour * 60 + currentParts.minuteOfHour,
      label: clockLabel(currentParts.hour, currentParts.minuteOfHour),
    }
    await page.setViewportSize({ width: 1280, height: 1900 })
    await page.goto(`/agenda?date=${current.date}`)
    await page.waitForLoadState('networkidle')
    const currentWeekButton = page.getByRole('button', { name: /^Go to current week/ })
    const weekRangeButton = page.locator('button[aria-label^="Agenda week:"]')
    let currentButtonLabel = await browserCurrentDateTimeLabel(page)
    const initialWeekRangeBox = await weekRangeButton.boundingBox()
    if (!initialWeekRangeBox) throw new Error('Selected week range must be visible')
    const toolbarControls = [
      page.getByRole('button', { name: 'Previous week' }),
      weekRangeButton,
      page.getByRole('button', { name: 'Next week' }),
      currentWeekButton,
    ]
    const toolbarBoxes = await Promise.all(toolbarControls.map((control) => control.boundingBox()))
    if (toolbarBoxes.some((box) => !box)) throw new Error('Agenda toolbar controls must be visible')
    const toolbarHeights = toolbarBoxes.map((box) => box!.height)
    expect(Math.max(...toolbarHeights) - Math.min(...toolbarHeights)).toBeLessThan(2)
    expect(Math.min(...toolbarHeights)).toBeGreaterThanOrEqual(32)

    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(currentWeekButton).toHaveAttribute('aria-current', 'true')
    await expect(page.getByText(/^Now /)).toHaveCount(0)
    await expectEndHourLabelInsideCard(page)
    let marker = page.locator('[data-current-time-marker]:visible')
    await expect(marker).toHaveCount(1)
    await expect(marker).toHaveAttribute('aria-label', `Current time ${current.label}`)
    expect(await marker.evaluate((element) => (element as HTMLElement).style.top)).toBe(
      `${(current.minute - 480) * 1.8}px`,
    )
    expect(await marker.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none')

    const agendaFilters = page.getByRole('group', { name: 'Agenda filters' })
    const initialFiltersBox = await agendaFilters.boundingBox()
    if (!initialFiltersBox) throw new Error('Agenda filters must be visible')

    await page.clock.fastForward(31_000)
    currentButtonLabel = await browserCurrentDateTimeLabel(page)
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(marker).toHaveAttribute('aria-label', 'Current time 10:30')

    await page.getByRole('button', { name: 'Previous week' }).click()
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(currentWeekButton).not.toHaveAttribute('aria-current')
    await expect(page.getByText(/^Now /)).toHaveCount(0)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(0)
    await page.clock.setSystemTime(new Date(2024, 8, 18, 10, 31))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    currentButtonLabel = await browserCurrentDateTimeLabel(page)
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(0)
    const [previousWeekFiltersBox, previousWeekRangeBox] = await Promise.all([
      agendaFilters.boundingBox(),
      weekRangeButton.boundingBox(),
    ])
    if (!previousWeekFiltersBox || !previousWeekRangeBox)
      throw new Error('Agenda filters and week range must remain visible')
    expect(Math.abs(previousWeekFiltersBox.x - initialFiltersBox.x)).toBeLessThan(1)
    expect(Math.abs(previousWeekRangeBox.width - initialWeekRangeBox.width)).toBeLessThan(1)

    await currentWeekButton.click()
    await expect(currentWeekButton).toHaveAttribute('aria-current', 'true')
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'Week timeline' })).toBeVisible()
    await expectEndHourLabelInsideCard(page)
    const currentDateHeading = page.locator('time[aria-current="date"]:visible')
    await expect(currentDateHeading).toHaveCount(1)
    await expect(currentDateHeading).toHaveAttribute('datetime', current.date)
    await expect(currentDateHeading.locator('..')).not.toContainText('Today')
    marker = page.locator('[data-current-time-marker]:visible')
    await expect(marker).toHaveCount(1)
    await expect(marker.locator('..')).toHaveAttribute('data-week-date', current.date)

    await page.getByRole('button', { name: 'Next week' }).click()
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(currentWeekButton).not.toHaveAttribute('aria-current')
    await expect(page.locator('time[aria-current="date"]')).toHaveCount(0)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(0)
    const [nextWeekFiltersBox, nextWeekRangeBox] = await Promise.all([
      agendaFilters.boundingBox(),
      weekRangeButton.boundingBox(),
    ])
    if (!nextWeekFiltersBox || !nextWeekRangeBox)
      throw new Error('Agenda filters and week range must remain visible')
    expect(Math.abs(nextWeekFiltersBox.x - initialFiltersBox.x)).toBeLessThan(1)
    expect(Math.abs(nextWeekRangeBox.width - initialWeekRangeBox.width)).toBeLessThan(1)
    await currentWeekButton.click()
    await expect(currentWeekButton).toHaveAttribute('aria-current', 'true')
    await expect(currentWeekButton).toContainText(currentButtonLabel)

    await page.clock.setSystemTime(new Date(2024, 8, 18, 20, 0))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    currentButtonLabel = await browserCurrentDateTimeLabel(page)
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(0)
    await page.clock.setSystemTime(new Date(2024, 8, 18, 7, 59))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    currentButtonLabel = await browserCurrentDateTimeLabel(page)
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(0)
    await page.clock.setSystemTime(new Date(2024, 8, 18, 8, 0))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    currentButtonLabel = await browserCurrentDateTimeLabel(page)
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(1)

    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(1)
    await expect(page.locator('time[aria-current="date"]:visible')).toHaveCount(1)

    await page.clock.setSystemTime(new Date(2024, 8, 19, 0, 1))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    const nextCurrentParts = await page.evaluate(() => {
      const now = new Date()
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
    })
    const nextCurrentDate = dateKey(nextCurrentParts)
    currentButtonLabel = await browserCurrentDateTimeLabel(page)
    await expect(currentWeekButton).toContainText(currentButtonLabel)
    await expect(page.locator('time[aria-current="date"]:visible')).toHaveAttribute(
      'datetime',
      nextCurrentDate,
    )
    await expect(page.locator('[data-current-time-marker]:visible')).toHaveCount(0)
  } finally {
    await helpers.deleteUser(owner.id)
  }
})

test('weekly agenda reads seven owner-scoped dates with per-day progress and localized controls', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Week agenda owner',
    email: `agenda-week-${crypto.randomUUID()}@example.com`,
  })
  const other = helpers.createUser({
    name: 'Week agenda other',
    email: `agenda-week-other-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  await helpers.saveUser(other)
  const hierarchy: { clientId: string; projectId: string; releaseId: string }[] = []
  const tickets: string[] = []
  const entries: string[] = []
  let localeContext: Awaited<ReturnType<typeof browser.newContext>> | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const defaults = await (await page.request.get('/api/settings')).json()
    expect(defaults.startOfWeekDay).toBe(1)
    const storedDefaults = await db
      .insert(userSettings)
      .values({ userId: owner.id })
      .returning({ startOfWeekDay: userSettings.startOfWeekDay })
    expect(storedDefaults[0]?.startOfWeekDay).toBe(1)
    await expect(
      db.insert(userSettings).values({ userId: other.id, startOfWeekDay: 7 }),
    ).rejects.toThrow()
    const settings = await page.request.patch('/api/settings', {
      data: {
        visibleStartMinute: 480,
        visibleEndMinute: 1200,
        workDayDurationMinutes: 60,
        startOfWeekDay: 0,
      },
    })
    expect(settings.ok()).toBe(true)
    expect(
      (
        await page.request.patch('/api/settings', {
          data: {
            visibleStartMinute: 480,
            visibleEndMinute: 1200,
            workDayDurationMinutes: 60,
            startOfWeekDay: 7,
          },
        })
      ).status(),
    ).toBe(400)

    const records = await createHierarchy(page, 'Weekly')
    hierarchy.push(records)
    const firstTicket = await createTicket(page, records.releaseId, 'Weekly first ticket')
    const secondTicket = await createTicket(page, records.releaseId, 'Weekly second ticket')
    tickets.push(firstTicket, secondTicket)
    const dates = getWeekDates('2024-09-18', 0)!
    entries.push(
      await createEntry(page, firstTicket, dates[0]!, 540, 60, 'Sunday work'),
      await createEntry(page, firstTicket, dates[1]!, 420, 30, 'Before hours'),
      await createEntry(page, secondTicket, dates[1]!, 600, 90, 'Monday work'),
      await createEntry(page, secondTicket, dates[6]!, 960, 30, 'Saturday work'),
      await createEntry(page, secondTicket, dates[6]!, 990, 30, 'Saturday adjacent work'),
    )

    const weekResponse = await page.request.get('/api/agenda/week', {
      params: { startDate: dates[0]! },
    })
    expect(weekResponse.ok()).toBe(true)
    const week = await weekResponse.json()
    expect(week.dates).toEqual(dates)
    expect(week.trackedMinutesByDate).toEqual({
      [dates[0]!]: 60,
      [dates[1]!]: 120,
      [dates[2]!]: 0,
      [dates[3]!]: 0,
      [dates[4]!]: 0,
      [dates[5]!]: 0,
      [dates[6]!]: 60,
    })
    expect(week).not.toHaveProperty('trackedMinutes')
    expect(
      week.entries.map((row: { entry: { date: string; startMinute: number } }) => [
        row.entry.date,
        row.entry.startMinute,
      ]),
    ).toEqual([
      [dates[0], 540],
      [dates[1], 420],
      [dates[1], 600],
      [dates[6], 960],
      [dates[6], 990],
    ])
    expect(
      (
        await page.request.get('/api/agenda/week', { params: { startDate: '2024-02-30' } })
      ).status(),
    ).toBe(400)
    expect(
      (
        await page.request.get('/api/agenda/week', { params: { startDate: '9999-12-31' } })
      ).status(),
    ).toBe(400)
    expect(
      (
        await page.request.patch(`/api/time-entries/${entries[0]}`, {
          data: { date: dates[6], startMinute: 1410, durationMinutes: 60 },
        })
      ).status(),
    ).toBe(400)

    const foreignContext = await browser.newContext()
    try {
      await foreignContext.addCookies(
        await helpers.getCookies({ userId: other.id, domain: '127.0.0.1' }),
      )
      const foreignPage = await foreignContext.newPage()
      expect((await (await foreignPage.request.get('/api/settings')).json()).startOfWeekDay).toBe(1)
      const foreignWeek = await (
        await foreignPage.request.get('/api/agenda/week', { params: { startDate: dates[0]! } })
      ).json()
      expect(foreignWeek.entries).toEqual([])
      expect(foreignWeek.trackedMinutesByDate).toEqual(
        Object.fromEntries(dates.map((date) => [date, 0])),
      )
    } finally {
      await foreignContext.close()
    }

    await page.setViewportSize({ width: 1280, height: 1900 })
    await page.goto('/agenda?date=2024-09-18')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('region', { name: 'Week timeline' })).toBeVisible()
    const timelineGrid = page.getByRole('region', { name: 'Week timeline' }).locator('..')
    const timeGutterWidth = await timelineGrid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ')[0],
    )
    expect(timeGutterWidth).toBe('38px')
    const selectedWeekButton = page.locator('button[aria-label^="Agenda week:"]')
    const selectedWeekButtonBox = await selectedWeekButton.boundingBox()
    if (!selectedWeekButtonBox) throw new Error('Selected week range must be visible at 1280px')
    expect(selectedWeekButtonBox.width).toBeGreaterThanOrEqual(224)
    const agendaFilters = page.getByRole('group', { name: 'Agenda filters' })
    const agendaFilterButtons = [
      ...(['client', 'project', 'release', 'ticket'] as const).map((kind) =>
        agendaFilters.getByRole('button', { name: `Filter ${kind}` }),
      ),
      agendaFilters.getByRole('button', { name: 'Clear filters' }),
    ]
    const [agendaFiltersBox, ...agendaFilterBoxes] = await Promise.all([
      agendaFilters.boundingBox(),
      ...agendaFilterButtons.map((button) => button.boundingBox()),
    ])
    if (!agendaFiltersBox || agendaFilterBoxes.some((box) => !box))
      throw new Error('Agenda filters must fit in the toolbar at 1280px')
    expect(agendaFiltersBox.height).toBe(32)
    const toolbarNavigation = page.getByRole('group', { name: 'Choose agenda week' })
    const toolbarSeparator = page.getByTestId('agenda-toolbar-separator')
    const [navigationBox, separatorBox] = await Promise.all([
      toolbarNavigation.boundingBox(),
      toolbarSeparator.boundingBox(),
    ])
    if (!navigationBox || !separatorBox)
      throw new Error('Agenda date controls and separator must be visible at 1280px')
    expect(separatorBox.height).toBe(24)
    expect(separatorBox.width).toBeLessThanOrEqual(2)
    expect(navigationBox.x + navigationBox.width).toBeLessThanOrEqual(separatorBox.x)
    expect(separatorBox.x + separatorBox.width).toBeLessThanOrEqual(agendaFiltersBox.x)
    const toolbarRowBox = await agendaFilters.locator('..').boundingBox()
    const agendaCardBox = await page.locator('main > div > div.mt-2').boundingBox()
    if (!toolbarRowBox || !agendaCardBox)
      throw new Error('Agenda toolbar and timeline must be visible')
    expect(agendaCardBox.y - (toolbarRowBox.y + toolbarRowBox.height)).toBe(16)
    expect(await agendaFilters.evaluate((element) => getComputedStyle(element).boxShadow)).toBe(
      'none',
    )
    const agendaFilterHeights = agendaFilterBoxes.map((box) => box!.height)
    expect(Math.min(...agendaFilterHeights)).toBeGreaterThanOrEqual(30)
    expect(Math.max(...agendaFilterHeights)).toBeLessThanOrEqual(34)
    const agendaFilterTops = agendaFilterBoxes.map((box) => box!.y)
    expect(Math.max(...agendaFilterTops) - Math.min(...agendaFilterTops)).toBeLessThan(2)
    const labels = await pageDateLabels(page, dates)
    for (const label of labels)
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible()
    const desktopHeader = page.getByRole('heading', { name: labels[0]!, exact: true }).first()
    await expect(desktopHeader).not.toHaveClass(/min-h-10/)
    await expect(page.getByRole('button', { name: /Add time entry on/ })).toHaveCount(0)
    const desktopHeaderRow = desktopHeader.locator('..')
    const desktopProgress = page.getByRole('progressbar', {
      name: `${labels[0]} workday progress`,
    })
    const [desktopHeadingBox, desktopHeaderRowBox, desktopProgressBox] = await Promise.all([
      desktopHeader.boundingBox(),
      desktopHeaderRow.boundingBox(),
      desktopProgress.boundingBox(),
    ])
    if (!desktopHeadingBox || !desktopHeaderRowBox || !desktopProgressBox)
      throw new Error('Weekly day header rows must be visible')
    expect(
      Math.abs(
        desktopHeadingBox.y +
          desktopHeadingBox.height / 2 -
          (desktopProgressBox.y + desktopProgressBox.height / 2),
      ),
    ).toBeLessThan(3)
    expect(desktopProgressBox.x).toBeGreaterThan(desktopHeadingBox.x)
    expect(desktopProgressBox.height).toBe(4)
    expect(desktopProgressBox.width).toBeGreaterThan(32)
    expect(
      await desktopHeader
        .locator('../..')
        .evaluate((element) => getComputedStyle(element).paddingTop),
    ).toBe('8px')
    expect(desktopProgressBox.x + desktopProgressBox.width).toBeCloseTo(
      desktopHeaderRowBox.x + desktopHeaderRowBox.width,
      0,
    )
    expect(await desktopHeader.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe(
      'nowrap',
    )
    await expect(desktopProgress).toHaveAttribute('aria-valuetext', 'Worked 1hr of 1hr target')
    await page.getByRole('button', { name: 'Clear filters' }).focus()
    await page.keyboard.press('Tab')
    await expect(desktopProgress).toBeFocused()
    const progressTooltip = page.locator('[data-slot="content"][data-state="instant-open"]').last()
    await expect(progressTooltip).toContainText('Worked 1hr of 1hr target')
    await expect(progressTooltip).toBeVisible()
    const weekRange = page.locator('button[aria-label^="Agenda week:"]')
    const initialRange = normalizeIntlWhitespace(await weekRange.getAttribute('aria-label'))
    expect(initialRange).not.toBe('')
    await page.getByRole('button', { name: 'Next week' }).click()
    await expect
      .poll(async () => normalizeIntlWhitespace(await weekRange.getAttribute('aria-label')))
      .not.toBe(initialRange)
    await page.getByRole('button', { name: 'Previous week' }).click()
    await expect
      .poll(async () => normalizeIntlWhitespace(await weekRange.getAttribute('aria-label')))
      .toBe(initialRange)
    await expect(page.getByRole('button', { name: 'Day', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Week', exact: true })).toHaveCount(0)
    await expect(page.getByRole('progressbar')).toHaveCount(7)
    await expect(
      page.getByRole('progressbar', { name: `${labels[0]} workday progress` }),
    ).toHaveAttribute('aria-valuenow', '60')
    await expect(
      page.getByRole('progressbar', { name: `${labels[1]} workday progress` }),
    ).toHaveAttribute('aria-valuetext', 'Worked 2hr of 1hr target; 1hr overtime')
    await expect(
      page.getByRole('progressbar', { name: `${labels[6]} workday progress` }),
    ).toHaveAttribute('aria-valuenow', '60')

    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByRole('option', { name: 'Weekly first ticket' }).click()
    await expect(
      page.locator(`[data-agenda-ticket-id="${secondTicket}"]`).filter({ visible: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('progressbar', { name: `${labels[1]} workday progress` }),
    ).toHaveAttribute('aria-valuenow', '60')
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await page.keyboard.press('Escape')

    const formattedRange = await page.evaluate(
      (range) => {
        const formatter = new Intl.DateTimeFormat(navigator.language, {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        })
        return formatter.formatRange(
          new Date(`${range[0]}T12:00:00`),
          new Date(`${range[1]}T12:00:00`),
        )
      },
      [dates[0]!, dates[6]!],
    )
    expect(await weekRange.innerText()).toBe(formattedRange)
    await expect(page.getByRole('region', { name: labels[0] })).toBeVisible()
    const timeline = page.getByRole('region', { name: 'Week timeline' })
    expect(await timeline.evaluate((element) => getComputedStyle(element).borderBottomWidth)).toBe(
      '0px',
    )
    const tuesdayColumn = timeline.locator(`[data-week-date="${dates[2]}"]`)
    const [timelineBox, tuesdayBox] = await Promise.all([
      timeline.boundingBox(),
      tuesdayColumn.boundingBox(),
    ])
    if (!timelineBox || !tuesdayBox) throw new Error('Tuesday timeline column must be visible')
    const createStart = {
      x: tuesdayBox.x + tuesdayBox.width / 2,
      y: timelineBox.y + (540 - 480) * 1.8 + 5,
    }
    const createEnd = { ...createStart, y: createStart.y + 10 }
    await page.mouse.move(createStart.x, createStart.y)
    await page.mouse.down()
    await page.mouse.move(createEnd.x, createEnd.y, { steps: 5 })
    await page.mouse.up()
    const addDialog = page.getByRole('dialog', { name: 'Add completed work' })
    await expect(addDialog).toBeVisible()
    await expect(addDialog).toContainText(labels[2]!)
    await addDialog.getByRole('button', { name: 'Ticket' }).click()
    await page.getByRole('option', { name: 'Weekly first ticket' }).click()
    await expect(page.getByRole('listbox')).toBeHidden()
    await addDialog.getByRole('textbox', { name: 'Work description' }).fill('Weekly quick add')
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog).toHaveCount(0)
    const tuesday = page.locator(`[data-week-date="${dates[2]}"]`)
    const quickAdd = tuesday.locator('[data-agenda-entry]').filter({ hasText: 'Weekly quick add' })
    await expect(quickAdd).toContainText('Weekly first ticket')
    await expect(
      page.getByRole('progressbar', { name: `${labels[2]} workday progress` }),
    ).toHaveAttribute('aria-valuenow', '30')
    await quickAdd.dblclick()
    const correction = page.getByRole('dialog', { name: 'Correct time entry' })
    await expect(correction).toBeVisible()
    await correction.getByRole('button', { name: `Work date: ${dates[2]}` }).click()
    const calendar = page.getByRole('dialog', { name: /Work date:/ })
    await expect(calendar.getByRole('gridcell')).toHaveCount(42)
    await calendar.getByRole('gridcell').nth(17).getByRole('button').click()
    await expect(calendar).toHaveCount(0)
    await expect(correction.getByRole('button', { name: `Work date: ${dates[3]}` })).toBeVisible()
    await correction.getByRole('button', { name: 'Save correction' }).click()
    await expect(correction).toHaveCount(0)
    await expect(page.locator(`[data-week-date="${dates[2]}"]`)).not.toContainText(
      'Weekly quick add',
    )
    await expect(page.locator(`[data-week-date="${dates[3]}"]`)).toContainText('Weekly quick add')
    await expect(
      page.getByRole('progressbar', { name: `${labels[2]} workday progress` }),
    ).toHaveAttribute('aria-valuenow', '0')
    await expect(
      page.getByRole('progressbar', { name: `${labels[3]} workday progress` }),
    ).toHaveAttribute('aria-valuenow', '30')
    const correctedWeek = await (
      await page.request.get('/api/agenda/week', { params: { startDate: dates[0]! } })
    ).json()
    expect(
      correctedWeek.entries.find(
        (row: { entry: { description: string } }) => row.entry.description === 'Weekly quick add',
      ).entry.date,
    ).toBe(dates[3])

    await page.setViewportSize({ width: 1280, height: 1900 })
    const shortBlock = page.locator(
      `[data-week-date="${dates[6]}"] [data-agenda-entry="${entries[3]}"]`,
    )
    const shortCard = shortBlock.getByRole('article')
    await expect(shortCard).toHaveClass(/border-accented\/50/)
    const shortHierarchy = shortCard.getByLabel('Entry hierarchy and ticket links')
    await expect(shortBlock).toBeVisible()
    expect(await shortHierarchy.evaluate((element) => getComputedStyle(element).flexWrap)).toBe(
      'nowrap',
    )
    const adjacentBlock = page.locator(
      `[data-week-date="${dates[6]}"] [data-agenda-entry="${entries[4]}"]`,
    )
    const [shortBlockBox, shortCardBox, shortHierarchyBox, shortHierarchyMetrics, adjacentBox] =
      await Promise.all([
        shortBlock.boundingBox(),
        shortCard.boundingBox(),
        shortHierarchy.boundingBox(),
        shortHierarchy.evaluate((element) => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        })),
        adjacentBlock.boundingBox(),
      ])
    if (!shortBlockBox || !shortCardBox || !shortHierarchyBox || !adjacentBox)
      throw new Error('Adjacent 30-minute weekly entries must be visible')
    expect(shortHierarchyMetrics.scrollWidth).toBeGreaterThan(shortHierarchyMetrics.clientWidth)
    expect(shortHierarchyMetrics.scrollHeight).toBeLessThanOrEqual(
      shortHierarchyMetrics.clientHeight,
    )
    expect(shortHierarchyBox.y + shortHierarchyBox.height).toBeLessThanOrEqual(
      shortCardBox.y + shortCardBox.height + 3,
    )
    expect(shortCardBox.height).toBeLessThanOrEqual(shortBlockBox.height + 1)
    const shortStatus = shortCard.getByRole('button', {
      name: 'Change status for Weekly second ticket from Idea',
    })
    await expect(shortStatus).toBeVisible()
    await expect(shortStatus.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
    await expect(shortHierarchy.getByRole('button', { name: /Change status/ })).toHaveCount(0)
    const [shortStatusBox, shortTitleBox] = await Promise.all([
      shortStatus.boundingBox(),
      shortCard.getByRole('link', { name: 'Weekly second ticket' }).boundingBox(),
    ])
    if (!shortStatusBox || !shortTitleBox)
      throw new Error('30-minute entry status action and ticket title must be visible')
    expect(shortStatusBox.x + shortStatusBox.width).toBeLessThanOrEqual(shortTitleBox.x + 1)
    expect(shortStatusBox.y + shortStatusBox.height).toBeLessThanOrEqual(
      shortCardBox.y + shortCardBox.height + 3,
    )
    const shortBadgeNames = await shortHierarchy
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
    expect(shortBadgeNames).toEqual([
      'client: Weekly client; actions',
      'project: Weekly project; actions',
      'release: Weekly release; actions',
    ])
    expect(shortBlockBox.height).toBeCloseTo(54, 0)
    expect(adjacentBox.height).toBeCloseTo(54, 0)
    expect(Math.abs(shortBlockBox.y + shortBlockBox.height - adjacentBox.y)).toBeLessThanOrEqual(1)
    const finalShortBadge = shortHierarchy.getByRole('button', { name: /release: Weekly release/ })
    await finalShortBadge.focus()
    expect(await shortHierarchy.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    await shortStatus.focus()
    await expect(shortStatus).toBeFocused()
    const middleBlock = page.locator(
      `[data-week-date="${dates[0]}"] [data-agenda-entry="${entries[0]}"]`,
    )
    const middleHierarchy = middleBlock
      .getByRole('article')
      .getByLabel('Entry hierarchy and ticket links')
    expect(await middleHierarchy.evaluate((element) => getComputedStyle(element).flexWrap)).toBe(
      'nowrap',
    )
    expect(
      await middleHierarchy.evaluate((element) => element.scrollWidth > element.clientWidth),
    ).toBe(true)

    const tallBlock = page.locator(
      `[data-week-date="${dates[1]}"] [data-agenda-entry="${entries[2]}"]`,
    )
    const tallCard = tallBlock.getByRole('article')
    const tallHierarchy = tallCard.getByLabel('Entry hierarchy and ticket links')
    expect(await tallHierarchy.evaluate((element) => getComputedStyle(element).flexWrap)).toBe(
      'wrap',
    )
    const [tallCardBox, tallHierarchyBox, tallHierarchyFits] = await Promise.all([
      tallCard.boundingBox(),
      tallHierarchy.boundingBox(),
      tallHierarchy.evaluate((element) => element.scrollHeight <= element.clientHeight),
    ])
    if (!tallCardBox || !tallHierarchyBox)
      throw new Error('90-minute weekly entry context must be visible')
    expect(tallHierarchyFits).toBe(true)
    expect(tallHierarchyBox.y + tallHierarchyBox.height).toBeLessThanOrEqual(
      tallCardBox.y + tallCardBox.height + 1,
    )
    const tallBadgeNames = await tallHierarchy
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
    expect(tallBadgeNames).toEqual([
      'client: Weekly client; actions',
      'project: Weekly project; actions',
      'release: Weekly release; actions',
    ])
    await expect(
      tallCard.getByRole('button', { name: /Change status for Weekly second ticket/ }),
    ).toBeVisible()

    expect(
      (
        await page.request.patch(`/api/clients/${hierarchy[0]!.clientId}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBe(true)
    const archivedWeek = await (
      await page.request.get('/api/agenda/week', { params: { startDate: dates[0]! } })
    ).json()
    expect(
      archivedWeek.entries.find((row: { entry: { id: string } }) => row.entry.id === entries[0])
        .clientArchivedAt,
    ).toBeTruthy()

    localeContext = await browser.newContext({
      locale: 'de-DE',
      viewport: { width: 1280, height: 1900 },
    })
    await localeContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const localizedPage = await localeContext.newPage()
    await localizedPage.goto('/agenda?date=2024-09-18')
    await localizedPage.waitForLoadState('networkidle')
    await expect(localizedPage.getByRole('region', { name: 'Week timeline' })).toBeVisible()
    const localizedCurrentWeekButton = localizedPage.getByRole('button', {
      name: /^Go to current week/,
    })
    await expect(localizedCurrentWeekButton).toContainText(
      await browserCurrentDateTimeLabel(localizedPage),
    )
    const germanLabel = await localizedPage.evaluate((date) => {
      const formatter = new Intl.DateTimeFormat(navigator.language, {
        weekday: 'long',
        month: 'numeric',
        day: 'numeric',
      })
      return formatter.format(new Date(`${date}T12:00:00`))
    }, dates[0]!)
    const germanHeading = localizedPage.getByRole('heading', { name: germanLabel, exact: true })
    await expect(germanHeading).toBeVisible()
    const germanProgress = localizedPage.getByRole('progressbar', {
      name: `${germanLabel} workday progress`,
    })
    const [germanHeadingBox, germanProgressBox, germanHeaderRowBox, germanHeaderOverflow] =
      await Promise.all([
        germanHeading.boundingBox(),
        germanProgress.boundingBox(),
        germanHeading.locator('..').boundingBox(),
        germanHeading
          .locator('..')
          .evaluate((element) => element.scrollWidth > element.clientWidth),
      ])
    if (!germanHeadingBox || !germanProgressBox || !germanHeaderRowBox)
      throw new Error('German weekly header must be visible at 1280px')
    expect(germanHeaderOverflow).toBe(false)
    expect(germanProgressBox.height).toBe(4)
    expect(germanProgressBox.width).toBeGreaterThan(32)
    expect(
      Math.abs(
        germanHeadingBox.y +
          germanHeadingBox.height / 2 -
          (germanProgressBox.y + germanProgressBox.height / 2),
      ),
    ).toBeLessThan(3)
    await localizedPage.goto('/settings')
    await waitForClientMount(localizedPage)
    await localizedPage.getByRole('combobox', { name: 'Week starts on' }).click()
    await expect(localizedPage.getByRole('option', { name: 'Sonntag', exact: true })).toBeVisible()
  } finally {
    await localeContext?.close()
    for (const ticketId of tickets) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ticketId))
      await db.delete(ticket).where(eq(ticket.id, ticketId))
    }
    for (const record of hierarchy) {
      await db.delete(release).where(eq(release.id, record.releaseId))
      await db.delete(project).where(eq(project.id, record.projectId))
      await db.delete(client).where(eq(client.id, record.clientId))
    }
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
    await helpers.deleteUser(other.id)
  }
})

test('week gestures create, resize, move across dates, and preview move conflicts at the attempted position', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Week gesture owner',
    email: `agenda-week-gesture-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let records: { clientId: string; projectId: string; releaseId: string } | undefined
  const tickets: string[] = []
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    await page.request.patch('/api/settings', {
      data: {
        visibleStartMinute: 480,
        visibleEndMinute: 1200,
        workDayDurationMinutes: 480,
        startOfWeekDay: 1,
      },
    })
    records = await createHierarchy(page, 'Gesture week')
    const movingTicket = await createTicket(page, records.releaseId, 'Week movable work')
    const blockerTicket = await createTicket(page, records.releaseId, 'Week blocking work')
    tickets.push(movingTicket, blockerTicket)
    const weekDates = getWeekDates('2024-09-18', 1)!
    const movingId = await createEntry(
      page,
      movingTicket,
      weekDates[0]!,
      600,
      60,
      'Move across week',
    )
    await createEntry(page, blockerTicket, weekDates[1]!, 600, 60, 'Conflict blocker')

    await page.setViewportSize({ width: 1600, height: 2500 })
    await page.goto('/agenda?date=2024-09-18')
    await page.waitForLoadState('networkidle')
    const timeline = page.getByRole('region', { name: 'Week timeline' })
    await expect(timeline).toBeVisible()

    async function point(date: string, minute: number, offset = 5) {
      const timelineBox = await timeline.boundingBox()
      const cellBox = await timeline.locator(`[data-week-date="${date}"]`).boundingBox()
      if (!timelineBox || !cellBox) throw new Error('Week timeline column is not visible')
      return {
        x: cellBox.x + Math.min(30, cellBox.width / 2),
        y: timelineBox.y + (minute - 480) * 1.8 + offset,
      }
    }
    async function dragEntry(id: string, date: string, minute: number) {
      const entry = timeline.locator(`[data-agenda-entry="${id}"]`)
      await entry.scrollIntoViewIfNeeded()
      const box = await entry.boundingBox()
      if (!box) throw new Error('Time entry is not visible')
      const source = { x: box.x + 2, y: box.y + 20 }
      const destination = await point(date, minute, 20)
      await page.mouse.move(source.x, source.y)
      await page.mouse.down()
      await page.mouse.move(destination.x, destination.y, { steps: 8 })
      return { entry, destination }
    }

    await dragEntry(movingId, weekDates[1]!, 600)
    const conflict = timeline.getByRole('status')
    await expect(conflict).toHaveText('Conflict')
    await expect(conflict).toHaveClass(/border-error/)
    const conflictBox = await conflict.boundingBox()
    const blockerColumn = await timeline.locator(`[data-week-date="${weekDates[1]}"]`).boundingBox()
    const timelineBox = await timeline.boundingBox()
    if (!conflictBox || !blockerColumn || !timelineBox)
      throw new Error('Conflict preview is missing')
    expect(conflictBox.x).toBeGreaterThanOrEqual(blockerColumn.x)
    expect(conflictBox.x + conflictBox.width).toBeLessThanOrEqual(
      blockerColumn.x + blockerColumn.width,
    )
    expect(Math.abs(conflictBox.y - (timelineBox.y + 120 * 1.8))).toBeLessThan(3)
    await page.mouse.up()
    await expect(page.getByRole('alert')).toContainText('conflicts with another entry')
    const weekApi = async () =>
      page.request.get('/api/agenda/week', { params: { startDate: weekDates[0]! } })
    let currentWeek = await (await weekApi()).json()
    expect(
      currentWeek.entries.find((row: { entry: { id: string } }) => row.entry.id === movingId).entry,
    ).toMatchObject({ date: weekDates[0], startMinute: 600 })

    await dragEntry(movingId, weekDates[3]!, 1170)
    const boundsConflict = timeline.getByRole('status')
    await expect(boundsConflict).toHaveText('Conflict')
    await expect(boundsConflict).toHaveClass(/border-error/)
    const [boundsBox, lastColumn, currentTimelineBox] = await Promise.all([
      boundsConflict.boundingBox(),
      timeline.locator(`[data-week-date="${weekDates[3]}"]`).boundingBox(),
      timeline.boundingBox(),
    ])
    if (!boundsBox || !lastColumn || !currentTimelineBox)
      throw new Error('Bounds conflict preview is missing')
    expect(boundsBox.x).toBeGreaterThanOrEqual(lastColumn.x)
    expect(boundsBox.x + boundsBox.width).toBeLessThanOrEqual(lastColumn.x + lastColumn.width)
    expect(Math.abs(boundsBox.y - (currentTimelineBox.y + 690 * 1.8))).toBeLessThan(3)
    await page.mouse.up()
    await expect(page.getByRole('alert')).toContainText('conflicts with another entry')
    currentWeek = await (await weekApi()).json()
    expect(
      currentWeek.entries.find((row: { entry: { id: string } }) => row.entry.id === movingId).entry,
    ).toMatchObject({ date: weekDates[0], startMinute: 600 })

    await dragEntry(movingId, weekDates[2]!, 720)
    await expect(timeline.getByRole('status')).toHaveText('12:00–13:00')
    await page.mouse.up()
    await expect
      .poll(async () => {
        const response = await weekApi()
        const result = await response.json()
        return result.entries.find((row: { entry: { id: string } }) => row.entry.id === movingId)
          ?.entry
      })
      .toMatchObject({ date: weekDates[2], startMinute: 720, durationMinutes: 60 })
    currentWeek = await (await weekApi()).json()
    expect(currentWeek.trackedMinutesByDate[weekDates[0]!]).toBe(0)
    expect(currentWeek.trackedMinutesByDate[weekDates[2]!]).toBe(60)

    const movedEntry = timeline.locator(`[data-agenda-entry="${movingId}"]`)
    await expect(movedEntry).toBeAttached()
    const edge = movedEntry.locator('[data-drag-edge="bottom"]')
    await edge.scrollIntoViewIfNeeded()
    const edgeBox = await edge.boundingBox()
    const afterResize = await point(weekDates[2]!, 840, 0)
    if (!edgeBox) throw new Error('Resize handle is missing')
    await page.mouse.move(edgeBox.x + edgeBox.width / 2, edgeBox.y + edgeBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(afterResize.x, afterResize.y, { steps: 6 })
    await expect(timeline.getByRole('status')).toHaveText('12:00–14:00')
    await page.mouse.up()
    await expect
      .poll(async () => {
        const result = await (await weekApi()).json()
        return result.entries.find((row: { entry: { id: string } }) => row.entry.id === movingId)
          ?.entry.durationMinutes
      })
      .toBe(120)

    const createStart = await point(weekDates[3]!, 900)
    const createEnd = await point(weekDates[3]!, 930)
    await page.mouse.move(createStart.x, createStart.y)
    await page.mouse.down()
    await page.mouse.move(createEnd.x, createEnd.y, { steps: 5 })
    await expect(timeline.getByRole('status')).toHaveText('15:00–16:00')
    await page.mouse.up()
    const addDialog = page.getByRole('dialog', { name: 'Add completed work' })
    await expect(addDialog).toBeVisible()
    await expect(addDialog).toContainText('Thursday')
    await addDialog.getByRole('button', { name: 'Ticket' }).click()
    await page.getByRole('option', { name: 'Week movable work' }).click()
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog).toHaveCount(0)
    await expect
      .poll(async () => {
        const result = await (await weekApi()).json()
        return result.entries.some(
          (row: { entry: { date: string; startMinute: number; durationMinutes: number } }) =>
            row.entry.date === weekDates[3] &&
            row.entry.startMinute === 900 &&
            row.entry.durationMinutes === 60,
        )
      })
      .toBe(true)
  } finally {
    for (const ticketId of tickets) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ticketId))
      await db.delete(ticket).where(eq(ticket.id, ticketId))
    }
    if (records) {
      await db.delete(release).where(eq(release.id, records.releaseId))
      await db.delete(project).where(eq(project.id, records.projectId))
      await db.delete(client).where(eq(client.id, records.clientId))
    }
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
  }
})

test('Agenda stays Week-only, ignores the legacy preference, and retires /today', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Agenda route owner',
    email: `agenda-route-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  const storageKey = 'nxmr:agenda-view'
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    await page.addInitScript((key) => {
      if (location.origin !== 'null') localStorage.setItem(key, 'day')
    }, storageKey)
    await page.goto('/agenda?date=2024-09-18')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle('Agenda')
    await expect(page.getByRole('region', { name: 'Week timeline' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Day', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Week', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Go to current week/ })).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe('day')

    const oldRoute = await page.goto('/today')
    expect(oldRoute?.status()).toBe(404)
    expect(page.url()).toMatch(/\/today$/)
  } finally {
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
  }
})
