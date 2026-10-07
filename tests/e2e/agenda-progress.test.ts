import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry, userSettings } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

test('per-day workday progress caps overtime and retains accessible segmented colors', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Agenda progress owner',
    email: `agenda-progress-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let clientId = ''
  let projectId = ''
  let releaseId = ''
  let ticketId = ''
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const clientRecord = await create('/api/clients', { name: 'Progress client' })
    clientId = clientRecord.id
    const projectRecord = await create('/api/projects', {
      clientId,
      name: 'Progress project',
      color: '#abcdef',
    })
    projectId = projectRecord.id
    const releaseRecord = await create('/api/releases', {
      projectId,
      name: 'Progress release',
    })
    releaseId = releaseRecord.id
    const ticketRecord = await create('/api/tickets', {
      releaseId,
      title: 'Overtime ratio',
    })
    ticketId = ticketRecord.id
    const settings = await page.request.patch('/api/settings', {
      data: {
        visibleStartMinute: 480,
        visibleEndMinute: 1200,
        workDayDurationMinutes: 300,
        startOfWeekDay: 1,
      },
    })
    expect(settings.ok()).toBe(true)
    const date = await page.evaluate(() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    })
    const entry = await create('/api/time-entries', {
      ticketId,
      date,
      startMinute: 540,
      durationMinutes: 330,
      description: 'Five and a half hours',
    })

    await page.goto(`/agenda?date=${date}`)
    await page.waitForLoadState('networkidle')
    const dateLabel = await page.evaluate(
      (value) =>
        new Intl.DateTimeFormat(navigator.language, {
          weekday: 'long',
          month: 'numeric',
          day: 'numeric',
        }).format(new Date(`${value}T12:00:00`)),
      date,
    )
    const progress = page.getByRole('progressbar', {
      name: `${dateLabel} workday progress`,
    })
    const setWorkdayTarget = async (workDayDurationMinutes: number) => {
      const response = await page.request.patch('/api/settings', {
        data: {
          visibleStartMinute: 480,
          visibleEndMinute: 1200,
          workDayDurationMinutes,
          startOfWeekDay: 1,
        },
      })
      expect(response.ok()).toBe(true)
      await page.reload()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByRole('progressbar')).toHaveCount(7)
    await expect(progress).toHaveAttribute('aria-valuenow', '300')
    await expect(progress).toHaveAttribute('aria-valuemax', '300')
    await expect(progress).toHaveAttribute(
      'aria-valuetext',
      'Worked 5hr 30m of 5hr target; 30m overtime',
    )
    const card = page.locator(`[data-agenda-ticket-id="${ticketId}"]`).filter({ visible: true })
    await expect(card).toContainText('5hr 30m')
    await expect(card).not.toContainText(/\b09:00–14:30\b/)
    const progressSegments = progress.locator('[aria-hidden="true"] [data-slot="segment"]')
    await expect(progressSegments).toHaveCount(2)
    expect(
      await progressSegments.evaluateAll((segments) =>
        segments.map((segment) => (segment as HTMLElement).style.width),
      ),
    ).toEqual(['90%', '10%'])
    await expect(progressSegments.nth(0).locator('[data-slot="indicator"]')).toHaveClass(/bg-info/)
    await expect(progressSegments.nth(1).locator('[data-slot="indicator"]')).toHaveClass(
      /bg-warning/,
    )

    await setWorkdayTarget(450)
    await expect(progress).toHaveAttribute('aria-valuetext', 'Worked 5hr 30m of 7hr 30m target')
    await expect(progressSegments).toHaveCount(1)
    await expect(progressSegments.nth(0).locator('[data-slot="indicator"]')).toHaveClass(/bg-info/)
    await setWorkdayTarget(390)
    await expect(progress).toHaveAttribute('aria-valuetext', 'Worked 5hr 30m of 6hr 30m target')
    await setWorkdayTarget(270)
    await expect(progress).toHaveAttribute(
      'aria-valuetext',
      'Worked 5hr 30m of 4hr 30m target; 1hr overtime',
    )
    await setWorkdayTarget(300)

    const update = await page.request.patch(`/api/time-entries/${entry.id}`, {
      data: { durationMinutes: 600 },
    })
    expect(update.ok()).toBe(true)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('progressbar')).toHaveCount(7)
    await expect(progress).toHaveAttribute(
      'aria-valuetext',
      'Worked 10hr of 5hr target; 5hr overtime',
    )
    expect(
      await progressSegments.evaluateAll((segments) =>
        segments.map((segment) => (segment as HTMLElement).style.width),
      ),
    ).toEqual(['0%', '100%'])
  } finally {
    if (ticketId) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ticketId))
      await db.delete(ticket).where(eq(ticket.id, ticketId))
    }
    if (releaseId) await db.delete(release).where(eq(release.id, releaseId))
    if (projectId) await db.delete(project).where(eq(project.id, projectId))
    if (clientId) await db.delete(client).where(eq(client.id, clientId))
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
  }
})
