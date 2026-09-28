import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, userSettings } from '../../server/db/schema'
import { ticketStatuses } from '../../shared/ticket-status'
import { testAuth } from '../../server/utils/auth-test'

test('release ticket status selector changes status and handles failures', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Release status owner',
    email: `release-status-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let clientId = ''
  let projectId = ''
  let releaseId = ''
  let ticketId = ''
  let mobileContext: Awaited<ReturnType<typeof browser.newContext>> | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const clientRecord = await create('/api/clients', { name: 'Release status client' })
    clientId = clientRecord.id
    const projectRecord = await create('/api/projects', {
      clientId,
      name: 'Release status project',
      color: '#abcdef',
    })
    projectId = projectRecord.id
    const releaseRecord = await create('/api/releases', {
      projectId,
      name: 'Release status release',
    })
    releaseId = releaseRecord.id
    const title = 'Release status ticket'
    const ticketRecord = await create('/api/tickets', {
      releaseId,
      title,
      status: 'Idea',
    })
    ticketId = ticketRecord.id

    await page.goto(`/releases/${releaseId}`)
    await page.waitForLoadState('networkidle')
    const card = page.locator(`[data-release-ticket-id="${ticketId}"]`)
    const status = card.getByRole('combobox', { name: `Ticket status for ${title}` })
    const option = (value: string) => page.getByRole('option', { name: value, exact: true })
    await expect(status).toContainText('Idea')
    await expect(status.locator('[data-slot="trailingIcon"]')).toHaveCount(0)

    await status.focus()
    await page.keyboard.press('Enter')
    for (const value of ticketStatuses) {
      await expect(option(value)).toBeVisible()
      const label = option(value).locator('[data-slot="itemLabel"]')
      const labelFits = await label.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      )
      expect(labelFits, `${value} status option should not be truncated`).toBe(true)
    }
    await expect(option('Idea')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(`/releases/${releaseId}`)

    let releasePatch!: () => void
    let signalPatchStarted!: () => void
    const patchGate = new Promise<void>((resolve) => {
      releasePatch = resolve
    })
    const patchStarted = new Promise<void>((resolve) => {
      signalPatchStarted = resolve
    })
    const ticketEndpoint = `**/api/tickets/${ticketId}`
    await page.route(ticketEndpoint, async (route) => {
      signalPatchStarted()
      await patchGate
      await route.continue()
    })
    await status.click()
    await option('Develop').click()
    await patchStarted
    await expect(page.getByRole('status')).toHaveText(`Changing ${title} to Develop.`)
    await expect(status).toBeDisabled()
    await expect(status.locator('[data-slot="trailingIcon"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark release as done' })).toBeDisabled()
    releasePatch()
    await expect(page.getByRole('status')).toHaveText(`Changed ${title} to Develop.`)
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
    await option('Review').click()
    await expect(page.getByRole('alert')).toContainText('Could not change ticket status')
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
    await expect(page.getByRole('status')).toHaveText('Release ticket data refreshed.')

    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await mobileContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto(`/releases/${releaseId}`)
    await mobilePage.waitForLoadState('networkidle')
    const mobileCard = mobilePage.locator(`[data-release-ticket-id="${ticketId}"]`)
    const mobileStatus = mobileCard.getByRole('combobox', { name: `Ticket status for ${title}` })
    await mobileStatus.tap()
    const mobileOption = (value: string) =>
      mobilePage.getByRole('option', { name: value, exact: true })
    for (const value of ticketStatuses) {
      await expect(mobileOption(value)).toBeVisible()
      const label = mobileOption(value).locator('[data-slot="itemLabel"]')
      const labelFits = await label.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      )
      expect(labelFits, `${value} mobile status option should not be truncated`).toBe(true)
    }

    await mobileOption('Deploy').tap()
    await expect(mobileStatus).toContainText('Deploy')
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await expect(mobilePage).toHaveURL(`/releases/${releaseId}`)

    await card.getByRole('link', { name: `Open ticket ${title}` }).click()
    await expect(page).toHaveURL(`/tickets/${ticketId}`)
  } finally {
    await mobileContext?.close()
    if (ticketId) await db.delete(ticket).where(eq(ticket.id, ticketId))
    if (releaseId) await db.delete(release).where(eq(release.id, releaseId))
    if (projectId) await db.delete(project).where(eq(project.id, projectId))
    if (clientId) await db.delete(client).where(eq(client.id, clientId))
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
  }
})
