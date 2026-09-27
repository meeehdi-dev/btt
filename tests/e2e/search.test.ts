import { expect, test, type APIRequestContext } from '@playwright/test'
import { eq, inArray, or } from 'drizzle-orm'
import { db } from '../../server/db'
import {
  client,
  project,
  release,
  ticket,
  ticketRelation,
  ticketLink,
  timeEntry,
} from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

async function makeHierarchy(api: APIRequestContext, suffix: string) {
  const c = await (
    await api.post('/api/clients', { data: { name: `Needle client ${suffix}` } })
  ).json()
  const p = await (
    await api.post('/api/projects', {
      data: { clientId: c.id, name: `Needle project ${suffix}`, color: '#abcdef' },
    })
  ).json()
  const r = await (
    await api.post('/api/releases', { data: { projectId: p.id, name: `Needle release ${suffix}` } })
  ).json()
  const t = await (
    await api.post('/api/tickets', { data: { releaseId: r.id, title: `Needle ticket ${suffix}` } })
  ).json()
  const e = await (
    await api.post('/api/time-entries', {
      data: {
        ticketId: t.id,
        date: '2030-02-10',
        startMinute: 540,
        durationMinutes: 30,
        description: `Needle work ${suffix}`,
      },
    })
  ).json()
  return { c, p, r, t, e }
}

