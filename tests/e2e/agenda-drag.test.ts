import { expect, test as base, type Locator, type Page } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { getWeekDates } from '../../shared/agenda-week'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

type AgendaFixture = {
  clientId: string
  ticketId: string
  hiddenTicketId: string
  date: string
  add: (
    ticketId: string,
    date: string,
    startMinute: number,
    durationMinutes: number,
    description: string,
  ) => Promise<string>
}

const test = base.extend<{ agenda: AgendaFixture }>({
  agenda: async ({ page, context }, use) => {
    const helpers = (await testAuth.$context).test
    const owner = helpers.createUser({
      name: 'Gesture owner',
      email: `gesture-${crypto.randomUUID()}@example.com`,
    })
    const ticketIds: string[] = []
    let clientId: string | undefined
    let projectId: string | undefined
    let releaseId: string | undefined

    try {
      await helpers.saveUser(owner)
      await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
      const create = async (path: string, data: unknown) => {
        const response = await page.request.post(path, { data })
        if (!response.ok())
          throw new Error(`Could not seed ${path}: ${response.status()} ${await response.text()}`)
        return response.json()
      }
      const c = await create('/api/clients', { name: 'Gesture client' })
      clientId = c.id
      const p = await create('/api/projects', {
        clientId: c.id,
        name: 'Gesture project',
        color: '#abcdef',
      })
      projectId = p.id
      const r = await create('/api/releases', {
        projectId: p.id,
        name: 'Gesture release',
      })
      releaseId = r.id
      const visibleTicket = await create('/api/tickets', {
        releaseId: r.id,
        title: 'Visible work',
      })
      ticketIds.push(visibleTicket.id)
      const hiddenTicket = await create('/api/tickets', {
        releaseId: r.id,
        title: 'Hidden work',
      })
      ticketIds.push(hiddenTicket.id)

      await page.request.patch('/api/settings', {
        data: {
          visibleStartMinute: 480,
          visibleEndMinute: 1200,
          workDayDurationMinutes: 480,
          startOfWeekDay: 1,
        },
      })
      await page.setViewportSize({ width: 1600, height: 2500 })
      const date = await page.evaluate(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })
      const add = async (
        ticketId: string,
        entryDate: string,
        startMinute: number,
        durationMinutes: number,
        description: string,
      ) => {
        const response = await page.request.post('/api/time-entries', {
          data: {
            ticketId,
            date: entryDate,
            startMinute,
            durationMinutes,
            description,
          },
        })
        if (!response.ok())
          throw new Error(
            `Could not seed time entry: ${response.status()} ${await response.text()}`,
          )
        return (await response.json()).id as string
      }

      await use({
        clientId: c.id,
        ticketId: visibleTicket.id,
        hiddenTicketId: hiddenTicket.id,
        date,
        add,
      })
    } finally {
      for (const id of ticketIds) {
        await db.delete(timeEntry).where(eq(timeEntry.ticketId, id))
        await db.delete(ticket).where(eq(ticket.id, id))
      }
      if (releaseId) await db.delete(release).where(eq(release.id, releaseId))
      if (projectId) await db.delete(project).where(eq(project.id, projectId))
      if (clientId) await db.delete(client).where(eq(client.id, clientId))
      await helpers.deleteUser(owner.id)
    }
  },
})

async function openWeekAgenda(page: Page, date: string) {
  const response = await page.goto(`/agenda?date=${date}`)
  if (!response) throw new Error('Agenda navigation must return a document response')
  expect(response.ok()).toBe(true)
  const html = await response.text()
  expect(html).toContain('aria-label="Week timeline"')
  await expect(page.getByText('Loading agenda…', { exact: true })).toHaveCount(0)
  await waitForClientMount(page)
  return page.getByRole('region', { name: 'Week timeline' })
}

async function point(page: Page, timeline: Locator, date: string, minute: number, offset = 10) {
  const [timelineBox, cellBox] = await Promise.all([
    timeline.boundingBox(),
    timeline.locator(`[data-week-date="${date}"]`).boundingBox(),
  ])
  if (!timelineBox || !cellBox) throw new Error('Week timeline column is not visible')
  return {
    x: cellBox.x + Math.min(30, cellBox.width / 2),
    y: timelineBox.y + (minute - 480) * 1.8 + offset,
  }
}

