import { expect, test, type Locator, type Page } from '@playwright/test'
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

async function dragBetweenLanes(page: Page, board: Locator, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded()
  const sourceBox = await source.boundingBox()
  const boardBox = await board.boundingBox()
  if (!sourceBox || !boardBox) throw new Error('Board and card must be visible')
  const y = sourceBox.y + 8 // Noninteractive card padding, away from title/links/buttons.
  await page.mouse.move(sourceBox.x + 8, y)
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + 33, y, { steps: 5 })
  let destination = await target.boundingBox()
  if (!destination) throw new Error('Destination lane must exist')
  if (
    destination.x + destination.width / 2 > boardBox.x + boardBox.width - 10 ||
    destination.x + destination.width / 2 < boardBox.x + 10
  ) {
    const right = destination.x > boardBox.x + boardBox.width
    await page.mouse.move(right ? boardBox.x + boardBox.width - 15 : boardBox.x + 15, y, {
      steps: 10,
    })
    await expect
      .poll(async () => {
        const box = await target.boundingBox()
        return (
          !!box &&
          box.x + box.width / 2 >= boardBox.x + 10 &&
          box.x + box.width / 2 <= boardBox.x + boardBox.width - 10
        )
      })
      .toBeTruthy()
    destination = await target.boundingBox()
  }
  if (!destination) throw new Error('Destination lane disappeared')
  await page.mouse.move(destination.x + destination.width / 2, destination.y + 20, { steps: 10 })
  await page.mouse.up()
}

