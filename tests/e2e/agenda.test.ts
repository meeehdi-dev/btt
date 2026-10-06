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
    | {
        client: string
        project: string
        release: string
        ticket: string
        doneTicket: string
        entries: string[]
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
    ids = {
      client: c.id,
      project: p.id,
      release: r.id,
      ticket: t.id,
      doneTicket: doneTicket.id,
      entries: [e.id],
    }
    expect(
      (await page.request.get('/api/agenda', { params: { date: '2024-02-30' } })).status(),
    ).toBe(400)
    expect((await page.request.get('/api/agenda')).status()).toBe(400)
    await page.request.patch('/api/settings', {
      data: {
        visibleStartMinute: 480,
        visibleEndMinute: 1200,
        workDayDurationMinutes: 60,
        startOfWeekDay: 1,
      },
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
    await expect(page.getByRole('region', { name: 'Day timeline' })).toBeVisible()
    const agendaFilterBody = page
      .locator('main .grid-cols-5')
      .locator('xpath=ancestor::*[@data-slot="body"]')
    await expect(agendaFilterBody).toHaveCSS('padding', '2px')
    const filterTriggers = page.locator('main .grid-cols-5 button[aria-label^="Filter "]')
    await expect(filterTriggers).toHaveCount(5)
    const filterHeights = await filterTriggers.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height),
    )
    expect(Math.min(...filterHeights)).toBeGreaterThanOrEqual(32)
    const todayButton = page.getByRole('button', { name: 'Today', exact: true })
    await expect(todayButton).toHaveAttribute('aria-current', 'date')
    await expect(todayButton).toHaveClass(/bg-primary/)
    const progress = page.getByRole('progressbar', { name: 'Workday progress' })
    await expect(progress).toHaveAttribute('aria-valuenow', '60')
    await expect(progress).toHaveAttribute('aria-valuemax', '60')
    await expect(page.getByRole('region', { name: 'Before visible hours' })).toContainText(
      'Before window',
    )
    await expect(page.getByRole('region', { name: 'After visible hours' })).toContainText(
      'After window',
    )
    await expect(progress).toHaveAttribute('aria-valuetext', 'Worked 1hr of 1hr target')
    await page.getByRole('button', { name: 'Add time entry' }).click()
    const addDialog = page.getByRole('dialog', { name: 'Add completed work' })
    await expect(addDialog).toBeVisible()
    await expect(addDialog.getByRole('button', { name: /Work date:/ })).toHaveCount(0)
    await expect(addDialog).toContainText('Work date:')
    await page.keyboard.press('Escape')
    await expect(addDialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Add time entry' }).click()
    await expect(addDialog).toBeVisible()
    await addDialog.getByRole('button', { name: 'Ticket' }).click()
    const ticketSearch = page.getByPlaceholder('Search tickets…')
    await ticketSearch.fill('Done agenda ticket')
    await expect(page.getByRole('option', { name: /Done agenda ticket/ })).toHaveCount(0)
    await ticketSearch.fill('Agenda ticket')
    await page.getByRole('option', { name: /Agenda ticket/ }).click()
    await expect(page.getByRole('listbox')).toBeHidden()
    await page.getByRole('textbox', { name: 'Work description' }).fill('From Today')
    await expect(page.getByRole('textbox', { name: 'Work description' })).toHaveValue('From Today')
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog).toHaveCount(0)
    const afterAdd = await (
      await page.request.get('/api/agenda', { params: { date: localDay } })
    ).json()
    expect(
      afterAdd.entries.some(
        (row: { entry: { description: string } }) => row.entry.description === 'From Today',
      ),
    ).toBe(true)
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
    const dayHierarchy = card.getByLabel('Entry hierarchy, status, and ticket links')
    expect(await dayHierarchy.evaluate((element) => getComputedStyle(element).flexWrap)).toBe(
      'nowrap',
    )
    expect(
      await dayHierarchy.evaluate((element) => element.scrollHeight <= element.clientHeight),
    ).toBe(true)
    const dayBadges = await dayHierarchy
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
    expect(dayBadges).toHaveLength(4)
    expect(dayBadges[3]).toMatch(/^status: .*; actions$/)
    const current = await (
      await page.request.get('/api/agenda', { params: { date: localDay } })
    ).json()
    const todayEntryId = current.entries.find(
      (row: { entry: { description: string } }) => row.entry.description === 'From Today',
    ).entry.id
    ids.entries.push(todayEntryId)
    const todayEntryCard = page
      .getByRole('region', { name: 'Day timeline' })
      .locator(`[data-agenda-entry="${todayEntryId}"]`)
      .getByRole('article')
    const ticketFilterAction = todayEntryCard.getByRole('button', {
      name: 'Filter by Agenda ticket',
    })
    await expect(ticketFilterAction).toBeVisible()
    await ticketFilterAction.click()
    await expect(page.getByRole('button', { name: 'Filter ticket' })).toContainText('Agenda ticket')
    await expect(page).toHaveURL(/\/today$/)
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(progress).toHaveAttribute(
      'aria-valuetext',
      'Worked 1hr 30m of 1hr target; 30m overtime',
    )
    const todayCard = page
      .getByRole('region', { name: 'Day timeline' })
      .locator(`[data-agenda-ticket-id="${t.id}"]`)
    await expect(todayCard).toContainText('30m')
    await expect(todayCard).not.toContainText(/\b09:00–09:30\b/)
    const adjacentResponse = await page.request.post('/api/time-entries', {
      data: {
        ticketId: t.id,
        date: localDay,
        startMinute: 570,
        durationMinutes: 30,
        description: 'Adjacent work',
      },
    })
    expect(adjacentResponse.ok()).toBe(true)
    const adjacentEntryId = (await adjacentResponse.json()).id
    ids.entries.push(adjacentEntryId)
    expect(
      (
        await page.request.patch('/api/settings', {
          data: {
            visibleStartMinute: 480,
            visibleEndMinute: 1200,
            workDayDurationMinutes: 90,
            startOfWeekDay: 1,
          },
        })
      ).ok(),
    ).toBe(true)
    await page.reload()
    await page.waitForLoadState('networkidle')
    const dayTimeline = page.getByRole('region', { name: 'Day timeline' })
    const firstBlock = dayTimeline.locator(`[data-agenda-entry="${todayEntryId}"]`)
    const secondBlock = dayTimeline.locator(`[data-agenda-entry="${adjacentEntryId}"]`)
    const [firstBounds, secondBounds] = await Promise.all([
      firstBlock.boundingBox(),
      secondBlock.boundingBox(),
    ])
    const [firstCardBounds, secondCardBounds] = await Promise.all([
      firstBlock.getByRole('article').boundingBox(),
      secondBlock.getByRole('article').boundingBox(),
    ])
    if (!firstBounds || !secondBounds || !firstCardBounds || !secondCardBounds)
      throw new Error('Adjacent agenda entries must be visible')
    expect(firstBounds.y + firstBounds.height).toBeCloseTo(secondBounds.y, 1)
    expect(secondCardBounds.y).toBeGreaterThan(firstCardBounds.y + firstCardBounds.height)
    await page.getByRole('button', { name: 'Add time entry' }).click()
    await addDialog.getByRole('button', { name: 'Ticket' }).click()
    await page.getByRole('option', { name: /Agenda ticket/ }).click()
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog.getByText(/Time entries cannot overlap/)).toBeVisible()
    await addDialog.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'client: Agenda client; actions' }).first().click()
    await page.getByRole('button', { name: 'Filter by Agenda client' }).click()
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText('Agenda client')
    await page.getByLabel('Clear client filter').click()
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText('All clients')
    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByPlaceholder('Search tickets…').fill('Done agenda ticket')
    await expect(
      page.getByRole('option', { name: 'Done agenda ticket', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Filter status' }).click()
    await page.getByPlaceholder('Search statuses…').fill('Done')
    await expect(page.getByRole('option', { name: 'Done', exact: true })).toBeVisible()
    await page.getByPlaceholder('Search statuses…').fill('Idea')
    await page.getByRole('option', { name: 'Idea' }).click()
    await expect(page.getByRole('button', { name: 'Filter status' })).toContainText('Idea')
    await page.getByLabel('Clear status filter').click()
    await expect(page.getByRole('button', { name: 'Filter status' })).toContainText('All statuses')
    await page.getByRole('button', { name: 'Next day' }).click()
    await expect(todayButton).not.toHaveAttribute('aria-current', 'date')
    await expect(todayButton).not.toHaveClass(/bg-primary/)
    await expect(page.getByText(/No completed work on this day/)).toHaveCount(0)
    await expect(page.locator('[data-agenda-entry]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByRole('option', { name: 'Agenda ticket', exact: true }).click()
    await expect(page.getByText('No work matches these filters.')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Previous day' }).click()
    await expect(todayButton).toHaveAttribute('aria-current', 'date')
    const desktopEntry = page.locator('[data-agenda-entry]').filter({ hasText: 'From Today' })
    await expect(desktopEntry).toBeVisible()
    const ticketTitle = desktopEntry.getByRole('link', { name: 'Agenda ticket' }).first()
    await expect(ticketTitle).toHaveAttribute('href', `/tickets/${t.id}`)
    await ticketTitle.click()
    await expect(page).toHaveURL(new RegExp(`/tickets/${t.id}`))
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    const saveSettings = page.getByRole('button', { name: 'Save settings' })
    await expect(saveSettings).toBeVisible()
    const [settingsMain, settingsPanel] = await Promise.all([
      page.locator('main').boundingBox(),
      saveSettings.locator('xpath=../../..').boundingBox(),
    ])
    if (!settingsMain || !settingsPanel) throw new Error('Settings panel must be visible')
    expect(
      Math.abs(
        settingsPanel.y + settingsPanel.height / 2 - (settingsMain.y + settingsMain.height / 2),
      ),
    ).toBeLessThanOrEqual(2)
    await saveSettings.click()
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
    await expect(progress).toHaveAttribute(
      'aria-valuetext',
      'Worked 3hr of 1hr 30m target; 1hr 30m overtime',
    )
    const spaciousCard = page.locator('[data-agenda-entry]').filter({ hasText: 'Spacious comment' })
    const entryContext = spaciousCard.locator('[aria-label="Entry context"]')
    expect(
      await entryContext.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true)
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
