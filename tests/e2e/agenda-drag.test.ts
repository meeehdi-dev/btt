import { expect, test as base, type Locator, type Page } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { getWeekDates } from '../../shared/agenda-week'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

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
  const startDate = getWeekDates(date, 1)![0]!
  const weekResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/agenda/week' &&
      url.searchParams.get('startDate') === startDate
    )
  })
  const [, response] = await Promise.all([page.goto(`/agenda?date=${date}`), weekResponse])
  expect(response.ok()).toBe(true)
  await expect(page.getByText('Loading agenda…', { exact: true })).toHaveCount(0)
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
  const staleTarget = await point(page, timeline, date, 960, 25)
  await page.mouse.move(stale.x + 2, stale.y + 20)
  await page.mouse.down()
  await page.mouse.move(staleTarget.x, staleTarget.y, { steps: 8 })
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