test('Agenda SSR-renders an explicitly dated week without a browser refetch', async ({
  page,
  agenda,
}) => {
  const { add, date, ticketId } = agenda
  const entryId = await add(ticketId, date, 540, 60, 'Server-rendered work')
  const browserWeekReads: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (request.method() === 'GET' && url.pathname === '/api/agenda/week')
      browserWeekReads.push(url.searchParams.get('startDate') ?? '')
  })

  const response = await page.goto(`/agenda?date=${date}`)
  if (!response) throw new Error('Agenda navigation must return a document response')
  expect(response.ok()).toBe(true)
  const html = await response.text()
  expect(html).toContain('aria-label="Week timeline"')
  expect(html).toContain('Server-rendered work')
  await expect(page.locator(`[data-agenda-entry="${entryId}"]`)).toBeVisible()
  expect(browserWeekReads).toEqual([])
})

test('Agenda loading and loaded cards keep the same spacing and padding', async ({
  page,
  agenda,
}) => {
  const { add, date, ticketId } = agenda
  await add(ticketId, date, 540, 60, 'Default week work')
  let releaseWeekRequest!: () => void
  let signalWeekRequest!: () => void
  const weekRequestGate = new Promise<void>((resolve) => {
    releaseWeekRequest = resolve
  })
  const weekRequestStarted = new Promise<void>((resolve) => {
    signalWeekRequest = resolve
  })
  await page.route('**/api/agenda/week**', async (route) => {
    signalWeekRequest()
    await weekRequestGate
    await route.continue()
  })

  try {
    const response = await page.goto('/agenda')
    if (!response) throw new Error('Agenda navigation must return a document response')
    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain('Loading agenda…')
    await expect(page.getByText('Loading agenda…', { exact: true })).toBeVisible()
    await weekRequestStarted

    const geometry = async () => {
      const shell = page.getByTestId('agenda-week-shell')
      const toolbar = page.getByRole('group', { name: 'Choose agenda week' }).locator('..')
      const [shellBox, toolbarBox, styles] = await Promise.all([
        shell.boundingBox(),
        toolbar.boundingBox(),
        shell.evaluate((element) => {
          const body = element.querySelector<HTMLElement>('[data-slot="body"]')
          return {
            marginTop: getComputedStyle(element).marginTop,
            padding: body ? getComputedStyle(body).padding : null,
          }
        }),
      ])
      if (!shellBox || !toolbarBox) throw new Error('Agenda shell and toolbar must be measurable')
      return {
        x: shellBox.x,
        width: shellBox.width,
        toolbarGap: shellBox.y - (toolbarBox.y + toolbarBox.height),
        ...styles,
      }
    }
    const loadingGeometry = await geometry()
    expect(loadingGeometry.padding).toBe('8px')
    expect(loadingGeometry.toolbarGap).toBe(16)

    releaseWeekRequest()
    await expect(page.getByRole('region', { name: 'Week timeline' })).toBeVisible()
    const loadedGeometry = await geometry()
    expect(loadedGeometry).toEqual(loadingGeometry)
  } finally {
    releaseWeekRequest()
    await page.unroute('**/api/agenda/week**')
  }
})

test('Agenda cards show drag affordance without overriding link, badge, or resize cursors', async ({
  page,
  agenda,
}) => {
  const { add, date, ticketId } = agenda
  const entryId = await add(ticketId, date, 540, 90, 'Movable card')
  const timeline = await openWeekAgenda(page, date)
  const wrapper = timeline.locator(`[data-agenda-entry="${entryId}"]`)
  const card = wrapper.getByRole('article')
  const baseBorderColor = await card.evaluate((element) => getComputedStyle(element).borderTopColor)
  await card.hover({ position: { x: 10, y: 25 } })
  await expect
    .poll(() => card.evaluate((element) => getComputedStyle(element).borderTopColor))
    .not.toBe(baseBorderColor)
  const hovered = await card.evaluate((element) => ({
    borderColor: getComputedStyle(element).borderTopColor,
    cursor: getComputedStyle(element).cursor,
  }))
  expect(hovered.borderColor).not.toBe(baseBorderColor)
  expect(hovered.cursor).toBe('grab')

  const interactiveControls = [
    card.getByRole('link', { name: 'Visible work' }),
    card.getByRole('button', { name: 'Filter by Visible work' }),
    card.getByRole('button', { name: 'client: Gesture client; actions' }),
    card.getByRole('button', { name: 'Change status for Visible work from Idea' }),
  ]
  for (const control of interactiveControls)
    expect(await control.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer')

  expect(
    await wrapper
      .locator('[data-drag-edge="top"]')
      .evaluate((element) => getComputedStyle(element).cursor),
  ).toBe('n-resize')
  expect(
    await wrapper
      .locator('[data-drag-edge="bottom"]')
      .evaluate((element) => getComputedStyle(element).cursor),
  ).toBe('s-resize')

  const dragPoint = await card.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { x: rect.x + 10, y: rect.y + rect.height / 2 }
  })
  const interactiveHit = await page.evaluate(({ x, y }) => {
    return Boolean(
      document
        .elementFromPoint(x, y)
        ?.closest('a,button,input,select,textarea,[role="button"],[role="combobox"]'),
    )
  }, dragPoint)
  expect(interactiveHit).toBe(false)
  await page.mouse.move(dragPoint.x, dragPoint.y)
  await page.mouse.down()
  expect(await card.evaluate((element) => getComputedStyle(element).cursor)).toBe('grabbing')
  await page.mouse.up()
})

