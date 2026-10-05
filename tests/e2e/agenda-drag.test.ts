import { expect, test as base, type Locator, type Page } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

type AgendaFixture = {
  clientId: string
  ticketId: string
  hiddenTicketId: string
  day: string
  add: (
    ticketId: string,
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

      await page.setViewportSize({ width: 1440, height: 2500 })
      await page.goto('/today')
      const day = await page.evaluate(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      })
      const add = async (
        ticketId: string,
        startMinute: number,
        durationMinutes: number,
        description: string,
      ) => {
        const response = await page.request.post('/api/time-entries', {
          data: { ticketId, date: day, startMinute, durationMinutes, description },
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
        day,
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

async function point(page: Page, timeline: Locator, minute: number, offset = 10) {
  const box = await timeline.boundingBox()
  if (!box) throw new Error('Timeline is not visible')
  return { x: box.x + Math.min(180, box.width / 2), y: box.y + (minute - 480) * 2.25 + offset }
}

test('desktop day gestures create, move, resize, and reject overlapping entries', async ({
  page,
  agenda,
}) => {
  const { add, day, hiddenTicketId, ticketId } = agenda
  const blockerId = await add(ticketId, 600, 60, 'Visible blocker')
  const hiddenId = await add(hiddenTicketId, 750, 30, 'Filtered blocker')
  const movingId = await add(ticketId, 900, 60, 'Movable block')
  await page.reload()

  const timeline = page.getByRole('region', { name: 'Day timeline' })
  const moving = timeline.locator(`[data-agenda-entry="${movingId}"]`)
  await expect(timeline.locator(`[data-agenda-entry="${blockerId}"]`)).toBeVisible()
  await expect(timeline.locator(`[data-agenda-entry="${hiddenId}"]`)).toBeVisible()
  await expect(moving).toBeVisible()
  async function draw(from: number, to: number) {
    const first = await point(page, timeline, from)
    const last = await point(page, timeline, to)
    await page.mouse.move(first.x, first.y)
    await page.mouse.down()
    await page.mouse.move(last.x, last.y, { steps: 8 })
  }

  await draw(540, 720)
  await expect(timeline.getByRole('status')).toHaveText('09:00–10:00')
  await page.mouse.up()
  const addDialog = page.getByRole('dialog', { name: 'Add completed work' })
  await expect(addDialog).toBeVisible()
  await addDialog.getByRole('button', { name: 'Ticket' }).click()
  await page.getByRole('option', { name: /Visible work/ }).click()
  await addDialog.getByRole('button', { name: 'Save time entry' }).click()
  await expect(addDialog).toHaveCount(0)
  await expect
    .poll(async () =>
      (
        await (await page.request.get('/api/agenda', { params: { date: day } })).json()
      ).entries.some(
        (row: { entry: { startMinute: number; durationMinutes: number } }) =>
          row.entry.startMinute === 540 && row.entry.durationMinutes === 60,
      ),
    )
    .toBe(true)

  await draw(690, 480)
  await expect(timeline.getByRole('status')).toHaveText('11:00–12:00')
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(addDialog).toHaveCount(0)

  await page.getByRole('button', { name: 'Filter ticket' }).click()
  await page.getByRole('option', { name: 'Visible work' }).click()
  await draw(720, 900)
  await expect(timeline.getByText('Filtered blocker')).toBeVisible()
  await expect(timeline.getByRole('status')).toHaveText('12:00–12:30')
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await page.getByRole('button', { name: 'Clear filters' }).click()

  await expect(moving).toBeVisible()
  const box = await moving.boundingBox()
  if (!box) throw new Error('Moving entry not visible')
  const target = await point(page, timeline, 775, 25)
  await page.mouse.move(box.x + box.width / 2, box.y + 25)
  await page.mouse.down()
  await expect(moving).not.toHaveClass(/opacity-40/)
  await expect(timeline.getByRole('status')).toHaveCount(0)
  await page.mouse.move(box.x + box.width / 2, box.y + 28)
  await expect(moving).not.toHaveClass(/opacity-40/)
  await page.mouse.move(target.x, target.y, { steps: 8 })
  await expect(moving).toHaveClass(/opacity-40/)
  await page.mouse.up()
  await expect
    .poll(
      async () =>
        (
          await (await page.request.get('/api/agenda', { params: { date: day } })).json()
        ).entries.find((row: { entry: { id: string } }) => row.entry.id === movingId)?.entry
          .startMinute,
    )
    .toBe(780)
  await expect(moving.getByRole('button', { name: /Edit time entry/ })).toHaveCount(0)
  await moving.getByText('Movable block').dblclick()
  await expect(page.getByRole('dialog', { name: 'Correct time entry' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Correct time entry' })).toHaveCount(0)

  const moved = await moving.boundingBox()
  if (!moved) throw new Error('Moved entry not visible')
  const occupied = await point(page, timeline, 600, 25)
  await page.mouse.move(moved.x + moved.width / 2, moved.y + 25)
  await page.mouse.down()
  await page.mouse.move(occupied.x, occupied.y, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('alert').filter({ hasText: 'The entry was not moved' })).toBeVisible()
  expect(
    (await (await page.request.get('/api/agenda', { params: { date: day } })).json()).entries.find(
      (row: { entry: { id: string } }) => row.entry.id === movingId,
    ).entry.startMinute,
  ).toBe(780)

  const bottom = await moving.boundingBox()
  if (!bottom) throw new Error('Entry missing before resize')
  const expanded = await point(page, timeline, 860, 0)
  await page.mouse.move(bottom.x + bottom.width / 2, bottom.y + bottom.height - 3)
  await page.mouse.down()
  await page.mouse.move(expanded.x, expanded.y, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(
      async () =>
        (
          await (await page.request.get('/api/agenda', { params: { date: day } })).json()
        ).entries.find((row: { entry: { id: string } }) => row.entry.id === movingId)?.entry
          .durationMinutes,
    )
    .toBeGreaterThan(60)
})

test('mobile agenda correction can edit and delete a time entry without overflow', async ({
  page,
  agenda,
}) => {
  const { add, day, hiddenTicketId } = agenda
  const deletableId = await add(hiddenTicketId, 1140, 30, 'Delete correction')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await waitForClientMount(page)

  const workList = page.getByRole('list', { name: 'Work in visible hours' })
  const deletableEntry = workList.getByText('Delete correction')
  await expect(deletableEntry).toBeVisible()
  await deletableEntry.dblclick()
  const correctionDialog = page.getByRole('dialog', { name: 'Correct time entry' })
  await expect(correctionDialog.getByRole('button', { name: 'Delete time entry' })).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await correctionDialog.getByRole('button', { name: 'Delete time entry' }).click()
  await expect(correctionDialog).toHaveCount(0)
  expect(
    (await (await page.request.get('/api/agenda', { params: { date: day } })).json()).entries.some(
      (row: { entry: { id: string } }) => row.entry.id === deletableId,
    ),
  ).toBe(false)
  await expect(workList.getByRole('button', { name: /Edit time entry/ })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('Today reports a server-side overlap when a blocker appears after loading', async ({
  page,
  agenda,
}) => {
  const { add, day, hiddenTicketId, ticketId } = agenda
  const movingId = await add(ticketId, 900, 60, 'Movable block')
  await page.reload()
  const timeline = page.getByRole('region', { name: 'Day timeline' })
  const moving = timeline.locator(`[data-agenda-entry="${movingId}"]`)
  await expect(moving).toBeVisible()

  await add(hiddenTicketId, 960, 180, 'Concurrent blocker') // deliberately leave the UI day read stale
  const stale = await moving.boundingBox()
  if (!stale) throw new Error('Entry missing before concurrent conflict')
  const staleTarget = await point(page, timeline, 960, 25)
  await page.mouse.move(stale.x + stale.width / 2, stale.y + 25)
  await page.mouse.down()
  await page.mouse.move(staleTarget.x, staleTarget.y, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('alert').filter({ hasText: /conflict|overlap/i })).toBeVisible()
  expect(
    (await (await page.request.get('/api/agenda', { params: { date: day } })).json()).entries.find(
      (row: { entry: { id: string } }) => row.entry.id === movingId,
    ).entry.startMinute,
  ).toBe(900)
})

test('archived-parent top resize clamps at an adjacent time entry', async ({ page, agenda }) => {
  const { add, clientId, day, hiddenTicketId, ticketId } = agenda
  const blockerId = await add(ticketId, 600, 60, 'Archived blocker')
  const archivedId = await add(hiddenTicketId, 720, 30, 'Archived history')
  const archivedClient = await page.request.patch(`/api/clients/${clientId}`, {
    data: { archived: true },
  })
  expect(archivedClient.ok()).toBe(true)
  await page.reload()

  const timeline = page.getByRole('region', { name: 'Day timeline' })
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

  const aboveBlocker = await point(page, timeline, 630, 0)
  await page.mouse.move(resizeStart.x, resizeStart.y)
  await page.mouse.down()
  await page.mouse.move(aboveBlocker.x, aboveBlocker.y, { steps: 5 })
  await expect(timeline.getByRole('status')).toHaveText('11:00–12:30')
  await page.mouse.up()
  await expect
    .poll(async () => {
      const targetEntry = (
        await (await page.request.get('/api/agenda', { params: { date: day } })).json()
      ).entries.find((row: { entry: { id: string } }) => row.entry.id === archivedId)
      return targetEntry
        ? {
            startMinute: targetEntry.entry.startMinute,
            durationMinutes: targetEntry.entry.durationMinutes,
          }
        : null
    })
    .toEqual({ startMinute: 660, durationMinutes: 90 })
})
