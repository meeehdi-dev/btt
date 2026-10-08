import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

test('owned historical time entries enforce daily slots, overlap, archive and usage', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Time owner',
    email: `m4-${crypto.randomUUID()}@example.com`,
  })
  const stranger = helpers.createUser({
    name: 'Time stranger',
    email: `m4-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  await helpers.saveUser(stranger)
  let ids: { client: string; project: string; release: string; tickets: string[] } | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const c = await (
      await page.request.post('/api/clients', { data: { name: 'Time client' } })
    ).json()
    const p = await (
      await page.request.post('/api/projects', {
        data: { clientId: c.id, name: 'Time project', color: '#abcdef' },
      })
    ).json()
    const r = await (
      await page.request.post('/api/releases', { data: { projectId: p.id, name: 'Time release' } })
    ).json()
    const a = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Time ticket', estimateMinutes: 60 },
      })
    ).json()
    const b = await (
      await page.request.post('/api/tickets', { data: { releaseId: r.id, title: 'Other ticket' } })
    ).json()
    ids = { client: c.id, project: p.id, release: r.id, tickets: [a.id, b.id] }
    const endpoint = '/api/time-entries'
    const slot = {
      ticketId: a.id,
      date: '2024-02-29',
      startMinute: 540,
      durationMinutes: 30,
      description: 'Worked',
    }
    for (const bad of [
      { date: '2025-02-29' },
      { durationMinutes: 15 },
      { startMinute: 550 },
      { startMinute: 1410, durationMinutes: 60 },
      { startMinute: -30 },
    ])
      expect((await page.request.post(endpoint, { data: { ...slot, ...bad } })).status()).toBe(400)
    const first = await page.request.post(endpoint, { data: slot })
    expect(first.ok()).toBeTruthy()
    const entry = await first.json()
    expect(
      (await page.request.post(endpoint, { data: { ...slot, ticketId: b.id } })).status(),
    ).toBe(409)
    const parallel = await Promise.all(
      [0, 1].map(() => page.request.post(endpoint, { data: { ...slot, startMinute: 600 } })),
    )
    expect(parallel.map((res) => res.status()).toSorted()).toEqual([200, 409])
    const second = (
      await (await page.request.get(endpoint, { params: { ticketId: a.id } })).json()
    ).entries.find((item: { id: string }) => item.id !== entry.id)
    expect(second).toBeDefined()
    expect(
      (
        await page.request.patch(`${endpoint}/${second.id}`, { data: { startMinute: 540 } })
      ).status(),
    ).toBe(409)
    expect(
      (
        await page.request.patch(`${endpoint}/${entry.id}`, { data: { description: 'Corrected' } })
      ).ok(),
    ).toBe(true)
    const adjacent = await page.request.post(endpoint, {
      data: { ...slot, startMinute: 570, durationMinutes: 30 },
    })
    expect(adjacent.ok()).toBe(true)
    const adjacentId = (await adjacent.json()).id as string
    const midnight = await page.request.post(endpoint, {
      data: { ...slot, startMinute: 1410, durationMinutes: 30 },
    })
    expect(midnight.ok()).toBe(true)
    expect((await page.request.delete(`${endpoint}/${(await midnight.json()).id}`)).ok()).toBe(true)
    const shiftA = await (
      await page.request.post(endpoint, { data: { ...slot, date: '2024-03-02', startMinute: 0 } })
    ).json()
    const shiftB = await (
      await page.request.post(endpoint, { data: { ...slot, date: '2024-03-02', startMinute: 60 } })
    ).json()
    const moves = await Promise.all(
      [shiftA.id, shiftB.id].map((id) =>
        page.request.patch(`${endpoint}/${id}`, { data: { startMinute: 120 } }),
      ),
    )
    expect(moves.map((res) => res.status()).toSorted()).toEqual([200, 409])
    expect((await page.request.delete(`${endpoint}/${shiftA.id}`)).ok()).toBe(true)
    expect((await page.request.delete(`${endpoint}/${shiftB.id}`)).ok()).toBe(true)
    const releaseTickets = await (
      await page.request.get('/api/tickets', { params: { releaseId: r.id } })
    ).json()
    expect(
      releaseTickets.tickets.find((item: { ticket: { id: string } }) => item.ticket.id === a.id)
        .trackedMinutes,
    ).toBe(90)
    await page.goto(`/releases/${r.id}`)
    const releaseCard = page.locator(`[data-release-ticket-id="${a.id}"]`)
    const releaseUsage = releaseCard.getByLabel('Tracked: 1hr 30m of 1hr')
    await expect(releaseUsage).toBeVisible()
    await expect(releaseUsage.locator('.text-error')).toHaveText('1hr 30m')
    await expect(releaseUsage.locator('.text-muted')).toHaveText('/ 1hr')
    await expect(
      releaseCard.locator('[data-release-ticket-header]').getByLabel('Tracked: 1hr 30m of 1hr'),
    ).toBeVisible()
    await expect(releaseCard.getByLabel('Estimate usage: 150%')).toHaveCount(0)
    await expect(
      page.locator(`[data-release-ticket-id="${b.id}"]`).getByLabel('Tracked: 0m'),
    ).toBeVisible()
    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    const boardCard = page.locator(`[data-board-ticket-id="${a.id}"]`).filter({ visible: true })
    const boardUsage = boardCard.getByLabel('Tracked: 1hr 30m of 1hr')
    await expect(boardUsage.locator('.text-error')).toHaveText('1hr 30m')
    await expect(boardUsage.locator('.text-muted')).toHaveText('/ 1hr')
    await expect(boardCard.getByLabel('Estimate usage: 150%')).toHaveCount(0)
    await page.goto(`/tickets/${a.id}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByLabel('Estimate usage: 150%')).toBeVisible()
    await expect(page.getByText('Corrected')).toBeVisible()
    const correctedRow = page.getByText('Corrected').locator('xpath=../..')
    await expect(correctedRow).toContainText('2024-02-29')
    await expect(correctedRow).toContainText('09:00–09:30')
    await expect(correctedRow).toContainText('30m')
    await expect(page.getByRole('button', { name: 'Add time entry' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Time ticket' })).toHaveCount(0)
    const browserEntryDate = '2024-03-03'
    const browserEntry = await page.request.post('/api/time-entries', {
      data: {
        ticketId: a.id,
        date: browserEntryDate,
        startMinute: 570,
        durationMinutes: 30,
        description: 'Browser entry',
      },
    })
    expect(browserEntry.ok()).toBe(true)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Browser entry')).toBeVisible()
    await page.getByRole('button', { name: `Edit time entry ${browserEntryDate} 09:30` }).click()
    await expect(page.getByRole('button', { name: `Work date: ${browserEntryDate}` })).toBeVisible()
    await page.getByRole('textbox', { name: 'Work description' }).fill('Edited in browser')
    await page.getByRole('button', { name: 'Save correction' }).click()
    await expect(page.getByText('Edited in browser')).toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: `Delete time entry ${browserEntryDate} 09:30` }).click()
    await expect(page.getByText('Edited in browser')).toHaveCount(0)
    await page.goto(`/tickets/${b.id}`)
    const unestimatedUsage = page.getByLabel('Tracked: 0m')
    await expect(unestimatedUsage).toBeVisible()
    await expect(unestimatedUsage.locator('.text-muted')).toHaveText('0m')
    await expect(page.getByLabel(/Estimate usage:/)).toHaveCount(0)
    await page.goto(`/tickets/${a.id}`)
    const foreign = await browser.newContext()
    try {
      await foreign.addCookies(
        await helpers.getCookies({ userId: stranger.id, domain: '127.0.0.1' }),
      )
      const request = await foreign.newPage()
      await request.goto('/tickets')
      expect((await request.request.get(endpoint, { params: { ticketId: a.id } })).status()).toBe(
        404,
      )
      expect(
        (
          await request.request.patch(`${endpoint}/${entry.id}`, { data: { description: 'No' } })
        ).status(),
      ).toBe(404)
      expect((await request.request.delete(`${endpoint}/${entry.id}`)).status()).toBe(404)
      expect((await request.request.post(endpoint, { data: slot })).status()).toBe(404)
    } finally {
      await foreign.close()
    }
    const unauth = await browser.newContext()
    try {
      const origin = new URL(page.url()).origin
      expect((await unauth.request.get(`${origin}${endpoint}?ticketId=${a.id}`)).status()).toBe(401)
    } finally {
      await unauth.close()
    }
    expect(
      (await page.request.patch(`/api/tickets/${a.id}`, { data: { archived: true } })).ok(),
    ).toBe(true)
    expect((await page.request.delete(`/api/tickets/${a.id}`)).status()).toBe(409)
    expect((await page.request.post(endpoint, { data: slot })).status()).toBe(409)
    expect(
      (await page.request.patch(`/api/clients/${c.id}`, { data: { archived: true } })).ok(),
    ).toBe(true)
    expect((await page.request.get(`/api/tickets/${a.id}`)).status()).toBe(404)
    expect((await page.request.get(`/api/tickets/${a.id}?archived=true`)).ok()).toBe(true)
    await page.goto(`/tickets/${a.id}?archived=true`)
    await expect(page.getByRole('heading', { name: 'Time ticket', level: 1 })).toBeVisible()
    await expect(page.getByText('Corrected')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add time entry' })).toHaveCount(0)
    expect(
      (
        await page.request.patch(`${endpoint}/${entry.id}`, {
          data: { description: 'Historical correction' },
        })
      ).ok(),
    ).toBe(true)
    expect(
      (await page.request.patch(`${endpoint}/${entry.id}`, { data: { ticketId: b.id } })).status(),
    ).toBe(409)
    expect(
      (
        await (await page.request.get(endpoint, { params: { ticketId: a.id } })).json()
      ).entries.some((item: { id: string }) => item.id === entry.id),
    ).toBe(true)
    expect(adjacentId).toBeTruthy()
    expect(
      (
        await page.request.post(endpoint, { data: { ...slot, ticketId: b.id, date: '2024-03-01' } })
      ).status(),
    ).toBe(409)
  } finally {
    if (ids) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ids.tickets[0]!))
      await db.delete(ticket).where(eq(ticket.id, ids.tickets[0]!))
      await db.delete(ticket).where(eq(ticket.id, ids.tickets[1]!))
      await db.delete(release).where(eq(release.id, ids.release))
      await db.delete(project).where(eq(project.id, ids.project))
      await db.delete(client).where(eq(client.id, ids.client))
    }
    await helpers.deleteUser(owner.id)
    await helpers.deleteUser(stranger.id)
  }
})
