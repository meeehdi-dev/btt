import { expect, test } from '@playwright/test'
import { eq, inArray, or } from 'drizzle-orm'
import { db } from '../../server/db'
import {
  client,
  project,
  release,
  ticket,
  ticketLink,
  ticketRelation,
} from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

async function cleanup(userId: string) {
  const clients = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId))
  const clientIds = clients.map((row) => row.id)
  const projects = clientIds.length
    ? await db.select({ id: project.id }).from(project).where(inArray(project.clientId, clientIds))
    : []
  const projectIds = projects.map((row) => row.id)
  const releases = projectIds.length
    ? await db
        .select({ id: release.id })
        .from(release)
        .where(inArray(release.projectId, projectIds))
    : []
  const releaseIds = releases.map((row) => row.id)
  const tickets = releaseIds.length
    ? await db.select({ id: ticket.id }).from(ticket).where(inArray(ticket.releaseId, releaseIds))
    : []
  const ticketIds = tickets.map((row) => row.id)
  if (ticketIds.length) {
    await db.delete(ticketLink).where(inArray(ticketLink.ticketId, ticketIds))
    await db
      .delete(ticketRelation)
      .where(
        or(
          inArray(ticketRelation.fromTicketId, ticketIds),
          inArray(ticketRelation.toTicketId, ticketIds),
        ),
      )
    await db.delete(ticket).where(inArray(ticket.id, ticketIds))
  }
  if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
  if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
  if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
}

test('ticket detail edits fields in place and creates links and relations in modals', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Ticket detail owner',
    email: `ticket-detail-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let ticketId = ''
  let relatedTicketId = ''
  let mobileContext: Awaited<ReturnType<typeof browser.newContext>> | undefined

  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok()).toBeTruthy()
      return response.json()
    }
    const clientA = await create('/api/clients', { name: 'Detail client A' })
    const clientB = await create('/api/clients', { name: 'Detail client B' })
    const projectA = await create('/api/projects', {
      clientId: clientA.id,
      name: 'Detail project A',
      color: '#abcdef',
    })
    const projectB = await create('/api/projects', {
      clientId: clientB.id,
      name: 'Detail project B',
      color: '#fedcba',
    })
    const releaseA = await create('/api/releases', {
      projectId: projectA.id,
      name: 'Detail release A',
    })
    const releaseB = await create('/api/releases', {
      projectId: projectB.id,
      name: 'Detail release B',
    })
    const currentTicket = await create('/api/tickets', {
      releaseId: releaseA.id,
      title: 'Detail ticket before edit',
      description: 'Initial description',
      status: 'Idea',
      estimateMinutes: 60,
    })
    ticketId = currentTicket.id
    const relatedTicket = await create('/api/tickets', {
      releaseId: releaseB.id,
      title: 'Related ticket candidate',
    })
    relatedTicketId = relatedTicket.id

    await page.goto(`/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Detail ticket before edit/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit ticket' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add time entry' })).toHaveCount(0)
    const archiveAction = page.getByRole('button', { name: 'Archive ticket' })
    const archiveBox = await archiveAction.boundingBox()
    if (!archiveBox) throw new Error('Archive action must be visible')
    expect(archiveBox.x).toBeGreaterThan((page.viewportSize()?.width ?? 0) / 2)
    await expect(archiveAction).toHaveClass(/text-sm/)
    await expect(page.getByRole('textbox', { name: 'Link label' })).toHaveCount(0)
    await expect(page.getByPlaceholder('Search tickets…')).toHaveCount(0)

    const titleAction = page.getByRole('button', { name: 'Edit ticket title' })
    await titleAction.focus()
    await page.keyboard.press('Enter')
    const titleDialog = page.getByRole('dialog', { name: 'Edit ticket title' })
    await titleDialog.getByRole('textbox', { name: 'Title' }).fill('Detail ticket updated')
    await titleDialog.getByRole('button', { name: 'Save title' }).click()
    await expect(page.getByRole('heading', { name: 'Detail ticket updated' })).toBeVisible()
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.title,
      )
      .toBe('Detail ticket updated')

    const status = page.getByRole('combobox', { name: 'Ticket status for Detail ticket updated' })
    await status.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('option', { name: 'Develop', exact: true }).click()
    await expect(status).toContainText('Develop')
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status,
      )
      .toBe('Develop')

    const description = page.getByRole('textbox', { name: 'Description for Detail ticket updated' })
    await description.fill('Description saved on blur')
    await description.press('Tab')
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.description,
      )
      .toBe('Description saved on blur')

    const estimate = page.getByRole('textbox', { name: 'Estimate for Detail ticket updated' })
    await estimate.fill('not an estimate')
    await estimate.press('Tab')
    await expect(
      page.getByText('Enter a positive whole-minute estimate (e.g. 1hr 30m or 90).'),
    ).toBeVisible()
    expect(
      (await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.estimateMinutes,
    ).toBe(60)
    await estimate.fill('1hr 30m')
    await estimate.press('Tab')
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket
            .estimateMinutes,
      )
      .toBe(90)

    const releaseSelector = page.getByRole('button', { name: 'Ticket release' })
    const fieldBoxes = await Promise.all([
      status.boundingBox(),
      estimate.boundingBox(),
      releaseSelector.boundingBox(),
    ])
    if (fieldBoxes.some((box) => !box)) throw new Error('Ticket fields must be visible')
    for (const box of fieldBoxes) expect(box!.height).toBeGreaterThan(30)
    await releaseSelector.click()
    await page.getByPlaceholder('Search releases…').fill('Detail release B')
    await page.getByRole('option', { name: 'Detail project B · Detail release B' }).click()
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
        name: 'Detail release B',
      }),
    ).toBeVisible()
    await expect
      .poll(
        async () =>
          (await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.releaseId,
      )
      .toBe(releaseB.id)

    await page.getByRole('button', { name: 'Add external link' }).click()
    const linkDialog = page.getByRole('dialog', { name: 'Add external link' })
    await linkDialog
      .getByRole('textbox', { name: 'URL*', exact: true })
      .fill('https://jira.atlassian.com/browse/DETAIL-1')
    await linkDialog.getByRole('button', { name: 'Add link' }).click()
    await expect(page.getByRole('link', { name: 'jira.atlassian.com', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Link ticket', exact: true }).click()
    const relationDialog = page.getByRole('dialog', { name: 'Link a related ticket' })
    await relationDialog.getByRole('button', { name: 'Related ticket' }).click()
    await page.getByPlaceholder('Search tickets…').fill('Related ticket candidate')
    await page.getByRole('option', { name: /Related ticket candidate/ }).click()
    await relationDialog.getByRole('button', { name: 'Link ticket', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Related ticket candidate' })).toBeVisible()
    expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).related).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: relatedTicketId })]),
    )

    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await mobileContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto(`/tickets/${ticketId}`)
    await mobilePage.waitForLoadState('networkidle')
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await mobilePage.getByRole('button', { name: 'Add external link' }).tap()
    const mobileDialog = mobilePage.getByRole('dialog', { name: 'Add external link' })
    await expect(mobileDialog.getByRole('textbox', { name: 'URL*', exact: true })).toBeVisible()
    await mobileDialog.getByRole('button', { name: 'Cancel' }).tap()
    await expect(mobileDialog).toHaveCount(0)

    await page.getByRole('button', { name: 'Archive ticket' }).click()
    await expect(page).toHaveURL(`/tickets/${ticketId}?archived=true`)
    await expect(page.getByText('Archived', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Restore ticket' }).click()
    await expect(page).toHaveURL(`/tickets/${ticketId}`)
    await expect(page.getByText('Archived', { exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: 'Archive ticket' }).click()
    await expect(page).toHaveURL(`/tickets/${ticketId}?archived=true`)
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Permanently delete' }).click()
    await expect(page).toHaveURL('/tickets')
    expect((await page.request.get(`/api/tickets/${ticketId}?archived=true`)).status()).toBe(404)
  } finally {
    await mobileContext?.close()
    await cleanup(owner.id)
    await helpers.deleteUser(owner.id)
  }
})