test('Agenda reports a server-side overlap when a blocker appears after loading', async ({
  page,
  agenda,
}) => {
  const { add, date, hiddenTicketId, ticketId } = agenda
  const movingId = await add(ticketId, date, 900, 60, 'Movable block')
  const timeline = await openWeekAgenda(page, date)
  const moving = timeline.locator(`[data-agenda-entry="${movingId}"]`)
  await expect(moving).toBeVisible()

  await add(hiddenTicketId, date, 960, 180, 'Concurrent blocker') // leave the loaded week stale
  const stale = await moving.boundingBox()
  if (!stale) throw new Error('Entry missing before concurrent conflict')
  const moveStart = { x: stale.x + 2, y: stale.y + 20 }
  const startHit = await page.evaluate(({ x, y }) => {
    const target = document.elementFromPoint(x, y)
    return {
      entryId: target?.closest<HTMLElement>('[data-agenda-entry]')?.dataset.agendaEntry,
      interactive: !!target?.closest(
        'a,button,input,select,textarea,[role="button"],[role="combobox"]',
      ),
    }
  }, moveStart)
  expect(startHit).toEqual({ entryId: movingId, interactive: false })
  const staleTarget = await point(page, timeline, date, 960, 25)
  await page.mouse.move(moveStart.x, moveStart.y)
  await page.mouse.down()
  await page.mouse.move(staleTarget.x, staleTarget.y, { steps: 8 })
  await expect(timeline.getByRole('status')).toHaveText('16:00–17:00')
  await page.mouse.up()
  await expect(page.getByRole('alert').filter({ hasText: /conflict|overlap/i })).toBeVisible()
  const week = await (
    await page.request.get('/api/agenda/week', {
      params: { startDate: getWeekDates(date, 1)![0]! },
    })
  ).json()
  expect(
    week.entries.find((row: { entry: { id: string } }) => row.entry.id === movingId).entry
      .startMinute,
  ).toBe(900)
})

test('archived-parent top resize clamps at an adjacent time entry in the Week timeline', async ({
  page,
  agenda,
}) => {
  const { add, clientId, date, hiddenTicketId, ticketId } = agenda
  const blockerId = await add(ticketId, date, 600, 60, 'Archived blocker')
  const archivedId = await add(hiddenTicketId, date, 720, 30, 'Archived history')
  const archivedClient = await page.request.patch(`/api/clients/${clientId}`, {
    data: { archived: true },
  })
  expect(archivedClient.ok()).toBe(true)
  const timeline = await openWeekAgenda(page, date)

  const blocker = timeline.locator(`[data-agenda-entry="${blockerId}"]`)
  const archived = timeline.locator(`[data-agenda-entry="${archivedId}"]`)
  await expect(blocker).toBeVisible()
  await expect(archived).toBeVisible()
  const topResize = archived.locator('[data-drag-edge="top"]')
  const topResizeBox = await topResize.boundingBox()
  if (!topResizeBox) throw new Error('Top resize handle missing')
  const resizeStart = {
    x: topResizeBox.x + topResizeBox.width / 2,
    y: topResizeBox.y + topResizeBox.height / 2,
  }
  expect(
    await page.evaluate(
      ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('[data-drag-edge="top"]')),
      resizeStart,
    ),
  ).toBe(true)

  const aboveBlocker = await point(page, timeline, date, 630, 0)
  await page.mouse.move(resizeStart.x, resizeStart.y)
  await page.mouse.down()
  await page.mouse.move(aboveBlocker.x, aboveBlocker.y, { steps: 5 })
  await expect(timeline.getByRole('status')).toHaveText('11:00–12:30')
  await page.mouse.up()
  await expect
    .poll(async () => {
      const week = await (
        await page.request.get('/api/agenda/week', {
          params: { startDate: getWeekDates(date, 1)![0]! },
        })
      ).json()
      const targetEntry = week.entries.find(
        (row: { entry: { id: string } }) => row.entry.id === archivedId,
      )
      return targetEntry
        ? {
            startMinute: targetEntry.entry.startMinute,
            durationMinutes: targetEntry.entry.durationMinutes,
          }
        : null
    })
    .toEqual({ startMinute: 660, durationMinutes: 90 })
})