test('search is bounded, owner-scoped and excludes archived descendants', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Search owner',
    email: `search-${crypto.randomUUID()}@example.com`,
  })
  const other = helpers.createUser({
    name: 'Search other',
    email: `search-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  await helpers.saveUser(other)
  const stranger = await browser.newContext()
  try {
    expect((await page.request.get('/api/search', { params: { q: 'needle' } })).status()).toBe(401)
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    await stranger.addCookies(await helpers.getCookies({ userId: other.id, domain: '127.0.0.1' }))
    const own = await makeHierarchy(page.request, 'own')
    const foreign = await makeHierarchy(stranger.request, 'foreign')
    const result = await (await page.request.get('/api/search', { params: { q: 'needle' } })).json()
    for (const [key, id] of [
      ['clients', own.c.id],
      ['projects', own.p.id],
      ['releases', own.r.id],
      ['tickets', own.t.id],
      ['timeEntries', own.e.id],
    ] as const) {
      expect(result[key].map((item: { id: string }) => item.id)).toContain(id)
      expect(result[key].map((item: { id: string }) => item.id)).not.toContain(
        (
          {
            clients: foreign.c,
            projects: foreign.p,
            releases: foreign.r,
            tickets: foreign.t,
            timeEntries: foreign.e,
          } as Record<string, { id: string }>
        )[key].id,
      )
      expect(result[key].length).toBeLessThanOrEqual(8)
    }
    expect(result.timeEntries[0]).toMatchObject({
      date: '2030-02-10',
      startMinute: 540,
      ticketTitle: 'Needle ticket own',
    })
    await page.goto('/today?date=2030-02-10')
    await expect(page.getByRole('button', { name: 'Agenda date: 2030-02-10' })).toBeVisible()
    await expect(page.getByLabel('Day timeline').getByText('Needle work own')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
    await page.getByRole('button', { name: 'Expand sidebar' }).click()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
    await page.keyboard.press('/')
    const search = page.getByRole('searchbox', { name: 'Search workspace' })
    await expect(search).toBeFocused()
    await search.fill('Needle work own')
    await expect(
      page.getByRole('listbox', { name: 'Search results' }).getByText('Time entries'),
    ).toBeVisible()
    await search.press('ArrowDown')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/today\?date=2030-02-10$/)
    await search.press('Escape')
    await page.keyboard.press('Control+k')
    await expect(search).toBeFocused()
    await search.fill('definitely-no-match-1234')
    await expect(page.getByRole('listbox', { name: 'Search results' })).toContainText('No matches.')
    await search.press('Escape')
    await page.keyboard.press('g')
    await page.keyboard.press('p')
    await expect(page).toHaveURL(/\/projects$/)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await expect(
      page
        .getByRole('dialog', { name: 'Menu' })
        .getByRole('searchbox', { name: 'Search workspace' }),
    ).toBeVisible()
    await page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('searchbox', { name: 'Search workspace' })
      .fill('Needle project own')
    await page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('option', { name: /Needle project own/ })
      .click()
    await expect(page).toHaveURL(new RegExp(`/projects/${own.p.id}$`))
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Tickets' }).click()
    await expect(page).toHaveURL(/\/tickets$/)
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('button', { name: 'Account: Search owner' })
      .click()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
    await page.goto('/today?date=2030-02-10')
    const workdaySummary = page.getByLabel('Workday summary')
    await expect(workdaySummary).toContainText('30m')
    await expect(workdaySummary.locator('.text-info')).toHaveText('30m')
    await expect(workdaySummary.locator('.text-muted')).toHaveText('/ 8hr')
    const controlRow = page.getByLabel('Choose agenda day').locator('..')
    await expect
      .poll(() => controlRow.evaluate((node) => getComputedStyle(node).flexDirection))
      .toBe('column')
    await expect(page.getByRole('button', { name: 'Add time entry' })).toBeVisible()
    await page.goto('/projects')
    await expect
      .poll(() =>
        page
          .getByRole('button', { name: 'Show archived' })
          .locator('..')
          .evaluate((node) => getComputedStyle(node).flexDirection),
      )
      .toBe('column')
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/today?date=2030-02-10')
    await expect
      .poll(() =>
        page
          .getByLabel('Choose agenda day')
          .locator('..')
          .evaluate((node) => getComputedStyle(node).flexDirection),
      )
      .toBe('row')
    expect((await page.getByLabel('Workday summary').boundingBox())?.width).toBeGreaterThan(400)
    expect(
      (await (await page.request.get('/api/search', { params: { q: 'n' } })).json()).tickets,
    ).toEqual([])
    expect(
      (await page.request.get('/api/search', { params: { q: 'x'.repeat(101) } })).status(),
    ).toBe(400)
    expect((await page.request.get('/api/search?q=one&q=two')).status()).toBe(400)
    expect(
      (await (await page.request.get('/api/search', { params: { q: '%_' } })).json()).clients,
    ).toEqual([])
    expect(
      (await (await page.request.get('/api/search', { params: { q: 'Needle ticket' } })).json())
        .timeEntries,
    ).toHaveLength(1)
    expect(
      (await page.request.patch(`/api/projects/${own.p.id}`, { data: { archived: true } })).ok(),
    ).toBe(true)
    const hidden = await (await page.request.get('/api/search', { params: { q: 'needle' } })).json()
    expect(hidden.clients).toHaveLength(1)
    for (const key of ['projects', 'releases', 'tickets', 'timeEntries'])
      expect(hidden[key]).toHaveLength(0)
    expect(
      (await page.request.patch(`/api/projects/${own.p.id}`, { data: { archived: false } })).ok(),
    ).toBe(true)
    expect(
      (await page.request.patch(`/api/tickets/${own.t.id}`, { data: { archived: true } })).ok(),
    ).toBe(true)
    const archivedTicket = await (
      await page.request.get('/api/search', { params: { q: 'needle' } })
    ).json()
    expect(archivedTicket.tickets).toHaveLength(0)
    expect(archivedTicket.timeEntries).toHaveLength(0)
    await page.goto('/projects')
    await page.getByRole('link', { name: 'Needle client own' }).click()
    await expect(page).toHaveURL(new RegExp(`/clients/${own.c.id}$`))
    await page.goto('/projects')
    await page
      .getByRole('link', { name: 'Open project Needle project own' })
      .click({ position: { x: 170, y: 55 } })
    await expect(page).toHaveURL(new RegExp(`/projects/${own.p.id}$`))
    await page
      .getByRole('link', { name: 'Open release Needle release own' })
      .locator('..')
      .click({ position: { x: 12, y: 85 } })
    await expect(page).toHaveURL(new RegExp(`/releases/${own.r.id}$`))
    await page.goto(`/projects/${own.p.id}`)
    await page.waitForLoadState('networkidle')
    const [doneResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/releases/${own.r.id}`) &&
          response.request().method() === 'PATCH',
        { timeout: 5000 },
      ),
      page.getByRole('button', { name: 'Mark release as done' }).click(),
    ])
    expect(doneResponse.ok()).toBe(true)
    await expect(page).toHaveURL(new RegExp(`/projects/${own.p.id}$`))
    await expect(page.getByText('Needle release own')).toBeHidden()
    for (let index = 0; index < 9; index++) {
      expect(
        (await page.request.post('/api/clients', { data: { name: `Needle extra ${index}` } })).ok(),
      ).toBe(true)
    }
    const bounded = await (
      await page.request.get('/api/search', { params: { q: 'Needle extra' } })
    ).json()
    expect(bounded.clients).toHaveLength(8)
  } finally {
    await stranger.close()
    for (const user of [owner, other]) {
      const cs = await db.select({ id: client.id }).from(client).where(eq(client.userId, user.id))
      const cids = cs.map((row) => row.id)
      const ps = cids.length
        ? await db.select({ id: project.id }).from(project).where(inArray(project.clientId, cids))
        : []
      const pids = ps.map((row) => row.id)
      const rs = pids.length
        ? await db.select({ id: release.id }).from(release).where(inArray(release.projectId, pids))
        : []
      const rids = rs.map((row) => row.id)
      const ts = rids.length
        ? await db.select({ id: ticket.id }).from(ticket).where(inArray(ticket.releaseId, rids))
        : []
      const tids = ts.map((row) => row.id)
      if (tids.length) {
        await db.delete(timeEntry).where(inArray(timeEntry.ticketId, tids))
        await db.delete(ticketLink).where(inArray(ticketLink.ticketId, tids))
        await db
          .delete(ticketRelation)
          .where(
            or(
              inArray(ticketRelation.fromTicketId, tids),
              inArray(ticketRelation.toTicketId, tids),
            ),
          )
        await db.delete(ticket).where(inArray(ticket.id, tids))
      }
      if (rids.length) await db.delete(release).where(inArray(release.id, rids))
      if (pids.length) await db.delete(project).where(inArray(project.id, pids))
      if (cids.length) await db.delete(client).where(inArray(client.id, cids))
      await helpers.deleteUser(user.id)
    }
  }
})
