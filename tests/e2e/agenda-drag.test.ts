import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

test('desktop drag creation, hidden blockers, moves, resizing and non-drag mobile correction', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Gesture owner',
    email: `gesture-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let ids: { client: string; project: string; release: string; tickets: string[] } | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const c = await (
      await page.request.post('/api/clients', { data: { name: 'Gesture client' } })
    ).json()
    const p = await (
      await page.request.post('/api/projects', {
        data: { clientId: c.id, name: 'Gesture project', color: '#abcdef' },
      })
    ).json()
    const r = await (
      await page.request.post('/api/releases', {
        data: { projectId: p.id, name: 'Gesture release' },
      })
    ).json()
    const t = await (
      await page.request.post('/api/tickets', { data: { releaseId: r.id, title: 'Visible work' } })
    ).json()
    const hiddenTicket = await (
      await page.request.post('/api/tickets', { data: { releaseId: r.id, title: 'Hidden work' } })
    ).json()
    ids = { client: c.id, project: p.id, release: r.id, tickets: [t.id, hiddenTicket.id] }
    await page.setViewportSize({ width: 1440, height: 2500 })
    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    const day = await page.getByRole('button', { name: /^Agenda date:/ }).textContent()
    expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    async function add(
      ticketId: string,
      startMinute: number,
      durationMinutes: number,
      description: string,
    ) {
      const response = await page.request.post('/api/time-entries', {
        data: { ticketId, date: day, startMinute, durationMinutes, description },
      })
      expect(response.ok()).toBe(true)
      return (await response.json()).id as string
    }
    const blockerId = await add(t.id, 600, 60, 'Visible blocker')
    const hiddenId = await add(hiddenTicket.id, 750, 30, 'Filtered blocker')
    const movingId = await add(t.id, 900, 60, 'Movable block')
    await page.reload()
    await page.waitForLoadState('networkidle')
    const timeline = page.getByRole('region', { name: 'Day timeline' })
    async function point(minute: number, offset = 10) {
      const box = await timeline.boundingBox()
      if (!box) throw new Error('Timeline is not visible')
      return { x: box.x + Math.min(180, box.width / 2), y: box.y + (minute - 480) * 2.25 + offset }
    }
    async function draw(from: number, to: number) {
      const first = await point(from)
      const last = await point(to)
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
    await page.mouse.up()
    await expect(addDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(addDialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByRole('option', { name: 'Visible work' }).click()
    await draw(720, 900)
    await expect(timeline.getByText('Filtered blocker')).toBeVisible()
    await expect(timeline.getByRole('status')).toHaveText('12:00–12:30')
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    const moving = timeline.locator(`[data-agenda-entry="${movingId}"]`)
    const box = await moving.boundingBox()
    if (!box) throw new Error('Moving entry not visible')
    const target = await point(775, 25)
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
    const occupied = await point(600, 25)
    await page.mouse.move(moved.x + moved.width / 2, moved.y + 25)
    await page.mouse.down()
    await page.mouse.move(occupied.x, occupied.y, { steps: 8 })
    await page.mouse.up()
    await expect(
      page.getByRole('alert').filter({ hasText: 'The entry was not moved' }),
    ).toBeVisible()
    expect(
      (
        await (await page.request.get('/api/agenda', { params: { date: day } })).json()
      ).entries.find((row: { entry: { id: string } }) => row.entry.id === movingId).entry
        .startMinute,
    ).toBe(780)
    const bottom = await moving.boundingBox()
    if (!bottom) throw new Error('Entry missing before resize')
    const expanded = await point(860, 0)
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
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('list', { name: 'Work in visible hours' })).toContainText(
      'Movable block',
    )
    const deletableId = await add(hiddenTicket.id, 1140, 30, 'Delete correction')
    await page.reload()
    await page.waitForLoadState('networkidle')
    const deletableEntry = page
      .getByRole('list', { name: 'Work in visible hours' })
      .getByText('Delete correction')
    await deletableEntry.dblclick()
    const correctionDialog = page.getByRole('dialog', { name: 'Correct time entry' })
    await expect(correctionDialog.getByRole('button', { name: 'Delete time entry' })).toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await correctionDialog.getByRole('button', { name: 'Delete time entry' }).click()
    await expect(correctionDialog).toHaveCount(0)
    expect(
      (
        await (await page.request.get('/api/agenda', { params: { date: day } })).json()
      ).entries.some((row: { entry: { id: string } }) => row.entry.id === deletableId),
    ).toBe(false)
    await expect(
      page
        .getByRole('list', { name: 'Work in visible hours' })
        .getByRole('button', { name: /Edit time entry/ }),
    ).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.setViewportSize({ width: 1440, height: 2500 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await add(t.id, 960, 180, 'Concurrent blocker') // deliberately leave the UI day read stale
    const stale = await moving.boundingBox()
    if (!stale) throw new Error('Entry missing before concurrent conflict')
    const staleTarget = await point(960, 25)
    await page.mouse.move(stale.x + stale.width / 2, stale.y + 25)
    await page.mouse.down()
    await page.mouse.move(staleTarget.x, staleTarget.y, { steps: 8 })
    await page.mouse.up()
    await expect(page.getByRole('alert').filter({ hasText: /conflict|overlap/i })).toBeVisible()
    expect(
      (
        await (await page.request.get('/api/agenda', { params: { date: day } })).json()
      ).entries.find((row: { entry: { id: string } }) => row.entry.id === movingId).entry
        .startMinute,
    ).toBe(780)
    await page.request.patch(`/api/clients/${c.id}`, { data: { archived: true } })
    const correction = await page.request.patch(`/api/time-entries/${hiddenId}`, {
      data: { description: 'Archived history corrected' },
    })
    expect(correction.ok()).toBe(true)
    await page.reload()
    await page.waitForLoadState('networkidle')
    const archived = page
      .getByRole('region', { name: 'Day timeline' })
      .locator(`[data-agenda-entry="${hiddenId}"]`)
    const archivedBox = await archived.boundingBox()
    if (!archivedBox) throw new Error('Archived-parent entry missing')
    const correctionTarget = await point(720, 15)
    await page.mouse.move(archivedBox.x + archivedBox.width / 2, archivedBox.y + 15)
    await page.mouse.down()
    await page.mouse.move(correctionTarget.x, correctionTarget.y, { steps: 5 })
    await page.mouse.up()
    await expect
      .poll(
        async () =>
          (
            await (await page.request.get('/api/agenda', { params: { date: day } })).json()
          ).entries.find((row: { entry: { id: string } }) => row.entry.id === hiddenId)?.entry
            .startMinute,
      )
      .toBe(720)
    // The PATCH can persist before Today finishes refreshing and clears its busy guard.
    await page.waitForLoadState('networkidle')
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
    const aboveBlocker = await point(630, 0)
    await page.mouse.move(resizeStart.x, resizeStart.y)
    await page.mouse.down()
    await page.mouse.move(aboveBlocker.x, aboveBlocker.y, { steps: 5 })
    await expect(timeline.getByRole('status')).toHaveText('11:00–12:30')
    await page.mouse.up()
    await expect
      .poll(async () => {
        const targetEntry = (
          await (await page.request.get('/api/agenda', { params: { date: day } })).json()
        ).entries.find((agendaRow: { entry: { id: string } }) => agendaRow.entry.id === hiddenId)
        return targetEntry
          ? {
              startMinute: targetEntry.entry.startMinute,
              durationMinutes: targetEntry.entry.durationMinutes,
            }
          : null
      })
      .toEqual({ startMinute: 660, durationMinutes: 90 })
    expect(blockerId).toBeTruthy()
  } finally {
    if (ids) {
      for (const id of ids.tickets) {
        await db.delete(timeEntry).where(eq(timeEntry.ticketId, id))
        await db.delete(ticket).where(eq(ticket.id, id))
      }
      await db.delete(release).where(eq(release.id, ids.release))
      await db.delete(project).where(eq(project.id, ids.project))
      await db.delete(client).where(eq(client.id, ids.client))
    }
    await helpers.deleteUser(owner.id)
  }
})
