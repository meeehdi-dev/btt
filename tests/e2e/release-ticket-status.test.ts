import { expect, test as base, type APIRequestContext } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket } from '../../server/db/schema'
import { ticketStatuses } from '../../shared/ticket-status'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

async function createRecord(
  request: APIRequestContext,
  path: string,
  data: unknown,
): Promise<{ id: string }> {
  const response = await request.post(path, { data })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

const test = base.extend<{
  releaseFixture: {
    releaseId: string
    create: (path: string, data: unknown) => Promise<{ id: string }>
  }
}>({
  releaseFixture: async ({ page, context }, use) => {
    const helpers = (await testAuth.$context).test
    const owner = helpers.createUser({
      name: 'Release owner',
      email: `release-${crypto.randomUUID()}@example.com`,
    })
    await helpers.saveUser(owner)
    let clientId = ''
    let projectId = ''
    let releaseId = ''
    try {
      await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
      const create = (path: string, data: unknown) => createRecord(page.request, path, data)
      clientId = (await create('/api/clients', { name: 'Release client' })).id
      projectId = (
        await create('/api/projects', { clientId, name: 'Release project', color: '#abcdef' })
      ).id
      releaseId = (await create('/api/releases', { projectId, name: 'Undated maintenance' })).id
      await use({ releaseId, create })
    } finally {
      await db.transaction(async (tx) => {
        if (releaseId) {
          await tx.delete(ticket).where(eq(ticket.releaseId, releaseId))
          await tx.delete(release).where(eq(release.id, releaseId))
        }
        if (projectId) await tx.delete(project).where(eq(project.id, projectId))
        if (clientId) await tx.delete(client).where(eq(client.id, clientId))
      })
      await helpers.deleteUser(owner.id)
    }
  },
})

test('release ticket status selector changes status and handles failures', async ({
  page,
  releaseFixture,
}) => {
  const { releaseId, create } = releaseFixture
  await page.goto(`/releases/${releaseId}`)
  await expect(page.getByRole('heading', { name: 'No tickets yet' })).toBeVisible()
  await expect(page.getByRole('separator', { name: 'Done' })).toHaveCount(0)
  const title = 'Release status ticket'
  const ticketRecord = await create('/api/tickets', {
    releaseId,
    title,
    status: 'Idea',
  })
  const ticketId = ticketRecord.id

  await page.goto(`/releases/${releaseId}`)
  await page.waitForLoadState('networkidle')
  const card = page.locator(`[data-release-ticket-id="${ticketId}"]`)
  const status = card.getByRole('combobox', { name: `Ticket status for ${title}` })
  const option = (value: string) => page.getByRole('option', { name: value, exact: true })
  await expect(status).toContainText('Idea')
  await expect(page.locator('[data-release-ticket-group="unfinished"]')).toHaveCount(1)
  await expect(page.getByRole('separator', { name: 'Done' })).toHaveCount(0)
  await expect(status.locator('[data-slot="trailingIcon"]')).toHaveCount(0)

  await status.focus()
  await page.keyboard.press('Enter')
  for (const value of ticketStatuses) {
    await expect(option(value)).toBeVisible()
    const label = option(value).locator('[data-slot="itemLabel"]')
    const labelFits = await label.evaluate((element) => element.scrollWidth <= element.clientWidth)
    expect(labelFits, `${value} status option should not be truncated`).toBe(true)
  }
  await expect(option('Idea')).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(`/releases/${releaseId}`)

  const patchGate = Promise.withResolvers<void>()
  const patchStarted = Promise.withResolvers<void>()
  const ticketEndpoint = `**/api/tickets/${ticketId}`
  await page.route(ticketEndpoint, async (route) => {
    patchStarted.resolve()
    await patchGate.promise
    await route.continue()
  })
  await status.click()
  await option('Develop').click()
  await patchStarted.promise
  await expect(page.locator('p.sr-only[role="status"]')).toHaveText(`Changing ${title} to Develop.`)
  await expect(status).toBeDisabled()
  await expect(status.locator('[data-slot="trailingIcon"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark release as done' })).toBeDisabled()
  patchGate.resolve()
  await expect(page.locator('p.sr-only[role="status"]')).toHaveText(`Changed ${title} to Develop.`)
  await expect(status).toContainText('Develop')
  await expect(page).toHaveURL(`/releases/${releaseId}`)
  await page.unroute(ticketEndpoint)
  expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
    'Develop',
  )

  await page.route(ticketEndpoint, async (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ statusMessage: 'Simulated status update failure' }),
    }),
  )
  await status.click()
  await option('Done').click()
  await expect(page.getByRole('alert')).toContainText('Could not change ticket status')
  await expect(page.getByRole('separator', { name: 'Done' })).toHaveCount(0)
  await expect(status).toContainText('Develop')
  await page.unroute(ticketEndpoint)
  expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
    'Develop',
  )

  const releaseTicketsQuery = (url: URL) =>
    url.pathname === '/api/tickets' && url.searchParams.get('releaseId') === releaseId
  await page.route(releaseTicketsQuery, async (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ statusMessage: 'Simulated release ticket refresh failure' }),
    }),
  )
  await status.click()
  await option('Done').click()
  await expect(page.getByRole('alert')).toContainText('Ticket updated; release refresh failed')
  await expect(page.getByRole('button', { name: 'Retry release ticket refresh' })).toBeVisible()
  await expect(card).toHaveCount(0)
  expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
    'Done',
  )
  await page.unroute(releaseTicketsQuery)
  await page.getByRole('button', { name: 'Retry release ticket refresh' }).click()
  await expect(status).toBeEnabled()
  await expect(status).toContainText('Done')
  await expect(page.getByRole('separator', { name: 'Done' })).toBeVisible()
  await expect(page.locator('[data-release-ticket-group="unfinished"]')).toHaveCount(0)
  await expect(page.locator('p.sr-only[role="status"]')).toHaveText(
    'Release ticket data refreshed.',
  )

  await status.click()
  await option('On hold').click()
  await expect(status).toContainText('On hold')
  await expect(page.getByRole('separator', { name: 'Done' })).toHaveCount(0)
  await expect(status.locator('[data-ticket-status-icon="On hold"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark release as done' })).toBeEnabled()
  await expect(page).toHaveURL(`/releases/${releaseId}`)
  expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
    'On hold',
  )

  await card.getByRole('link', { name: `Open ticket ${title}` }).click()
  await expect(page).toHaveURL(`/tickets/${ticketId}`)
})

