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
    toolbar.getByRole('button', { name: 'Show archived' }),
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

test('Today and ticket-board filters accept typed searches', async ({ page, context }) => {
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
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    const toolbar = page.getByRole('group', { name: 'Ticket board controls' })
    const filterGroup = toolbar.getByRole('group', { name: 'Ticket filters' })
    await expect(toolbar).toBeVisible()
    await expectCompactPageSpacing(page)
    await expect(filterGroup.getByRole('button', { name: 'Filter client' })).toBeVisible()
    await expect(filterGroup.getByRole('button', { name: 'Clear filters' })).toBeVisible()
    await expect(filterGroup.getByRole('button', { name: 'Show archived' })).toHaveCount(0)
    await expect(filterGroup.getByRole('link', { name: 'New ticket' })).toHaveCount(0)
    await expectSameToolbarRow(toolbar)
    await expect(toolbar.getByRole('link', { name: 'New ticket' })).toHaveAttribute(
      'href',
      '/tickets/new',
    )
    await toolbar.getByRole('button', { name: 'Show archived' }).click()
    await expect(toolbar.getByRole('button', { name: 'Hide archived' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await toolbar.getByRole('button', { name: 'Hide archived' }).click()
    await expect(toolbar.getByRole('button', { name: 'Show archived' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
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
    await page.getByPlaceholder('Search tickets…').fill('Searchable')
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

    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    await expectCompactPageSpacing(page)
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
      {
        kind: 'status',
        placeholder: 'Search statuses…',
        query: 'Dev',
        match: 'Develop',
        miss: 'Done',
      },
    ])
      await searchFilter(filter.kind, filter.placeholder, filter.query, filter.match, filter.miss)

    await page.getByRole('button', { name: 'Filter ticket' }).click()
    await page.getByPlaceholder('Search tickets…').fill('Searchable')
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
    await page.getByRole('button', { name: 'Filter status' }).click()
    await page.getByPlaceholder('Search statuses…').fill('Develop')
    await page.getByRole('option', { name: 'Develop', exact: true }).click()
    await page.getByRole('button', { name: 'Filter client' }).click()
    await page.getByRole('option', { name: `Other client ${suffix}`, exact: true }).click()
    await expect(page.getByRole('button', { name: 'Filter status' })).toContainText('Develop')
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText('All projects')
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText('All releases')
    await expect(page.getByRole('button', { name: 'Filter ticket' })).toContainText('All tickets')
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('button', { name: 'Filter status' })).toContainText('All statuses')
  } finally {
    await cleanup(owner.id)
  }
})
