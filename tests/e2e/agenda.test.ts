import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry, userSettings } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

test('day read and settings are owner scoped, include archived history, and validate input', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Agenda owner',
    email: `agenda-${crypto.randomUUID()}@example.com`,
  })
  const other = helpers.createUser({
    name: 'Agenda other',
    email: `agenda-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  await helpers.saveUser(other)
  let ids:
    | { client: string; project: string; release: string; ticket: string; entries: string[] }
    | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const settings = await page.request.get('/api/settings')
    expect((await settings.json()).visibleStartMinute).toBe(480)
    const updated = await page.request.patch('/api/settings', {
      data: { visibleStartMinute: 420, visibleEndMinute: 1260, workDayDurationMinutes: 450 },
    })
    expect(updated.ok()).toBe(true)
    expect((await (await page.request.get('/api/settings')).json()).workDayDurationMinutes).toBe(
      450,
    )
    for (const invalid of [
      { visibleStartMinute: 430, visibleEndMinute: 1260, workDayDurationMinutes: 450 },
      { visibleStartMinute: 1260, visibleEndMinute: 1260, workDayDurationMinutes: 450 },
      { visibleStartMinute: 420, visibleEndMinute: 1260, workDayDurationMinutes: 0 },
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
    const e = await (
      await page.request.post('/api/time-entries', {
        data: {
          ticketId: t.id,
          date: '2024-02-29',
          startMinute: 420,
          durationMinutes: 60,
          description: 'Early work',
        },
      })
    ).json()
    ids = { client: c.id, project: p.id, release: r.id, ticket: t.id, entries: [e.id] }
    expect(
      (await page.request.get('/api/agenda', { params: { date: '2024-02-30' } })).status(),
    ).toBe(400)
    expect((await page.request.get('/api/agenda')).status()).toBe(400)
    await page.request.patch('/api/settings', {
      data: { visibleStartMinute: 480, visibleEndMinute: 1200, workDayDurationMinutes: 60 },
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
      ids.entries.push((await response.json()).id)
    }
    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('region', { name: 'Before visible hours' })).toContainText(
      'Before window',
    )
    await expect(page.getByRole('region', { name: 'After visible hours' })).toContainText(
      'After window',
    )
    await expect(page.getByLabel('Workday progress 100%')).toBeVisible()
    await page.getByRole('button', { name: 'Add time entry' }).click()
    const addDialog = page.getByRole('dialog', { name: 'Add completed work' })
    await expect(addDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(addDialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Add time entry' }).click()
    await expect(addDialog).toBeVisible()
    await addDialog.getByRole('combobox', { name: 'Ticket*' }).click()
    await page.getByRole('option', { name: /Agenda ticket/ }).click()
    await page.getByRole('textbox', { name: 'Work description' }).fill('From Today')
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog).toHaveCount(0)
    await expect(
      page.getByRole('region', { name: 'Day timeline' }).getByText('From Today'),
    ).toBeVisible()
    const card = page.getByRole('region', { name: 'Day timeline' }).getByRole('article')
    expect(
      await card.evaluate((element) => {
        const badges = element.querySelector('[aria-label="Entry context"]')
        return badges
          ? badges.getBoundingClientRect().bottom <= element.getBoundingClientRect().bottom
          : false
      }),
    ).toBe(true)
    const current = await (
      await page.request.get('/api/agenda', { params: { date: localDay } })
    ).json()
    ids.entries.push(
      current.entries.find(
        (row: { entry: { description: string } }) => row.entry.description === 'From Today',
      ).entry.id,
    )
    await expect(page.getByLabel('Workday progress 150%')).toBeVisible()
    await page.getByRole('button', { name: 'Add time entry' }).click()
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog.getByText(/Time entries cannot overlap/)).toBeVisible()
    await addDialog.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'client: Agenda client; actions' }).first().click()
    await page.getByRole('button', { name: 'Filter by Agenda client' }).click()
    await expect(page.getByText(/Showing 3 entries/)).toBeVisible()
    await page.getByLabel('Clear client filter').click()
    await expect(page.getByText(/Showing 3 entries/)).toHaveCount(0)
    await page.getByRole('button', { name: 'Filter status' }).click()
    await page.getByRole('option', { name: 'Idea' }).click()
    await expect(page.getByText(/Showing 3 entries/)).toBeVisible()
    await page.getByLabel('Clear status filter').click()
    await expect(page.getByText(/Showing 3 entries/)).toHaveCount(0)
    await page.getByRole('button', { name: 'Next day' }).click()
    await expect(page.getByText(/No completed work on this day/)).toBeVisible()
    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByRole('option', { name: 'Agenda ticket' }).click()
    await expect(page.getByText('No work matches these filters.')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Previous day' }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    await expect(page.getByRole('list', { name: 'Work in visible hours' })).toContainText(
      'From Today',
    )
    await page
      .getByRole('button', { name: 'ticket: Agenda ticket; actions' })
      .first()
      .click({ timeout: 5_000 })
    await page.getByRole('link', { name: 'Open Agenda ticket' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/tickets/${t.id}`))
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible()
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Settings saved.' })).toBeVisible()
    const spacious = await page.request.post('/api/time-entries', {
      data: {
        ticketId: t.id,
        date: localDay,
        startMinute: 600,
        durationMinutes: 60,
        description: 'Spacious comment',
      },
    })
    expect(spacious.ok()).toBe(true)
    expect(
      (
        await (await page.request.get('/api/agenda', { params: { date: localDay } })).json()
      ).entries.some(
        (row: { entry: { description: string } }) => row.entry.description === 'Spacious comment',
      ),
    ).toBe(true)
    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    await expect(page.getByLabel('Workday progress 250%')).toBeVisible()
    const spaciousCard = page
      .getByRole('list', { name: 'Work in visible hours' })
      .getByRole('article')
      .filter({ hasText: 'Spacious comment' })
    expect(
      await spaciousCard.evaluate((node) => {
        const comment = node.querySelector('p')
        const icon = comment?.querySelector('.size-4')
        return !!icon && icon.getBoundingClientRect().width > 0
      }),
    ).toBe(true)
    await page.request.patch(`/api/clients/${c.id}`, { data: { archived: true } })
    const agenda = await (
      await page.request.get('/api/agenda', { params: { date: '2024-02-29' } })
    ).json()
    expect(agenda.trackedMinutes).toBe(60)
    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'project: Agenda project; actions' }).first().click()
    await page.getByRole('link', { name: 'Open Agenda project' }).click()
    await expect(page).toHaveURL(new RegExp(`/projects/${p.id}\\?archived=true`))
    expect(agenda.entries[0].clientArchivedAt).toBeTruthy()
    expect(agenda.entries[0].ticketTitle).toBe('Agenda ticket')
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
    const unauth = await browser.newContext()
    try {
      expect((await unauth.request.get('http://127.0.0.1:3000/api/settings')).status()).toBe(401)
      expect(
        (await unauth.request.get('http://127.0.0.1:3000/api/agenda?date=2024-02-29')).status(),
      ).toBe(401)
    } finally {
      await unauth.close()
    }
  } finally {
    if (ids) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ids.ticket))
      await db.delete(ticket).where(eq(ticket.id, ids.ticket))
      await db.delete(release).where(eq(release.id, ids.release))
      await db.delete(project).where(eq(project.id, ids.project))
      await db.delete(client).where(eq(client.id, ids.client))
    }
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
    await helpers.deleteUser(other.id)
  }
})
