import { expect, test, type Locator, type Page } from '@playwright/test'
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

function boardCard(page: Page, id: string) {
  return page.locator(`[data-board-ticket-id="${id}"]`).filter({ visible: true })
}

async function expectNoHorizontalOverflow(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true)
}

async function filterBy(
  card: Locator,
  page: Page,
  kind: 'client' | 'project' | 'release',
  name: string,
) {
  await card.getByRole('button', { name: `${kind}: ${name}; actions` }).click()
  await page.getByRole('button', { name: `Filter by ${name}`, exact: true }).click()
}

async function openItem(
  card: Locator,
  page: Page,
  kind: 'client' | 'project' | 'release',
  name: string,
) {
  await card.getByRole('button', { name: `${kind}: ${name}; actions` }).click()
  await page.getByRole('link', { name: `Open ${name}`, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/${kind === 'client' ? 'clients' : `${kind}s`}/[^/?]+$`))
}

test('ticket board hierarchy badges filter by or open their item on desktop', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Board hierarchy actions owner',
    email: `board-hierarchy-actions-${crypto.randomUUID()}@example.com`,
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
    const clientAName = `Action client ${suffix}`
    const projectAName = `Action project ${suffix}`
    const releaseAName = `Action release ${suffix}`
    const clientA = await create('/api/clients', { name: clientAName })
    const projectA = await create('/api/projects', {
      clientId: clientA.id,
      name: projectAName,
      color: '#abcdef',
    })
    const releaseA = await create('/api/releases', { projectId: projectA.id, name: releaseAName })
    const releaseA2 = await create('/api/releases', {
      projectId: projectA.id,
      name: `Other release ${suffix}`,
    })
    const clientB = await create('/api/clients', { name: `Other client ${suffix}` })
    const projectB = await create('/api/projects', {
      clientId: clientB.id,
      name: `Other project ${suffix}`,
      color: '#123456',
    })
    const releaseB = await create('/api/releases', {
      projectId: projectB.id,
      name: `Other release branch ${suffix}`,
    })
    const ticketA = await create('/api/tickets', {
      releaseId: releaseA.id,
      title: `Action ticket ${suffix}`,
      status: 'Idea',
    })
    const ticketA2 = await create('/api/tickets', {
      releaseId: releaseA2.id,
      title: `Other ticket ${suffix}`,
      status: 'Idea',
    })
    const ticketB = await create('/api/tickets', {
      releaseId: releaseB.id,
      title: `Separate ticket ${suffix}`,
      status: 'Idea',
    })

    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    const target = boardCard(page, ticketA.id)
    await expect(target).toBeVisible()
    await expectNoHorizontalOverflow(target.getByLabel('Ticket hierarchy'))
    await expectNoHorizontalOverflow(target.getByLabel('Ticket context'))
    await expect(boardCard(page, ticketA2.id)).toBeVisible()
    await expect(boardCard(page, ticketB.id)).toBeVisible()

    // The badge trigger and its action can be reached and activated by keyboard.
    const clientTrigger = target.getByRole('button', { name: `client: ${clientAName}; actions` })
    await expect(clientTrigger).toHaveAttribute('title', clientAName)
    await clientTrigger.focus()
    await page.keyboard.press('Enter')
    const filterClient = page.getByRole('button', { name: `Filter by ${clientAName}`, exact: true })
    await expect(filterClient).toBeVisible()
    await filterClient.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText(clientAName)
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText('All projects')
    await expect(boardCard(page, ticketA2.id)).toBeVisible()
    await expect(boardCard(page, ticketB.id)).toHaveCount(0)

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await filterBy(boardCard(page, ticketA.id), page, 'project', projectAName)
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText(clientAName)
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText(projectAName)
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText('All releases')
    await expect(boardCard(page, ticketA2.id)).toBeVisible()
    await expect(boardCard(page, ticketB.id)).toHaveCount(0)

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await filterBy(boardCard(page, ticketA.id), page, 'release', releaseAName)
    await expect(page.getByRole('button', { name: 'Filter client' })).toContainText(clientAName)
    await expect(page.getByRole('button', { name: 'Filter project' })).toContainText(projectAName)
    await expect(page.getByRole('button', { name: 'Filter release' })).toContainText(releaseAName)
    await expect(boardCard(page, ticketA2.id)).toHaveCount(0)
    await expect(boardCard(page, ticketB.id)).toHaveCount(0)

    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    await openItem(boardCard(page, ticketA.id), page, 'client', clientAName)
    await expect(page.getByRole('heading', { name: clientAName })).toBeVisible()

    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    await openItem(boardCard(page, ticketA.id), page, 'project', projectAName)
    await expect(page.getByRole('heading', { name: projectAName })).toBeVisible()

    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    await openItem(boardCard(page, ticketA.id), page, 'release', releaseAName)
    await expect(page.getByRole('heading', { name: releaseAName })).toBeVisible()
  } finally {
    await cleanup(owner.id)
  }
})
