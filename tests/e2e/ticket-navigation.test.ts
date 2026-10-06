import { expect, test } from '@playwright/test'
import { waitForClientMount } from './wait-for-client-mount'
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

test('board hierarchy actions and related-ticket icons locate visible targets', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'Board Navigation User',
    email: `nxmr-board-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    const c = await (
      await page.request.post('/api/clients', { data: { name: 'Nav Client' } })
    ).json()
    const p = await (
      await page.request.post('/api/projects', {
        data: { clientId: c.id, name: 'Nav Project', color: '#abcdef' },
      })
    ).json()
    const r = await (
      await page.request.post('/api/releases', { data: { projectId: p.id, name: 'Nav Release' } })
    ).json()
    const otherRelease = await (
      await page.request.post('/api/releases', { data: { projectId: p.id, name: 'Other Release' } })
    ).json()
    const target = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Target ticket', status: 'Done' },
      })
    ).json()
    const cross = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: otherRelease.id, title: 'Cross release target', status: 'Test' },
      })
    ).json()
    const source = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Source ticket', relatedTicketIds: [target.id, cross.id] },
      })
    ).json()

    const response = await (await page.request.get(`/api/tickets?releaseId=${r.id}`)).json()
    const entry = response.tickets.find(
      (item: { ticket: { id: string } }) => item.ticket.id === source.id,
    )
    expect(entry.clientId).toBe(c.id)
    expect(entry.projectId).toBe(p.id)
    expect(entry.relatedTickets.map((item: { id: string }) => item.id).toSorted()).toEqual(
      [target.id, cross.id].toSorted(),
    )

    await page.goto('/tickets')
    await waitForClientMount(page)
    const board = page.getByRole('region', { name: 'Ticket board' })
    const sourceCard = board.locator(`[data-board-ticket-id="${source.id}"]`)
    await page.getByRole('button', { name: 'Filter client' }).click()
    await page.getByRole('option', { name: 'Nav Client' }).click()
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText('Nav Client')
    await page.getByRole('button', { name: 'Filter release' }).click()
    await page.getByPlaceholder('Search releases…').fill('Nav')
    await page.getByRole('option', { name: 'Nav Release' }).click()
    await expect(board.getByText('Cross release target')).toHaveCount(0)
    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByPlaceholder('Search tickets…').fill('Source')
    await page.getByRole('option', { name: 'Source ticket' }).click()
    await expect(sourceCard).toBeVisible()
    await expect(board.locator(`[data-board-ticket-id="${target.id}"]`)).toHaveCount(0)
    await page.getByRole('button', { name: 'Clear filters' }).click()
    const targetCard = board.locator(`[data-board-ticket-id="${target.id}"]`)
    await sourceCard.getByRole('button', { name: 'Related tickets' }).hover()
    const shortcut = page.locator(`[data-related-ticket-id="${target.id}"]`)
    await expect(shortcut).toBeVisible()
    await expect(targetCard).toHaveClass(/border-default/)
    await shortcut.hover()
    await expect(targetCard).toHaveClass(/border-primary/)
    await board.getByRole('heading', { name: 'Idea' }).hover()
    await expect(targetCard).toHaveClass(/border-default/)
    await shortcut.click()
    await expect(page).toHaveURL(/\/tickets$/)
    await expect(targetCard).toHaveClass(/border-primary/)
    await expect.poll(() => board.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    await board.getByRole('heading', { name: 'Idea' }).hover()
    await expect(targetCard).toHaveClass(/border-primary/)
    // Clicking another relation switches the pinned border.
    await sourceCard.getByRole('button', { name: 'Related tickets' }).focus()
    await sourceCard.getByRole('button', { name: 'Related tickets' }).press('Enter')
    const crossShortcut = page.locator(`[data-related-ticket-id="${cross.id}"]`)
    await crossShortcut.focus()
    await crossShortcut.press('Enter')
    await expect(board.locator(`[data-board-ticket-id="${cross.id}"]`)).toHaveClass(
      /border-primary/,
    )
    await expect(targetCard).toHaveClass(/border-default/)

    for (const [kind, name, destination] of [
      ['client', 'Nav Client', `/clients/${c.id}`],
      ['project', 'Nav Project', `/projects/${p.id}`],
      ['release', 'Nav Release', `/releases/${r.id}`],
    ]) {
      await page.goto('/tickets')
      await waitForClientMount(page)
      const hierarchyBadge = board
        .locator(`[data-board-ticket-id="${source.id}"]`)
        .getByRole('button', { name: `${kind}: ${name}; actions` })
      await hierarchyBadge.click()
      const openAction = page.getByRole('link', { name: `Open ${name}`, exact: true })
      await expect(openAction).toHaveAttribute('href', destination)
      await openAction.click()
      await expect(page).toHaveURL(destination)
      expect(context.pages()).toHaveLength(1)
    }

    // The cross-release target is not in this filtered board, so the real link navigates to detail.
    await page.goto(`/tickets?release=${r.id}`)
    await waitForClientMount(page)
    await page
      .getByRole('region', { name: 'Ticket board' })
      .locator(`[data-board-ticket-id="${source.id}"]`)
      .getByRole('button', { name: 'Related tickets' })
      .hover()
    await page.locator(`[data-related-ticket-id="${cross.id}"]`).click()
    await expect(page).toHaveURL(`/tickets/${cross.id}`)

    // Archived targets and descendants of an archived parent do not leak a shortcut.
    expect(
      (await page.request.patch(`/api/tickets/${target.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    let current = await (await page.request.get('/api/tickets')).json()
    expect(
      current.tickets
        .find((item: { ticket: { id: string } }) => item.ticket.id === source.id)
        .relatedTickets.map((item: { id: string }) => item.id),
    ).not.toContain(target.id)
    await page.goto('/tickets')
    await expect(
      page
        .getByRole('region', { name: 'Ticket board' })
        .locator(`[data-board-ticket-id="${source.id}"]`)
        .locator(`[data-related-ticket-id="${target.id}"]`),
    ).toHaveCount(0)
    expect(
      (await page.request.patch(`/api/tickets/${target.id}`, { data: { archived: false } })).ok(),
    ).toBeTruthy()
    expect(
      (
        await page.request.patch(`/api/releases/${otherRelease.id}`, { data: { archived: true } })
      ).ok(),
    ).toBeTruthy()
    current = await (await page.request.get('/api/tickets')).json()
    expect(
      current.tickets
        .find((item: { ticket: { id: string } }) => item.ticket.id === source.id)
        .relatedTickets.map((item: { id: string }) => item.id),
    ).not.toContain(cross.id)
    await page.goto('/tickets')
    await expect(
      page
        .getByRole('region', { name: 'Ticket board' })
        .locator(`[data-board-ticket-id="${source.id}"]`)
        .locator(`[data-related-ticket-id="${cross.id}"]`),
    ).toHaveCount(0)
    expect(
      (
        await page.request.patch(`/api/releases/${otherRelease.id}`, { data: { archived: false } })
      ).ok(),
    ).toBeTruthy()
    const unrelated = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'No relations', status: 'Estimate' },
      })
    ).json()
    await page.goto('/tickets')
    await expect(
      page
        .getByRole('region', { name: 'Ticket board' })
        .locator(`[data-board-ticket-id="${unrelated.id}"]`)
        .locator('[aria-label="Related tickets"]'),
    ).toHaveCount(0)
    await page.goto(`/tickets/${source.id}`)
    await expect(page.getByRole('link', { name: 'Nav Client' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Nav Project' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Nav Release' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Unlink Target ticket' }).locator('..'),
    ).not.toContainText('>')
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
