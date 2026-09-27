import { expect, test } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

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

test('Today and ticket-board filters accept typed searches', async ({ page, context, browser }) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Filter search owner',
    email: `filter-search-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let mobileContext: Awaited<ReturnType<typeof browser.newContext>> | undefined

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
      await search.fill(query)
      await expect(page.getByRole('option', { name: match, exact: true })).toBeVisible()
      await expect(page.getByRole('option', { name: miss, exact: true })).toHaveCount(0)
    }

    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
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

    await page.goto('/today')
    await page.waitForLoadState('networkidle')
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

    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await mobileContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const mobile = await mobileContext.newPage()
    await mobile.goto('/tickets')
    await mobile.waitForLoadState('networkidle')
    await mobile.getByRole('button', { name: 'Filter client' }).tap()
    const mobileSearch = mobile.getByPlaceholder('Search clients…')
    await expect(mobileSearch).toBeVisible()
    expect(await mobileSearch.evaluate((element) => element === document.activeElement)).toBe(false)
    await mobile.goto('/today')
    await mobile.waitForLoadState('networkidle')
    await mobile.getByRole('button', { name: 'Filter client' }).tap()
    const mobileTodaySearch = mobile.getByPlaceholder('Search clients…')
    await expect(mobileTodaySearch).toBeVisible()
    expect(await mobileTodaySearch.evaluate((element) => element === document.activeElement)).toBe(
      false,
    )
  } finally {
    await mobileContext?.close()
    await cleanup(owner.id)
  }
})
