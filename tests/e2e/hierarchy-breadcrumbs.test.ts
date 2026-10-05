import { expect, test as base, type Page } from '@playwright/test'
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

type Crumb = { label: string; href: string }

async function expectTrail(page: Page, ancestors: Crumb[], current: string) {
  const nav = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(nav).toBeVisible()
  const items = nav.locator('ol > li')
  await expect(items).toHaveCount(ancestors.length + 1)
  for (const [index, ancestor] of ancestors.entries()) {
    const link = items.nth(index).getByRole('link')
    await expect(link).toHaveText(ancestor.label)
    await expect(link).toHaveAttribute('href', ancestor.href)
  }
  const currentPage = items.last().locator('[aria-current="page"]')
  await expect(currentPage).toHaveText(current)
  await expect(currentPage).toHaveRole('heading', { level: 1 })
}

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

type HierarchyFixture = {
  clientA: { id: string; name: string }
  clientB: { id: string; name: string }
  projectA: { id: string; name: string }
  projectB: { id: string; name: string }
  releaseA: { id: string; name: string }
  releaseB: { id: string; name: string }
  ticketA: { id: string; title: string }
  userId: string
}

const test = base.extend<{ hierarchy: HierarchyFixture }>({
  hierarchy: async ({ page, context }, use) => {
    const helpers = (await testAuth.$context).test
    const user = helpers.createUser({
      name: 'Breadcrumb E2E User',
      email: `nxmr-breadcrumb-${crypto.randomUUID()}@example.com`,
    })

    try {
      await helpers.saveUser(user)
      await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
      const create = async (path: string, data: unknown) => {
        const response = await page.request.post(path, { data })
        expect(response.ok(), await response.text()).toBeTruthy()
        return response.json()
      }
      const clientA = await create('/api/clients', { name: 'Breadcrumb Client A' })
      const clientB = await create('/api/clients', { name: 'Breadcrumb Client B' })
      const projectA = await create('/api/projects', {
        clientId: clientA.id,
        name: 'Breadcrumb Project A',
        color: '#abcdef',
      })
      const projectB = await create('/api/projects', {
        clientId: clientB.id,
        name: 'Breadcrumb Project B',
        color: '#fedcba',
      })
      const releaseA = await create('/api/releases', {
        projectId: projectA.id,
        name: 'Breadcrumb Release A',
      })
      const releaseB = await create('/api/releases', {
        projectId: projectB.id,
        name: 'Breadcrumb Release B',
      })
      const ticketA = await create('/api/tickets', {
        releaseId: releaseA.id,
        title: 'Breadcrumb Ticket A',
      })
      await use({
        clientA,
        clientB,
        projectA,
        projectB,
        releaseA,
        releaseB,
        ticketA,
        userId: user.id,
      })
    } finally {
      await cleanup(user.id)
      await helpers.deleteUser(user.id)
    }
  },
})

test('hierarchy detail pages show their contextual breadcrumbs', async ({ page, hierarchy }) => {
  const { clientA, projectA, releaseA, ticketA } = hierarchy
  await page.setViewportSize({ width: 1440, height: 900 })

  const releaseList = await (await page.request.get('/api/releases')).json()
  expect(releaseList.releases).toContainEqual(
    expect.objectContaining({
      release: expect.objectContaining({ id: releaseA.id }),
      clientId: clientA.id,
      clientName: clientA.name,
    }),
  )
  const releaseDetails = await (await page.request.get(`/api/releases/${releaseA.id}`)).json()
  expect(releaseDetails).toMatchObject({ clientId: clientA.id, clientName: clientA.name })

  await page.goto(`/clients/${clientA.id}`)
  await waitForClientMount(page)
  await expect(page.getByRole('heading', { name: clientA.name, level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Clients', exact: true }),
  ).toHaveCount(0)

  await page.goto(`/projects/${projectA.id}`)
  await waitForClientMount(page)
  await expectTrail(page, [{ label: clientA.name, href: `/clients/${clientA.id}` }], projectA.name)
  await page.goto(`/releases/${releaseA.id}`)
  await waitForClientMount(page)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}` },
      { label: projectA.name, href: `/projects/${projectA.id}` },
    ],
    releaseA.name,
  )
  await page.goto(`/tickets/${ticketA.id}`)
  await waitForClientMount(page)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}` },
      { label: projectA.name, href: `/projects/${projectA.id}` },
      { label: releaseA.name, href: `/releases/${releaseA.id}` },
    ],
    ticketA.title,
  )
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
      name: 'Clients',
      exact: true,
    }),
  ).toHaveCount(0)
})

