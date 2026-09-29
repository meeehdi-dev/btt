import { expect, test, type Locator, type Page } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

async function expectBorderOnlyHover(page: Page, card: Locator, title: Locator) {
  await page.mouse.move(0, 0)
  const borderBefore = await card.evaluate((element) => getComputedStyle(element).borderTopColor)
  const titleBefore = await title.evaluate((element) => getComputedStyle(element).color)
  await card.hover()
  await expect
    .poll(() => card.evaluate((element) => getComputedStyle(element).borderTopColor))
    .not.toBe(borderBefore)
  await expect
    .poll(() => title.evaluate((element) => getComputedStyle(element).color))
    .toBe(titleBefore)
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

async function expectCompactReleaseCard(card: Locator, name: string, count: string) {
  const heading = card.locator('[data-release-card-heading]')
  const title = heading.getByRole('heading', { name })
  const button = heading.getByRole('button', { name: 'Mark release as done' })
  const summary = card.locator('[data-release-card-summary]')
  const hierarchy = summary.getByLabel('Release hierarchy')
  await expect
    .poll(() => hierarchy.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true)
  await expect
    .poll(() => summary.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true)
  const metrics = card.locator('[data-release-card-metrics]')
  const ticketIcon = card.locator('[data-release-card-ticket-icon]')
  const counts = card.locator('[data-release-card-counts]')
  const progress = card.locator('[data-release-card-progress]')
  await expect(counts).toHaveText(count)
  await expect(card.locator('[data-release-card-percent]')).toHaveCount(0)
  await expect(hierarchy.getByRole('link')).toHaveCount(2)
  await expect(hierarchy.getByRole('link').first()).toHaveClass(/bg-default/)
  await expect(hierarchy.getByRole('link').first()).toHaveClass(/px-1\.5/)
  await expect(hierarchy.getByRole('link').first()).toHaveClass(/text-muted/)
  await expect(metrics).toHaveClass(/bg-default/)
  await expect(metrics).toHaveClass(/px-1\.5/)
  await expect(metrics).toHaveClass(/text-muted/)
  const [cardSurface, metricsSurface] = await Promise.all([
    card.evaluate((element) => getComputedStyle(element).backgroundColor),
    metrics.evaluate((element) => getComputedStyle(element).backgroundColor),
  ])
  expect(metricsSurface).not.toBe(cardSurface)
  await expect(ticketIcon).toBeVisible()
  await expect(progress).toHaveRole('progressbar')
  await expect(progress).toHaveAccessibleName(`${name} completion`)
  expect(await metrics.evaluate((element) => getComputedStyle(element).color)).toBe(
    await hierarchy
      .getByRole('link')
      .first()
      .evaluate((element) => getComputedStyle(element).color),
  )
  await expect(card.getByRole('list')).toHaveCount(0)
  await expect(card.getByLabel(/Target date/)).toHaveCount(0)
  const [
    cardBox,
    titleBox,
    buttonBox,
    summaryBox,
    hierarchyBox,
    metricsBox,
    ticketIconBox,
    countsBox,
    ringBox,
  ] = await Promise.all([
    card.boundingBox(),
    title.boundingBox(),
    button.boundingBox(),
    summary.boundingBox(),
    hierarchy.boundingBox(),
    metrics.boundingBox(),
    ticketIcon.boundingBox(),
    counts.boundingBox(),
    progress.boundingBox(),
  ])
  if (
    !cardBox ||
    !titleBox ||
    !buttonBox ||
    !summaryBox ||
    !hierarchyBox ||
    !metricsBox ||
    !ticketIconBox ||
    !countsBox ||
    !ringBox
  )
    throw new Error('Release card rows must be visible')
  expect(buttonBox.x - (titleBox.x + titleBox.width)).toBeLessThanOrEqual(16)
  expect(buttonBox.x).toBeGreaterThanOrEqual(titleBox.x + titleBox.width)
  expect(
    Math.abs(buttonBox.y + buttonBox.height / 2 - (titleBox.y + titleBox.height / 2)),
  ).toBeLessThan(4)
  expect(summaryBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height)
  expect(Math.abs(hierarchyBox.x - titleBox.x)).toBeLessThan(2)
  const metricsOnHierarchyRow =
    metricsBox.x >= hierarchyBox.x + hierarchyBox.width - 1 &&
    Math.abs(metricsBox.y + metricsBox.height / 2 - (hierarchyBox.y + hierarchyBox.height / 2)) < 4
  const metricsBelowHierarchy = metricsBox.y >= hierarchyBox.y + hierarchyBox.height - 1
  expect(metricsOnHierarchyRow || metricsBelowHierarchy).toBe(true)
  expect(countsBox.x).toBeGreaterThanOrEqual(ticketIconBox.x + ticketIconBox.width)
  expect(ringBox.x).toBeGreaterThanOrEqual(countsBox.x + countsBox.width)
  const metricsRightPadding = metricsBox.x + metricsBox.width - (ringBox.x + ringBox.width)
  expect(metricsRightPadding).toBeGreaterThanOrEqual(4)
  expect(metricsRightPadding).toBeLessThanOrEqual(8)
  expect(ringBox.width).toBeLessThanOrEqual(20)
  expect(ringBox.height).toBeLessThanOrEqual(20)
  expect(metricsBox.height).toBeLessThanOrEqual(24)
  expect(cardBox.height).toBeLessThan(160)
}

test('hierarchy cards show active counts and accessible release completion progress', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Hierarchy metrics owner',
    email: `hierarchy-metrics-${crypto.randomUUID()}@example.com`,
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
    const clientRecord = await create('/api/clients', { name: 'Metrics client' })
    const projectRecord = await create('/api/projects', {
      clientId: clientRecord.id,
      name: 'Metrics project',
      color: '#abcdef',
    })
    const activeRelease = await create('/api/releases', {
      projectId: projectRecord.id,
      name: 'Metrics release',
      targetDate: '2030-02-01',
    })
    const emptyRelease = await create('/api/releases', {
      projectId: projectRecord.id,
      name: 'Empty release',
    })
    const archivedRelease = await create('/api/releases', {
      projectId: projectRecord.id,
      name: 'Archived release',
    })
    await create('/api/tickets', {
      releaseId: activeRelease.id,
      title: 'Done ticket',
      status: 'Done',
    })
    await create('/api/tickets', {
      releaseId: activeRelease.id,
      title: 'Active ticket',
      status: 'Develop',
    })
    const archivedTicket = await create('/api/tickets', {
      releaseId: activeRelease.id,
      title: 'Archived ticket',
      status: 'Done',
    })
    await create('/api/tickets', {
      releaseId: archivedRelease.id,
      title: 'Hidden ticket',
      status: 'Done',
    })

    expect(
      (
        await page.request.patch(`/api/tickets/${archivedTicket.id}`, { data: { archived: true } })
      ).ok(),
    ).toBeTruthy()
    expect(
      (
        await page.request.patch(`/api/releases/${archivedRelease.id}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()

    const clientResponse = await (await page.request.get('/api/clients')).json()
    expect(clientResponse.clients).toContainEqual(
      expect.objectContaining({
        id: clientRecord.id,
        projectCount: 1,
        releaseCount: 2,
        ticketCount: 2,
      }),
    )
    const projectResponse = await (await page.request.get('/api/projects')).json()
    expect(projectResponse.projects).toContainEqual(
      expect.objectContaining({
        project: expect.objectContaining({ id: projectRecord.id }),
        releaseCount: 2,
        ticketCount: 2,
      }),
    )
    const releaseResponse = await (await page.request.get('/api/releases')).json()
    expect(releaseResponse.releases).toContainEqual(
      expect.objectContaining({
        release: expect.objectContaining({ id: activeRelease.id }),
        ticketCount: 2,
        doneTicketCount: 1,
      }),
    )
    expect(releaseResponse.releases).toContainEqual(
      expect.objectContaining({
        release: expect.objectContaining({ id: emptyRelease.id }),
        ticketCount: 0,
        doneTicketCount: 0,
      }),
    )
    const archivedReleaseResponse = await (
      await page.request.get('/api/releases?archived=true')
    ).json()
    expect(archivedReleaseResponse.releases).toContainEqual(
      expect.objectContaining({
        release: expect.objectContaining({ id: archivedRelease.id }),
        ticketCount: 0,
        doneTicketCount: 0,
      }),
    )

    await page.goto('/clients')
    await page.waitForLoadState('networkidle')
    const clientCard = page.locator(`[data-client-card-id="${clientRecord.id}"]`)
    const clientTitle = clientCard.locator('[data-client-card-title]')
    const clientCounts = clientCard.getByRole('list', { name: 'Active client contents' })
    await expect(clientTitle.getByRole('heading', { name: 'Metrics client' })).toBeVisible()
    await expect(clientTitle.locator(':scope > span').first()).not.toHaveClass(/border/)
    await expect(clientCounts).toContainText('1 project')
    await expect(clientCounts).toContainText('2 releases')
    await expect(clientCounts).toContainText('2 tickets')
    const [clientTitleBox, clientCountsBox] = await Promise.all([
      clientCard.locator('[data-client-card-title]').boundingBox(),
      clientCounts.boundingBox(),
    ])
    if (!clientTitleBox || !clientCountsBox) throw new Error('Client card rows must be visible')
    expect(clientCountsBox.y).toBeGreaterThan(clientTitleBox.y)
    expect(Math.abs(clientCountsBox.x - clientTitleBox.x)).toBeLessThan(2)
    expect(clientCountsBox.height).toBeLessThanOrEqual(24)
    await expectBorderOnlyHover(page, clientCard, clientTitle.getByRole('heading'))

    await page.goto(`/clients/${clientRecord.id}`)
    await page.waitForLoadState('networkidle')
    const projectCard = page.locator(`[data-project-card-id="${projectRecord.id}"]`)
    const projectSummary = projectCard.locator('[data-project-card-summary]')
    await expect
      .poll(() => projectSummary.evaluate((element) => element.scrollWidth <= element.clientWidth))
      .toBe(true)
    const projectTitle = projectCard.locator('[data-project-card-title]')
    const projectCounts = projectCard.getByRole('list', { name: 'Active project contents' })
    await expect(projectTitle.getByRole('heading', { name: 'Metrics project' })).toBeVisible()
    await expect(projectTitle.locator(':scope > span').first()).not.toHaveClass(/border/)
    await expect(projectCounts).toContainText('2 releases')
    await expect(projectCounts).toContainText('2 tickets')
    await expectBorderOnlyHover(
      page,
      projectCard,
      projectTitle.getByRole('heading', { name: 'Metrics project' }),
    )

    await page.goto(`/projects/${projectRecord.id}`)
    await page.waitForLoadState('networkidle')
    const activeReleaseCard = page.locator(`[data-release-card-id="${activeRelease.id}"]`)
    const releaseHierarchy = activeReleaseCard.getByLabel('Release hierarchy')
    await expectCompactReleaseCard(activeReleaseCard, 'Metrics release', '1 / 2')
    await expect(releaseHierarchy.getByRole('link', { name: 'Metrics client' })).toHaveAttribute(
      'href',
      `/clients/${clientRecord.id}`,
    )
    await expect(releaseHierarchy.getByRole('link', { name: 'Metrics project' })).toHaveAttribute(
      'href',
      `/projects/${projectRecord.id}`,
    )
    const activeProgress = activeReleaseCard.getByRole('progressbar', {
      name: 'Metrics release completion',
    })
    await expect(activeProgress).toHaveAttribute('aria-valuenow', '1')
    await expect(activeProgress).toHaveAttribute('aria-valuemax', '2')
    await expect(activeProgress).toHaveAttribute(
      'aria-valuetext',
      'Metrics release: 1 of 2 active tickets done, 50% complete',
    )

    const emptyReleaseCard = page.locator(`[data-release-card-id="${emptyRelease.id}"]`)
    const emptyProgress = emptyReleaseCard.getByRole('progressbar', {
      name: 'Empty release completion',
    })
    await expectCompactReleaseCard(emptyReleaseCard, 'Empty release', '0 / 0')
    await expect(emptyProgress).toHaveAttribute('aria-valuenow', '0')
    await expect(emptyProgress).toHaveAttribute('aria-valuemax', '1')
    await expect(emptyProgress).toHaveAttribute(
      'aria-valuetext',
      'Empty release: 0 of 0 active tickets done, 0% complete',
    )
    await releaseHierarchy.getByRole('link', { name: 'Metrics client' }).click()
    await expect(page).toHaveURL(`/clients/${clientRecord.id}`)
    await page.goto(`/projects/${projectRecord.id}`)
    await page.waitForLoadState('networkidle')
    await page
      .locator(`[data-release-card-id="${activeRelease.id}"]`)
      .getByLabel('Release hierarchy')
      .getByRole('link', { name: 'Metrics project' })
      .click()
    await expect(page).toHaveURL(`/projects/${projectRecord.id}`)

    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await mobileContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto('/clients')
    await mobilePage.waitForLoadState('networkidle')
    await expect(
      mobilePage
        .locator(`[data-client-card-id="${clientRecord.id}"]`)
        .getByRole('list', { name: 'Active client contents' }),
    ).toContainText('2 tickets')
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    await mobilePage.goto(`/clients/${clientRecord.id}`)
    await mobilePage.waitForLoadState('networkidle')
    const mobileProjectCard = mobilePage.locator(`[data-project-card-id="${projectRecord.id}"]`)
    await expect
      .poll(() =>
        mobileProjectCard
          .locator('[data-project-card-summary]')
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      )
      .toBe(true)
    await expect(
      mobileProjectCard.getByRole('list', { name: 'Active project contents' }),
    ).toContainText('2 tickets')
    await mobilePage.goto(`/projects/${projectRecord.id}`)
    await mobilePage.waitForLoadState('networkidle')
    await expectCompactReleaseCard(
      mobilePage.locator(`[data-release-card-id="${activeRelease.id}"]`),
      'Metrics release',
      '1 / 2',
    )
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)

    expect(
      (
        await page.request.patch(`/api/clients/${clientRecord.id}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()
    const hiddenProjectResponse = await (
      await page.request.get('/api/projects?archived=true')
    ).json()
    expect(
      hiddenProjectResponse.projects.some(
        (item: { project: { id: string } }) => item.project.id === projectRecord.id,
      ),
    ).toBe(false)
    const hiddenReleaseResponse = await (
      await page.request.get('/api/releases?archived=true')
    ).json()
    expect(
      hiddenReleaseResponse.releases.some(
        (item: { release: { id: string } }) => item.release.id === activeRelease.id,
      ),
    ).toBe(false)
    await page.goto(`/clients/${clientRecord.id}?archived=true`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator(`[data-project-card-id="${projectRecord.id}"]`)).toHaveCount(0)
    await page.goto(`/projects/${projectRecord.id}?archived=true`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator(`[data-release-card-id="${activeRelease.id}"]`)).toHaveCount(0)
    expect(
      (
        await page.request.patch(`/api/clients/${clientRecord.id}`, {
          data: { archived: false },
        })
      ).ok(),
    ).toBeTruthy()

    await page.goto(`/projects/${projectRecord.id}?archived=true`)
    await page.waitForLoadState('networkidle')
    const archivedReleaseCard = page.locator(`[data-release-card-id="${archivedRelease.id}"]`)
    await expect(archivedReleaseCard).toBeVisible()
    await expect(archivedReleaseCard.getByRole('list')).toHaveCount(0)
    await expect(archivedReleaseCard.getByRole('progressbar')).toHaveCount(0)
    await expect(archivedReleaseCard.getByLabel('Release hierarchy').getByRole('link')).toHaveCount(
      2,
    )
    await expect(archivedReleaseCard.locator('[data-release-card-counts]')).toHaveCount(0)
    await expect(
      archivedReleaseCard.getByRole('button', { name: 'Mark release as done' }),
    ).toHaveCount(0)

    expect(
      (
        await page.request.patch(`/api/projects/${projectRecord.id}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()
    const archivedProjectResponse = await (
      await page.request.get('/api/projects?archived=true')
    ).json()
    expect(archivedProjectResponse.projects).toContainEqual(
      expect.objectContaining({
        project: expect.objectContaining({ id: projectRecord.id }),
        releaseCount: 0,
        ticketCount: 0,
      }),
    )
    await page.goto(`/clients/${clientRecord.id}`)
    await page.waitForLoadState('networkidle')
    const archivedProjectCard = page.locator(`[data-project-card-id="${projectRecord.id}"]`)
    await expect(archivedProjectCard).toBeVisible()
    await expect(archivedProjectCard.getByText('Archived', { exact: true })).toBeVisible()
    await expect(
      archivedProjectCard.getByRole('list', { name: 'Active project contents' }),
    ).toHaveCount(0)
    const archivedProjectReleaseResponse = await (
      await page.request.get('/api/releases?archived=true')
    ).json()
    expect(
      archivedProjectReleaseResponse.releases.some(
        (item: { release: { id: string } }) => item.release.id === activeRelease.id,
      ),
    ).toBe(false)
    await page.goto(`/projects/${projectRecord.id}?archived=true`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator(`[data-release-card-id="${activeRelease.id}"]`)).toHaveCount(0)

    expect(
      (
        await page.request.patch(`/api/clients/${clientRecord.id}`, {
          data: { archived: true },
        })
      ).ok(),
    ).toBeTruthy()
    const archivedClientResponse = await (
      await page.request.get('/api/clients?archived=true')
    ).json()
    expect(archivedClientResponse.clients).toContainEqual(
      expect.objectContaining({
        id: clientRecord.id,
        projectCount: 0,
        releaseCount: 0,
        ticketCount: 0,
      }),
    )
  } finally {
    await mobileContext?.close()
    await cleanup(owner.id)
  }
})
