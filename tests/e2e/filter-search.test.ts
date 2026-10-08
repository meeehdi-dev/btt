import { expect, test, type Locator } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

function boardToolbarControls(toolbar: Locator) {
  return [
    ...(['client', 'project', 'release', 'ticket'] as const).map((kind) =>
      toolbar.getByRole('button', { name: `Filter ${kind}` }),
    ),
    toolbar.getByRole('button', { name: 'Clear filters' }),
    toolbar.getByRole('button', { name: 'Filter archived tickets' }),
    toolbar.getByRole('link', { name: 'New ticket', exact: true }),
  ]
}

async function expectSameToolbarRow(toolbar: Locator) {
  const boxes = await Promise.all(
    boardToolbarControls(toolbar).map((control) => control.boundingBox()),
  )
  if (boxes.some((box) => !box))
    throw new Error('All ticket-board toolbar controls must be visible')
  const tops = boxes.map((box) => box!.y)
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2)
}

async function expectCompactPageSpacing(page: import('@playwright/test').Page) {
  await expect(page.locator('main > .flex.flex-col.gap-2')).toHaveCSS('row-gap', '8px')
}

async function cleanup(userId: string) {
  const clients = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId))
  const clientIds = clients.map(({ id }) => id)
  const projects = clientIds.length
    ? await db.select({ id: project.id }).from(project).where(inArray(project.clientId, clientIds))
    : []
  const projectIds = projects.map(({ id }) => id)
  const releases = projectIds.length
    ? await db
        .select({ id: release.id })
        .from(release)
        .where(inArray(release.projectId, projectIds))
    : []
  const releaseIds = releases.map(({ id }) => id)
  if (releaseIds.length) await db.delete(ticket).where(inArray(ticket.releaseId, releaseIds))
  if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
  if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
  if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
}