test('hierarchy-aware create and edit forms keep breadcrumbs in sync', async ({
  page,
  hierarchy,
}) => {
  const { clientA, clientB, projectA, projectB, releaseA, releaseB, ticketA } = hierarchy
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(`/projects/${projectA.id}/edit`)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}` },
      { label: projectA.name, href: `/projects/${projectA.id}` },
    ],
    'Edit project',
  )
  await page.goto(`/releases/${releaseA.id}/edit`)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}` },
      { label: projectA.name, href: `/projects/${projectA.id}` },
      { label: releaseA.name, href: `/releases/${releaseA.id}` },
    ],
    'Edit release',
  )
  const removedTicketEditor = await page.goto(`/tickets/${ticketA.id}/edit`)
  expect(removedTicketEditor?.status()).toBe(404)

  await page.goto('/projects/new')
  await waitForClientMount(page)
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)
  await page.goto(`/projects/new?client=${clientA.id}`)
  await waitForClientMount(page)
  await expectTrail(page, [{ label: clientA.name, href: `/clients/${clientA.id}` }], 'New project')
  await page.getByRole('button', { name: 'Client' }).click()
  const clientSearch = page.getByPlaceholder('Search clients…')
  await clientSearch.fill('Breadcrumb Client B')
  await expect(page.getByRole('option', { name: clientA.name, exact: true })).toHaveCount(0)
  await page.getByRole('option', { name: clientB.name, exact: true }).click()
  await expectTrail(page, [{ label: clientB.name, href: `/clients/${clientB.id}` }], 'New project')

  await page.goto(`/releases/new?project=${projectA.id}`)
  await waitForClientMount(page)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}` },
      { label: projectA.name, href: `/projects/${projectA.id}` },
    ],
    'New release',
  )
  await page.getByRole('button', { name: 'Project' }).click()
  await page.getByPlaceholder('Search projects…').fill('Breadcrumb Project B')
  await expect(
    page.getByRole('option', { name: `${clientA.name} · ${projectA.name}` }),
  ).toHaveCount(0)
  await page.getByRole('option', { name: `${clientB.name} · ${projectB.name}` }).click()
  await expectTrail(
    page,
    [
      { label: clientB.name, href: `/clients/${clientB.id}` },
      { label: projectB.name, href: `/projects/${projectB.id}` },
    ],
    'New release',
  )

  await page.goto(`/tickets/new?release=${releaseA.id}`)
  await waitForClientMount(page)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}` },
      { label: projectA.name, href: `/projects/${projectA.id}` },
      { label: releaseA.name, href: `/releases/${releaseA.id}` },
    ],
    'New ticket',
  )
  await page.getByRole('button', { name: 'Release' }).click()
  await page.getByPlaceholder('Search releases…').fill('Breadcrumb Release B')
  await expect(
    page.getByRole('option', { name: `${projectA.name} · ${releaseA.name}` }),
  ).toHaveCount(0)
  await page.getByRole('option', { name: `${projectB.name} · ${releaseB.name}` }).click()
  await expectTrail(
    page,
    [
      { label: clientB.name, href: `/clients/${clientB.id}` },
      { label: projectB.name, href: `/projects/${projectB.id}` },
      { label: releaseB.name, href: `/releases/${releaseB.id}` },
    ],
    'New ticket',
  )
})

test('archived hierarchy breadcrumbs preserve context on narrow layouts', async ({
  page,
  hierarchy,
}) => {
  const { clientA, clientB, projectA, releaseA, ticketA } = hierarchy
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(`/projects/${projectA.id}`)
  const projectClientCrumb = page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: clientA.name, exact: true })
  await projectClientCrumb.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(`/clients/${clientA.id}`)
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)

  expect(
    (await page.request.patch(`/api/clients/${clientA.id}`, { data: { archived: true } })).ok(),
  ).toBeTruthy()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/projects/new?client=${clientB.id}`)
  await waitForClientMount(page)
  await expectTrail(page, [{ label: clientB.name, href: `/clients/${clientB.id}` }], 'New project')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const archivedEditorResponse = await page.goto(`/tickets/${ticketA.id}/edit?archived=true`)
  expect(archivedEditorResponse?.status()).toBe(404)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.goto(`/tickets/${ticketA.id}?archived=true`)
  await waitForClientMount(page)
  await expectTrail(
    page,
    [
      { label: clientA.name, href: `/clients/${clientA.id}?archived=true` },
      { label: projectA.name, href: `/projects/${projectA.id}?archived=true` },
      { label: releaseA.name, href: `/releases/${releaseA.id}?archived=true` },
    ],
    ticketA.title,
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: releaseA.name, exact: true })
    .click()
  await expect(page).toHaveURL(`/releases/${releaseA.id}?archived=true`)
  await expect(page.getByRole('heading', { name: releaseA.name, level: 1 })).toBeVisible()
})

test('mobile hierarchy selector is touch-accessible without stealing focus', async ({
  browser,
  hierarchy,
}) => {
  const { clientB, userId } = hierarchy
  const helpers = (await testAuth.$context).test
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  try {
    await mobileContext.addCookies(await helpers.getCookies({ userId, domain: '127.0.0.1' }))
    const mobile = await mobileContext.newPage()
    await mobile.goto('/projects/new')
    await waitForClientMount(mobile)
    await mobile.getByRole('button', { name: 'Client' }).tap()
    const mobileSearch = mobile.getByPlaceholder('Search clients…')
    await expect(mobileSearch).toBeVisible()
    expect(await mobileSearch.evaluate((element) => element === document.activeElement)).toBe(false)
    await mobileSearch.fill('Breadcrumb Client B')
    await expect(mobile.getByRole('option', { name: clientB.name, exact: true })).toBeVisible()
  } finally {
    await mobileContext.close()
  }
})