test('release groups Done tickets below an odd unfinished grid with keyboard status changes', async ({
  page,
  releaseFixture,
}, testInfo) => {
  const { releaseId, create } = releaseFixture
  const records: { id: string; status: string }[] = []
  for (const [index, status] of ['Done', 'Idea', 'Done', 'On hold', 'Develop'].entries()) {
    const record = await create('/api/tickets', {
      releaseId,
      title: `Grouping ${index} — a long maintenance ticket title that must truncate without pushing usage or context controls out of the card`,
      status,
      ...(index % 2 ? { estimateMinutes: 60 } : {}),
    })
    records.push({ id: record.id, status })
  }
  // Quiet Done tickets must remain visible in this undated release.
  await db
    .update(ticket)
    .set({ updatedAt: new Date('2025-01-01') })
    .where(
      inArray(
        ticket.id,
        records.filter((record) => record.status === 'Done').map((record) => record.id),
      ),
    )
  await page.goto(`/releases/${releaseId}`)
  await waitForClientMount(page)
  const cards = page.locator('[data-release-ticket-id]')
  const unfinished = page.locator('[data-release-ticket-group="unfinished"]')
  const done = page.locator('[data-release-ticket-group="done"]')
  const separator = page.getByRole('separator', { name: 'Done' })
  await expect(unfinished.locator('article')).toHaveCount(3)
  await expect(done.locator('article')).toHaveCount(2)
  await page.getByRole('button', { name: 'Mark release as done' }).click()
  const confirmation = page.getByRole('dialog', { name: 'Mark release as done?' })
  await expect(confirmation.getByText('2 of 5 tickets are done.', { exact: false })).toBeVisible()
  await confirmation.getByRole('button', { name: 'Cancel' }).click()
  for (const width of [1280, 1600]) {
    await page.setViewportSize({ width, height: 900 })
    const [unfinishedBox, doneBox, separatorBox] = await Promise.all([
      unfinished.boundingBox(),
      done.boundingBox(),
      separator.boundingBox(),
    ])
    if (!unfinishedBox || !doneBox || !separatorBox)
      throw new Error('Both grids and separator must be visible')
    expect(separatorBox.y).toBeGreaterThanOrEqual(unfinishedBox.y + unfinishedBox.height)
    expect(doneBox.y).toBeGreaterThanOrEqual(separatorBox.y + separatorBox.height)
    expect(separatorBox.width).toBeCloseTo(unfinishedBox.width, 0)
    expect(doneBox.x).toBe(unfinishedBox.x)
    for (const dark of [false, true]) {
      await page
        .locator('html')
        .evaluate((element, enabled) => element.classList.toggle('dark', enabled), dark)
      await page.screenshot({
        path: testInfo.outputPath(`release-${width}-${dark ? 'dark' : 'light'}.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }
  }
  const moved = unfinished.locator('article').first()
  const movedId = await moved.getAttribute('data-release-ticket-id')
  const control = page.locator(`[data-release-ticket-id="${movedId}"]`).getByRole('combobox')
  const documentMarker = await page.evaluate(() => {
    const marker = crypto.randomUUID()
    document.documentElement.dataset.groupingMarker = marker
    return marker
  })
  await control.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('option', { name: 'Done', exact: true }).press('Enter')
  await expect(done.locator('article')).toHaveCount(3)
  await expect(control).toBeEnabled()
  await expect(control).toContainText('Done')
  await control.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('option', { name: 'On hold', exact: true }).press('Enter')
  await expect(unfinished.locator('article')).toHaveCount(3)
  await expect(control).toContainText('On hold')
  await expect(page.locator('html')).toHaveAttribute('data-grouping-marker', documentMarker)
  await page.getByRole('button', { name: 'New ticket', exact: true }).click()
  const creation = page.getByRole('dialog', { name: 'New ticket', exact: true })
  await creation.getByRole('textbox', { name: /^Title/ }).fill('New unfinished ticket')
  await creation.getByRole('button', { name: 'Create ticket', exact: true }).click()
  await expect(creation).toHaveCount(0)
  await expect(unfinished.locator('article')).toHaveCount(4)
  await expect(done.locator('article')).toHaveCount(2)
  await expect(cards).toHaveCount(6)
})