test('Agenda and ticket-board filters accept typed searches', async ({ page, context }) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Filter search owner',
    email: `filter-search-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)

  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const suffix = crypto.randomUUID().slice(0, 8)
    const searchableClient = await create('/api/clients', {
      name: `Searchable client ${suffix}`,
    })
    const otherClient = await create('/api/clients', { name: `Other client ${suffix}` })
    const searchableProject = await create('/api/projects', {
      clientId: searchableClient.id,
      name: `Searchable project ${suffix}`,
      color: '#abcdef',
    })
    const otherProject = await create('/api/projects', {
      clientId: otherClient.id,
      name: `Other project ${suffix}`,
      color: '#abcdef',
    })
    const searchableRelease = await create('/api/releases', {
      projectId: searchableProject.id,
      name: `Searchable release ${suffix}`,
    })
    const otherRelease = await create('/api/releases', {
      projectId: otherProject.id,
      name: `Other release ${suffix}`,
    })
    await create('/api/tickets', {
      releaseId: searchableRelease.id,
      title: `Searchable ticket ${suffix}`,
      status: 'Develop',
    })
    const archivedTicket = await create('/api/tickets', {
      releaseId: searchableRelease.id,
      title: `Archived ticket ${suffix}`,
      status: 'Develop',
    })
    const archivedTicketResponse = await page.request.patch(`/api/tickets/${archivedTicket.id}`, {
      data: { archived: true },
    })
    expect(archivedTicketResponse.ok(), await archivedTicketResponse.text()).toBe(true)
    await create('/api/tickets', {
      releaseId: otherRelease.id,
      title: `Other ticket ${suffix}`,
      status: 'Done',
    })

    async function searchFilter(
      kind: string,
      placeholder: string,
      query: string,
      match: string,
      miss: string,
    ) {
      await page.getByRole('button', { name: `Filter ${kind}` }).click()
      const search = page.getByPlaceholder(placeholder)
      await expect(search).toBeVisible()
      await expect(search).toBeFocused()
      await search.fill(query)
      await expect(page.getByRole('option', { name: match, exact: true })).toBeVisible()
      await expect(page.getByRole('option', { name: miss, exact: true })).toHaveCount(0)
      await page.keyboard.press('Escape')
    }

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    const toolbar = page.getByRole('group', { name: 'Ticket board controls' })
    const filterGroup = toolbar.getByRole('group', { name: 'Ticket filters' })
    await expect(toolbar).toBeVisible()
    await expectCompactPageSpacing(page)
    await expect(filterGroup.getByRole('button', { name: 'Filter client' })).toBeVisible()
    await expect(filterGroup.getByRole('button', { name: 'Clear filters' })).toBeVisible()
    const archiveFilter = filterGroup.getByRole('button', { name: 'Filter archived tickets' })
    await expect(archiveFilter).toContainText('Active tickets')
    await expect(filterGroup).toHaveCSS('height', '32px')
    await expect(filterGroup).toHaveCSS('column-gap', '4px')
    await expect(filterGroup.locator('.grid-cols-5')).toHaveCSS('column-gap', '4px')
    await expect(filterGroup).toHaveCSS('border-width', '0px')
    await expect(filterGroup).toHaveCSS('box-shadow', 'none')
    await expect(filterGroup.getByRole('link', { name: 'New ticket' })).toHaveCount(0)
    await expectSameToolbarRow(toolbar)
    const newTicket = toolbar.getByRole('link', { name: 'New ticket' })
    await expect(newTicket).toHaveAttribute('href', '/tickets/new')
    const board = page.getByRole('region', { name: 'Ticket board' })
    const archivedCard = board.locator(`[data-board-ticket-id="${archivedTicket.id}"]`)
    await expect(archivedCard).toHaveCount(0)
    const shellHeaderBox = await page.getByRole('banner').boundingBox()
    const filterBarBox = await filterGroup.boundingBox()
    const toolbarBox = await toolbar.boundingBox()
    const separator = page.getByTestId('ticket-board-toolbar-separator')
    const separatorBox = await separator.boundingBox()
    const newTicketBox = await newTicket.boundingBox()
    if (!shellHeaderBox || !filterBarBox || !toolbarBox || !separatorBox || !newTicketBox)
      throw new Error('Ticket board toolbar controls must be visible at 1280px')
    expect(filterBarBox.y - (shellHeaderBox.y + shellHeaderBox.height)).toBe(16)
    expect(toolbarBox.height).toBe(32)
    expect(separatorBox.height).toBe(24)
    expect(separatorBox.width).toBeLessThanOrEqual(2)
    expect(filterBarBox.x + filterBarBox.width).toBeLessThanOrEqual(separatorBox.x)
    expect(separatorBox.x + separatorBox.width).toBeLessThanOrEqual(newTicketBox.x)
    const boardBox = await board.boundingBox()
    if (!boardBox) throw new Error('Ticket board must be visible')
    expect(boardBox.y - (toolbarBox.y + toolbarBox.height)).toBe(16)
    expect(await board.evaluate((element) => getComputedStyle(element).borderWidth)).toBe('1px')
    expect(await board.evaluate((element) => getComputedStyle(element).borderRadius)).toBe('8px')
    const laneBox = await board.getByRole('region', { name: 'Idea tickets' }).boundingBox()
    if (!laneBox) throw new Error('Ticket lanes must stretch to the board minimum height')
    expect(laneBox.height).toBeGreaterThan(700)
    expect(Math.abs(900 - (boardBox.y + boardBox.height) - 16)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await archiveFilter.click()
    await page.getByRole('option', { name: 'Include archived', exact: true }).click()
    await expect(archiveFilter).toContainText('Include archived')
    await expect(archivedCard).toBeVisible()
    await toolbar.getByRole('button', { name: 'Clear filters' }).click()
    await expect(archiveFilter).toContainText('Active tickets')
    await expect(archivedCard).toHaveCount(0)
    for (let index = 0; index < 18; index++)
      await create('/api/tickets', {
        releaseId: searchableRelease.id,
        title: `Tall lane ticket ${index} ${suffix}`,
        status: 'Develop',
      })
    await page.reload()
    await page.waitForLoadState('networkidle')
    const grownBoardBox = await board.boundingBox()
    if (!grownBoardBox) throw new Error('Ticket board must remain visible with more cards')
    expect(grownBoardBox.height).toBeGreaterThan(boardBox.height + 100)
    expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(
      true,
    )
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const filter of [
      {
        kind: 'client',
        placeholder: 'Search clients…',
        query: 'Searchable',
        match: `Searchable client ${suffix}`,
        miss: `Other client ${suffix}`,
      },
      {
        kind: 'project',
        placeholder: 'Search projects…',
        query: 'Searchable',
        match: `Searchable project ${suffix}`,
        miss: `Other project ${suffix}`,
      },
      {
        kind: 'release',
        placeholder: 'Search releases…',
        query: 'Searchable',
        match: `Searchable release ${suffix}`,
        miss: `Other release ${suffix}`,
      },
      {
        kind: 'ticket',
        placeholder: 'Search tickets…',
        query: 'Searchable',
        match: `Searchable ticket ${suffix}`,
        miss: `Other ticket ${suffix}`,
      },
    ])
      await searchFilter(filter.kind, filter.placeholder, filter.query, filter.match, filter.miss)

    await page.getByRole('button', { name: 'Filter ticket' }).click()
    const boardTicketSearch = page.getByPlaceholder('Search tickets…')
    await expect(boardTicketSearch).toBeVisible()
    await boardTicketSearch.fill('Searchable')
    await page.getByRole('option', { name: `Searchable ticket ${suffix}`, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Filter ticket' })).toContainText(
      `Searchable ticket ${suffix}`,
    )
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText(
      `Searchable client ${suffix}`,
    )
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText(
      `Searchable project ${suffix}`,
    )
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText(
      `Searchable release ${suffix}`,
    )
    await page.getByRole('button', { name: 'Filter client' }).click()
    await page.getByRole('option', { name: `Other client ${suffix}`, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText('All projects')
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText('All releases')
    await expect(page.getByRole('button', { name: 'Filter ticket' })).toContainText('All tickets')
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText('All clients')
    await page.goto(`/tickets?release=${searchableRelease.id}`)
    await page.waitForLoadState('networkidle')
    await expect(
      page
        .getByRole('group', { name: 'Ticket board controls' })
        .getByRole('link', { name: 'New ticket' }),
    ).toHaveAttribute('href', `/tickets/new?release=${searchableRelease.id}`)

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/agenda')
    await page.waitForLoadState('networkidle')
    await expectCompactPageSpacing(page)
    const agendaToolbar = page.getByRole('group', { name: 'Agenda filters' })
    await expect(agendaToolbar).toBeVisible()
    await expect(agendaToolbar).toHaveCSS('height', '32px')
    await expect(agendaToolbar).toHaveCSS('column-gap', '4px')
    await expect(agendaToolbar.locator('.grid-cols-4')).toHaveCSS('column-gap', '4px')
    await expect(agendaToolbar.getByRole('button', { name: 'Clear filters' })).toBeVisible()
    for (const filter of [
      {
        kind: 'client',
        placeholder: 'Search clients…',
        query: 'Searchable',
        match: `Searchable client ${suffix}`,
        miss: `Other client ${suffix}`,
      },
      {
        kind: 'project',
        placeholder: 'Search projects…',
        query: 'Searchable',
        match: `Searchable project ${suffix}`,
        miss: `Other project ${suffix}`,
      },
      {
        kind: 'release',
        placeholder: 'Search releases…',
        query: 'Searchable',
        match: `Searchable release ${suffix}`,
        miss: `Other release ${suffix}`,
      },
      {
        kind: 'ticket',
        placeholder: 'Search tickets…',
        query: 'Searchable',
        match: `Searchable ticket ${suffix}`,
        miss: `Other ticket ${suffix}`,
      },
    ])
      await searchFilter(filter.kind, filter.placeholder, filter.query, filter.match, filter.miss)

    await page.getByRole('button', { name: 'Filter ticket' }).click()
    const agendaTicketSearch = page.getByPlaceholder('Search tickets…')
    await expect(agendaTicketSearch).toBeVisible()
    await agendaTicketSearch.fill('Searchable')
    await page.getByRole('option', { name: `Searchable ticket ${suffix}`, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText(
      `Searchable client ${suffix}`,
    )
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText(
      `Searchable project ${suffix}`,
    )
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText(
      `Searchable release ${suffix}`,
    )
    await expect(page.getByRole('button', { name: 'Filter status' })).toHaveCount(0)
    await expect(page.getByPlaceholder('Search statuses…')).toHaveCount(0)
    await page.getByRole('button', { name: 'Filter client' }).click()
    await page.getByRole('option', { name: `Other client ${suffix}`, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText('All projects')
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText('All releases')
    await expect(page.getByRole('button', { name: 'Filter ticket' })).toContainText('All tickets')
    await page.getByRole('button', { name: 'Clear filters' }).click()
  } finally {
    await cleanup(owner.id)
  }
})
