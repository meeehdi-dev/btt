import { expect, test } from '@playwright/test'
import { testAuth } from '../../server/utils/auth-test'
import { db } from '../../server/db'
import {
  client as clientTable,
  project as projectTable,
  release as releaseTable,
} from '../../server/db/schema'
import { eq, inArray } from 'drizzle-orm'

test('redirects unauthenticated users and supports an authenticated shell session', async ({
  page,
  context,
}) => {
  await page.goto('/today')
  await expect(page).toHaveURL(/\/login\?redirect=\/today$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'E2E Nxmr User',
    email: `nxmr-e2e-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)

  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.goto('/today')
    await expect(page).toHaveURL(/\/today$/)
    await expect(page.getByText('E2E Nxmr User')).toBeVisible()

    for (const [label, path] of [
      ['Projects', '/projects'],
      ['Tickets', '/tickets'],
      ['Settings', '/settings'],
    ] as const) {
      await page.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }

    await page.reload()
    await expect(page.getByText('E2E Nxmr User')).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click({ noWaitAfter: true })
    await page.waitForURL(/\/login$/)
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('creates and archives the client hierarchy', async ({ page, context }) => {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'E2E M2 User',
    email: `nxmr-m2-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)

  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.goto('/projects/new')
    await expect(page.getByRole('heading', { name: 'Create a client first' })).toBeVisible()
    await page.goto('/releases/new')
    await expect(page.getByRole('heading', { name: 'Create a project first' })).toBeVisible()
    const clientResponse = await page.request.post('/api/clients', {
      data: { name: 'M2 Client', color: '#ABC123' },
    })
    expect(clientResponse.ok()).toBeTruthy()
    const client = await clientResponse.json()
    const projectResponse = await page.request.post('/api/projects', {
      data: { clientId: client.id, name: 'M2 Project', color: '#ABC123' },
    })
    expect(projectResponse.ok()).toBeTruthy()
    const project = await projectResponse.json()
    const releaseResponse = await page.request.post('/api/releases', {
      data: { projectId: project.id, name: 'M2 Release', targetDate: '2030-02-01' },
    })
    expect(releaseResponse.ok()).toBeTruthy()
    const release = await releaseResponse.json()

    await page.goto('/clients')
    await expect(page.getByRole('button', { name: 'Show archived' })).toBeVisible()
    await page.goto(`/clients/${client.id}`)
    await expect(page.getByRole('heading', { name: 'M2 Client' })).toBeVisible()
    await expect(page.getByText('M2 Project')).toBeVisible()
    await page.goto(`/projects/${project.id}`)
    await expect(page.getByText('M2 Release')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Show archived' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark release as done' })).toBeVisible()
    expect(
      (await page.request.patch(`/api/releases/${release.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    await page.reload()
    await expect(page.getByText('M2 Release')).toBeHidden()
    await page.goto(`/projects/${project.id}?archived=true`)
    await expect(page.getByRole('button', { name: 'Hide archived' })).toBeVisible()
    await expect(page.getByText('M2 Release')).toBeVisible()

    expect(
      (await page.request.patch(`/api/clients/${client.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    expect((await (await page.request.get('/api/projects')).json()).projects).toHaveLength(0)
    expect(
      (
        await page.request.patch(`/api/clients/${client.id}`, {
          data: { archived: false, name: 'Edited Client' },
        })
      ).ok(),
    ).toBeTruthy()
    expect(
      (await page.request.patch(`/api/releases/${release.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
  } finally {
    const ownedClients = await db
      .select({ id: clientTable.id })
      .from(clientTable)
      .where(eq(clientTable.userId, user.id))
    const ownedClientIds = ownedClients.map(({ id }) => id)
    const ownedProjects = ownedClientIds.length
      ? await db
          .select({ id: projectTable.id })
          .from(projectTable)
          .where(inArray(projectTable.clientId, ownedClientIds))
      : []
    const ownedProjectIds = ownedProjects.map(({ id }) => id)
    if (ownedProjectIds.length)
      await db.delete(releaseTable).where(inArray(releaseTable.projectId, ownedProjectIds))
    if (ownedClientIds.length)
      await db.delete(projectTable).where(inArray(projectTable.clientId, ownedClientIds))
    if (ownedClientIds.length)
      await db.delete(clientTable).where(inArray(clientTable.id, ownedClientIds))
    await helpers.deleteUser(user.id)
  }
})
