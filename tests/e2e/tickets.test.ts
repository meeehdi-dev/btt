import { expect, test } from '@playwright/test'
import { eq, inArray, or } from 'drizzle-orm'
import { testAuth } from '../../server/utils/auth-test'
import { db } from '../../server/db'
import {
  client,
  project,
  release,
  ticket,
  ticketLink,
  ticketRelation,
} from '../../server/db/schema'

const uuidv7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

test('release tickets, workflow, links and relations respect auth and archive lifecycle', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const users = await Promise.all(
    ['A', 'B'].map(async (label) => {
      const user = helpers.createUser({
        name: `M3 ${label}`,
        email: `nxmr-m3-${crypto.randomUUID()}@example.com`,
      })
      await helpers.saveUser(user)
      return user
    }),
  )
  const [owner, stranger] = users
  if (!owner || !stranger) throw new Error('Fixtures unavailable')
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    await page.goto('/tickets/new')
    await expect(page.getByRole('heading', { name: 'Create a release first' })).toBeVisible()
    const c = await (
      await page.request.post('/api/clients', { data: { name: 'Ticket Client' } })
    ).json()
    const p = await (
      await page.request.post('/api/projects', {
        data: { clientId: c.id, name: 'Ticket Project', color: '#abcdef' },
      })
    ).json()
    const r = await (
      await page.request.post('/api/releases', {
        data: { projectId: p.id, name: 'Ticket Release' },
      })
    ).json()
    expect(
      (await page.request.post('/api/tickets', { data: { title: 'Missing release' } })).status(),
    ).toBe(400)
    expect(
      (
        await page.request.post('/api/tickets', {
          data: { releaseId: r.id, title: 'Invalid estimate', estimateMinutes: -1 },
        })
      ).status(),
    ).toBe(400)
    const aResponse = await page.request.post('/api/tickets', {
      data: { releaseId: r.id, title: 'First ticket', estimateMinutes: 45 },
    })
    expect(aResponse.ok()).toBeTruthy()
    const a = await aResponse.json()
    expect(a.id).toMatch(uuidv7)
    const b = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: r.id, title: 'Second ticket', status: 'Review' },
      })
    ).json()
    expect(b.id).toMatch(uuidv7)
    const secondRelease = await (
      await page.request.post('/api/releases', { data: { projectId: p.id, name: 'Other Release' } })
    ).json()
    const crossRelease = await (
      await page.request.post('/api/tickets', {
        data: { releaseId: secondRelease.id, title: 'Cross-release ticket' },
      })
    ).json()
    expect(
      (
        await page.request.post(`/api/tickets/${b.id}/relations`, {
          data: { ticketId: crossRelease.id },
        })
      ).ok(),
    ).toBeTruthy()
    expect((await page.request.get(`/api/tickets/${b.id}`)).ok()).toBeTruthy()
    const linkedCreation = await page.request.post('/api/tickets', {
      data: {
        releaseId: r.id,
        title: 'Created with extras',
        links: [
          { label: 'PR', url: 'https://example.com/pr' },
          { label: 'Design', url: 'https://example.com/design' },
        ],
        relatedTicketIds: [b.id, crossRelease.id],
      },
    })
    expect(linkedCreation.ok()).toBeTruthy()
    const linkedId = (await linkedCreation.json()).id as string
    const linkedDetails = await (await page.request.get(`/api/tickets/${linkedId}`)).json()
    expect(linkedDetails.links.map((link: { label: string }) => link.label)).toEqual([
      'PR',
      'Design',
    ])
    expect(linkedDetails.related.map((other: { id: string }) => other.id).toSorted()).toEqual(
      [b.id, crossRelease.id].toSorted(),
    )
    const ticketCount = (await (await page.request.get('/api/tickets')).json()).tickets.length
    for (const data of [
      { links: [{ label: 'Unsafe', url: 'javascript:alert(1)' }], relatedTicketIds: [b.id] },
      { links: [{ label: 'Okay', url: 'https://example.com' }], relatedTicketIds: [b.id, b.id] },
    ]) {
      expect(
        (
          await page.request.post('/api/tickets', {
            data: { releaseId: r.id, title: 'Should not exist', ...data },
          })
        ).ok(),
      ).toBeFalsy()
    }
    expect((await (await page.request.get('/api/tickets')).json()).tickets).toHaveLength(
      ticketCount,
    )
    await page.goto(`/tickets/new?release=${r.id}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'Title' }).fill('Created in browser')
    await page.getByRole('textbox', { name: 'Estimate' }).fill('1 hr 30m')
    await page.getByRole('button', { name: 'Add link' }).click()
    await page.getByRole('textbox', { name: 'Link 1 label' }).fill('Brief')
    await page.getByRole('textbox', { name: 'Link 1 URL' }).fill('https://example.com/brief')
    await page.getByRole('combobox', { name: 'Choose related ticket' }).click()
    await page.getByRole('option', { name: /Second ticket/ }).click()
    await page.getByRole('button', { name: 'Add related ticket' }).click()
    await page.getByRole('button', { name: 'Create ticket' }).click()
    await expect(page).toHaveURL(/\/tickets\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: 'Created in browser' })).toBeVisible()
    await expect(page.getByLabel('Estimated: 1hr 30m')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Brief' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Second ticket' })).toBeVisible()
    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('region', { name: 'Idea tickets' }).getByText('First ticket'),
    ).toBeVisible()
    await page
      .getByRole('region', { name: 'Ticket board' })
      .locator(`[data-board-ticket-id="${a.id}"]`)
      .getByRole('button', { name: 'Move to Estimate' })
      .click()
    await expect(
      page.getByRole('region', { name: 'Estimate tickets' }).getByText('First ticket'),
    ).toBeVisible()
    await page.goto(`/tickets/${a.id}`)
    await expect(page.getByLabel('Estimated: 45m')).toBeVisible()
    const link = await page.request.post(`/api/tickets/${a.id}/links`, {
      data: { label: 'PR', url: 'https://example.com/pr' },
    })
    expect(link.ok()).toBeTruthy()
    const linkId = (await link.json()).id
    expect(
      (
        await page.request.post(`/api/tickets/${a.id}/links`, {
          data: { label: 'Unsafe', url: 'javascript:alert(1)' },
        })
      ).status(),
    ).toBe(400)
    const relation = await page.request.post(`/api/tickets/${a.id}/relations`, {
      data: { ticketId: b.id },
    })
    expect(relation.ok()).toBeTruthy()
    expect(
      (
        await page.request.post(`/api/tickets/${b.id}/relations`, { data: { ticketId: a.id } })
      ).status(),
    ).toBe(409)
    expect(
      (
        await page.request.post(`/api/tickets/${a.id}/relations`, { data: { ticketId: a.id } })
      ).status(),
    ).toBe(409)
    await page.reload()
    await expect(page.getByRole('link', { name: 'PR', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Second ticket' })).toBeVisible()
    const otherContext = await browser.newContext()
    try {
      const otherPage = await otherContext.newPage()
      expect((await otherPage.request.get(`/api/tickets/${a.id}`)).status()).toBe(401)
      await otherContext.addCookies(
        await helpers.getCookies({ userId: stranger.id, domain: '127.0.0.1' }),
      )
      expect((await otherPage.request.get(`/api/tickets/${a.id}`)).status()).toBe(404)
      expect(
        (
          await otherPage.request.post(`/api/tickets/${a.id}/relations`, {
            data: { ticketId: b.id },
          })
        ).status(),
      ).toBe(404)
      const foreignClient = await (
        await otherPage.request.post('/api/clients', { data: { name: 'Foreign' } })
      ).json()
      const foreignProject = await (
        await otherPage.request.post('/api/projects', {
          data: { clientId: foreignClient.id, name: 'Foreign', color: '#abcdef' },
        })
      ).json()
      const foreignRelease = await (
        await otherPage.request.post('/api/releases', {
          data: { projectId: foreignProject.id, name: 'Foreign' },
        })
      ).json()
      const foreignTicket = await (
        await otherPage.request.post('/api/tickets', {
          data: { releaseId: foreignRelease.id, title: 'Foreign' },
        })
      ).json()
      expect(
        (
          await page.request.post(`/api/tickets/${a.id}/relations`, {
            data: { ticketId: foreignTicket.id },
          })
        ).status(),
      ).toBe(404)
      expect(
        (
          await page.request.patch(`/api/tickets/${a.id}`, {
            data: { releaseId: foreignRelease.id },
          })
        ).status(),
      ).toBe(404)
      const beforeForeignCreate = (await (await page.request.get('/api/tickets')).json()).tickets
        .length
      expect(
        (
          await page.request.post('/api/tickets', {
            data: {
              releaseId: r.id,
              title: 'Foreign relation must fail',
              links: [{ label: 'Valid', url: 'https://example.com' }],
              relatedTicketIds: [foreignTicket.id],
            },
          })
        ).status(),
      ).toBe(404)
      expect((await (await page.request.get('/api/tickets')).json()).tickets).toHaveLength(
        beforeForeignCreate,
      )
      expect(
        (await (await otherPage.request.get('/api/tickets')).json()).tickets.map(
          (item: { ticket: { id: string } }) => item.ticket.id,
        ),
      ).toEqual([foreignTicket.id])
    } finally {
      await otherContext.close()
    }
    expect(
      (
        await page.request.patch(`/api/tickets/${crossRelease.id}`, { data: { archived: true } })
      ).ok(),
    ).toBeTruthy()
    const beforeArchivedCreate = (await (await page.request.get('/api/tickets')).json()).tickets
      .length
    expect(
      (
        await page.request.post('/api/tickets', {
          data: {
            releaseId: r.id,
            title: 'Archived relation must fail',
            relatedTicketIds: [crossRelease.id],
          },
        })
      ).status(),
    ).toBe(404)
    expect((await (await page.request.get('/api/tickets')).json()).tickets).toHaveLength(
      beforeArchivedCreate,
    )
    expect(
      (
        await page.request.patch(`/api/tickets/${crossRelease.id}`, { data: { archived: false } })
      ).ok(),
    ).toBeTruthy()
    expect((await page.request.delete(`/api/releases/${r.id}`)).status()).toBe(409)
    expect((await page.request.delete(`/api/tickets/${a.id}`)).status()).toBe(409)
    expect(
      (await page.request.patch(`/api/tickets/${a.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    expect((await page.request.get(`/api/tickets/${a.id}`)).status()).toBe(404)
    expect((await page.request.get(`/api/tickets/${a.id}?archived=true`)).ok()).toBeTruthy()
    expect((await page.request.delete(`/api/tickets/${a.id}`)).ok()).toBeTruthy()
    expect((await page.request.get(`/api/tickets/${b.id}`)).ok()).toBeTruthy()
    expect(
      (await page.request.patch(`/api/releases/${r.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    expect(await (await page.request.get(`/api/tickets?releaseId=${r.id}`)).json()).toMatchObject({
      tickets: [],
    })
    expect((await page.request.get(`/api/tickets/${b.id}?archived=true`)).status()).toBe(404)
    expect(
      (await page.request.patch(`/api/releases/${r.id}`, { data: { archived: false } })).ok(),
    ).toBeTruthy()
    expect(
      (await page.request.patch(`/api/tickets/${b.id}`, { data: { status: 'Done' } })).ok(),
    ).toBeTruthy()
    await page.goto(`/tickets/${b.id}`)
    await expect(page.getByRole('button', { name: /Move to/ })).toHaveCount(0)
    await page.goto('/tickets')
    const board = page.getByRole('region', { name: 'Ticket board' })
    await expect(board).toBeVisible()
    const positions = await Promise.all(
      ['Idea', 'Estimate', 'Develop', 'Review', 'Test', 'Deploy', 'Done'].map(async (status) => {
        const box = await board.getByRole('region', { name: `${status} tickets` }).boundingBox()
        return box?.y
      }),
    )
    expect(new Set(positions).size).toBe(1)
    await expect(board.getByText('No tickets in Review.')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/clients/new')
    expect((await page.locator('main').boundingBox())?.width).toBeGreaterThan(1800)
    expect((await page.locator('main > div').boundingBox())?.width).toBeGreaterThan(1800)
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    try {
      await mobile
        .context()
        .addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
      await mobile.goto('/tickets')
      await mobile.waitForLoadState('networkidle')
      expect(await mobile.evaluate(() => innerWidth)).toBe(390)
      await expect(mobile.getByRole('heading', { name: 'Tickets' })).toBeVisible()
      for (const status of ['Idea', 'Estimate', 'Develop', 'Review', 'Test', 'Deploy', 'Done']) {
        const trigger = mobile.getByRole('button', {
          name: new RegExp(`^${status}: \\d+ tickets$`),
        })
        await expect(trigger).toBeVisible()
        await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      }
      const doneSection = mobile.getByRole('region', { name: 'Done tickets' })
      await expect(doneSection.getByRole('link', { name: 'Second ticket' })).toBeHidden()
      await doneSection.getByRole('button', { name: 'Done: 1 tickets' }).click()
      await expect(doneSection.getByRole('button', { name: 'Done: 1 tickets' })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
      await expect(doneSection.getByRole('link', { name: 'Second ticket' })).toBeVisible()
      expect(
        await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy()
    } finally {
      await mobile.close()
    }
    expect(linkId).toMatch(uuidv7)
  } finally {
    await cleanup(owner.id)
    await cleanup(stranger.id)
    await helpers.deleteUser(owner.id)
    await helpers.deleteUser(stranger.id)
  }
})
