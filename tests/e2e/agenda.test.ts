import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry, userSettings } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

test('day agenda API and settings remain owner-scoped, include archived history, and validate input', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Agenda API owner',
    email: `agenda-${crypto.randomUUID()}@example.com`,
  })
  const other = helpers.createUser({
    name: 'Agenda API other',
    email: `agenda-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  await helpers.saveUser(other)
  let ids:
    | {
        client: string
        project: string
        release: string
        ticket: string
        doneTicket: string
      }
    | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const settings = await page.request.get('/api/settings')
    expect((await settings.json()).visibleStartMinute).toBe(480)
    expect((await settings.json()).startOfWeekDay).toBe(1)
    const updated = await page.request.patch('/api/settings', {
      data: {
        visibleStartMinute: 420,
        visibleEndMinute: 1260,
        workDayDurationMinutes: 450,
        startOfWeekDay: 0,
      },
    })
    expect(updated.ok()).toBe(true)
    expect((await (await page.request.get('/api/settings')).json()).workDayDurationMinutes).toBe(
      450,
    )
    expect((await (await page.request.get('/api/settings')).json()).startOfWeekDay).toBe(0)
    for (const invalid of [
      {
        visibleStartMinute: 430,
        visibleEndMinute: 1260,
        workDayDurationMinutes: 450,
        startOfWeekDay: 0,
      },
      {
        visibleStartMinute: 1260,
        visibleEndMinute: 1260,
        workDayDurationMinutes: 450,
        startOfWeekDay: 0,
      },
      {
        visibleStartMinute: 420,
        visibleEndMinute: 1260,
        workDayDurationMinutes: 0,
        startOfWeekDay: 0,
      },
      {
        visibleStartMinute: 420,
        visibleEndMinute: 1260,
        workDayDurationMinutes: 450,
        startOfWeekDay: 7,
      },
    ])
      expect((await page.request.patch('/api/settings', { data: invalid })).status()).toBe(400)

    const c = await (
      await page.request.post('/api/clients', { data: { name: 'Agenda client' } })
    ).json()
    const p = await (
      await page.request.post('/api/projects', {
        data: { clientId: c.id, name: 'Agenda project', color: '#abcdef' },
      })
    ).json()
    const r = await (
      await page.request.post('/api/releases', {
        data: { projectId: p.id, name: 'Agenda release' },
      })
    ).json()
    const t = await (
      await page.request.post('/api/tickets', { data: { releaseId: r.id, title: 'Agenda ticket' } })
    ).json()
    const doneTicket = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Done agenda ticket', status: 'Done' },
      })
    ).json()
    ids = {
      client: c.id,
      project: p.id,
      release: r.id,
      ticket: t.id,
      doneTicket: doneTicket.id,
    }
    const historicalEntry = await (
      await page.request.post('/api/time-entries', {
        data: {
          ticketId: t.id,
          date: '2024-02-29',
          startMinute: 420,
          durationMinutes: 60,
          description: 'Historical work',
        },
      })
    ).json()
    expect(
      (await page.request.get('/api/agenda', { params: { date: '2024-02-30' } })).status(),
    ).toBe(400)
    expect((await page.request.get('/api/agenda')).status()).toBe(400)
    const historical = await (
      await page.request.get('/api/agenda', { params: { date: '2024-02-29' } })
    ).json()
    expect(historical.trackedMinutes).toBe(60)
    expect(historical.entries).toHaveLength(1)
    expect(historical.entries[0]).toMatchObject({
      entry: { id: historicalEntry.id, description: 'Historical work' },
      ticketTitle: 'Agenda ticket',
    })

    const localDay = await page.evaluate(() => {
      const date = new Date()
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    })
    for (const [startMinute, description] of [
      [420, 'Before window'],
      [1260, 'After window'],
    ] as const) {
      const response = await page.request.post('/api/time-entries', {
        data: { ticketId: t.id, date: localDay, startMinute, durationMinutes: 30, description },
      })
      expect(response.ok()).toBe(true)
    }
    const currentDay = await (
      await page.request.get('/api/agenda', { params: { date: localDay } })
    ).json()
    expect(currentDay.trackedMinutes).toBe(60)
    expect(
      currentDay.entries.map((row: { entry: { description: string } }) => row.entry.description),
    ).toEqual(['Before window', 'After window'])

    expect(
      (await page.request.patch(`/api/clients/${c.id}`, { data: { archived: true } })).ok(),
    ).toBe(true)
    const archivedHistory = await (
      await page.request.get('/api/agenda', { params: { date: '2024-02-29' } })
    ).json()
    expect(archivedHistory.trackedMinutes).toBe(60)
    expect(archivedHistory.entries[0].clientArchivedAt).toBeTruthy()
    expect(archivedHistory.entries[0].ticketTitle).toBe('Agenda ticket')
    expect((await page.request.get(`/api/projects/${p.id}`)).status()).toBe(404)
    expect((await page.request.get(`/api/releases/${r.id}`)).status()).toBe(404)
    expect((await page.request.get(`/api/projects/${p.id}?archived=true`)).status()).toBe(200)
    expect((await page.request.get(`/api/releases/${r.id}?archived=true`)).status()).toBe(200)

    const foreign = await browser.newContext()
    try {
      await foreign.addCookies(await helpers.getCookies({ userId: other.id, domain: '127.0.0.1' }))
      const request = await foreign.newPage()
      expect(
        (
          await (
            await request.request.get('/api/agenda', { params: { date: '2024-02-29' } })
          ).json()
        ).entries,
      ).toEqual([])
      expect(
        (await (await request.request.get('/api/settings')).json()).workDayDurationMinutes,
      ).toBe(480)
    } finally {
      await foreign.close()
    }
    await page.goto('/agenda')
    const unauth = await browser.newContext()
    try {
      const origin = new URL(page.url()).origin
      expect((await unauth.request.get(`${origin}/api/settings`)).status()).toBe(401)
      expect((await unauth.request.get(`${origin}/api/agenda?date=2024-02-29`)).status()).toBe(401)
    } finally {
      await unauth.close()
    }
  } finally {
    if (ids) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ids.ticket))
      await db.delete(ticket).where(eq(ticket.id, ids.ticket))
      await db.delete(ticket).where(eq(ticket.id, ids.doneTicket))
      await db.delete(release).where(eq(release.id, ids.release))
      await db.delete(project).where(eq(project.id, ids.project))
      await db.delete(client).where(eq(client.id, ids.client))
    }
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
    await helpers.deleteUser(other.id)
  }
})