test('ticket detail reports safe write and refresh failures', async ({ page, context }) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Ticket detail failure owner',
    email: `ticket-detail-failure-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let ticketId = ''
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const clientRecord = await (
      await page.request.post('/api/clients', { data: { name: 'Failure detail client' } })
    ).json()
    const projectRecord = await (
      await page.request.post('/api/projects', {
        data: { clientId: clientRecord.id, name: 'Failure detail project', color: '#abcdef' },
      })
    ).json()
    const releaseRecord = await (
      await page.request.post('/api/releases', {
        data: { projectId: projectRecord.id, name: 'Failure detail release' },
      })
    ).json()
    const ticketRecord = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: releaseRecord.id, title: 'Failure detail ticket' },
      })
    ).json()
    ticketId = ticketRecord.id

    await page.goto(`/tickets/${ticketId}`)
    await page.waitForLoadState('networkidle')
    await page.route(`**/api/tickets/${ticketId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ statusMessage: 'private title failure' }),
        })
        return
      }
      await route.continue()
    })
    await page.getByRole('button', { name: 'Edit ticket title' }).click()
    const titleDialog = page.getByRole('dialog', { name: 'Edit ticket title' })
    await titleDialog.getByRole('textbox', { name: 'Title' }).fill('Failed title')
    await titleDialog.getByRole('button', { name: 'Save title' }).click()
    const titleFailure = titleDialog.getByText(
      'The request could not be completed. Please try again.',
    )
    await expect(titleFailure).toBeVisible()
    await expect(titleFailure).not.toContainText('private title failure')
    await expect(page.locator('h1[aria-current="page"]')).toContainText('Failure detail ticket')
    await page.unroute(`**/api/tickets/${ticketId}`)
    await titleDialog.getByRole('button', { name: 'Cancel' }).click()

    await page.route(`**/api/tickets/${ticketId}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ statusMessage: 'private refresh failure' }),
        })
        return
      }
      await route.continue()
    })
    const status = page.getByRole('combobox', { name: 'Ticket status for Failure detail ticket' })
    await status.click()
    await page.getByRole('option', { name: 'Review', exact: true }).click()
    const partialFailure = page
      .getByRole('alert')
      .filter({ hasText: 'Ticket updated; refresh failed' })
    await expect(partialFailure).toBeVisible()
    await expect(partialFailure).not.toContainText('private refresh failure')
    await expect(page.getByRole('button', { name: 'Retry loading ticket details' })).toBeVisible()
    expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
      'Review',
    )
    await page.unroute(`**/api/tickets/${ticketId}`)
    await page.getByRole('button', { name: 'Retry loading ticket details' }).click()
    await expect(status).toContainText('Review')
    await expect(page.getByRole('status')).toHaveText('Ticket details refreshed.')
  } finally {
    await cleanup(owner.id)
    await helpers.deleteUser(owner.id)
  }
})