test('board status moves work across lanes, without reordering or changing card navigation', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'Board Status User',
    email: `nxmr-status-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    const c = await (
      await page.request.post('/api/clients', { data: { name: 'Move Client' } })
    ).json()
    const p = await (
      await page.request.post('/api/projects', {
        data: { clientId: c.id, name: 'Move Project', color: '#abcdef' },
      })
    ).json()
    const r = await (
      await page.request.post('/api/releases', { data: { projectId: p.id, name: 'Move Release' } })
    ).json()
    const otherRelease = await (
      await page.request.post('/api/releases', { data: { projectId: p.id, name: 'Other Release' } })
    ).json()
    const done = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Done source', status: 'Done' },
      })
    ).json()
    const idea = await (
      await page.request.post('/api/tickets', {
        data: {
          releaseId: r.id,
          title: 'Idea source',
          description: 'Board comment',
          relatedTicketIds: [done.id],
        },
      })
    ).json()
    const other = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: otherRelease.id, title: 'Other ticket', status: 'Review' },
      })
    ).json()
    const archived = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Archived source', status: 'Deploy' },
      })
    ).json()
    expect(
      (await page.request.patch(`/api/tickets/${archived.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    // The API is already authoritative for arbitrary transitions and enum validation.
    expect(
      (
        await page.request.patch(`/api/tickets/${done.id}`, { data: { status: 'Not a status' } })
      ).status(),
    ).toBe(400)

    let patchCount = 0
    let failNext = false
    let holdNext = false
    let releaseHeld: (() => void) | null = null
    await page.route('**/api/tickets/**', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue()
      patchCount++
      if (holdNext) {
        holdNext = false
        await new Promise<void>((resolve) => {
          releaseHeld = resolve
        })
      }
      if (failNext) {
        failNext = false
        return route.fulfill({ status: 503, body: 'Try again' })
      }
      return route.continue()
    })
    await page.addInitScript(() => {
      const nativeDragImage = DataTransfer.prototype.setDragImage
      DataTransfer.prototype.setDragImage = function (element, x, y) {
        if (element instanceof HTMLElement && element.dataset.boardTicketId)
          document.documentElement.dataset.dragImageTicketId = element.dataset.boardTicketId
        return nativeDragImage.call(this, element, x, y)
      }
    })
    await page.goto(`/tickets?release=${r.id}`)
    await page.waitForLoadState('networkidle')
    const board = page.getByRole('region', { name: 'Ticket board' })
    const lane = (status: string) => board.getByRole('region', { name: `${status} tickets` })
    const card = (id: string) => board.locator(`[data-board-ticket-id="${id}"]`)
    await expect(lane('Idea').getByText('Idea source')).toBeVisible()
    await expect(lane('Done').getByText('Done source')).toBeVisible()
    await expect(board.getByText('Other ticket')).toHaveCount(0)
    await expect(lane('Estimate').getByText('No tickets in Estimate.')).toBeVisible()
    await expect(card(idea.id)).toHaveAttribute('draggable', 'true')
    await expect(card(idea.id).getByText('Board comment')).toHaveCount(0)
    await expect(card(idea.id).getByLabel('Ticket context')).toBeVisible()
    await expect(board.getByText('No estimate')).toHaveCount(0)
    await expect(board.getByText('Change status')).toHaveCount(0)

    // Source lane drop and cancelled drag must not write anything.
    await card(idea.id).dragTo(lane('Idea'), { sourcePosition: { x: 8, y: 8 } })
    expect(patchCount).toBe(0)
    await card(idea.id).dragTo(page.getByRole('searchbox', { name: 'Search workspace' }), {
      sourcePosition: { x: 8, y: 8 },
    })
    await expect(page.locator('html')).toHaveAttribute('data-drag-image-ticket-id', idea.id)
    await card(idea.id).getByRole('link', { name: 'Idea source' }).dragTo(lane('Done'))
    await card(idea.id).getByRole('button', { name: 'Related tickets' }).hover()
    await page.locator(`[data-related-ticket-id="${done.id}"]`).dragTo(lane('Done'))
    await expect(page).toHaveURL(new RegExp(`/tickets\\?release=${r.id}$`))
    expect(patchCount).toBe(0)
    await board.evaluate((node) => {
      node.scrollLeft = 0
    })

    // Edge scrolling is owned by the board container, not the document.
    const box = await board.boundingBox()
    const sourceCard = await card(idea.id).boundingBox()
    if (!box || !sourceCard) throw new Error('Board and card must be visible')
    await page.mouse.move(sourceCard.x + 8, sourceCard.y + 8)
    await page.mouse.down()
    await page.mouse.move(sourceCard.x + 33, sourceCard.y + 8, { steps: 5 })
    const reviewBox = await lane('Review').boundingBox()
    if (!reviewBox) throw new Error('Review lane must be visible')
    await page.mouse.move(reviewBox.x + reviewBox.width / 2, reviewBox.y + 20, { steps: 8 })
    await expect(lane('Review')).toHaveClass(/border-primary/)
    await page.mouse.move(box.x + box.width - 15, sourceCard.y + 8, { steps: 12 })
    await expect.poll(() => board.evaluate((node) => node.scrollLeft)).toBeGreaterThan(100)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await page.mouse.move(box.x + 20, box.y - 40)
    await page.mouse.up()
    expect(patchCount).toBe(0)
    await board.evaluate((node) => {
      node.scrollLeft = 0
    })

    // Skip all intermediate lanes; dropping on an empty one also works.
    await dragBetweenLanes(page, board, card(idea.id), lane('Done'))
    await expect(lane('Done').getByText('Idea source')).toBeVisible()
    expect(patchCount).toBe(1)
    await dragBetweenLanes(page, board, card(done.id), lane('Review'))
    await expect(lane('Review').getByText('Done source')).toBeVisible()
    await dragBetweenLanes(page, board, card(done.id), lane('Done'))
    await expect(lane('Done').getByText('Done source')).toBeVisible()
    await dragBetweenLanes(page, board, card(done.id), lane('Idea'))
    await expect(lane('Idea').getByText('Done source')).toBeVisible()
    await dragBetweenLanes(page, board, card(idea.id), lane('Review'))
    await expect(lane('Review').getByText('Idea source')).toBeVisible()
    await dragBetweenLanes(page, board, card(done.id), lane('Estimate'))
    await expect(lane('Estimate').getByText('Done source')).toBeVisible()
    expect(patchCount).toBe(6)
    await card(idea.id).getByRole('button', { name: 'Related tickets' }).hover()
    await expect(page.locator(`[data-related-ticket-id="${done.id}"]`)).toBeVisible()
    await card(idea.id).getByRole('button', { name: 'client: Move Client; actions' }).click()
    await expect(page.getByRole('button', { name: 'Filter by Move Client' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open Move Client' })).toHaveAttribute(
      'href',
      `/clients/${c.id}`,
    )
    await page.keyboard.press('Escape')
    await card(idea.id).getByRole('button', { name: 'release: Move Release; actions' }).click()
    await expect(page.getByRole('link', { name: 'Open Move Release' })).toHaveAttribute(
      'href',
      `/releases/${r.id}`,
    )
    await page.keyboard.press('Escape')
    await card(idea.id).getByRole('button', { name: 'Related tickets' }).hover()
    await page.locator(`[data-related-ticket-id="${done.id}"]`).click()
    await expect(page).toHaveURL(new RegExp(`/tickets\\?release=${r.id}$`))
    await expect(card(done.id)).toHaveClass(/border-primary/)

    // Failure keeps the source card in place and offers an explicit retry.
    failNext = true
    holdNext = true
    await dragBetweenLanes(page, board, card(done.id), lane('Test'))
    await expect.poll(() => !!releaseHeld).toBeTruthy()
    await expect(card(done.id)).toHaveAttribute('aria-busy', 'true')
    await expect(card(done.id).getByText('Moving…')).toBeVisible()
    await expect(lane('Estimate').getByText('Done source')).toBeVisible()
    if (!releaseHeld) throw new Error('Held PATCH must be released')
    releaseHeld()
    await expect(page.getByRole('alert')).toContainText('Could not update ticket')
    await expect(page.getByRole('alert')).not.toContainText('Try again')
    await expect(lane('Estimate').getByText('Done source')).toBeVisible()
    await page.getByRole('button', { name: 'Retry status change' }).click()
    await expect(lane('Test').getByText('Done source')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)

    // Status changes on the board use desktop drag; the edit form remains the non-drag route.
    await expect(card(idea.id).getByRole('button', { name: /Move Idea source/ })).toHaveCount(0)
    await dragBetweenLanes(page, board, card(idea.id), lane('Test'))
    await expect(lane('Test').getByText('Idea source')).toBeVisible()
    await card(idea.id).getByRole('link', { name: 'Idea source' }).click()
    await expect(page).toHaveURL(`/tickets/${idea.id}`)
    const ticketMetadata = page.getByLabel('Ticket metadata')
    const ticketStatus = ticketMetadata.getByLabel('Status: Test')
    const releaseLink = page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Move Release' })
    await expect(ticketStatus.locator('[aria-hidden="true"]')).toBeVisible()
    await expect(releaseLink).toBeVisible()
    await expect(releaseLink).toHaveAttribute('href', `/releases/${r.id}`)
    await page.goto(`/releases/${r.id}`)
    await expect(page.getByText('No estimate')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'View grouped tickets' })).toHaveCount(0)
    const releaseTicket = page.locator(`[data-release-ticket-id="${idea.id}"]`)
    await expect(releaseTicket.locator('div.flex.items-center').first()).toBeVisible()
    await expect(releaseTicket.locator('div.flex.items-center').first()).not.toContainText('Test ·')

    await page.goto(`/tickets?release=${r.id}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Show archived' }).click()
    await expect(card(archived.id)).toBeVisible()
    await expect(card(archived.id)).toHaveAttribute('draggable', 'false')
    await expect(card(archived.id).getByRole('button', { name: /^Move to / })).toHaveCount(0)
    await expect(
      card(archived.id).getByRole('button', { name: /^(client|project|release): .*; actions$/ }),
    ).toHaveCount(3)

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    try {
      await mobile
        .context()
        .addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
      await mobile.goto(`/tickets?release=${r.id}`)
      await mobile.waitForLoadState('networkidle')
      const testLane = mobile.getByRole('region', { name: 'Test tickets' })
      await testLane.getByRole('button', { name: 'Test: 2 tickets' }).click()
      const mobileCard = mobile
        .locator('[aria-label="Ticket statuses"]')
        .locator(`[data-board-ticket-id="${idea.id}"]`)
      await expect(mobileCard).toBeVisible()
      await expect(mobileCard).toHaveAttribute('draggable', 'false')
      await expect(mobile.getByRole('combobox', { name: /Change status/ })).toHaveCount(0)
      await mobileCard.dragTo(mobile.getByRole('button', { name: 'Open menu' }), {
        sourcePosition: { x: 8, y: 8 },
      })
      await expect(testLane.getByText('Idea source')).toBeVisible()
      await expect(mobileCard.getByRole('button', { name: /Move Idea source/ })).toHaveCount(0)
      await mobileCard.getByRole('link', { name: 'Idea source' }).click()
      await expect(mobile).toHaveURL(`/tickets/${idea.id}`)
      await mobile.getByRole('link', { name: 'Edit' }).click()
      await expect(mobile.getByRole('combobox', { name: 'Status' })).toBeVisible()
      await mobile.goto(`/tickets?release=${r.id}`)
      await mobile.waitForLoadState('networkidle')
      await mobile.getByRole('button', { name: 'Show archived' }).click()
      const deploy = mobile.getByRole('region', { name: 'Deploy tickets' })
      await deploy.getByRole('button', { name: 'Deploy: 1 tickets' }).click()
      await expect(deploy.locator(`[data-board-ticket-id="${archived.id}"]`)).toBeVisible()
      await expect(deploy.locator(`[data-board-ticket-id="${archived.id}"]`)).toHaveAttribute(
        'draggable',
        'false',
      )
      expect(
        await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy()
    } finally {
      await mobile.close()
    }
    expect(
      (
        await (await page.request.get(`/api/tickets?releaseId=${otherRelease.id}`)).json()
      ).tickets.map((item: { ticket: { id: string } }) => item.ticket.id),
    ).toContain(other.id)
  } finally {
    const clients = await db
      .select({ id: client.id })
      .from(client)
      .where(eq(client.userId, user.id))
    const clientIds = clients.map(({ id }) => id)
    const projects = clientIds.length
      ? await db
          .select({ id: project.id })
          .from(project)
          .where(inArray(project.clientId, clientIds))
      : []
    const projectIds = projects.map(({ id }) => id)
    const releases = projectIds.length
      ? await db
          .select({ id: release.id })
          .from(release)
          .where(inArray(release.projectId, projectIds))
      : []
    const releaseIds = releases.map(({ id }) => id)
    const tickets = releaseIds.length
      ? await db.select({ id: ticket.id }).from(ticket).where(inArray(ticket.releaseId, releaseIds))
      : []
    const ids = tickets.map(({ id }) => id)
    if (ids.length) {
      await db.delete(ticketLink).where(inArray(ticketLink.ticketId, ids))
      await db
        .delete(ticketRelation)
        .where(
          or(inArray(ticketRelation.fromTicketId, ids), inArray(ticketRelation.toTicketId, ids)),
        )
      await db.delete(ticket).where(inArray(ticket.id, ids))
    }
    if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
    if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
    if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
    await helpers.deleteUser(user.id)
  }
})
